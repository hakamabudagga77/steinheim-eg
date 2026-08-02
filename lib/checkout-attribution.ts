/**
 * Carries the original traffic source across the checkout handoff.
 *
 * Browsing happens here; payment happens on Shopify's own domain. Shopify
 * stamps each order with the first URL it saw (`landing_site`) and the
 * referrer (`referring_site`), and lib/channel-attribution.ts reads those to
 * decide which channel closed the sale.
 *
 * Since the shopper now reaches Shopify from our own cart permalink, both of
 * those describe *us*, not the ad that brought them — so every order lands in
 * "steinheim-eg.com (Organic)" and the paid channels look dead. (Before the
 * storefront moved off Shopify this worked by itself, because the shopper
 * landed on Shopify directly from the ad.)
 *
 * So we record the source on arrival and re-attach it to the cart permalink on
 * the way out. Last-non-direct-touch, matching the `last_click_non_direct`
 * model behind Shopify's own Growth > Attribution report, so the two reports
 * credit the same channel instead of quietly disagreeing.
 */

export const ATTRIBUTION_KEY = "steinheim:attribution";

// Shopify's own attribution window. Past this we would be crediting a channel
// for a visit the shopper has long forgotten.
export const ATTRIBUTION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLICK_ID_KEYS = ["fbclid", "gclid", "igshid"] as const;

// Real campaign values are short; anything longer is a mistake or an attempt
// to bloat the redirect URL. Meta's fbclid is the longest we see, ~100 chars.
const MAX_VALUE_LENGTH = 256;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  igshid?: string;
  /**
   * Hostname of the *original* external referrer. `referring_site` on the
   * order will always be our own domain from now on, and it is the only thing
   * that separates a Facebook placement from an Instagram one — Meta tags both
   * as utm_source=facebook.
   */
  ref_host?: string;
  ts: number;
}

/** Every parameter we forward, so the checkout URL and the parser agree. */
export const ATTRIBUTION_PARAMS = [...UTM_KEYS, ...CLICK_ID_KEYS, "ref_host"] as const;

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Pure so it can be tested without a browser. `ownHost` is this site's own
 * hostname: a referrer pointing at ourselves is internal navigation, not a
 * new source, and must not overwrite the real one.
 */
export function parseAttribution(search: string, referrer: string, ownHost: string): Attribution | null {
  const params = new URLSearchParams(search);
  const next: Attribution = { ts: Date.now() };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) next[key] = value;
  }
  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key);
    if (value) next[key] = value;
  }

  const refHost = referrer ? hostnameOf(referrer) : null;
  const own = ownHost.replace(/^www\./, "");
  if (refHost && refHost !== own) next.ref_host = refHost;

  return hasSignal(next) ? next : null;
}

/** A visit with nothing but a timestamp is direct traffic — not a source. */
export function hasSignal(attribution: Attribution): boolean {
  return ATTRIBUTION_PARAMS.some((key) => Boolean(attribution[key]));
}

export function isExpired(attribution: Attribution, now = Date.now()): boolean {
  return now - attribution.ts > ATTRIBUTION_MAX_AGE_MS;
}

/**
 * Appends the stored source onto a Shopify cart permalink. Shopify records the
 * full landing URL including its query string, which is what puts these back
 * within reach of classifyOrderChannel.
 *
 * Existing parameters win: never overwrite something already on the URL.
 */
export function appendAttribution(checkoutUrl: string, attribution: Attribution | null | undefined): string {
  if (!attribution || !hasSignal(attribution)) return checkoutUrl;

  let url: URL;
  try {
    url = new URL(checkoutUrl);
  } catch {
    return checkoutUrl;
  }

  for (const key of ATTRIBUTION_PARAMS) {
    const value = attribution[key];
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Records the source of this visit. Called on every page load; only writes
 * when the visit carries a real signal, so an ad click is not overwritten by
 * the shopper's next internal page view or by a later direct return.
 */
/**
 * Narrows untrusted JSON from the browser to an Attribution.
 *
 * The cart drawer sends whatever is in its localStorage, and the result is
 * written into a URL we then send the shopper to, so nothing here is taken on
 * faith: unknown keys are dropped, non-strings ignored, and values are capped
 * so a tampered store cannot push an unbounded query string into the redirect.
 */
export function sanitizeAttribution(input: unknown): Attribution | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const clean: Attribution = { ts: Date.now() };

  for (const key of ATTRIBUTION_PARAMS) {
    const value = source[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, MAX_VALUE_LENGTH);
    if (trimmed) clean[key] = trimmed;
  }

  return hasSignal(clean) ? clean : null;
}

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const found = parseAttribution(window.location.search, document.referrer, window.location.hostname);
    if (!found) return;
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(found));
  } catch {
    // Private mode or a full quota — attribution is not worth breaking a page over.
  }
}

export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (typeof parsed?.ts !== "number" || isExpired(parsed) || !hasSignal(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Campaign attribution passthrough.
 *
 * Shopify classifies an order from `order.landing_site` — the URL the customer
 * entered the *shop* on. Our customers enter on steinheim-eg.com and only touch
 * the Shopify domain at the cart permalink, which carries no campaign
 * parameters, so `classifyOrderChannel` saw no signal and every order fell
 * through to "Direct" no matter which ad produced it.
 *
 * This captures the campaign parameters where they actually land (the
 * storefront) and re-attaches them to the checkout handoff, so both Shopify's
 * own reporting and lib/channel-attribution.ts get the real source.
 */

export const ATTRIBUTION_STORAGE_KEY = "steinheim-attribution-v1";

/** Last non-direct touch wins, which is what ad platforms report against. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "igshid",
  "ttclid",
  "msclkid",
] as const;

export type Attribution = {
  params: Record<string, string>;
  capturedAt: string;
};

/** Pulls the tracked parameters out of a URL's query string. */
export function readAttributionParams(search: string): Record<string, string> {
  const query = new URLSearchParams(search);
  const params: Record<string, string> = {};
  for (const key of TRACKED_PARAMS) {
    const value = query.get(key);
    // Cap length so a malformed or hostile URL cannot bloat storage or the
    // outgoing checkout link.
    if (value) params[key] = value.slice(0, 200);
  }
  return params;
}

export function isExpired(capturedAt: string, now: number): boolean {
  const time = Date.parse(capturedAt);
  return !Number.isFinite(time) || now - time > MAX_AGE_MS;
}

/**
 * Appends stored attribution to a checkout URL. Existing parameters on the
 * target win, so nothing already on the permalink is overwritten.
 */
export function decorateCheckoutUrl(checkoutUrl: string, attribution: Attribution | null): string {
  if (!attribution || Object.keys(attribution.params).length === 0) return checkoutUrl;

  try {
    const url = new URL(checkoutUrl);
    for (const [key, value] of Object.entries(attribution.params)) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    // Never break the checkout handoff over analytics.
    return checkoutUrl;
  }
}

export function parseStoredAttribution(raw: string | null, now: number): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.capturedAt !== "string" || isExpired(parsed.capturedAt, now)) return null;
    if (!parsed.params || typeof parsed.params !== "object") return null;

    const params: Record<string, string> = {};
    for (const key of TRACKED_PARAMS) {
      const value = (parsed.params as Record<string, unknown>)[key];
      if (typeof value === "string" && value) params[key] = value.slice(0, 200);
    }
    if (Object.keys(params).length === 0) return null;

    return { params, capturedAt: parsed.capturedAt };
  } catch {
    return null;
  }
}

/** Client-only: records the current URL's campaign parameters, if any. */
export function captureAttribution(search: string, now = Date.now()) {
  if (typeof window === "undefined") return;
  const params = readAttributionParams(search);
  if (Object.keys(params).length === 0) return; // Direct visit — keep any earlier touch.
  try {
    window.localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ params, capturedAt: new Date(now).toISOString() })
    );
  } catch {
    // Storage disabled — attribution is best-effort.
  }
}

/** Client-only: reads the stored touch, ignoring anything expired. */
export function getStoredAttribution(now = Date.now()): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredAttribution(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY), now);
  } catch {
    return null;
  }
}

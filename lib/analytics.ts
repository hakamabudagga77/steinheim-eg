import { getFinishById, getProductBySlug, getSeriesById } from "@/lib/utils";

/**
 * GA4 ecommerce events.
 *
 * The property was only ever receiving `config` and Core Web Vitals, so Meta
 * and Google were optimising spend with no view of the funnel — nobody could
 * see whether drop-off happened at finish selection, add-to-cart or the
 * checkout handoff, and the Shopify-checkout cohort could not be told apart
 * from the WhatsApp one.
 *
 * Every function here is a no-op when gtag is absent (GA4 is optional via
 * NEXT_PUBLIC_GA4_ID, and the init script deliberately skips non-production
 * hostnames), mirroring the guard in components/analytics/WebVitals.tsx.
 */

export type CartLine = { slug: string; finish: string; quantity: number };

export type CheckoutChannel = "shopify" | "whatsapp";

type GaItem = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

function gtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return null;
  return window.gtag;
}

/**
 * Resolves a cart line to a GA4 item. `price` prefers the live Shopify price
 * when the caller has it, since that is what the shopper actually sees.
 */
export function toGaItem(line: CartLine, livePrice?: number): GaItem | null {
  const product = getProductBySlug(line.slug);
  if (!product) return null;
  const variant = product.variants.find((v) => v.finish === line.finish) ?? product.variants[0];
  if (!variant) return null;
  const series = getSeriesById(product.series);
  const finish = getFinishById(line.finish);

  return {
    // The model number is the SKU used in Shopify and on every spec sheet, so
    // GA4 reporting lines up with the store's own product reports.
    item_id: variant.model,
    item_name: `${series?.name ?? product.series} ${product.name}`,
    item_brand: "Steinheim",
    item_category: series?.name ?? product.series,
    item_variant: finish?.name ?? line.finish,
    price: livePrice ?? variant.price,
    quantity: line.quantity,
  };
}

function itemsValue(items: GaItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function send(event: string, items: GaItem[], extra: Record<string, unknown> = {}) {
  const push = gtag();
  if (!push || items.length === 0) return;
  push("event", event, {
    currency: "EGP",
    value: Number(itemsValue(items).toFixed(2)),
    items,
    ...extra,
  });
}

export function trackViewItem(line: CartLine, livePrice?: number) {
  const item = toGaItem(line, livePrice);
  if (item) send("view_item", [item]);
}

export function trackAddToCart(line: CartLine, livePrice?: number) {
  const item = toGaItem(line, livePrice);
  if (item) send("add_to_cart", [item]);
}

export function trackRemoveFromCart(line: CartLine, livePrice?: number) {
  const item = toGaItem(line, livePrice);
  if (item) send("remove_from_cart", [item]);
}

export function trackViewCart(lines: CartLine[], livePrices: Record<string, number> = {}) {
  const items = lines
    .map((line) => toGaItem(line, livePrices[`${line.slug}::${line.finish}`]))
    .filter((item): item is GaItem => item !== null);
  send("view_cart", items);
}

/**
 * `checkout_channel` is the split that matters most for this business: a
 * Shopify card checkout and a WhatsApp order are completely different funnels
 * and cannot otherwise be told apart in GA4.
 */
export function trackBeginCheckout(
  lines: CartLine[],
  channel: CheckoutChannel,
  livePrices: Record<string, number> = {}
) {
  const items = lines
    .map((line) => toGaItem(line, livePrices[`${line.slug}::${line.finish}`]))
    .filter((item): item is GaItem => item !== null);
  send("begin_checkout", items, { checkout_channel: channel });
}

/**
 * Cross-domain note. GA4 links domains via the `_gl` linker parameter, which
 * gtag only writes onto anchor clicks and form submits to a configured domain.
 * The checkout handoff is a programmatic navigation, so it is never decorated,
 * and `_ga=<client_id>` is the old Universal Analytics convention that GA4
 * ignores. GoogleAnalytics.tsx therefore configures `linker.domains` only when
 * NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN is set — that covers real link clicks, but
 * it is not what makes the checkout attributable.
 *
 * Campaign attribution to Shopify is handled properly and independently of GA4
 * in lib/attribution.ts, which re-attaches the visitor's utm/click parameters
 * to the cart permalink so Shopify records them as order.landing_site.
 */

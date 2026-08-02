/**
 * Shared cache of live Shopify prices, keyed `${slug}::${finish}`.
 *
 * Analytics needs the price the shopper actually saw, but the components that
 * hold live data (product page, cards, cart drawer) are not the ones that fire
 * every event — `CartContext.addItem` is the single call site covering all four
 * paths into the cart, and it has no live data in scope.
 *
 * Without this, `view_item` reported the live price while `add_to_cart`,
 * `view_cart` and `begin_checkout` silently fell back to the static catalogue
 * figure — overstating cart and checkout value by ~14% and making the same
 * product disagree with itself inside one session.
 *
 * A module-level cache rather than a context: the pages that matter already
 * receive live data server-side, so they can seed it for free. No provider to
 * thread through, and no extra network request.
 */

const prices = new Map<string, number>();

export function livePriceKey(slug: string, finish: string) {
  return `${slug}::${finish}`;
}

export type LiveVariantLike = { finish: string; price: number };

/** Seeds the cache from live data a component already holds. */
export function cacheLivePrices(slug: string, variants: LiveVariantLike[] | undefined | null) {
  if (!variants) return;
  for (const variant of variants) {
    if (typeof variant?.price === "number" && Number.isFinite(variant.price)) {
      prices.set(livePriceKey(slug, variant.finish), variant.price);
    }
  }
}

/** Seeds from the shape `/api/shopify/prices` returns. */
export function cacheLivePricesBulk(
  data: Record<string, { variants?: LiveVariantLike[] }> | undefined | null
) {
  if (!data) return;
  for (const [slug, entry] of Object.entries(data)) cacheLivePrices(slug, entry?.variants);
}

/** Undefined when unknown, so callers fall back to the catalogue price. */
export function getLivePrice(slug: string, finish: string): number | undefined {
  return prices.get(livePriceKey(slug, finish));
}

/** Test-only: the cache is module state and would otherwise leak between cases. */
export function __resetLivePrices() {
  prices.clear();
}

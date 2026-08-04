export const CART_STORAGE_KEY = "steinheim-cart-v1";

export const MAX_CART_ITEMS = 50;
export const MAX_ITEM_QUANTITY = 99;

export interface CartItem {
  slug: string;
  finish: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

export function createEmptyCart(): Cart {
  return { items: [], updatedAt: "" };
}

/**
 * Server-side gate for the checkout endpoint. The cart drawer clamps
 * quantities client-side, but the API must not trust that: a negative, zero,
 * fractional, or absurd quantity would land verbatim in the Shopify cart
 * permalink and produce a broken checkout URL. Returns a normalized item list
 * or a structured error for a 400 response.
 */
export function normalizeCheckoutItems(
  value: unknown
): { ok: true; items: Array<{ slug: string; finish: string; quantity: number }> } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: "No items provided" };
  }
  if (value.length > MAX_CART_ITEMS) {
    return { ok: false, error: `Cart exceeds the ${MAX_CART_ITEMS}-item limit` };
  }

  const items: Array<{ slug: string; finish: string; quantity: number }> = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "Invalid item payload" };
    }
    const item = raw as Record<string, unknown>;
    if (typeof item.slug !== "string" || !item.slug.trim()) {
      return { ok: false, error: "Invalid item slug" };
    }
    if (typeof item.finish !== "string" || !item.finish.trim()) {
      return { ok: false, error: "Invalid item finish" };
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return { ok: false, error: `Quantity must be an integer between 1 and ${MAX_ITEM_QUANTITY}` };
    }
    items.push({ slug: item.slug.slice(0, 120), finish: item.finish.slice(0, 60), quantity });
  }

  return { ok: true, items };
}

export function sanitizeCart(value: unknown): Cart | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Cart>;
  if (!Array.isArray(source.items)) return null;
  const items = source.items.slice(0, 50).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const c = item as Partial<CartItem>;
    if (typeof c.slug !== "string" || typeof c.finish !== "string") return [];
    const quantity = Math.max(1, Math.min(99, Math.round(Number(c.quantity) || 1)));
    return [{ slug: c.slug.slice(0, 120), finish: c.finish.slice(0, 60), quantity }];
  });
  return {
    items,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : "",
  };
}

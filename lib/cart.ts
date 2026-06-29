export const CART_STORAGE_KEY = "steinheim-cart-v1";

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

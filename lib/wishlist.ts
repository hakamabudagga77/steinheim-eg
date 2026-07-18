export const WISHLIST_STORAGE_KEY = "steinheim-wishlist-v1";

export interface WishlistItem {
  slug: string;
  finish: string;
}

export interface Wishlist {
  items: WishlistItem[];
  updatedAt: string;
}

export function createEmptyWishlist(): Wishlist {
  return { items: [], updatedAt: "" };
}

export function sanitizeWishlist(value: unknown): Wishlist | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Wishlist>;
  if (!Array.isArray(source.items)) return null;
  const items = source.items.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const w = item as Partial<WishlistItem>;
    if (typeof w.slug !== "string" || typeof w.finish !== "string") return [];
    return [{ slug: w.slug.slice(0, 120), finish: w.finish.slice(0, 60) }];
  });
  return {
    items,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : "",
  };
}

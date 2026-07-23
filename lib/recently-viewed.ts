export const RECENTLY_VIEWED_STORAGE_KEY = "steinheim-recently-viewed-v1";
export const RECENTLY_VIEWED_MAX_ITEMS = 12;

export interface RecentlyViewedEntry {
  slug: string;
  viewedAt: string;
}

export function sanitizeRecentlyViewed(value: unknown): RecentlyViewedEntry[] | null {
  if (!Array.isArray(value)) return null;
  return value.slice(0, RECENTLY_VIEWED_MAX_ITEMS).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const e = entry as Partial<RecentlyViewedEntry>;
    if (typeof e.slug !== "string" || typeof e.viewedAt !== "string") return [];
    return [{ slug: e.slug.slice(0, 120), viewedAt: e.viewedAt }];
  });
}

/** Moves `slug` to the front (deduping) and caps the list length. */
export function recordView(entries: RecentlyViewedEntry[], slug: string): RecentlyViewedEntry[] {
  const withoutSlug = entries.filter((entry) => entry.slug !== slug);
  return [{ slug, viewedAt: new Date().toISOString() }, ...withoutSlug].slice(0, RECENTLY_VIEWED_MAX_ITEMS);
}

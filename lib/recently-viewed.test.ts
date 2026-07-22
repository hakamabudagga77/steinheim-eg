import { describe, expect, it } from "vitest";
import { recordView, sanitizeRecentlyViewed, RECENTLY_VIEWED_MAX_ITEMS, type RecentlyViewedEntry } from "@/lib/recently-viewed";

describe("recordView", () => {
  it("adds a new slug to the front", () => {
    const result = recordView([], "joy-basin-mixer");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("joy-basin-mixer");
  });

  it("moves an already-viewed slug to the front instead of duplicating it", () => {
    const existing: RecentlyViewedEntry[] = [
      { slug: "joy-basin-mixer", viewedAt: "2026-01-01T00:00:00.000Z" },
      { slug: "up-basin-mixer", viewedAt: "2026-01-02T00:00:00.000Z" },
    ];
    const result = recordView(existing, "joy-basin-mixer");
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("joy-basin-mixer");
    expect(result[1].slug).toBe("up-basin-mixer");
  });

  it("caps the list at RECENTLY_VIEWED_MAX_ITEMS", () => {
    const existing: RecentlyViewedEntry[] = Array.from({ length: RECENTLY_VIEWED_MAX_ITEMS }, (_, i) => ({
      slug: `product-${i}`,
      viewedAt: new Date(2026, 0, i + 1).toISOString(),
    }));
    const result = recordView(existing, "new-product");
    expect(result).toHaveLength(RECENTLY_VIEWED_MAX_ITEMS);
    expect(result[0].slug).toBe("new-product");
    expect(result.find((e) => e.slug === `product-${RECENTLY_VIEWED_MAX_ITEMS - 1}`)).toBeUndefined();
  });
});

describe("sanitizeRecentlyViewed", () => {
  it("returns null for non-array input", () => {
    expect(sanitizeRecentlyViewed({})).toBeNull();
    expect(sanitizeRecentlyViewed(null)).toBeNull();
  });

  it("filters out malformed entries", () => {
    const result = sanitizeRecentlyViewed([
      { slug: "joy-basin-mixer", viewedAt: "2026-01-01T00:00:00.000Z" },
      { slug: 123, viewedAt: "2026-01-01T00:00:00.000Z" },
      { viewedAt: "2026-01-01T00:00:00.000Z" },
      "not-an-object",
    ]);
    expect(result).toEqual([{ slug: "joy-basin-mixer", viewedAt: "2026-01-01T00:00:00.000Z" }]);
  });

  it("caps at RECENTLY_VIEWED_MAX_ITEMS", () => {
    const input = Array.from({ length: RECENTLY_VIEWED_MAX_ITEMS + 5 }, (_, i) => ({
      slug: `product-${i}`,
      viewedAt: "2026-01-01T00:00:00.000Z",
    }));
    expect(sanitizeRecentlyViewed(input)).toHaveLength(RECENTLY_VIEWED_MAX_ITEMS);
  });
});

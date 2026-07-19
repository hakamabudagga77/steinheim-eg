import { describe, expect, it } from "vitest";
import {
  createEmptyWishlist,
  decodeWishlistItems,
  encodeWishlistItems,
  sanitizeWishlist,
} from "@/lib/wishlist";

describe("createEmptyWishlist", () => {
  it("returns an empty item list", () => {
    expect(createEmptyWishlist()).toEqual({ items: [], updatedAt: "" });
  });
});

describe("sanitizeWishlist", () => {
  it("returns null for non-object input", () => {
    expect(sanitizeWishlist(null)).toBeNull();
    expect(sanitizeWishlist("not an object")).toBeNull();
    expect(sanitizeWishlist(42)).toBeNull();
  });

  it("returns null when items isn't an array", () => {
    expect(sanitizeWishlist({ items: "nope" })).toBeNull();
  });

  it("keeps well-formed items and drops malformed ones", () => {
    const result = sanitizeWishlist({
      items: [
        { slug: "joy-basin-mixer", finish: "chrome" },
        { slug: "missing-finish" },
        { finish: "missing-slug" },
        null,
        "not an object",
        { slug: 42, finish: "chrome" },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result).toEqual({
      items: [{ slug: "joy-basin-mixer", finish: "chrome" }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("caps items at 100 and truncates long slug/finish strings", () => {
    const items = Array.from({ length: 150 }, (_, i) => ({
      slug: "x".repeat(200) + i,
      finish: "y".repeat(100),
    }));
    const result = sanitizeWishlist({ items, updatedAt: "" });

    expect(result?.items).toHaveLength(100);
    expect(result?.items[0].slug.length).toBe(120);
    expect(result?.items[0].finish.length).toBe(60);
  });

  it("defaults updatedAt to an empty string when missing or invalid", () => {
    expect(sanitizeWishlist({ items: [] })?.updatedAt).toBe("");
    expect(sanitizeWishlist({ items: [], updatedAt: 12345 })?.updatedAt).toBe("");
  });
});

describe("encodeWishlistItems / decodeWishlistItems", () => {
  it("round-trips a normal item list", () => {
    const items = [
      { slug: "joy-basin-mixer", finish: "chrome" },
      { slug: "up-tall-basin-mixer", finish: "brushed-gold" },
    ];
    expect(decodeWishlistItems(encodeWishlistItems(items))).toEqual(items);
  });

  it("round-trips slugs/finishes containing characters that need encoding", () => {
    const items = [{ slug: "weird slug/with:chars", finish: "finish,with,commas" }];
    expect(decodeWishlistItems(encodeWishlistItems(items))).toEqual(items);
  });

  it("encodes an empty list as an empty string and decodes it back to nothing", () => {
    expect(encodeWishlistItems([])).toBe("");
    expect(decodeWishlistItems("")).toEqual([]);
  });

  it("drops malformed entries instead of throwing on a hand-edited URL", () => {
    expect(decodeWishlistItems("no-colon-here")).toEqual([]);
    expect(decodeWishlistItems("slug:")).toEqual([]);
    expect(decodeWishlistItems(":finish")).toEqual([]);
    expect(decodeWishlistItems("%zz:chrome")).toEqual([]);
  });

  it("mixes valid and malformed entries, keeping only the valid ones", () => {
    const decoded = decodeWishlistItems("joy-basin-mixer:chrome,broken,also-broken:");
    expect(decoded).toEqual([{ slug: "joy-basin-mixer", finish: "chrome" }]);
  });

  it("caps decoded items at 100", () => {
    const encoded = Array.from({ length: 150 }, (_, i) => `slug-${i}:chrome`).join(",");
    expect(decodeWishlistItems(encoded)).toHaveLength(100);
  });
});

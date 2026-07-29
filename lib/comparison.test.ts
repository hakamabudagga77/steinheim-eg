import { describe, expect, it } from "vitest";
import { COMPARISON_MAX_ITEMS, createEmptyComparison, sanitizeComparison } from "@/lib/comparison";

describe("createEmptyComparison", () => {
  it("returns an empty item list", () => {
    expect(createEmptyComparison()).toEqual({ items: [], updatedAt: "" });
  });
});

describe("sanitizeComparison", () => {
  it("returns null for non-object input", () => {
    expect(sanitizeComparison(null)).toBeNull();
    expect(sanitizeComparison("not an object")).toBeNull();
    expect(sanitizeComparison(42)).toBeNull();
  });

  it("returns null when items isn't an array", () => {
    expect(sanitizeComparison({ items: "nope" })).toBeNull();
  });

  it("keeps well-formed items and drops malformed ones", () => {
    const result = sanitizeComparison({
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

  it("caps items at COMPARISON_MAX_ITEMS", () => {
    const items = Array.from({ length: COMPARISON_MAX_ITEMS + 4 }, (_, i) => ({
      slug: `slug-${i}`,
      finish: "chrome",
    }));
    expect(sanitizeComparison({ items })?.items).toHaveLength(COMPARISON_MAX_ITEMS);
  });

  it("truncates long slug/finish strings", () => {
    const result = sanitizeComparison({
      items: [{ slug: "x".repeat(200), finish: "y".repeat(100) }],
    });
    expect(result?.items[0].slug.length).toBe(120);
    expect(result?.items[0].finish.length).toBe(60);
  });

  it("defaults updatedAt to an empty string when missing or invalid", () => {
    expect(sanitizeComparison({ items: [] })?.updatedAt).toBe("");
    expect(sanitizeComparison({ items: [], updatedAt: 12345 })?.updatedAt).toBe("");
  });
});

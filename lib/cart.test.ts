import { describe, expect, it } from "vitest";
import { createEmptyCart, sanitizeCart } from "@/lib/cart";

describe("createEmptyCart", () => {
  it("returns an empty item list", () => {
    expect(createEmptyCart()).toEqual({ items: [], updatedAt: "" });
  });
});

describe("sanitizeCart", () => {
  it("returns null for non-object input", () => {
    expect(sanitizeCart(null)).toBeNull();
    expect(sanitizeCart("not an object")).toBeNull();
    expect(sanitizeCart(42)).toBeNull();
  });

  it("returns null when items isn't an array", () => {
    expect(sanitizeCart({ items: "nope" })).toBeNull();
  });

  it("keeps well-formed items and drops malformed ones", () => {
    const result = sanitizeCart({
      items: [
        { slug: "joy-basin-mixer", finish: "chrome", quantity: 2 },
        { slug: "missing-finish", quantity: 1 },
        { finish: "missing-slug", quantity: 1 },
        null,
        "not an object",
        { slug: 42, finish: "chrome", quantity: 1 },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(result).toEqual({
      items: [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 2 }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("clamps quantity to the 1-99 range", () => {
    const q = (quantity: unknown) =>
      sanitizeCart({ items: [{ slug: "s", finish: "chrome", quantity }] })?.items[0].quantity;
    expect(q(0)).toBe(1);
    expect(q(-5)).toBe(1);
    expect(q(100)).toBe(99);
    expect(q(5)).toBe(5);
  });

  it("rounds and falls back to 1 for fractional or non-numeric quantities", () => {
    const q = (quantity: unknown) =>
      sanitizeCart({ items: [{ slug: "s", finish: "chrome", quantity }] })?.items[0].quantity;
    expect(q(2.6)).toBe(3);
    expect(q(2.4)).toBe(2);
    expect(q("abc")).toBe(1);
    expect(q(Number.NaN)).toBe(1);
    expect(q(undefined)).toBe(1);
  });

  it("caps items at 50", () => {
    const items = Array.from({ length: 60 }, (_, i) => ({
      slug: `slug-${i}`,
      finish: "chrome",
      quantity: 1,
    }));
    expect(sanitizeCart({ items })?.items).toHaveLength(50);
  });

  it("truncates long slug/finish strings", () => {
    const result = sanitizeCart({
      items: [{ slug: "x".repeat(200), finish: "y".repeat(100), quantity: 1 }],
    });
    expect(result?.items[0].slug.length).toBe(120);
    expect(result?.items[0].finish.length).toBe(60);
  });

  it("defaults updatedAt to an empty string when missing or invalid", () => {
    expect(sanitizeCart({ items: [] })?.updatedAt).toBe("");
    expect(sanitizeCart({ items: [], updatedAt: 12345 })?.updatedAt).toBe("");
  });
});

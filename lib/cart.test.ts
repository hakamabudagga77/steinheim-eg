import { describe, expect, it } from "vitest";
import { createEmptyCart, normalizeCheckoutItems, sanitizeCart } from "@/lib/cart";

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

describe("normalizeCheckoutItems", () => {
  it("rejects a missing or empty item list", () => {
    expect(normalizeCheckoutItems(undefined)).toEqual({ ok: false, error: "No items provided" });
    expect(normalizeCheckoutItems([])).toEqual({ ok: false, error: "No items provided" });
    expect(normalizeCheckoutItems("nope")).toEqual({ ok: false, error: "No items provided" });
  });

  it("returns a normalized list for valid input", () => {
    const result = normalizeCheckoutItems([
      { slug: "joy-basin-mixer", finish: "chrome", quantity: 2 },
    ]);
    expect(result).toEqual({
      ok: true,
      items: [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 2 }],
    });
  });

  it("rejects zero, negative, fractional and non-numeric quantities", () => {
    const q = (quantity: unknown) =>
      normalizeCheckoutItems([{ slug: "s", finish: "chrome", quantity }]);
    expect(q(0).ok).toBe(false);
    expect(q(-1).ok).toBe(false);
    expect(q(1.5).ok).toBe(false);
    expect(q("abc").ok).toBe(false);
    expect(q(Number.NaN).ok).toBe(false);
    expect(q(undefined).ok).toBe(false);
  });

  it("rejects quantities above the 99 cap", () => {
    const result = normalizeCheckoutItems([{ slug: "s", finish: "chrome", quantity: 100 }]);
    expect(result).toEqual({
      ok: false,
      error: "Quantity must be an integer between 1 and 99",
    });
  });

  it("rejects missing slug or finish", () => {
    expect(normalizeCheckoutItems([{ finish: "chrome", quantity: 1 }]).ok).toBe(false);
    expect(normalizeCheckoutItems([{ slug: "s", quantity: 1 }]).ok).toBe(false);
    expect(normalizeCheckoutItems([{ slug: "  ", finish: "chrome", quantity: 1 }]).ok).toBe(false);
  });

  it("rejects an item list larger than 50", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      slug: `slug-${i}`,
      finish: "chrome",
      quantity: 1,
    }));
    const result = normalizeCheckoutItems(items);
    expect(result).toEqual({ ok: false, error: "Cart exceeds the 50-item limit" });
  });
});

import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getAllFinishes,
  getAllProducts,
  getAllSeries,
  getFinishById,
  getProductBySlug,
  getProductsBySeries,
  getSeriesById,
} from "@/lib/utils";

describe("getAllSeries / getSeriesById", () => {
  it("returns all four collections", () => {
    const series = getAllSeries();
    expect(series.map((s) => s.id).sort()).toEqual(["art", "joy", "quatro", "up"]);
  });

  it("looks up a series by id", () => {
    expect(getSeriesById("joy")?.id).toBe("joy");
  });

  it("returns undefined for an unknown series", () => {
    expect(getSeriesById("does-not-exist")).toBeUndefined();
  });
});

describe("getProductsBySeries / getProductBySlug", () => {
  it("returns only products belonging to the requested series", () => {
    const joyProducts = getProductsBySeries("joy");
    expect(joyProducts.length).toBeGreaterThan(0);
    expect(joyProducts.every((p) => p.series === "joy")).toBe(true);
  });

  it("returns an empty array for a series with no products", () => {
    expect(getProductsBySeries("does-not-exist")).toEqual([]);
  });

  it("looks up a product by slug", () => {
    const product = getProductBySlug("joy-basin-mixer");
    expect(product?.slug).toBe("joy-basin-mixer");
    expect(product?.series).toBe("joy");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getAllProducts", () => {
  it("returns every product with a unique slug", () => {
    const products = getAllProducts();
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(products.length).toBeGreaterThan(0);
  });
});

describe("getAllFinishes / getFinishById", () => {
  it("looks up a finish by id", () => {
    expect(getFinishById("chrome")?.id).toBe("chrome");
  });

  it("returns undefined for an unknown finish", () => {
    expect(getFinishById("does-not-exist")).toBeUndefined();
  });

  it("every finish referenced by a product variant actually exists", () => {
    const finishIds = new Set(getAllFinishes().map((f) => f.id));
    for (const product of getAllProducts()) {
      for (const variant of product.variants) {
        expect(finishIds.has(variant.finish)).toBe(true);
      }
    }
  });
});

describe("formatPrice", () => {
  it("formats a whole number with thousands separators and the default currency", () => {
    expect(formatPrice(4950)).toBe("LE 4,950");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("LE 0");
  });

  it("accepts a custom currency label", () => {
    expect(formatPrice(1000, "EGP")).toBe("EGP 1,000");
  });
});

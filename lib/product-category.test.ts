import { describe, expect, it } from "vitest";
import {
  getAllProducts,
  getAvailableCategories,
  getProductCategory,
  getProductsByCategory,
} from "@/lib/utils";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

describe("product category", () => {
  it("treats a product with no category as a bathroom fitting", () => {
    // The catalogue was bathroom-only before the kitchen range, so none of the
    // existing 26 entries carry the field and none of them had to be edited.
    const uncategorised = getAllProducts().find(
      (product) => !(product as { category?: string }).category
    );
    expect(uncategorised).toBeDefined();
    expect(getProductCategory(uncategorised!)).toBe("bathroom");
  });

  it("puts every catalogue product in exactly one category", () => {
    const all = getAllProducts();
    const bathroom = getProductsByCategory("bathroom");
    const kitchen = getProductsByCategory("kitchen");
    expect(bathroom.length + kitchen.length).toBe(all.length);
    expect(bathroom.some((p) => kitchen.includes(p))).toBe(false);
  });

  it("only offers categories the catalogue actually contains", () => {
    // Guards the filter against rendering an empty bucket: with no kitchen
    // products yet, "kitchen" must not be offered.
    const available = getAvailableCategories();
    for (const category of available) {
      expect(getProductsByCategory(category).length).toBeGreaterThan(0);
    }
    expect(available).toContain("bathroom");
  });

  it("has a label for every category in both locales", () => {
    // next-intl throws on a missing key, so a category with no label would be
    // a runtime error on the products page rather than a silent fallback.
    for (const category of ["bathroom", "kitchen"] as const) {
      expect(en.products.categories[category]).toBeTruthy();
      expect(ar.products.categories[category]).toBeTruthy();
      expect(ar.products.categories[category]).not.toBe(en.products.categories[category]);
    }
  });
});

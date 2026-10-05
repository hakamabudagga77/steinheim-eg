import { describe, expect, it } from "vitest";
import { getProductImage } from "@/data/images";

describe("Shopify-generated product images", () => {
  it("uses the matching Shopify variant image for a generated product", () => {
    expect(getProductImage("joy-series-ceiling-shower-arm", "coffee-gold"))
      .toMatch(/^https:\/\/cdn\.shopify\.com\/s\/files\//);
  });

  it("adds an image for the new Quatro Coffee Gold variant", () => {
    expect(getProductImage("quatro-basin-mixer", "coffee-gold"))
      .toMatch(/^https:\/\/cdn\.shopify\.com\/s\/files\//);
  });
});

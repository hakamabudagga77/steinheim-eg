import { describe, expect, it } from "vitest";
import { getProductImage, getProductImageStyle, isShopifyProductImage } from "@/data/images";

describe("Shopify-generated product images", () => {
  it("uses the matching Shopify variant image for a generated product", () => {
    expect(getProductImage("joy-series-ceiling-shower-arm", "coffee-gold"))
      .toMatch(/^https:\/\/cdn\.shopify\.com\/s\/files\//);
  });

  it("adds an image for the new Quatro Coffee Gold variant", () => {
    expect(getProductImage("quatro-basin-mixer", "coffee-gold"))
      .toMatch(/^https:\/\/cdn\.shopify\.com\/s\/files\//);
  });

  it("applies the warm-surface treatment to Shopify product media", () => {
    expect(getProductImageStyle("https://cdn.shopify.com/s/files/product.png"))
      .toEqual({ mixBlendMode: "darken" });
  });

  it("leaves prepared local product media unchanged", () => {
    expect(getProductImageStyle("/images/products/joy/basin-mixer/chrome.png"))
      .toBeUndefined();
  });

  it("distinguishes Shopify media from prepared local assets", () => {
    expect(isShopifyProductImage("https://cdn.shopify.com/s/files/product.png")).toBe(true);
    expect(isShopifyProductImage("/images/products/joy/basin-mixer/chrome.png")).toBe(false);
  });
});

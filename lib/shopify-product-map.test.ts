import { describe, expect, it } from "vitest";
import type { ShopifyProduct, ShopifyVariant } from "@/lib/shopify-client";
import { resolveInventory, resolveVariantId, resolveVariantPrice } from "@/lib/shopify-product-map";

function variant(fields: Partial<ShopifyVariant>): ShopifyVariant {
  return {
    id: 1,
    product_id: 1,
    inventory_item_id: 1,
    title: "Default",
    price: "0.00",
    sku: "sku",
    inventory_quantity: 0,
    option1: null,
    ...fields,
  };
}

function product(handle: string, variants: ShopifyVariant[]): ShopifyProduct {
  return {
    id: 1,
    title: "Product",
    handle,
    tags: "",
    product_type: "",
    status: "active",
    image: null,
    variants,
  };
}

// "joy-basin-mixer" maps to handle "joy-single-lever-basin-mixer" in SLUG_TO_HANDLE.
const catalogue: ShopifyProduct[] = [
  product("joy-single-lever-basin-mixer", [
    variant({ id: 101, option1: "Chrome", price: "4500.00", inventory_quantity: 7 }),
    variant({ id: 102, option1: "Matte Black", price: "5200.50", inventory_quantity: 0 }),
  ]),
];

describe("resolveVariantId", () => {
  it("returns null for a slug not in the map", () => {
    expect(resolveVariantId("does-not-exist", "chrome", catalogue)).toBeNull();
  });

  it("returns null for a slug mapped to an empty handle", () => {
    // joy-bottle-trap is intentionally mapped to "" (no Shopify handle yet).
    expect(resolveVariantId("joy-bottle-trap", "chrome", catalogue)).toBeNull();
  });

  it("returns null when the mapped product is absent from the catalogue", () => {
    expect(resolveVariantId("joy-basin-mixer", "chrome", [])).toBeNull();
  });

  it("resolves a finish alias to the matching variant", () => {
    expect(resolveVariantId("joy-basin-mixer", "matte-black", catalogue)).toBe(102);
  });

  it("matches an unaliased finish case-insensitively", () => {
    expect(resolveVariantId("joy-basin-mixer", "Chrome", catalogue)).toBe(101);
  });

  it("returns null when the finish has no matching variant", () => {
    expect(resolveVariantId("joy-basin-mixer", "brushed-gold", catalogue)).toBeNull();
  });
});

describe("resolveVariantPrice", () => {
  it("parses the matching variant price to a number", () => {
    expect(resolveVariantPrice("joy-basin-mixer", "chrome", catalogue)).toBe(4500);
    expect(resolveVariantPrice("joy-basin-mixer", "matte-black", catalogue)).toBe(5200.5);
  });

  it("returns null when nothing matches", () => {
    expect(resolveVariantPrice("joy-basin-mixer", "brushed-gold", catalogue)).toBeNull();
    expect(resolveVariantPrice("does-not-exist", "chrome", catalogue)).toBeNull();
  });
});

describe("resolveInventory", () => {
  it("returns the matching variant inventory, including zero", () => {
    expect(resolveInventory("joy-basin-mixer", "chrome", catalogue)).toBe(7);
    expect(resolveInventory("joy-basin-mixer", "matte-black", catalogue)).toBe(0);
  });

  it("returns null when nothing matches", () => {
    expect(resolveInventory("joy-basin-mixer", "brushed-gold", catalogue)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { computeBestSellers } from "@/lib/best-sellers";
import type { ShopifyOrder } from "@/lib/shopify-client";
import { getAllProducts } from "@/lib/utils";

function makeOrder(lineItems: Array<{ title: string; quantity: number }>, overrides: Partial<ShopifyOrder> = {}): ShopifyOrder {
  return {
    id: Math.random(),
    order_number: 1,
    name: "#1001",
    email: null,
    created_at: new Date().toISOString(),
    currency: "EGP",
    total_price: "1000",
    financial_status: "paid",
    fulfillment_status: null,
    customer: null,
    line_items: lineItems,
    source_name: null,
    referring_site: null,
    landing_site: null,
    ...overrides,
  };
}

describe("computeBestSellers", () => {
  const products = getAllProducts();
  const joyBasin = products.find((p) => p.slug === "joy-basin-mixer")!;

  it("matches a line item title against the series + product name", () => {
    const orders = [makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 2 }])];
    const result = computeBestSellers(orders);
    expect(result).toEqual([{ product: joyBasin, unitsSold: 2 }]);
  });

  it("does not cross-attribute the same generic product name across series", () => {
    const orders = [
      makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 1 }]),
      makeOrder([{ title: "Up Basin Mixer - Matte Black", quantity: 3 }]),
    ];
    const result = computeBestSellers(orders);
    expect(result.find((r) => r.product.slug === "joy-basin-mixer")?.unitsSold).toBe(1);
    expect(result.find((r) => r.product.slug === "up-basin-mixer")?.unitsSold).toBe(3);
  });

  it("aggregates quantities across multiple orders for the same product", () => {
    const orders = [
      makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 2 }]),
      makeOrder([{ title: "Joy Basin Mixer - Brushed Gold", quantity: 5 }]),
    ];
    const result = computeBestSellers(orders);
    expect(result.find((r) => r.product.slug === "joy-basin-mixer")?.unitsSold).toBe(7);
  });

  it("excludes voided orders", () => {
    const orders = [makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 10 }], { financial_status: "voided" })];
    const result = computeBestSellers(orders);
    expect(result).toEqual([]);
  });

  it("ignores line items that don't match any catalog product", () => {
    const orders = [makeOrder([{ title: "Some Random Third Party Item", quantity: 4 }])];
    const result = computeBestSellers(orders);
    expect(result).toEqual([]);
  });

  it("sorts by units sold descending and respects the limit", () => {
    const orders = [
      makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 1 }]),
      makeOrder([{ title: "Up Basin Mixer - Chrome", quantity: 9 }]),
    ];
    const result = computeBestSellers(orders, 1);
    expect(result).toHaveLength(1);
    expect(result[0].product.slug).toBe("up-basin-mixer");
  });

  it("returns Product objects usable by ProductCard (has variants)", () => {
    const orders = [makeOrder([{ title: "Joy Basin Mixer - Chrome", quantity: 1 }])];
    const result = computeBestSellers(orders);
    expect(result[0].product.variants.length).toBeGreaterThan(0);
  });
});

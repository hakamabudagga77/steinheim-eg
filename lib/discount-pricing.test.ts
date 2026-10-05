import { describe, expect, it } from "vitest";
import { discountPercentage, validCompareAtPrice } from "@/lib/discount-pricing";

describe("discount pricing", () => {
  it("accepts a Shopify compare-at price only when it is above the selling price", () => {
    expect(validCompareAtPrice(4350, 5100)).toBe(5100);
    expect(validCompareAtPrice(4350, 4350)).toBeNull();
    expect(validCompareAtPrice(4350, 4000)).toBeNull();
    expect(validCompareAtPrice(4350, null)).toBeNull();
  });

  it("calculates the customer-facing discount percentage", () => {
    expect(discountPercentage(4350, 5100)).toBe(15);
    expect(discountPercentage(4350, null)).toBeNull();
  });
});

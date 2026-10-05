import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductPrice from "@/components/product/ProductPrice";

describe("ProductPrice", () => {
  it("renders the selling price, crossed-out compare-at price, and discount", () => {
    const markup = renderToStaticMarkup(
      createElement(ProductPrice, { price: 4350, compareAtPrice: 5100 })
    );

    expect(markup).toContain("LE 4,350");
    expect(markup).toContain("<del");
    expect(markup).toContain("LE 5,100");
    expect(markup).toContain("15%");
  });

  it("does not claim a discount when compare-at is not above the selling price", () => {
    const markup = renderToStaticMarkup(
      createElement(ProductPrice, { price: 4350, compareAtPrice: 4350 })
    );

    expect(markup).toContain("LE 4,350");
    expect(markup).not.toContain("<del");
    expect(markup).not.toContain("%");
  });
});

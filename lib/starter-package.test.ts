import { describe, expect, it } from "vitest";
import { buildStarterPackage } from "@/lib/starter-package";

describe("buildStarterPackage", () => {
  it("builds a basin mixer + shower + accessories set for a full collection", () => {
    const pkg = buildStarterPackage("joy", "chrome");
    const types = pkg.lines.map((line) => line.product.type);
    expect(types).toEqual(["basin-mixer", "concealed-shower", "accessories"]);
    expect(pkg.unavailable).toEqual([]);
    expect(pkg.total).toBeGreaterThan(0);
  });

  it("skips types a collection does not carry rather than failing", () => {
    // Art and Quatro have no accessories set in the catalogue.
    const pkg = buildStarterPackage("quatro", "chrome");
    const types = pkg.lines.map((line) => line.product.type);
    expect(types).toEqual(["basin-mixer", "concealed-shower"]);
    expect(pkg.lines.length).toBeGreaterThan(0);
  });

  it("reports products with no variant in the chosen finish instead of dropping them", () => {
    // Brushed nickel is not offered on Quatro.
    const pkg = buildStarterPackage("quatro", "brushed-nickel");
    expect(pkg.lines).toEqual([]);
    expect(pkg.unavailable.length).toBeGreaterThan(0);
    expect(pkg.total).toBe(0);
  });

  it("totals the lines it did resolve", () => {
    const pkg = buildStarterPackage("joy", "chrome");
    const expected = pkg.lines.reduce((sum, line) => sum + line.price, 0);
    expect(pkg.total).toBe(expected);
  });

  it("prefers live Shopify prices over catalogue prices", () => {
    const catalogue = buildStarterPackage("joy", "chrome");
    const first = catalogue.lines[0];
    const live = buildStarterPackage("joy", "chrome", {
      [`${first.product.slug}::chrome`]: 999999,
    });
    expect(live.lines[0].price).toBe(999999);
    expect(live.total).toBe(catalogue.total - first.price + 999999);
  });

  it("returns an empty package for an unknown collection", () => {
    const pkg = buildStarterPackage("does-not-exist", "chrome");
    expect(pkg.lines).toEqual([]);
    expect(pkg.total).toBe(0);
  });
});

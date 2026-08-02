import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetLivePrices,
  cacheLivePrices,
  cacheLivePricesBulk,
  getLivePrice,
} from "@/lib/live-prices";

describe("live price cache", () => {
  beforeEach(() => __resetLivePrices());

  it("returns the live price a component seeded", () => {
    // The real discrepancy this exists for: the catalogue says 4,950 for a
    // chrome Joy basin mixer while Shopify charges 4,350.
    cacheLivePrices("joy-basin-mixer", [
      { finish: "chrome", price: 4350 },
      { finish: "matte-black", price: 5350 },
    ]);
    expect(getLivePrice("joy-basin-mixer", "chrome")).toBe(4350);
    expect(getLivePrice("joy-basin-mixer", "matte-black")).toBe(5350);
  });

  it("returns undefined for anything unseeded, so callers fall back", () => {
    expect(getLivePrice("joy-basin-mixer", "chrome")).toBeUndefined();
    cacheLivePrices("joy-basin-mixer", [{ finish: "chrome", price: 4350 }]);
    expect(getLivePrice("joy-basin-mixer", "brushed-gold")).toBeUndefined();
    expect(getLivePrice("up-basin-mixer", "chrome")).toBeUndefined();
  });

  it("seeds from the /api/shopify/prices payload shape", () => {
    cacheLivePricesBulk({
      "joy-basin-mixer": { variants: [{ finish: "chrome", price: 4350 }] },
      "up-basin-mixer": { variants: [{ finish: "chrome", price: 3900 }] },
    });
    expect(getLivePrice("joy-basin-mixer", "chrome")).toBe(4350);
    expect(getLivePrice("up-basin-mixer", "chrome")).toBe(3900);
  });

  it("ignores missing, malformed and non-finite entries", () => {
    cacheLivePrices("joy-basin-mixer", undefined);
    cacheLivePrices("joy-basin-mixer", null);
    cacheLivePricesBulk(undefined);
    cacheLivePricesBulk({ "joy-basin-mixer": {} });
    cacheLivePrices("joy-basin-mixer", [
      { finish: "chrome", price: Number.NaN },
      { finish: "matte-black", price: Infinity },
    ]);
    expect(getLivePrice("joy-basin-mixer", "chrome")).toBeUndefined();
    expect(getLivePrice("joy-basin-mixer", "matte-black")).toBeUndefined();
  });

  it("lets a later seed correct an earlier one", () => {
    cacheLivePrices("joy-basin-mixer", [{ finish: "chrome", price: 4350 }]);
    cacheLivePrices("joy-basin-mixer", [{ finish: "chrome", price: 4100 }]);
    expect(getLivePrice("joy-basin-mixer", "chrome")).toBe(4100);
  });
});

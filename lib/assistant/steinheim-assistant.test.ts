import { describe, expect, it } from "vitest";
import { answerSteinheimQuestion, type LiveLookup } from "./steinheim-assistant";

const user = (content: string) => [{ role: "user" as const, content }];

const liveLookup: LiveLookup = (slug) => {
  if (slug !== "joy-basin-mixer") return null;
  return { finish: "chrome", price: 3999, inventory: 3, inStock: true };
};

const outOfStockLookup: LiveLookup = (slug) => {
  if (slug !== "joy-basin-mixer") return null;
  return { finish: "chrome", price: 4500, inventory: 0, inStock: false };
};

describe("live-aware assistant", () => {
  it("quotes the live price and stock instead of the catalogue reference when live data exists", () => {
    const result = answerSteinheimQuestion(user("How much is the joy basin mixer in chrome?"), "", liveLookup);
    expect(result.text).toContain("3,999 LE");
    expect(result.text).toContain("live");
    expect(result.text).toContain("in stock");
  });

  it("falls back to the catalogue retail-reference price without live data", () => {
    const result = answerSteinheimQuestion(user("How much is the joy basin mixer in chrome?"));
    expect(result.text).toContain("retail-reference");
  });

  it("answers live availability when asked about stock", () => {
    const result = answerSteinheimQuestion(user("Is the joy basin mixer in stock?"), "", liveLookup);
    expect(result.text).toContain("in stock");
  });

  it("says out of stock when live stock is zero", () => {
    const result = answerSteinheimQuestion(user("Is the joy basin mixer available?"), "", outOfStockLookup);
    expect(result.text).toContain("out of stock");
  });

  it("stays honest when no live data covers the product", () => {
    const result = answerSteinheimQuestion(user("Is the up basin mixer in stock?"), "", liveLookup);
    expect(result.text).toContain("I do not have live stock data");
  });
});

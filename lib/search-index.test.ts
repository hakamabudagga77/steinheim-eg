import { describe, expect, it } from "vitest";
import { buildSearchIndex, searchIndex } from "@/lib/search-index";
import { getAllProducts, getAllSeries } from "@/lib/utils";

const PAGE_LABELS = {
  about: "About",
  contact: "Contact",
  trade: "Trade",
  warranty: "Warranty",
  shipping: "Shipping",
  returns: "Returns",
  privacy: "Privacy",
  projects: "Projects",
};

const COLLECTION_DESCRIPTIONS = Object.fromEntries(
  getAllSeries().map((s) => [s.id, `${s.name} collection description`])
);

function buildIndex() {
  return buildSearchIndex(PAGE_LABELS, "Page", COLLECTION_DESCRIPTIONS);
}

describe("buildSearchIndex", () => {
  it("includes every product, every collection, and every static page", () => {
    const index = buildIndex();
    const productCount = index.filter((e) => e.kind === "product").length;
    const collectionCount = index.filter((e) => e.kind === "collection").length;
    const pageCount = index.filter((e) => e.kind === "page").length;

    expect(productCount).toBe(getAllProducts().length);
    expect(collectionCount).toBe(getAllSeries().length);
    expect(pageCount).toBe(Object.keys(PAGE_LABELS).length);
  });

  it("points each product entry at its product page", () => {
    const index = buildIndex();
    const entry = index.find((e) => e.kind === "product" && e.title === "Basin Mixer" && e.subtitle === "Joy");
    expect(entry?.href).toBe("/products/joy-basin-mixer");
  });

  it("uses the localized collection description, not raw data-file copy", () => {
    const index = buildIndex();
    const joy = index.find((e) => e.kind === "collection" && e.href === "/collections/joy");
    expect(joy?.subtitle).toBe("Joy collection description");
  });
});

describe("searchIndex", () => {
  const index = buildIndex();

  it("returns nothing for a blank query", () => {
    expect(searchIndex(index, "")).toEqual([]);
    expect(searchIndex(index, "   ")).toEqual([]);
  });

  it("is case-insensitive", () => {
    const lower = searchIndex(index, "joy basin");
    const upper = searchIndex(index, "JOY BASIN");
    expect(lower).toEqual(upper);
    expect(lower.length).toBeGreaterThan(0);
  });

  it("requires every query term to match", () => {
    const results = searchIndex(index, "joy nonexistentterm12345");
    expect(results).toEqual([]);
  });

  it("finds a static page by its label", () => {
    const results = searchIndex(index, "warranty");
    expect(results.some((r) => r.kind === "page" && r.href === "/warranty")).toBe(true);
  });

  it("respects the limit parameter", () => {
    const results = searchIndex(index, "joy", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

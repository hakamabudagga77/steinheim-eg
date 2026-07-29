import { describe, expect, it } from "vitest";
import { getStaticPageMetadata, localizedAlternates } from "@/lib/seo";

describe("localized SEO metadata", () => {
  it("builds a page-specific canonical and hreflang set", () => {
    expect(localizedAlternates("en", "/shop-by-need")).toEqual({
      canonical: "/en/shop-by-need",
      languages: {
        en: "/en/shop-by-need",
        ar: "/ar/shop-by-need",
        "x-default": "/en/shop-by-need",
      },
    });
  });

  it("gives Shop the Look unique Arabic metadata", () => {
    const metadata = getStaticPageMetadata("ar", "/shop-the-look", "shopTheLook");

    expect(metadata.title).toBe("تسوق إطلالات حمامات متكاملة | شتاينهايم مصر");
    expect(metadata.description).toContain("إطلالات حمامات شتاينهايم");
    expect(metadata.alternates?.canonical).toBe("/ar/shop-the-look");
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps experimental and personalized pages out of search results", () => {
    const metadata = getStaticPageMetadata("en", "/assistant", "assistant", { index: false });

    expect(metadata.alternates?.canonical).toBe("/en/assistant");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

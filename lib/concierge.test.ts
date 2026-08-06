import { describe, expect, it } from "vitest";
import { buildConciergeLink, CONCIERGE_NUMBER } from "@/lib/concierge";

describe("buildConciergeLink", () => {
  it("always targets the shop's WhatsApp number", () => {
    const link = buildConciergeLink({ kind: "generic" }, "en");
    expect(link.startsWith(`https://wa.me/${CONCIERGE_NUMBER}?text=`)).toBe(true);
  });

  it("encodes the message so it is a valid deep link", () => {
    const link = buildConciergeLink({ kind: "generic" }, "en");
    const text = new URL(link).searchParams.get("text");
    expect(text).toContain("design consultant");
  });

  it("names the product in a product context", () => {
    const link = buildConciergeLink(
      { kind: "product", productName: "Basin Mixer", seriesName: "Joy", price: "LE 12,500" },
      "en"
    );
    const text = new URL(link).searchParams.get("text");
    expect(text).toContain("Joy Basin Mixer");
    expect(text).toContain("LE 12,500");
  });

  it("omits the price when none is given", () => {
    const link = buildConciergeLink({ kind: "product", productName: "Basin Mixer" }, "en");
    const text = new URL(link).searchParams.get("text");
    expect(text).not.toContain("LE");
  });

  it("sends Arabic copy for the Arabic locale", () => {
    const link = buildConciergeLink({ kind: "trade" }, "ar");
    const text = new URL(link).searchParams.get("text");
    expect(text).toMatch(/[\u0600-\u06FF]/);
    expect(text).toContain("أسعار المحترفين");
  });

  it("keeps contact and trade contexts distinct", () => {
    const trade = new URL(buildConciergeLink({ kind: "trade" }, "en")).searchParams.get("text");
    const contact = new URL(buildConciergeLink({ kind: "contact" }, "en")).searchParams.get("text");
    expect(trade).toContain("trade");
    expect(contact).toContain("enquiry");
    expect(trade).not.toBe(contact);
  });
});

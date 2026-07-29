import { describe, expect, it } from "vitest";
import { classifyOrderChannel } from "@/lib/channel-attribution";
import type { ShopifyOrder } from "@/lib/shopify-client";

// classifyOrderChannel only reads landing_site / referring_site, so a partial
// fixture cast to ShopifyOrder is enough to exercise every branch.
function order(fields: Partial<ShopifyOrder>): ShopifyOrder {
  return { landing_site: null, referring_site: null, ...fields } as ShopifyOrder;
}

describe("classifyOrderChannel", () => {
  it("returns Direct when there is no attribution signal", () => {
    expect(classifyOrderChannel(order({}))).toEqual({
      key: "Direct",
      platform: "direct",
      type: "Direct",
    });
    expect(classifyOrderChannel(order({ landing_site: "/products/joy-basin-mixer" }))).toEqual({
      key: "Direct",
      platform: "direct",
      type: "Direct",
    });
  });

  it("classifies by referrer host, stripping www.", () => {
    expect(classifyOrderChannel(order({ referring_site: "https://www.instagram.com/" })).platform).toBe(
      "instagram"
    );
    expect(classifyOrderChannel(order({ referring_site: "https://facebook.com/ads" })).platform).toBe(
      "facebook"
    );
    expect(classifyOrderChannel(order({ referring_site: "https://l.fb.com/x" })).platform).toBe("facebook");
    expect(classifyOrderChannel(order({ referring_site: "https://www.google.com/search" })).platform).toBe(
      "google"
    );
  });

  it("lets the referrer win over utm_source", () => {
    const result = classifyOrderChannel(
      order({
        referring_site: "https://instagram.com/",
        landing_site: "/?utm_source=facebook",
      })
    );
    expect(result.platform).toBe("instagram");
    expect(result.key).toBe("Instagram (Organic)");
  });

  it("maps utm_source=facebook to the generic Meta bucket when no referrer is present", () => {
    const result = classifyOrderChannel(order({ landing_site: "/?utm_source=facebook" }));
    expect(result.platform).toBe("meta");
    expect(result.key).toBe("Meta Ads (Organic)");
  });

  it("maps utm_source=ig to instagram", () => {
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=ig" })).platform).toBe("instagram");
  });

  it("detects paid traffic from utm_medium or a click id", () => {
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=facebook&utm_medium=cpc" })).type).toBe(
      "Paid"
    );
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=facebook&utm_medium=paid" })).type).toBe(
      "Paid"
    );
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=facebook&fbclid=abc" })).key).toBe(
      "Meta Ads (Paid)"
    );
    expect(classifyOrderChannel(order({ referring_site: "https://google.com", landing_site: "/?gclid=xyz" })).type).toBe(
      "Paid"
    );
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=instagram&igshid=123" })).type).toBe(
      "Paid"
    );
  });

  it("treats a bare utm_source as organic without a paid signal", () => {
    expect(classifyOrderChannel(order({ landing_site: "/?utm_source=instagram" })).type).toBe("Organic");
  });

  it("capitalizes an unknown utm_source into an 'other' bucket", () => {
    const result = classifyOrderChannel(order({ landing_site: "/?utm_source=newsletter" }));
    expect(result.platform).toBe("other");
    expect(result.key).toBe("Newsletter (Organic)");
  });

  it("does not throw on an unparseable referring_site and still classifies", () => {
    const result = classifyOrderChannel(order({ referring_site: "::not a url::" }));
    expect(result.platform).toBe("other");
    expect(result.type).toBe("Organic");
  });
});

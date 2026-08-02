import { describe, expect, it } from "vitest";
import {
  decorateCheckoutUrl,
  isExpired,
  parseStoredAttribution,
  readAttributionParams,
} from "@/lib/attribution";

const NOW = Date.parse("2026-08-02T00:00:00.000Z");
const CART_URL = "https://rwxybt-jy.myshopify.com/cart/45464142020665:2";

describe("readAttributionParams", () => {
  it("picks up utm parameters and ad click ids", () => {
    const params = readAttributionParams(
      "?utm_source=facebook&utm_medium=cpc&utm_campaign=summer&fbclid=abc123"
    );
    expect(params).toEqual({
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "summer",
      fbclid: "abc123",
    });
  });

  it("ignores unrelated query parameters", () => {
    expect(readAttributionParams("?finish=chrome&page=2")).toEqual({});
  });

  it("truncates absurdly long values", () => {
    const params = readAttributionParams(`?utm_campaign=${"x".repeat(500)}`);
    expect(params.utm_campaign).toHaveLength(200);
  });
});

describe("decorateCheckoutUrl", () => {
  it("attaches the campaign to the Shopify cart permalink", () => {
    // Without this the permalink is the first Shopify URL the customer ever
    // touches, so order.landing_site carries no campaign and every order
    // classifies as Direct.
    const url = decorateCheckoutUrl(CART_URL, {
      params: { utm_source: "instagram", utm_medium: "paid", fbclid: "xyz" },
      capturedAt: new Date(NOW).toISOString(),
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("utm_source")).toBe("instagram");
    expect(parsed.searchParams.get("utm_medium")).toBe("paid");
    expect(parsed.searchParams.get("fbclid")).toBe("xyz");
    // The cart itself must survive untouched.
    expect(parsed.pathname).toBe("/cart/45464142020665:2");
  });

  it("returns the url unchanged when there is no attribution", () => {
    expect(decorateCheckoutUrl(CART_URL, null)).toBe(CART_URL);
  });

  it("never overwrites a parameter already on the target url", () => {
    const url = decorateCheckoutUrl(`${CART_URL}?utm_source=direct`, {
      params: { utm_source: "facebook" },
      capturedAt: new Date(NOW).toISOString(),
    });
    expect(new URL(url).searchParams.get("utm_source")).toBe("direct");
  });

  it("falls back to the original url rather than breaking checkout", () => {
    expect(
      decorateCheckoutUrl("not-a-url", {
        params: { utm_source: "facebook" },
        capturedAt: new Date(NOW).toISOString(),
      })
    ).toBe("not-a-url");
  });
});

describe("parseStoredAttribution", () => {
  const fresh = JSON.stringify({
    params: { utm_source: "google", gclid: "g1" },
    capturedAt: new Date(NOW - 1000).toISOString(),
  });

  it("reads a fresh touch", () => {
    expect(parseStoredAttribution(fresh, NOW)?.params).toEqual({
      utm_source: "google",
      gclid: "g1",
    });
  });

  it("drops a touch older than the window", () => {
    const stale = JSON.stringify({
      params: { utm_source: "google" },
      capturedAt: new Date(NOW - 31 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(parseStoredAttribution(stale, NOW)).toBeNull();
  });

  it("survives malformed or hostile storage", () => {
    expect(parseStoredAttribution(null, NOW)).toBeNull();
    expect(parseStoredAttribution("{{{", NOW)).toBeNull();
    expect(parseStoredAttribution(JSON.stringify({ params: "nope" }), NOW)).toBeNull();
    expect(
      parseStoredAttribution(
        JSON.stringify({ params: { evil: "x" }, capturedAt: new Date(NOW).toISOString() }),
        NOW
      )
    ).toBeNull();
  });
});

describe("isExpired", () => {
  it("treats an unparseable timestamp as expired", () => {
    expect(isExpired("not-a-date", NOW)).toBe(true);
  });
});

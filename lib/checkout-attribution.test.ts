import { describe, expect, it } from "vitest";
import {
  appendAttribution,
  hasSignal,
  isExpired,
  parseAttribution,
  sanitizeAttribution,
  ATTRIBUTION_MAX_AGE_MS,
  type Attribution,
} from "@/lib/checkout-attribution";

const OWN = "steinheim-eg.com";

describe("parseAttribution", () => {
  it("captures utm parameters", () => {
    const found = parseAttribution("?utm_source=instagram&utm_medium=paid&utm_campaign=launch", "", OWN);
    expect(found).toMatchObject({
      utm_source: "instagram",
      utm_medium: "paid",
      utm_campaign: "launch",
    });
  });

  it("captures click ids", () => {
    expect(parseAttribution("?fbclid=abc123", "", OWN)?.fbclid).toBe("abc123");
    expect(parseAttribution("?gclid=xyz", "", OWN)?.gclid).toBe("xyz");
  });

  it("records an external referrer host, stripping www.", () => {
    expect(parseAttribution("", "https://www.instagram.com/p/abc", OWN)?.ref_host).toBe("instagram.com");
  });

  // Internal navigation must not overwrite the ad click that started the visit.
  it("ignores a referrer pointing at our own site", () => {
    expect(parseAttribution("", "https://steinheim-eg.com/en/products", OWN)).toBeNull();
    expect(parseAttribution("", "https://www.steinheim-eg.com/en", OWN)).toBeNull();
  });

  it("returns null for direct traffic", () => {
    expect(parseAttribution("", "", OWN)).toBeNull();
    expect(parseAttribution("?page=2", "", OWN)).toBeNull();
  });
});

describe("appendAttribution", () => {
  const base = "https://rwxybt-jy.myshopify.com/cart/123:1";

  it("appends the source onto a cart permalink", () => {
    const url = new URL(
      appendAttribution(base, {
        utm_source: "facebook",
        utm_medium: "paid",
        ref_host: "instagram.com",
        ts: Date.now(),
      })
    );
    expect(url.pathname).toBe("/cart/123:1");
    expect(url.searchParams.get("utm_source")).toBe("facebook");
    expect(url.searchParams.get("utm_medium")).toBe("paid");
    expect(url.searchParams.get("ref_host")).toBe("instagram.com");
  });

  it("leaves the url untouched when there is nothing to attribute", () => {
    expect(appendAttribution(base, null)).toBe(base);
    expect(appendAttribution(base, { ts: Date.now() })).toBe(base);
  });

  it("never overwrites a parameter already on the url", () => {
    const withUtm = `${base}?utm_source=newsletter`;
    const out = new URL(appendAttribution(withUtm, { utm_source: "facebook", ts: Date.now() }));
    expect(out.searchParams.get("utm_source")).toBe("newsletter");
  });

  it("returns the input unchanged when it is not a valid url", () => {
    expect(appendAttribution("not a url", { utm_source: "facebook", ts: Date.now() })).toBe("not a url");
  });
});

describe("sanitizeAttribution", () => {
  it("keeps known keys and drops everything else", () => {
    const clean = sanitizeAttribution({
      utm_source: "instagram",
      evil: "<script>",
      quantity: 5,
    });
    expect(clean?.utm_source).toBe("instagram");
    expect(clean).not.toHaveProperty("evil");
    expect(clean).not.toHaveProperty("quantity");
  });

  it("ignores non-string values", () => {
    expect(sanitizeAttribution({ utm_source: 42, fbclid: null })).toBeNull();
  });

  // Client-supplied and destined for a URL we redirect the shopper to.
  it("caps value length", () => {
    const clean = sanitizeAttribution({ utm_campaign: "x".repeat(5000) });
    expect(clean?.utm_campaign?.length).toBe(256);
  });

  it("returns null for junk input", () => {
    expect(sanitizeAttribution(null)).toBeNull();
    expect(sanitizeAttribution("instagram")).toBeNull();
    expect(sanitizeAttribution({})).toBeNull();
  });
});

describe("expiry", () => {
  it("expires past Shopify's attribution window", () => {
    const stale: Attribution = { utm_source: "facebook", ts: Date.now() - ATTRIBUTION_MAX_AGE_MS - 1 };
    expect(isExpired(stale)).toBe(true);
    expect(isExpired({ utm_source: "facebook", ts: Date.now() })).toBe(false);
  });
});

describe("hasSignal", () => {
  it("is false for a timestamp alone", () => {
    expect(hasSignal({ ts: Date.now() })).toBe(false);
    expect(hasSignal({ ref_host: "instagram.com", ts: Date.now() })).toBe(true);
  });
});

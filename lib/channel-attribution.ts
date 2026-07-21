import type { ShopifyOrder } from "@/lib/shopify-client";

export type ChannelPlatform = "facebook" | "instagram" | "meta" | "google" | "direct" | "other";
export type ChannelType = "Paid" | "Organic" | "Direct";

export interface ChannelInfo {
  key: string;
  platform: ChannelPlatform;
  type: ChannelType;
}

// Built from order-level UTM/referrer data Shopify captures at checkout
// (order.landing_site / order.referring_site), not Shopify's own proprietary
// session-level multi-touch model that powers Growth > Attribution — so
// totals track it closely but individual orders can land in a different
// bucket than that report. referring_site is checked before utm_source
// because it's the only reliable way to tell Facebook and Instagram
// placements apart: Meta tags every ad click utm_source=facebook regardless
// of whether it ran on Facebook or Instagram, and its in-app browser often
// strips the referrer entirely. When neither gives us a real signal, we
// label it "Meta Ads" instead of guessing a specific platform — Shopify's
// own report can split these because its Facebook & Instagram app gets
// placement data straight from Meta that isn't exposed via the Orders API.
export function classifyOrderChannel(order: ShopifyOrder): ChannelInfo {
  let utmSource: string | null = null;
  let utmMedium: string | null = null;
  let hasClickId = false;

  if (order.landing_site) {
    try {
      const url = new URL(order.landing_site, "https://steinheim-eg.com");
      utmSource = url.searchParams.get("utm_source");
      utmMedium = url.searchParams.get("utm_medium");
      hasClickId = url.searchParams.has("fbclid") || url.searchParams.has("gclid") || url.searchParams.has("igshid");
    } catch {
      // malformed landing_site — fall through with no utm signal
    }
  }

  let referHost: string | null = null;
  if (order.referring_site) {
    try {
      referHost = new URL(order.referring_site).hostname.replace(/^www\./, "");
    } catch {
      referHost = order.referring_site;
    }
  }

  const hasSignal = Boolean(utmSource || utmMedium || hasClickId || referHost);
  if (!hasSignal) return { key: "Direct", platform: "direct", type: "Direct" };

  let platform: ChannelPlatform = "other";
  if (referHost?.includes("instagram")) platform = "instagram";
  else if (referHost?.includes("facebook") || referHost?.includes("fb.com")) platform = "facebook";
  else if (referHost?.includes("google")) platform = "google";
  else if (utmSource) {
    const s = utmSource.toLowerCase();
    if (s === "instagram" || s === "ig") platform = "instagram";
    else if (s === "facebook" || s === "fb") platform = "meta";
    else if (s.includes("google")) platform = "google";
  }

  const isPaid = utmMedium === "paid" || utmMedium === "cpc" || utmMedium === "ppc" || hasClickId;
  const type: ChannelType = isPaid ? "Paid" : "Organic";

  if (platform === "meta") {
    return { key: `Meta Ads (${type})`, platform, type };
  }

  if (platform !== "other") {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    return { key: `${label} (${type})`, platform, type };
  }

  const label = utmSource ? utmSource.charAt(0).toUpperCase() + utmSource.slice(1) : (referHost ?? "Unattributed");
  return { key: `${label} (${type})`, platform: "other", type };
}

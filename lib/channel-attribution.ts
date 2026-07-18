import type { ShopifyOrder } from "@/lib/shopify-client";

export type ChannelPlatform = "facebook" | "instagram" | "google" | "direct" | "other";
export type ChannelType = "Paid" | "Organic" | "Direct";

export interface ChannelInfo {
  key: string;
  platform: ChannelPlatform;
  type: ChannelType;
}

// Built from order-level UTM/referrer data Shopify captures at checkout
// (order.landing_site / order.referring_site), not Shopify's own proprietary
// session-level multi-touch model — so totals track it closely but won't
// match to the order. referring_site is checked before utm_source because it
// reliably tells Facebook and Instagram placements apart even when an ad
// account tags every click with the same utm_source=facebook.
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
    if (s.includes("instagram") || s === "ig") platform = "instagram";
    else if (s.includes("facebook") || s === "fb") platform = "facebook";
    else if (s.includes("google")) platform = "google";
  }

  const isPaid = utmMedium === "paid" || utmMedium === "cpc" || utmMedium === "ppc" || hasClickId;
  const type: ChannelType = isPaid ? "Paid" : "Organic";

  if (platform !== "other") {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    return { key: `${label} (${type})`, platform, type };
  }

  const label = utmSource ? utmSource.charAt(0).toUpperCase() + utmSource.slice(1) : (referHost ?? "Unattributed");
  return { key: `${label} (${type})`, platform: "other", type };
}

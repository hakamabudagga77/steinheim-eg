import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/en/trade/restore/",
        "/ar/trade/restore/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

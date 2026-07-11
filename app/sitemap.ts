import type { MetadataRoute } from "next";
import { getAllProducts, getAllSeries } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/collections", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/trade", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/warranty", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/shipping", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/returns", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  const locales = ["en", "ar"];

  const pages: MetadataRoute.Sitemap = staticPages.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }))
  );

  const series = getAllSeries();
  for (const s of series) {
    for (const locale of locales) {
      pages.push({
        url: `${BASE_URL}/${locale}/collections/${s.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const products = getAllProducts();
  for (const p of products) {
    for (const locale of locales) {
      pages.push({
        url: `${BASE_URL}/${locale}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return pages;
}

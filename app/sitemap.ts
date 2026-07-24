import type { MetadataRoute } from "next";
import { getAllProducts, getAllSeries } from "@/lib/utils";
import { projectReferences } from "@/data/project-references";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const languageAlternates = (path: string) => ({
    languages: {
      en: `${BASE_URL}/en${path}`,
      ar: `${BASE_URL}/ar${path}`,
      "x-default": `${BASE_URL}/en${path}`,
    },
  });

  const staticPages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/collections", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/best-sellers", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/projects", priority: 0.8, changeFrequency: "monthly" as const },
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
      alternates: languageAlternates(path),
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
        alternates: languageAlternates(`/collections/${s.id}`),
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
        alternates: languageAlternates(`/products/${p.slug}`),
      });
    }
  }

  for (const project of projectReferences) {
    for (const locale of locales) {
      pages.push({
        url: `${BASE_URL}/${locale}/projects/${project.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: languageAlternates(`/projects/${project.slug}`),
      });
    }
  }

  return pages;
}

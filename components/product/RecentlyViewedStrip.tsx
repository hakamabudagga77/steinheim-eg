"use client";

import { useTranslations } from "next-intl";
import ProductCard from "@/components/product/ProductCard";
import { useRecentlyViewed } from "@/components/product/useRecentlyViewed";
import { getProductBySlug } from "@/lib/utils";

export default function RecentlyViewedStrip({ excludeSlug }: { excludeSlug?: string }) {
  const t = useTranslations("recentlyViewed");
  const entries = useRecentlyViewed();

  const products = entries
    .filter((entry) => entry.slug !== excludeSlug)
    .flatMap((entry) => {
      const product = getProductBySlug(entry.slug);
      return product ? [product] : [];
    })
    .slice(0, 8);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-black/6 px-5 py-16 text-start sm:px-8 lg:px-16 lg:py-20">
      <div className="mx-auto max-w-[1780px]">
        <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("eyebrow")}</p>
        <div data-lenis-prevent className="mt-8 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-7">
          {products.map((product) => (
            <div key={product.slug} className="w-[200px] shrink-0 sm:w-[240px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

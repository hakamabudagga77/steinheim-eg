"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/product/ProductCard";
import PageTransition from "@/components/layout/PageTransition";
import { decodeWishlistItems } from "@/lib/wishlist";
import { getProductBySlug } from "@/lib/utils";
import { useWishlist } from "@/components/wishlist/WishlistContext";

export default function SharedWishlistPage() {
  return (
    <Suspense fallback={null}>
      <SharedWishlistContent />
    </Suspense>
  );
}

function SharedWishlistContent() {
  const t = useTranslations("sharedWishlistPage");
  const searchParams = useSearchParams();
  const { addItem, setOpen } = useWishlist();
  const [added, setAdded] = useState(false);

  const entries = useMemo(() => {
    const raw = searchParams.get("items");
    if (!raw) return [];
    return decodeWishlistItems(raw).flatMap((item) => {
      const product = getProductBySlug(item.slug);
      if (!product || !product.variants.some((v) => v.finish === item.finish)) return [];
      return [{ product, finish: item.finish }];
    });
  }, [searchParams]);

  function addAll() {
    entries.forEach(({ product, finish }) => addItem(product.slug, finish));
    setAdded(true);
  }

  return (
    <PageTransition>
      <section className="bg-charcoal pt-[124px]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
              {t("eyebrow")}
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white">
              {t("title")}
            </h1>
            {entries.length > 0 && (
              <p className="mt-4 text-[14px] text-white/50">
                {t("itemCount", { count: entries.length })}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-[1780px]">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h2 className="font-heading text-[24px] text-charcoal">{t("emptyTitle")}</h2>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-warm-gray">
                {t("emptyBody")}
              </p>
              <Link
                href="/collections"
                className="mt-8 inline-flex h-11 items-center px-7 text-[10px] font-medium uppercase tracking-[0.15em] bg-charcoal text-white transition hover:bg-black"
              >
                {t("browse")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[13px] text-warm-gray">{t("addAllHint")}</p>
                <button
                  type="button"
                  onClick={addAll}
                  className={`inline-flex h-11 shrink-0 items-center px-7 text-[10px] font-medium uppercase tracking-[0.15em] transition ${
                    added ? "bg-charcoal/10 text-charcoal" : "bg-charcoal text-white hover:bg-black"
                  }`}
                >
                  {added ? t("addedAll") : t("addAll")}
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20"
              >
                {entries.map(({ product, finish }) => (
                  <ProductCard key={`${product.slug}-${finish}`} product={product} finish={finish} />
                ))}
              </motion.div>

              {added && (
                <div className="mt-16 text-center">
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-[12px] font-medium uppercase tracking-[0.15em] text-charcoal underline underline-offset-4 hover:text-black"
                  >
                    {t("viewWishlist")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageTransition>
  );
}

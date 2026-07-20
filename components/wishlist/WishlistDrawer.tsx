"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, getAllFinishes, getProductBySlug, getSeriesById } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import { encodeWishlistItems } from "@/lib/wishlist";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useCart } from "@/components/cart/CartContext";

export default function WishlistDrawer({ locale }: { locale: string }) {
  const t = useTranslations("wishlistDrawer");
  const isArabic = locale === "ar";
  const { wishlist, open, setOpen, removeItem, itemCount } = useWishlist();
  const { addItem: addToCart } = useCart();
  const finishes = getAllFinishes();
  const [shared, setShared] = useState(false);

  async function shareWishlist() {
    const url = `${window.location.origin}/${locale}/wishlist?items=${encodeWishlistItems(wishlist.items)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      window.prompt(t("shareFallback"), url);
    }
  }

  const rows = wishlist.items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    const series = getSeriesById(product.series);
    return [{
      item,
      product,
      variant,
      series,
      finish: finishes.find((f) => f.id === item.finish),
    }];
  });

  // Not wrapped in AnimatePresence: several rows above navigate via next-intl
  // Link while also calling setOpen(false) in the same click, and Framer
  // Motion's exit lifecycle can be interrupted by that concurrent route
  // change, leaving an invisible-but-clickable backdrop stuck over the page.
  // A plain conditional render unmounts synchronously and can never get stuck.
  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <motion.aside
        initial={{ x: isArabic ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.76, 0.2, 1] }}
        className={`fixed bottom-0 top-0 z-[80] flex w-full max-w-[100vw] sm:max-w-[440px] flex-col bg-white ${isArabic ? "left-0" : "right-0"}`}
        dir={isArabic ? "rtl" : "ltr"}
      >
            <header className="shrink-0 border-b border-charcoal/8 px-5 sm:px-7 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-[26px] leading-tight">{t("title")}</h2>
                  <p className="mt-0.5 text-[11px] text-warm-gray">
                    {itemCount === 0 ? t("noItems") : t("itemCount", { count: itemCount })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {itemCount > 0 && (
                    <button
                      type="button"
                      onClick={shareWishlist}
                      className="flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
                      aria-label={t("share")}
                      title={shared ? t("shareCopied") : t("share")}
                    >
                      {shared ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
                          <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
                    aria-label={t("close")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 sm:px-7 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-warm-gray">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-heading text-[22px]">{t("emptyTitle")}</h3>
                  <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-warm-gray">
                    {t("emptyBody")}
                  </p>
                  <Link
                    href="/collections"
                    onClick={() => setOpen(false)}
                    className="mt-8 inline-flex h-11 items-center px-7 text-[10px] font-medium uppercase tracking-[0.15em] bg-charcoal text-white transition hover:bg-black"
                  >
                    {t("browse")}
                  </Link>
                </div>
              ) : (
                <div className="px-5 sm:px-7 py-5">
                  <div className="divide-y divide-charcoal/6">
                    {rows.map(({ item, product, variant, series, finish }) => {
                      const img = getProductImage(product.slug, variant.finish);
                      return (
                        <motion.div
                          key={`${item.slug}-${item.finish}`}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="py-5"
                        >
                          <div className="flex gap-4">
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() => setOpen(false)}
                              className="relative h-[80px] w-[80px] shrink-0 bg-[#ece9e2]"
                            >
                              {img && (
                                <Image src={img} alt={product.name} fill sizes="80px" className="object-contain p-2" />
                              )}
                            </Link>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link
                                    href={`/products/${product.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="font-heading text-[16px] leading-tight text-charcoal hover:underline underline-offset-2"
                                  >
                                    {product.name}
                                  </Link>
                                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-warm-gray">
                                    {series?.name ?? product.series} · {finish?.name ?? item.finish}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.slug, item.finish)}
                                  className="mt-0.5 text-warm-gray/40 transition hover:text-charcoal"
                                  aria-label={t("remove")}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <p className="text-[14px] font-medium text-charcoal">
                                  {formatPrice(variant.price)}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToCart(item.slug, item.finish);
                                    removeItem(item.slug, item.finish);
                                  }}
                                  className="rounded-full border border-charcoal/15 px-4 py-1.5 text-[11px] font-medium text-charcoal transition hover:border-charcoal hover:bg-charcoal hover:text-white"
                                >
                                  {t("addToCart")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
      </motion.aside>
    </>
  );
}

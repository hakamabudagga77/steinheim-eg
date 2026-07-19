"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, getAllFinishes, getProductBySlug, getSeriesById } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import { useCart } from "@/components/cart/CartContext";

const WHATSAPP_NUMBER = "201223998124";

export default function CartDrawer({ locale }: { locale: string }) {
  const t = useTranslations("cartDrawer");
  const isArabic = locale === "ar";
  const { cart, open, setOpen, updateQuantity, removeItem, clearCart, itemCount } = useCart();
  const finishes = useMemo(() => getAllFinishes(), []);
  const [checkingOut, setCheckingOut] = useState(false);
  const [liveData, setLiveData] = useState<Record<string, { variants: Array<{ finish: string; price: number; inventory: number; inStock: boolean }> }>>({});

  useEffect(() => {
    if (!open) return;
    fetch("/api/shopify/prices")
      .then((r) => r.ok ? r.json() : {})
      .then(setLiveData)
      .catch(() => {});
  }, [open]);

  const rows = cart.items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    const series = getSeriesById(product.series);
    const live = liveData[item.slug]?.variants.find((v) => v.finish === item.finish);
    return [{
      item,
      product,
      variant,
      series,
      finish: finishes.find((f) => f.id === item.finish),
      livePrice: live?.price,
      inStock: live?.inStock,
    }];
  });

  const subtotal = rows.reduce((sum, r) => sum + (r.livePrice ?? r.variant.price) * r.item.quantity, 0);

  function buildWhatsAppOrder() {
    const lines = rows
      .map(
        (r) =>
          `• ${r.series?.name ?? r.product.series} ${r.product.name} — ${r.finish?.name ?? r.item.finish} (${r.variant.model}) × ${r.item.quantity} = ${formatPrice((r.livePrice ?? r.variant.price) * r.item.quantity)}`
      )
      .join("\n");

    return [
      `*New order from steinheim-eg.com*`,
      ``,
      `*Items:*`,
      lines,
      ``,
      `*Subtotal:* ${formatPrice(subtotal)}`,
      ``,
      `I'd like to place this order. Please confirm availability and payment details.`,
    ].join("\n");
  }

  function handleCheckoutWhatsApp() {
    const msg = buildWhatsAppOrder();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // Not wrapped in AnimatePresence: several rows below navigate via next-intl
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
            {/* Header */}
            <header className="shrink-0 border-b border-charcoal/8 px-5 sm:px-7 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-[26px] leading-tight">{t("title")}</h2>
                  <p className="mt-0.5 text-[11px] text-warm-gray">
                    {itemCount === 0 ? t("noItems") : t("itemCount", { count: itemCount })}
                  </p>
                </div>
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
            </header>

            {/* Items */}
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 sm:px-7 py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-warm-gray">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
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
                  <div className="flex items-center justify-between pb-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray">
                      {t("productCount", { count: rows.length })}
                    </p>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-[9px] uppercase tracking-[0.12em] text-warm-gray/50 transition hover:text-charcoal"
                    >
                      {t("clearAll")}
                    </button>
                  </div>

                  <div className="divide-y divide-charcoal/6">
                    {rows.map(({ item, product, variant, series, finish, livePrice }) => {
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
                                <Image
                                  src={img}
                                  alt={product.name}
                                  fill
                                  sizes="80px"
                                  className="object-contain p-2"
                                />
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
                                <div className="flex items-center border border-charcoal/10">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      item.quantity <= 1
                                        ? removeItem(item.slug, item.finish)
                                        : updateQuantity(item.slug, item.finish, item.quantity - 1)
                                    }
                                    className="flex h-7 w-7 items-center justify-center text-[13px] text-warm-gray transition hover:text-charcoal"
                                  >
                                    {item.quantity <= 1 ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                      </svg>
                                    ) : (
                                      "−"
                                    )}
                                  </button>
                                  <span className="flex h-7 w-8 items-center justify-center border-x border-charcoal/10 text-[12px]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.slug, item.finish, item.quantity + 1)}
                                    className="flex h-7 w-7 items-center justify-center text-[13px] text-warm-gray transition hover:text-charcoal"
                                  >
                                    +
                                  </button>
                                </div>

                                <p className="text-[14px] font-medium text-charcoal">
                                  {formatPrice((livePrice ?? variant.price) * item.quantity)}
                                </p>
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

            {/* Footer */}
            {rows.length > 0 && (
              <footer className="shrink-0 border-t border-charcoal/8 bg-white px-5 sm:px-7 py-5">
                <div className="flex items-center justify-between pb-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-warm-gray">
                    {t("subtotal")}
                  </p>
                  <p className="font-heading text-[22px] text-charcoal">
                    {formatPrice(subtotal)}
                  </p>
                </div>

                <p className="pb-4 text-[10px] leading-relaxed text-warm-gray/60">
                  {t("shippingNote")}
                </p>

                <button
                  type="button"
                  disabled={checkingOut}
                  onClick={async () => {
                    setCheckingOut(true);
                    try {
                      const res = await fetch("/api/shopify/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          items: cart.items.map((i) => ({
                            slug: i.slug,
                            finish: i.finish,
                            quantity: i.quantity,
                          })),
                        }),
                      });
                      const data = await res.json();
                      if (data.checkoutUrl) {
                        window.open(data.checkoutUrl, "_blank");
                      }
                    } catch {
                      // fall through
                    } finally {
                      setCheckingOut(false);
                    }
                  }}
                  className="flex h-[50px] w-full items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
                >
                  {checkingOut ? t("preparingCheckout") : t("checkout")}
                  {!checkingOut && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCheckoutWhatsApp}
                  className="mt-2 flex h-[44px] w-full items-center justify-center gap-2 border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-charcoal/60">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.257-.154-2.871.853.853-2.871-.154-.257A8 8 0 1112 20z" />
                  </svg>
                  {t("whatsappEnquire")}
                </button>

                <p className="mt-3 text-center text-[9px] text-warm-gray/50">
                  {t("secureNote")}
                </p>
              </footer>
            )}
      </motion.aside>
    </>
  );
}

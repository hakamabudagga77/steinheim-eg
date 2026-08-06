"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { formatPrice, getProductBySlug, getSeriesById } from "@/lib/utils";
import { buildConciergeLink, type ConciergeContext } from "@/lib/concierge";

function resolveContext(pathname: string): ConciergeContext {
  const productMatch = /^\/products\/([^/]+)/.exec(pathname);
  if (productMatch) {
    const product = getProductBySlug(productMatch[1]);
    if (product) {
      const series = getSeriesById(product.series);
      return {
        kind: "product",
        productName: product.name,
        seriesName: series?.name ?? product.series,
        price: formatPrice(product.variants[0].price),
      };
    }
    return { kind: "generic" };
  }
  if (pathname.startsWith("/trade")) return { kind: "trade" };
  if (pathname.startsWith("/contact")) return { kind: "contact" };
  return { kind: "generic" };
}

// A persistent "talk to a designer" channel. Sits above BackToTop on the
// non-start side (bottom-start in RTL) so it never collides with the cart-side
// floaters, and opens WhatsApp with a message pre-shaped to where the shopper
// is: product, trade, contact, or a generic welcome.
export default function DesignerConcierge({ locale }: { locale: string }) {
  const t = useTranslations("concierge");
  const pathname = usePathname();
  const href = useMemo(
    () => buildConciergeLink(resolveContext(pathname), locale === "ar" ? "ar" : "en"),
    [pathname, locale]
  );

  return (
    <motion.a
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-24 right-6 rtl:right-auto rtl:left-6 z-50 flex h-[52px] items-center rounded-full border border-white/20 bg-[#0a0a0a] pl-5 pr-5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.32)] backdrop-blur-sm transition-colors duration-300 hover:bg-black sm:pr-7"
      aria-label={t("label")}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.257-.154-2.871.853.853-2.871-.154-.257A8 8 0 1112 20z" />
      </svg>
      <span className="ms-3 hidden text-[10px] font-medium uppercase tracking-[0.2em] sm:inline">
        {t("label")}
      </span>
    </motion.a>
  );
}

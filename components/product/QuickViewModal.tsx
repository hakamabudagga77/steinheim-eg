"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Modal from "@/components/ui/Modal";
import SpecTable from "@/components/product/SpecTable";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getSeriesById, type Product } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";

type LiveVariants = Array<{ finish: string; price: number; inventory: number; inStock: boolean }>;

export default function QuickViewModal({
  product,
  liveVariants,
  open,
  onClose,
}: {
  product: Product;
  liveVariants?: LiveVariants;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("cards");
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const liveVariant = liveVariants?.find((entry) => entry.finish === variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series[0].toUpperCase() + product.series.slice(1);
  const finish = getFinishById(variant.finish);

  return (
    <Modal
      open={open}
      onClose={onClose}
      centered
      backdropClassName="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-[2px]"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickview-title"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 0.76, 0.2, 1] }}
        className="relative grid max-h-[90svh] w-full max-w-[1000px] overflow-y-auto rounded-[8px] bg-[#ece9e2] text-black sm:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("quickViewClose")}
          className="absolute end-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/8 text-black/45 transition hover:bg-black hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        <div className="relative aspect-square bg-[#ece9e2] sm:aspect-auto">
          <AnimatePresence mode="wait">
            <motion.div key={variant.finish} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="absolute inset-0">
              {imageUrl ? (
                <Image src={imageUrl} alt={`${seriesName} ${product.name} in ${finish?.name ?? variant.finish}`} fill sizes="(max-width: 640px) 100vw, 500px" className="object-contain p-[10%]" />
              ) : (
                <div className="flex h-full items-center justify-center px-5 text-center font-heading text-xl text-black/20">{product.name}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/35" style={{ fontStyle: "italic" }}>{seriesName}</p>
          <h2 id="quickview-title" className="mt-1 font-heading text-[26px] leading-[1.1] tracking-[-0.02em] text-black">
            {product.name}
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <p className="text-[18px] font-medium">{formatPrice(liveVariant?.price ?? variant.price)}</p>
            {liveVariant && (
              <span className={`inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.08em] ${liveVariant.inStock ? "text-emerald-600" : "text-red-400"}`}>
                <span className={`h-1 w-1 rounded-full ${liveVariant.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                {liveVariant.inStock ? t("inStock") : t("outOfStock")}
              </span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-black/40">{finish?.name}</p>
              <div className="flex flex-wrap items-center gap-1.5" aria-label={t("availableFinishes")}>
                {product.variants.map((entry) => {
                  const entryFinish = getFinishById(entry.finish);
                  const disc = getFinishDiscImage(entry.finish);
                  if (!entryFinish) return null;
                  return (
                    <button
                      key={entry.finish}
                      type="button"
                      onClick={() => setSelectedFinish(entry.finish)}
                      title={entryFinish.name}
                      aria-label={t("showFinish", { name: entryFinish.name })}
                      aria-pressed={selectedFinish === entry.finish}
                      className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-full border transition cursor-pointer ${selectedFinish === entry.finish ? "scale-110 border-black ring-1 ring-black ring-offset-1" : "border-black/10 hover:border-black/40"}`}
                    >
                      {disc ? <Image src={disc} alt="" fill sizes="28px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: entryFinish.hex }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                addItem(product.slug, variant.finish);
                setAdded(true);
                setTimeout(() => setAdded(false), 1600);
              }}
              className={`flex h-11 items-center justify-center rounded-full border px-6 text-[13px] font-medium uppercase tracking-[0.08em] transition cursor-pointer ${
                added ? "border-black bg-black text-white" : "border-black bg-black text-white hover:bg-black/85"
              }`}
            >
              {added ? t("added") : t("add")}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex h-11 items-center justify-center rounded-full border border-black/20 px-6 text-[13px] text-black/70 transition hover:border-black hover:text-black"
            >
              {t("viewFullDetails")}
            </Link>
          </div>

          <div className="mt-8 max-h-[240px] overflow-y-auto border-t border-black/8 pt-4">
            <SpecTable product={product} />
          </div>
        </div>
      </motion.div>
    </Modal>
  );
}

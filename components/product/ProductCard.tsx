"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getSeriesById, type Product } from "@/lib/utils";

type LiveVariants = Array<{ finish: string; price: number; inventory: number; inStock: boolean }>;

export default function ProductCard({ product, liveVariants, hidePrice = false }: { product: Product; liveVariants?: LiveVariants; hidePrice?: boolean }) {
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const liveVariant = liveVariants?.find((v) => v.finish === variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series[0].toUpperCase() + product.series.slice(1);

  return (
    <article>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-[18px] bg-white">
          <AnimatePresence mode="wait">
            <motion.div key={variant.finish} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="absolute inset-0">
              {imageUrl ? (
                <Image src={imageUrl} alt={`${seriesName} ${product.name} in ${getFinishById(variant.finish)?.name ?? variant.finish}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-contain p-[12%] transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
              ) : (
                <div className="flex h-full items-center justify-center px-5 text-center font-heading text-xl text-black/20">{product.name}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="pt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/35">{seriesName}</p>
          <p className="mt-1 text-[13px] text-black/60">{variant.model}</p>
          {!hidePrice && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-[14px] font-medium">{formatPrice(liveVariant?.price ?? variant.price)}</p>
              {liveVariant && (
                <span className={`inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.08em] ${liveVariant.inStock ? "text-emerald-600" : "text-red-400"}`}>
                  <span className={`h-1 w-1 rounded-full ${liveVariant.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                  {liveVariant.inStock ? "In stock" : "Out of stock"}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Available finishes">
        {product.variants.map((entry) => {
          const finish = getFinishById(entry.finish);
          const disc = getFinishDiscImage(entry.finish);
          if (!finish) return null;
          return (
            <button
              key={entry.finish}
              type="button"
              onClick={() => setSelectedFinish(entry.finish)}
              title={finish.name}
              aria-label={`Show ${finish.name}`}
              aria-pressed={selectedFinish === entry.finish}
              className={`relative h-6 w-6 overflow-hidden rounded-full border transition cursor-pointer ${selectedFinish === entry.finish ? "scale-110 border-black ring-1 ring-black ring-offset-2" : "border-black/10 hover:border-black/40"}`}
            >
              {disc ? <Image src={disc} alt="" fill sizes="24px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />}
            </button>
          );
        })}
      </div>
    </article>
  );
}

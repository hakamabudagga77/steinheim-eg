"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, type Product } from "@/lib/utils";

type LiveVariants = Array<{ finish: string; price: number; inventory: number; inStock: boolean }>;

export default function ProductCard({ product, liveVariants }: { product: Product; liveVariants?: LiveVariants }) {
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const liveVariant = liveVariants?.find((v) => v.finish === variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const seriesName = product.series[0].toUpperCase() + product.series.slice(1);

  return (
    <article>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-square overflow-hidden border border-border-light bg-white">
          <AnimatePresence mode="wait">
            <motion.div key={variant.finish} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="absolute inset-0">
              {imageUrl ? (
                <Image src={imageUrl} alt={`${seriesName} ${product.name} in ${getFinishById(variant.finish)?.name ?? variant.finish}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-contain p-[12%] transition-transform duration-700 ease-out group-hover:scale-[1.025]" />
              ) : (
                <div className="flex h-full items-center justify-center px-5 text-center font-heading text-xl text-warm-gray/45">{product.name}</div>
              )}
            </motion.div>
          </AnimatePresence>
          <span className="absolute left-4 top-4 text-[8px] font-medium uppercase tracking-[0.18em] text-warm-gray sm:left-5 sm:top-5">{seriesName}</span>
        </div>
        <div className="pt-5">
          <h3 className="font-heading text-lg leading-tight text-charcoal sm:text-[1.35rem]">{product.name}</h3>
          <div className="mt-2 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-warm-gray">{variant.model}</p>
            <span className="flex items-center gap-2">
              <p className="text-xs font-medium text-charcoal">{formatPrice(liveVariant?.price ?? variant.price)}</p>
              {liveVariant && (
                <span className={`inline-flex items-center gap-1 text-[8px] font-medium uppercase tracking-[0.08em] ${liveVariant.inStock ? "text-emerald-600" : "text-red-400"}`}>
                  <span className={`h-1 w-1 rounded-full ${liveVariant.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                  {liveVariant.inStock ? "In stock" : "Out of stock"}
                </span>
              )}
            </span>
          </div>
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
              title={`${finish.name} · ${formatPrice(entry.price)}`}
              aria-label={`Show ${finish.name}`}
              aria-pressed={selectedFinish === entry.finish}
              className={`relative h-5 w-5 overflow-hidden rounded-full border transition ${selectedFinish === entry.finish ? "scale-110 border-charcoal ring-1 ring-charcoal ring-offset-2" : "border-black/10 hover:border-charcoal/50"}`}
            >
              {disc ? <Image src={disc} alt="" fill sizes="20px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />}
            </button>
          );
        })}
      </div>
    </article>
  );
}

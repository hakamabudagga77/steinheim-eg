"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getSeriesById, type Product } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";

type LiveVariants = Array<{ finish: string; price: number; inventory: number; inStock: boolean }>;

export default function ProductCard({
  product,
  liveVariants,
  hidePrice = false,
  finish: groupFinish,
  onAdd,
}: {
  product: Product;
  liveVariants?: LiveVariants;
  hidePrice?: boolean;
  finish?: string | null;
  onAdd?: (slug: string, finish: string, quantity: number) => void;
}) {
  const [selectedFinish, setSelectedFinish] = useState(groupFinish ?? product.variants[0].finish);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // A group-level finish choice (e.g. the collection page's "Choose a finish" selector)
  // sets this card's default, but the shopper can still pick a different one for this card alone.
  useEffect(() => {
    if (groupFinish) setSelectedFinish(groupFinish);
  }, [groupFinish]);

  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const liveVariant = liveVariants?.find((v) => v.finish === variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series[0].toUpperCase() + product.series.slice(1);

  return (
    <article>
      <Link
        href={`/products/${product.slug}`}
        className="group block"
        {...(onAdd ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <div className="relative aspect-square overflow-hidden bg-[#ece9e2]">
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/35" style={{ fontStyle: "italic" }}>{seriesName}</p>
          <p className="mt-1 text-[15px] font-medium text-black">{product.name}</p>
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

      {onAdd ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Available finishes">
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
                  className={`relative h-6 w-6 shrink-0 overflow-hidden rounded-full border transition cursor-pointer ${selectedFinish === entry.finish ? "scale-110 border-black ring-1 ring-black ring-offset-1" : "border-black/10 hover:border-black/40"}`}
                >
                  {disc ? <Image src={disc} alt="" fill sizes="24px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 flex-1 items-center border border-black/12">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[14px] text-black/55 transition hover:text-black"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={9999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.round(Number(e.target.value)) || 1))}
                className="h-full w-full min-w-0 border-x border-black/12 bg-transparent text-center text-[12px] outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-full w-8 shrink-0 items-center justify-center text-[14px] text-black/55 transition hover:text-black"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onAdd(product.slug, variant.finish, quantity);
                setAdded(true);
                setTimeout(() => setAdded(false), 1600);
              }}
              aria-label={added ? "Added" : "Add"}
              className={`flex h-8 shrink-0 items-center justify-center rounded-full border px-4 text-[11px] font-medium uppercase tracking-[0.08em] transition cursor-pointer ${
                added ? "border-black bg-black text-white" : "border-black/15 text-black/55 hover:border-black hover:text-black"
              }`}
            >
              {added ? "Added" : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5" aria-label="Available finishes">
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
                  className={`relative h-5 w-5 shrink-0 overflow-hidden rounded-full border transition cursor-pointer sm:h-6 sm:w-6 ${selectedFinish === entry.finish ? "scale-110 border-black ring-1 ring-black ring-offset-1 sm:ring-offset-2" : "border-black/10 hover:border-black/40"}`}
                >
                  {disc ? <Image src={disc} alt="" fill sizes="24px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              addItem(product.slug, variant.finish);
              setAdded(true);
              setTimeout(() => setAdded(false), 1600);
            }}
            aria-label={added ? "Added to cart" : "Quick add to cart"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[15px] transition cursor-pointer sm:h-auto sm:w-auto sm:rounded-full sm:px-3 sm:py-1.5 sm:text-[11px] sm:font-medium ${
              added ? "border-black bg-black text-white" : "border-black/15 text-black/55 hover:border-black hover:text-black"
            }`}
          >
            <span className="sm:hidden">{added ? "✓" : "+"}</span>
            <span className="hidden sm:inline">{added ? "Added" : "Quick add"}</span>
          </button>
        </div>
      )}
    </article>
  );
}

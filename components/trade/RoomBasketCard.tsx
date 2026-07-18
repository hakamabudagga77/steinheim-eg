"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { formatPrice, type Finish, type Product, type Variant } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import type { TradeProjectItem } from "@/lib/trade-project";

export function ProjectItemRow({
  item,
  product,
  variant,
  finish,
  inStock,
  onRemove,
  onQuantityChange,
}: {
  item: TradeProjectItem;
  product: Product;
  variant: Variant;
  finish: Finish | undefined;
  inStock?: boolean;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const img = getProductImage(product.slug, variant.finish);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group bg-white"
    >
      <div className="flex gap-4 p-4">
        <div className="relative h-[72px] w-[72px] shrink-0 bg-[#ece9e2]">
          {img && <Image src={img} alt={product.name} fill sizes="72px" className="object-contain p-1" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-heading text-[17px] leading-tight">{product.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-warm-gray">
                {product.series[0].toUpperCase() + product.series.slice(1)} · {finish?.name ?? item.finish}
              </p>
              <p className="mt-0.5 text-[9px] text-warm-gray/60">{variant.model}</p>
              {inStock !== undefined && (
                <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.08em] ${inStock ? "text-emerald-600" : "text-red-400"}`}>
                  <span className={`h-1 w-1 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                  {inStock ? "In stock" : "Out of stock"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="mt-0.5 text-warm-gray/40 transition hover:text-charcoal"
              aria-label="Remove"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center border border-charcoal/12">
              <button
                type="button"
                onClick={() => onQuantityChange(item.quantity - 1)}
                className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="10000"
                value={item.quantity}
                onChange={(e) => onQuantityChange(Number(e.target.value))}
                className="h-7 w-12 border-x border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
              />
              <button
                type="button"
                onClick={() => onQuantityChange(item.quantity + 1)}
                className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
              >
                +
              </button>
            </div>
            <p className="text-[12px] font-medium text-charcoal">
              {formatPrice(variant.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function RoomBasketCard({
  title,
  summary,
  itemRows,
  liveStock,
  onRemoveItem,
  onQuantityChange,
}: {
  title: string;
  summary?: string;
  itemRows: Array<{ item: TradeProjectItem; product: Product; variant: Variant; finish: Finish | undefined }>;
  liveStock?: Record<string, boolean>;
  onRemoveItem: (slug: string, finish: string) => void;
  onQuantityChange: (slug: string, finish: string, quantity: number) => void;
}) {
  const totalUnits = itemRows.reduce((sum, row) => sum + row.item.quantity, 0);
  const totalValue = itemRows.reduce((sum, row) => sum + row.variant.price * row.item.quantity, 0);

  return (
    <div className="border border-charcoal/8">
      <div className="bg-white p-3">
        <p className="truncate text-[13px] font-medium text-charcoal">{title}</p>
        {summary && <p className="mt-0.5 text-[10px] text-warm-gray">{summary}</p>}
        {itemRows.length > 0 && (
          <p className="mt-0.5 text-[10px] text-warm-gray/70">{totalUnits} units · {formatPrice(totalValue)}</p>
        )}
      </div>
      {itemRows.length > 0 && (
        <div className="divide-y divide-charcoal/8 border-t border-charcoal/8">
          {itemRows.map(({ item, product, variant, finish }) => (
            <ProjectItemRow
              key={`${item.scopeId}-${item.slug}-${item.finish}`}
              item={item}
              product={product}
              variant={variant}
              finish={finish}
              inStock={liveStock?.[`${item.slug}::${item.finish}`]}
              onRemove={() => onRemoveItem(item.slug, item.finish)}
              onQuantityChange={(quantity) => onQuantityChange(item.slug, item.finish, quantity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShopifyProduct } from "@/lib/shopify-client";

const LOW_STOCK_THRESHOLD = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load products.");
        }
        return res.json();
      })
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message));
  }, []);

  const lowStockVariants = useMemo(() => {
    if (!products) return [];
    return products
      .flatMap((product) =>
        product.variants
          .filter((v) => v.inventory_quantity <= LOW_STOCK_THRESHOLD)
          .map((v) => ({ product, variant: v }))
      )
      .sort((a, b) => a.variant.inventory_quantity - b.variant.inventory_quantity);
  }, [products]);

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Products</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">
        {products ? `${products.length} product${products.length === 1 ? "" : "s"}` : "Loading…"}
      </h1>
      <p className="mt-2 text-[13px] text-black/40">Live from Shopify · read-only</p>

      {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}

      {lowStockVariants.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-6">
          <p className="text-[13px] font-medium text-amber-900">
            {lowStockVariants.length} variant{lowStockVariants.length === 1 ? "" : "s"} at or below {LOW_STOCK_THRESHOLD} units
          </p>
          <div className="mt-4 space-y-1.5">
            {lowStockVariants.slice(0, 12).map(({ product, variant }) => (
              <div key={variant.id} className="flex items-center justify-between text-[13px]">
                <span className="text-amber-900/80">
                  {product.title} — {variant.title !== "Default Title" ? variant.title : variant.sku || "—"}
                </span>
                <span className="font-medium text-amber-900">
                  {variant.inventory_quantity <= 0 ? "Out of stock" : `${variant.inventory_quantity} left`}
                </span>
              </div>
            ))}
            {lowStockVariants.length > 12 && (
              <p className="pt-1 text-[12px] text-amber-900/60">+{lowStockVariants.length - 12} more</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {products?.map((product) => {
          const totalStock = product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
          const expanded = expandedId === product.id;
          return (
            <div key={product.id} className="rounded-xl border border-black/8 bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : product.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image.src} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{product.title}</p>
                  <p className="mt-0.5 text-[12px] text-black/45">
                    {product.product_type || "—"} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium">{totalStock} units</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                      product.status === "active" ? "bg-black/8 text-black/55" : "bg-black/5 text-black/35"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </button>

              {expanded && (
                <div className="border-t border-black/8 px-5 py-4">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-black/40">
                        <th className="pb-2 font-normal">Variant</th>
                        <th className="pb-2 font-normal">SKU</th>
                        <th className="pb-2 font-normal">Price</th>
                        <th className="pb-2 text-right font-normal">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-t border-black/6">
                          <td className="py-2">{variant.title}</td>
                          <td className="py-2 text-black/50">{variant.sku || "—"}</td>
                          <td className="py-2 text-black/50">EGP {variant.price}</td>
                          <td
                            className={`py-2 text-right font-medium ${
                              variant.inventory_quantity <= LOW_STOCK_THRESHOLD ? "text-amber-700" : ""
                            }`}
                          >
                            {variant.inventory_quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

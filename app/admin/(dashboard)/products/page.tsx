"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Package, AlertTriangle, XCircle } from "lucide-react";
import type { ShopifyProduct } from "@/lib/shopify-client";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, ErrorState } from "@/components/admin/ui";

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

  const stats = useMemo(() => {
    if (!products) return null;
    const outOfStock = lowStockVariants.filter((v) => v.variant.inventory_quantity <= 0).length;
    const totalUnits = products.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.inventory_quantity, 0), 0);
    return { outOfStock, totalUnits };
  }, [products, lowStockVariants]);

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title={products ? `${products.length} product${products.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · read-only"
      />

      {error && <ErrorState>{error}</ErrorState>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {products && stats ? (
          <>
            <StatCard icon={Package} label="Total stock" value={`${stats.totalUnits.toLocaleString()} units`} accent />
            <StatCard icon={AlertTriangle} label="Low stock variants" value={lowStockVariants.length} hint={`≤ ${LOW_STOCK_THRESHOLD} units`} />
            <StatCard icon={XCircle} label="Out of stock" value={stats.outOfStock} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      {lowStockVariants.length > 0 && (
        <Panel className="mt-4 border-amber-400/20 bg-amber-400/[0.05]">
          <p className="text-[13px] font-medium text-amber-300">
            {lowStockVariants.length} variant{lowStockVariants.length === 1 ? "" : "s"} at or below {LOW_STOCK_THRESHOLD} units
          </p>
          <div className="mt-4 space-y-1.5">
            {lowStockVariants.slice(0, 12).map(({ product, variant }) => (
              <div key={variant.id} className="flex items-center justify-between text-[13px]">
                <span className="text-amber-200/70">
                  {product.title} — {variant.title !== "Default Title" ? variant.title : variant.sku || "—"}
                </span>
                <span className="font-medium text-amber-300">
                  {variant.inventory_quantity <= 0 ? "Out of stock" : `${variant.inventory_quantity} left`}
                </span>
              </div>
            ))}
            {lowStockVariants.length > 12 && (
              <p className="pt-1 text-[12px] text-amber-300/50">+{lowStockVariants.length - 12} more</p>
            )}
          </div>
        </Panel>
      )}

      <div className="mt-6 space-y-3">
        {products?.map((product) => {
          const totalStock = product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
          const expanded = expandedId === product.id;
          return (
            <Panel key={product.id} padded={false} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : product.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                  {product.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image.src} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-white/90">{product.title}</p>
                  <p className="mt-0.5 text-[12px] text-white/40">
                    {product.product_type || "—"} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium text-white/85">{totalStock} units</p>
                  <Badge tone={product.status === "active" ? "positive" : "muted"}>{product.status}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded && (
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-white/35">
                        <th className="pb-2 font-normal">Variant</th>
                        <th className="pb-2 font-normal">SKU</th>
                        <th className="pb-2 font-normal">Price</th>
                        <th className="pb-2 text-right font-normal">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-t border-white/[0.05]">
                          <td className="py-2 text-white/80">{variant.title}</td>
                          <td className="py-2 text-white/40">{variant.sku || "—"}</td>
                          <td className="py-2 text-white/40">EGP {variant.price}</td>
                          <td
                            className={`py-2 text-right font-medium ${
                              variant.inventory_quantity <= LOW_STOCK_THRESHOLD ? "text-amber-300" : "text-white/80"
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
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

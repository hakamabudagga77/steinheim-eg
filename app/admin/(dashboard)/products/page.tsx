"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Package, AlertTriangle, XCircle } from "lucide-react";
import type { ShopifyProduct, ShopifyLocation } from "@/lib/shopify-client";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, ErrorState, InlineEdit } from "@/components/admin/ui";

const LOW_STOCK_THRESHOLD = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [locations, setLocations] = useState<ShopifyLocation[] | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

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

    fetch("/api/admin/locations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.locations?.length) {
          setLocations(data.locations);
          setLocationId(data.locations[0].id);
        }
      })
      .catch(() => {});
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

  function patchVariant(productId: number, variantId: number, updates: Partial<ShopifyProduct["variants"][number]>) {
    setProducts(
      (prev) =>
        prev?.map((p) =>
          p.id !== productId
            ? p
            : { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, ...updates } : v)) }
        ) ?? null
    );
  }

  async function savePrice(productId: number, variantId: number, price: string) {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, price }),
    });
    if (!res.ok) throw new Error("Failed");
    patchVariant(productId, variantId, { price });
  }

  async function saveStock(productId: number, variant: ShopifyProduct["variants"][number], quantity: string) {
    if (!locationId) throw new Error("No location");
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) throw new Error("Invalid quantity");
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryItemId: variant.inventory_item_id, locationId, quantity: qty }),
    });
    if (!res.ok) throw new Error("Failed");
    patchVariant(productId, variant.id, { inventory_quantity: qty });
  }

  async function toggleStatus(product: ShopifyProduct) {
    const nextStatus = product.status === "active" ? "draft" : "active";
    if (!confirm(`${nextStatus === "active" ? "Publish" : "Unpublish"} "${product.title}"?`)) return;
    setTogglingId(product.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev?.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)) ?? null);
    } catch {
      alert("Could not update product status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title={products ? `${products.length} product${products.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · click any price, stock, or status to edit"
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

      {locations && locations.length > 1 && locationId && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-white/40">
          <span>Editing stock at:</span>
          <select
            value={locationId}
            onChange={(e) => setLocationId(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-[#131316] px-2 py-1 text-white/80"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
              <div className="flex w-full items-center gap-4 px-5 py-4 text-left">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : product.id)}
                  className="flex min-w-0 flex-1 items-center gap-4"
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
                </button>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-medium text-white/85">{totalStock} units</p>
                  <button
                    type="button"
                    onClick={() => toggleStatus(product)}
                    disabled={togglingId === product.id}
                    className="mt-1 disabled:opacity-40"
                  >
                    <Badge tone={product.status === "active" ? "positive" : "muted"}>
                      {togglingId === product.id ? "Saving…" : product.status}
                    </Badge>
                  </button>
                </div>
                <button type="button" onClick={() => setExpandedId(expanded ? null : product.id)}>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition ${expanded ? "rotate-180" : ""}`} />
                </button>
              </div>

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
                          <td className="py-2 text-white/80">
                            <InlineEdit
                              value={variant.price}
                              prefix="EGP "
                              type="number"
                              onSave={(v) => savePrice(product.id, variant.id, v)}
                              confirmMessage={(v) =>
                                `Change the price of "${product.title} — ${variant.title}" from EGP ${variant.price} to EGP ${v}? This updates the live Shopify store immediately.`
                              }
                            />
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${
                              variant.inventory_quantity <= LOW_STOCK_THRESHOLD ? "text-amber-300" : "text-white/80"
                            }`}
                          >
                            <InlineEdit
                              value={String(variant.inventory_quantity)}
                              type="number"
                              align="right"
                              onSave={(v) => saveStock(product.id, variant, v)}
                              confirmMessage={(v) =>
                                `Set stock for "${product.title} — ${variant.title}" from ${variant.inventory_quantity} to ${v} units? This updates the live Shopify store immediately.`
                              }
                            />
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

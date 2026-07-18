"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Package, AlertTriangle, XCircle } from "lucide-react";
import type { ShopifyProduct, ShopifyLocation } from "@/lib/shopify-client";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, ErrorState, InlineEdit } from "@/components/admin/ui";

const LOW_STOCK_THRESHOLD = 10;

function ProductDrawer({
  product,
  locationId,
  onClose,
  onSavePrice,
  onSaveStock,
  onToggleStatus,
  toggling,
}: {
  product: ShopifyProduct;
  locationId: number | null;
  onClose: () => void;
  onSavePrice: (productId: number, variantId: number, price: string) => Promise<void>;
  onSaveStock: (productId: number, variant: ShopifyProduct["variants"][number], quantity: string) => Promise<void>;
  onToggleStatus: (product: ShopifyProduct) => void;
  toggling: boolean;
}) {
  const totalStock = product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 right-0 z-[80] w-full max-w-[480px] overflow-y-auto border-l border-white/[0.08] bg-[#131316] px-6 py-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image.src} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-4 font-heading text-[22px] leading-tight tracking-[-0.01em] text-white">{product.title}</h2>
        <p className="mt-1 text-[13px] text-white/40">
          {product.product_type || "—"} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"} · {totalStock} units
        </p>

        <button
          type="button"
          onClick={() => onToggleStatus(product)}
          disabled={toggling}
          className="mt-3 disabled:opacity-40"
        >
          <Badge tone={product.status === "active" ? "positive" : "muted"}>
            {toggling ? "Saving…" : product.status === "active" ? "Active — click to unpublish" : "Draft — click to publish"}
          </Badge>
        </button>

        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Variants</p>
          <table className="mt-3 w-full text-[13px]">
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
                  <td className="py-2.5 text-white/80">{variant.title}</td>
                  <td className="py-2.5 text-white/40">{variant.sku || "—"}</td>
                  <td className="py-2.5 text-white/80">
                    <InlineEdit
                      value={variant.price}
                      prefix="EGP "
                      type="number"
                      onSave={(v) => onSavePrice(product.id, variant.id, v)}
                      confirmMessage={(v) =>
                        `Change the price of "${product.title} — ${variant.title}" from EGP ${variant.price} to EGP ${v}? This updates the live Shopify store immediately.`
                      }
                    />
                  </td>
                  <td
                    className={`py-2.5 text-right font-medium ${
                      variant.inventory_quantity <= LOW_STOCK_THRESHOLD ? "text-amber-300" : "text-white/80"
                    }`}
                  >
                    <InlineEdit
                      value={String(variant.inventory_quantity)}
                      type="number"
                      align="right"
                      onSave={(v) => onSaveStock(product.id, variant, v)}
                      confirmMessage={(v) =>
                        `Set stock for "${product.title} — ${variant.title}" from ${variant.inventory_quantity} to ${v} units? This updates the live Shopify store immediately.`
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!locationId && <p className="mt-3 text-[11px] text-white/25">No inventory location detected — stock edits may fail.</p>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [locations, setLocations] = useState<ShopifyLocation[] | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
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

  const openProduct = products?.find((p) => p.id === openId) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title={products ? `${products.length} product${products.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · click any product to view and edit"
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
              <button
                key={variant.id}
                type="button"
                onClick={() => setOpenId(product.id)}
                className="flex w-full items-center justify-between text-left text-[13px] transition hover:text-amber-100"
              >
                <span className="text-amber-200/70">
                  {product.title} — {variant.title !== "Default Title" ? variant.title : variant.sku || "—"}
                </span>
                <span className="font-medium text-amber-300">
                  {variant.inventory_quantity <= 0 ? "Out of stock" : `${variant.inventory_quantity} left`}
                </span>
              </button>
            ))}
            {lowStockVariants.length > 12 && (
              <p className="pt-1 text-[12px] text-amber-300/50">+{lowStockVariants.length - 12} more</p>
            )}
          </div>
        </Panel>
      )}

      {/* Visual catalog grid — this is a fixtures catalog, not a spreadsheet */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products?.map((product) => {
          const totalStock = product.variants.reduce((sum, v) => sum + v.inventory_quantity, 0);
          const outOfStock = totalStock <= 0;
          const low = !outOfStock && totalStock <= LOW_STOCK_THRESHOLD * product.variants.length;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setOpenId(product.id)}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131316] text-left transition hover:border-white/20"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image.src}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/15">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute left-2.5 top-2.5">
                  <Badge tone={product.status === "active" ? "positive" : "muted"}>{product.status}</Badge>
                </div>
                {(outOfStock || low) && (
                  <div className="absolute right-2.5 top-2.5">
                    <Badge tone={outOfStock ? "danger" : "warning"}>{outOfStock ? "Out of stock" : "Low stock"}</Badge>
                  </div>
                )}
              </div>
              <div className="px-3.5 py-3">
                <p className="truncate text-[13.5px] font-medium text-white/90">{product.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-white/35">
                  {product.product_type || "—"} · {totalStock} units
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {openProduct && (
        <ProductDrawer
          product={openProduct}
          locationId={locationId}
          onClose={() => setOpenId(null)}
          onSavePrice={savePrice}
          onSaveStock={saveStock}
          onToggleStatus={toggleStatus}
          toggling={togglingId === openProduct.id}
        />
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Modal from "@/components/ui/Modal";
import { useComparison } from "@/components/comparison/ComparisonContext";
import { getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getProductBySlug, getSeriesById, type Product } from "@/lib/utils";

const SPEC_FIELDS: Array<{ key: keyof Product; labelKey: string }> = [
  { key: "material", labelKey: "material" },
  { key: "cartridge", labelKey: "cartridge" },
  { key: "aerator", labelKey: "aerator" },
  { key: "inletPipe", labelKey: "inletPipe" },
  { key: "connectionSize", labelKey: "connectionSize" },
  { key: "pressureRange", labelKey: "pressureRange" },
  { key: "maxPressure", labelKey: "maxPressure" },
  { key: "maxTemperature", labelKey: "maxTemperature" },
  { key: "operatingTemperature", labelKey: "operatingTemperature" },
  { key: "mountingAperture", labelKey: "mountingAperture" },
];

export default function CompareModal() {
  const t = useTranslations("compare");
  const tSpecs = useTranslations("specs");
  const { comparison, open, setOpen, removeItem, clearComparison } = useComparison();

  const columns = comparison.items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    if (!product) return [];
    const variant = product.variants.find((v) => v.finish === item.finish) ?? product.variants[0];
    const finish = getFinishById(variant.finish);
    const series = getSeriesById(product.series);
    const imageUrl = getProductImage(product.slug, variant.finish);
    return [{ item, product, variant, finish, series, imageUrl }];
  });

  const visibleFields = SPEC_FIELDS.filter((field) => columns.some((col) => col.product[field.key]));

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      centered
      backdropClassName="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-[2px]"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 0.76, 0.2, 1] }}
        className="relative max-h-[90svh] w-full max-w-[1100px] overflow-y-auto rounded-[8px] bg-[#ece9e2] text-black"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/8 bg-[#ece9e2] px-6 py-4">
          <h2 id="compare-title" className="font-heading text-[20px] tracking-[-0.01em]">
            {t("title")}
          </h2>
          <div className="flex items-center gap-4">
            {columns.length > 0 && (
              <button type="button" onClick={clearComparison} className="text-[12px] text-black/50 underline decoration-black/20 hover:text-black">
                {t("clearAll")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/8 text-black/45 transition hover:bg-black hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
          </div>
        </div>

        {columns.length === 0 ? (
          <p className="p-8 text-[14px] text-black/50">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto px-6 py-6">
            <div className="grid min-w-[560px] gap-4" style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(180px, 1fr))` }}>
              <div aria-hidden />
              {columns.map((col) => (
                <div key={`${col.product.slug}-${col.variant.finish}`} className="flex flex-col">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => removeItem(col.item.slug, col.item.finish)}
                      aria-label={t("remove", { name: col.product.name })}
                      className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-black/45 backdrop-blur-sm transition hover:text-black"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                        <line x1="4" y1="4" x2="16" y2="16" />
                        <line x1="16" y1="4" x2="4" y2="16" />
                      </svg>
                    </button>
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                      {col.imageUrl ? (
                        <Image src={col.imageUrl} alt={col.product.name} fill sizes="(max-width: 768px) 33vw, 240px" className="object-contain p-[10%]" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-3 text-center font-heading text-sm text-black/20">{col.product.name}</div>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-black/35" style={{ fontStyle: "italic" }}>
                    {col.series?.name ?? col.product.series}
                  </p>
                  <p className="mt-1 text-[14px] font-medium">{col.product.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-black/45">{col.finish?.name}</p>
                  <p className="mt-2 text-[15px] font-medium">{formatPrice(col.variant.price)}</p>
                  <Link
                    href={`/products/${col.product.slug}`}
                    className="mt-3 flex h-9 items-center justify-center rounded-full border border-black/20 px-4 text-[11px] text-black/70 transition hover:border-black hover:text-black"
                  >
                    {t("viewDetails")}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-black/8">
              {visibleFields.map((field) => (
                <div
                  key={field.key}
                  className="grid gap-4 border-b border-black/6 py-3"
                  style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(180px, 1fr))` }}
                >
                  <p className="text-[12px] text-black/45">{tSpecs(field.labelKey)}</p>
                  {columns.map((col) => (
                    <p key={col.product.slug} className="text-[12px] text-black/80">
                      {(col.product[field.key] as string | undefined) ?? "—"}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </Modal>
  );
}

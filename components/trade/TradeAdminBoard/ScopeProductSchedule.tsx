"use client";

import Image from "next/image";
import { formatPrice, getFinishById, getProductBySlug, getSeriesById } from "@/lib/utils";
import { getProductDefaultImage, getProductImage } from "@/data/images";
import type { TradeLead } from "@/lib/trade-leads";
import { routing } from "@/i18n/routing";

export function ScopeProductSchedule({ lead }: { lead: TradeLead }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Scope breakdown</p>
      <div className="space-y-3">
        {lead.scopeBreakdown.map((scope) => {
          const rows = lead.project.items.flatMap((item, index) => {
            const scopeId = item.scopeId || "manual";
            if (scopeId !== scope.scopeId) return [];

            const product = getProductBySlug(item.slug);
            const variant = product?.variants.find((entry) => entry.finish === item.finish);
            const finish = getFinishById(item.finish);
            const series = product ? getSeriesById(product.series) : undefined;
            const image = getProductImage(item.slug, item.finish) ?? getProductDefaultImage(item.slug);
            const unitPrice = variant?.price ?? 0;

            return [{
              key: `${scope.scopeId}-${item.slug}-${item.finish}-${index}`,
              // Admin-only preview link — always opens in the default locale, since this
              // panel has no locale context of its own to base it on.
              href: `/${routing.defaultLocale}/products/${item.slug}`,
              image,
              productName: product?.name ?? item.slug.replace(/-/g, " "),
              seriesName: series?.name,
              finishName: finish?.name ?? item.finish.replace(/-/g, " "),
              finishHex: finish?.hex,
              model: variant?.model,
              quantity: item.quantity,
              unitPrice,
              lineTotal: unitPrice * item.quantity,
            }];
          });

          return (
            <div key={scope.scopeId} className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/20">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/90">{scope.scopeName}</p>
                  <p className="mt-0.5 text-[10px] leading-[1.5] text-white/40">{scope.scopeSummary}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-white/70">
                    {scope.totalUnits} units · {scope.lineCount} {scope.lineCount === 1 ? "line" : "lines"}
                  </p>
                  <p className="text-[10px] text-white/40">{formatPrice(scope.retailReferenceTotal)}</p>
                </div>
              </div>

              {rows.length > 0 ? (
                <div className="divide-y divide-white/[0.06]">
                  {rows.map((row) => (
                    <div key={row.key} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 p-3">
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-[#f1f0ed]"
                        aria-label={`Open ${row.productName}`}
                      >
                        {row.image ? (
                          <Image src={row.image} alt="" width={52} height={52} className="h-full w-full object-contain p-1.5" />
                        ) : (
                          <span className="text-[9px] uppercase tracking-[0.12em] text-black/35">No image</span>
                        )}
                      </a>

                      <div className="min-w-0">
                        <a
                          href={row.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[12px] font-medium text-white/85 transition hover:text-[#0a84ff]"
                        >
                          {row.seriesName ? `${row.seriesName} ${row.productName}` : row.productName}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
                          <span className="inline-flex items-center gap-1.5">
                            {row.finishHex && (
                              <span
                                className="h-2.5 w-2.5 rounded-full border border-white/20"
                                style={{ backgroundColor: row.finishHex }}
                              />
                            )}
                            {row.finishName}
                          </span>
                          {row.model && <span className="text-white/25">· {row.model}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[12px] font-medium text-white/80">× {row.quantity}</p>
                        <p className="text-[10px] text-white/35">
                          {row.unitPrice ? `${formatPrice(row.lineTotal)} total` : "Price unavailable"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-3 text-[11px] text-white/35">No product rows found for this scope.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

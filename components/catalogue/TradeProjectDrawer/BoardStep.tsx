"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { formatPrice } from "@/lib/utils";
import { RoomBasketCard, ProjectItemRow } from "@/components/trade/RoomBasketCard";
import { TRADE_LEAD_STATUS_LABELS } from "@/lib/trade-leads";
import type { RoomGroup, TradeProject, TradeProjectRoomPlan } from "@/lib/trade-project";
import type { LeadOverview, Row, ScopeGroup } from "./shared";

export default function BoardStep({
  t,
  locale,
  setOpen,
  rows,
  activeRoomGroups,
  totalItems,
  clearProject,
  retailReferenceTotal,
  roomPlan,
  pdfDownloading,
  onDownloadPdf,
  project,
  updateStatus,
  onUpdateSteinheim,
  duplicateProject,
  otherScopeGroups,
  liveStock,
  removeItem,
  updateQuantity,
  leadOverview,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  setOpen: (open: boolean) => void;
  rows: Row[];
  activeRoomGroups: RoomGroup[];
  totalItems: number;
  clearProject: () => void;
  retailReferenceTotal: number;
  roomPlan: TradeProjectRoomPlan | null;
  pdfDownloading: boolean;
  onDownloadPdf: () => void;
  project: TradeProject;
  updateStatus: "idle" | "busy" | "success" | "error";
  onUpdateSteinheim: () => void;
  duplicateProject: (sourceId: string) => void;
  otherScopeGroups: ScopeGroup[];
  liveStock: Record<string, boolean>;
  removeItem: (slug: string, finish: string, scopeId?: string) => void;
  updateQuantity: (slug: string, finish: string, quantity: number, scopeId?: string) => void;
  leadOverview: LeadOverview | null;
}) {
  return (
    <motion.div
      key="board"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {rows.length === 0 && activeRoomGroups.length === 0 ? (
        <ScaleIn className="flex flex-col items-center justify-center px-7 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-warm-gray">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <h3 className="mt-6 font-heading text-2xl" style={{ fontStyle: "italic" }}>
            {t("board.startTitle")}
          </h3>
          <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-warm-gray">
            {t("board.startBody")}
          </p>
          <a
            href={`/${locale}/trade#smart-room-calculator`}
            onClick={() => setOpen(false)}
            className="mt-8 flex h-[46px] items-center justify-center bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
          >
            {t("board.setupProperty")}
          </a>
        </ScaleIn>
      ) : (
        <div className="px-7 py-5">
          <div className="flex items-center justify-between pb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
              {t("board.productAndUnitCount", { products: rows.length, units: totalItems })}
            </p>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={clearProject}
                className="text-[9px] uppercase tracking-[0.12em] text-warm-gray/60 transition hover:text-charcoal"
              >
                {t("board.clearAll")}
              </button>
            )}
          </div>

          <p className="mb-4 text-[11px] text-warm-gray">
            {t("board.retailTotal")} <span className="text-charcoal">{formatPrice(retailReferenceTotal)}</span>
          </p>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <a
              href={`/${locale}/trade#smart-room-calculator`}
              onClick={() => setOpen(false)}
              className="flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
            >
              {roomPlan ? t("board.editProperty") : t("board.setupPropertyShort")}
            </a>
            <button
              type="button"
              disabled={pdfDownloading}
              onClick={onDownloadPdf}
              className="flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal disabled:opacity-50"
            >
              {pdfDownloading ? t("board.generating") : t("board.downloadPdf")}
            </button>

            {project.status === "submitted" && project.submittedLeadId && (
              <button
                type="button"
                disabled={updateStatus === "busy"}
                onClick={onUpdateSteinheim}
                className="col-span-2 flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal disabled:opacity-50"
              >
                {updateStatus === "busy"
                  ? t("board.sendingUpdate")
                  : updateStatus === "success"
                    ? t("board.sentNotified")
                    : updateStatus === "error"
                      ? t("board.sendError")
                      : t("board.sendUpdate")}
              </button>
            )}

            {project.status === "submitted" && (
              <button
                type="button"
                onClick={() => duplicateProject(project.id)}
                className="col-span-2 flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
              >
                {t("board.reorder")}
              </button>
            )}
          </div>

          <StaggerContainer className="space-y-5">
            {activeRoomGroups.map((group) => {
              const basketRows = rows.filter((row) => row.item.scopeId === group.scopeId);
              const neededTotal = group.productNeeds.reduce((sum, need) => sum + need.quantity, 0);
              const selectedTotal = basketRows.reduce((sum, row) => sum + row.item.quantity, 0);
              const stillNeeds = neededTotal > 0 && selectedTotal < neededTotal;

              return (
                <StaggerItem key={group.scopeId}>
                <section className="border border-charcoal/10 bg-white">
                  <div className="border-b border-charcoal/8 bg-[#ece9e2] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {t("board.roomCount", { count: group.count })}
                        </p>
                        <h3 className="mt-1 font-heading text-[22px] leading-none text-charcoal">
                          {group.roomLabel}
                        </h3>
                      </div>
                      {stillNeeds && (
                        <a
                          href={`/${locale}/trade#smart-room-calculator`}
                          onClick={() => setOpen(false)}
                          className="shrink-0 rounded-full border border-charcoal bg-charcoal px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black"
                        >
                          {t("board.shopOnTradePage")}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    {basketRows.length > 0 ? (
                      <RoomBasketCard
                        title={group.roomLabel}
                        itemRows={basketRows}
                        liveStock={liveStock}
                        onRemoveItem={(slug, finish) => removeItem(slug, finish, group.scopeId)}
                        onQuantityChange={(slug, finish, quantity) => updateQuantity(slug, finish, quantity, group.scopeId)}
                      />
                    ) : (
                      <p className="p-2 text-[11px] font-medium uppercase tracking-[0.08em] text-amber-700">{t("board.notYetAssigned")}</p>
                    )}
                  </div>
                </section>
                </StaggerItem>
              );
            })}

            {otherScopeGroups.map((group) => (
              <StaggerItem key={group.id}>
              <section className="border border-charcoal/10 bg-white">
                <div className="border-b border-charcoal/8 bg-[#ece9e2] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                        {t("board.scope")}
                      </p>
                      <h3 className="mt-1 font-heading text-[22px] leading-none text-charcoal">
                        {group.name}
                      </h3>
                      <p className="mt-2 text-[11px] leading-[1.6] text-warm-gray">
                        {group.summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium text-charcoal">{t("board.unitsCount", { count: group.totalUnits })}</p>
                      <p className="mt-1 text-[10px] text-warm-gray">{formatPrice(group.totalValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-charcoal/8">
                  {group.rows.map(({ item, product, variant, finish }) => (
                    <ProjectItemRow
                      key={`${item.scopeId || "manual"}-${item.slug}-${item.finish}`}
                      item={item}
                      product={product}
                      variant={variant}
                      finish={finish}
                      inStock={liveStock[`${item.slug}::${item.finish}`]}
                      onRemove={() => removeItem(item.slug, item.finish, item.scopeId)}
                      onQuantityChange={(quantity) => updateQuantity(item.slug, item.finish, quantity, item.scopeId)}
                    />
                  ))}
                </div>
              </section>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <p className="mt-4 text-[9px] leading-relaxed text-warm-gray/60">
            {t("board.priceDisclaimer")}
          </p>

          {leadOverview && leadOverview.relatedProjects.length > 0 && (
            <div className="mt-5 border border-charcoal/10 bg-white p-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                {t("board.otherProjects")}
              </p>
              <div className="mt-3 space-y-2">
                {leadOverview.relatedProjects.map((rp) => (
                  <a
                    key={rp.id}
                    href={`/${locale}/trade/restore/${rp.id}`}
                    className="flex items-center justify-between gap-3 border border-charcoal/8 bg-[#ece9e2] p-3 transition hover:border-charcoal"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] text-charcoal">{rp.projectName}</p>
                      <p className="text-[10px] text-warm-gray">{rp.reference}</p>
                    </div>
                    <span className="shrink-0 border border-charcoal/15 bg-white px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-charcoal">
                      {TRADE_LEAD_STATUS_LABELS[rp.status]}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

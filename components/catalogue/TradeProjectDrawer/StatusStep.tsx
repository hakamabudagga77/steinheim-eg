"use client";

import type { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import TradeStageTimeline from "@/components/trade/TradeStageTimeline";
import { TRADE_LEAD_STATUS_LABELS } from "@/lib/trade-leads";
import { formatSampleDate, type LeadOverview } from "./shared";

export default function StatusStep({
  t,
  leadOverview,
  allScopeEntries,
  deliveryContactName,
  setDeliveryContactName,
  deliveryContactPhone,
  setDeliveryContactPhone,
  deliveryAccessNotes,
  setDeliveryAccessNotes,
  deliveryError,
  deliverySaving,
  onSaveDeliveryDetails,
}: {
  t: ReturnType<typeof useTranslations>;
  leadOverview: LeadOverview | null;
  allScopeEntries: { id: string; name: string }[];
  deliveryContactName: string;
  setDeliveryContactName: Dispatch<SetStateAction<string>>;
  deliveryContactPhone: string;
  setDeliveryContactPhone: Dispatch<SetStateAction<string>>;
  deliveryAccessNotes: string;
  setDeliveryAccessNotes: Dispatch<SetStateAction<string>>;
  deliveryError: string | null;
  deliverySaving: boolean;
  onSaveDeliveryDetails: () => void;
}) {
  return (
    <motion.div
      key="status"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-5"
    >
      {leadOverview ? (
        <TradeStageTimeline status={leadOverview.status} />
      ) : (
        <p className="text-[12px] text-warm-gray">{t("status.loading")}</p>
      )}

      {leadOverview && allScopeEntries.length > 1 && (
        <div className="mt-5 border border-charcoal/10 bg-white p-4">
          <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("status.progressByRoom")}
          </p>
          <div className="space-y-2">
            {allScopeEntries.map((entry) => {
              const override = leadOverview.scopeStatuses.find((s) => s.scopeId === entry.id);
              const roomStatus = override?.status ?? leadOverview.status;
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-charcoal/8 pb-2 last:border-b-0 last:pb-0">
                  <p className="min-w-0 truncate text-[12px] text-charcoal">{entry.name}</p>
                  <span className="shrink-0 border border-charcoal/15 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-charcoal">
                    {TRADE_LEAD_STATUS_LABELS[roomStatus]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leadOverview && (
        <div className="mt-5 border border-charcoal/10 bg-white p-4">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("status.deliveryDetails")}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-warm-gray">
            {t("status.deliveryIntro")}
          </p>
          <input
            value={deliveryContactName}
            onChange={(e) => setDeliveryContactName(e.target.value)}
            placeholder={t("status.contactName")}
            className="mt-3 h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
          />
          <input
            value={deliveryContactPhone}
            onChange={(e) => setDeliveryContactPhone(e.target.value)}
            placeholder={t("status.contactPhone")}
            className="mt-2 h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
          />
          <textarea
            value={deliveryAccessNotes}
            onChange={(e) => setDeliveryAccessNotes(e.target.value)}
            placeholder={t("status.accessNotes")}
            rows={2}
            className="mt-2 min-h-[54px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
          />
          {deliveryError && <p className="mt-2 text-[11px] text-red-700">{deliveryError}</p>}
          <button
            type="button"
            disabled={!deliveryContactName.trim() || !deliveryContactPhone.trim() || deliverySaving}
            onClick={onSaveDeliveryDetails}
            className="mt-3 flex h-[42px] w-full items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-40"
          >
            {deliverySaving ? t("status.saving") : t("status.save")}
          </button>
          {leadOverview.deliveryDetails && (
            <p className="mt-2 text-[10px] text-warm-gray">
              {t("status.lastSaved", { date: formatSampleDate(leadOverview.deliveryDetails.updatedAt) })}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

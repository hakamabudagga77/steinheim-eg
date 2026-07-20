"use client";

import type { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ScheduleCallModal from "@/components/trade/ScheduleCallModal";
import { formatSampleDate, type DrawerStep, type LeadOverview } from "./shared";

export default function SamplesStep({
  t,
  showroomOpen,
  setShowroomOpen,
  sampleNote,
  setSampleNote,
  sampleAddress,
  setSampleAddress,
  sampleError,
  sampleSending,
  onRequestSamples,
  leadOverview,
  setStep,
}: {
  t: ReturnType<typeof useTranslations>;
  showroomOpen: boolean;
  setShowroomOpen: Dispatch<SetStateAction<boolean>>;
  sampleNote: string;
  setSampleNote: Dispatch<SetStateAction<string>>;
  sampleAddress: string;
  setSampleAddress: Dispatch<SetStateAction<string>>;
  sampleError: string | null;
  sampleSending: boolean;
  onRequestSamples: () => void;
  leadOverview: LeadOverview | null;
  setStep: (step: DrawerStep) => void;
}) {
  return (
    <motion.div
      key="samples"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-5"
    >
      <button
        type="button"
        onClick={() => setShowroomOpen(true)}
        className="mb-5 flex h-[46px] w-full items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
      >
        {t("samples.bookShowroom")}
      </button>

      <div className="border border-charcoal/10 bg-white p-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
          {t("samples.requestSamples")}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-warm-gray">
          {t("samples.intro")}
        </p>
        <textarea
          value={sampleNote}
          onChange={(e) => setSampleNote(e.target.value)}
          placeholder={t("samples.notePlaceholder")}
          rows={3}
          className="mt-3 min-h-[70px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
        />
        <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
          {t("samples.deliveryAddress")}
        </p>
        <textarea
          value={sampleAddress}
          onChange={(e) => setSampleAddress(e.target.value)}
          placeholder={t("samples.addressPlaceholder")}
          rows={2}
          className="mt-3 min-h-[54px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
        />
        {sampleError && <p className="mt-2 text-[11px] text-red-700">{sampleError}</p>}
        <button
          type="button"
          disabled={!sampleNote.trim() || !sampleAddress.trim() || sampleSending}
          onClick={onRequestSamples}
          className="mt-3 flex h-[42px] w-full items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-40"
        >
          {sampleSending ? t("samples.sending") : t("samples.requestSamples")}
        </button>
      </div>

      {leadOverview && leadOverview.sampleRequests.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
            {t("samples.yourRequests")}
          </p>
          {leadOverview.sampleRequests.slice().reverse().map((entry) => (
            <div key={entry.id} className="border border-charcoal/8 bg-[#ece9e2] p-3">
              <p className="whitespace-pre-wrap text-[12px] text-charcoal">{entry.note}</p>
              <p className="mt-1 whitespace-pre-wrap text-[11px] text-warm-gray">{entry.address}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">
                  {formatSampleDate(entry.requestedAt)}
                </p>
                <span className={`px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] ${
                  entry.fulfilledAt ? "bg-charcoal text-white" : "border border-charcoal/15 text-charcoal"
                }`}>
                  {entry.fulfilledAt ? t("samples.fulfilled") : t("samples.requested")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleCallModal
        open={showroomOpen}
        onClose={() => setShowroomOpen(false)}
        onRequestByMessage={() => setStep("messages")}
        title={t("samples.showroomTitle")}
        fallbackCopy={t("samples.showroomFallback")}
        ctaLabel={t("samples.showroomCta")}
      />
    </motion.div>
  );
}

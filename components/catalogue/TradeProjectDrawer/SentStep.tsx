"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { DrawerStep } from "./shared";

export default function SentStep({
  t,
  sentRef,
  pdfDownloading,
  onDownloadPdf,
  submittedLeadId,
  setStep,
  onNewProject,
}: {
  t: ReturnType<typeof useTranslations>;
  sentRef: string | null;
  pdfDownloading: boolean;
  onDownloadPdf: () => void;
  submittedLeadId: string | undefined;
  setStep: (step: DrawerStep) => void;
  onNewProject: () => void;
}) {
  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center px-7 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h3 className="mt-8 font-heading text-[28px] leading-tight">
        {t("sent.title")}
      </h3>

      {sentRef && (
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
          {t("sent.reference", { ref: sentRef })}
        </p>
      )}

      <p className="mt-5 max-w-[300px] text-[14px] leading-relaxed text-stone">
        {t("sent.body")}
      </p>

      <div className="mt-10 w-full max-w-[280px] space-y-3">
        <button
          type="button"
          disabled={pdfDownloading}
          onClick={onDownloadPdf}
          className="flex h-[46px] w-full items-center justify-center gap-2 border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.13em] text-charcoal transition hover:border-charcoal disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          {pdfDownloading ? t("sent.generating") : t("sent.downloadSpec")}
        </button>

        {submittedLeadId && (
          <button
            type="button"
            onClick={() => setStep("messages")}
            className="flex h-[46px] w-full items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.13em] text-white transition hover:bg-black"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
            {t("sent.messageSteinheim")}
          </button>
        )}

        <button
          type="button"
          onClick={onNewProject}
          className="flex h-[42px] w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray transition hover:text-charcoal"
        >
          {t("sent.newProject")}
        </button>
      </div>
    </motion.div>
  );
}

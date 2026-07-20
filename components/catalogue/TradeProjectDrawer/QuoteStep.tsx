"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { formatSampleDate, type LeadOverview } from "./shared";

export default function QuoteStep({
  t,
  leadOverview,
  acceptStatus,
  onAcceptQuote,
}: {
  t: ReturnType<typeof useTranslations>;
  leadOverview: LeadOverview | null;
  acceptStatus: "idle" | "busy" | "error";
  onAcceptQuote: () => void;
}) {
  return (
    <motion.div
      key="quote"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-5"
    >
      {leadOverview?.quoteUrl ? (
        <div className="border border-charcoal/10 bg-white p-4">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("quote.label")}
          </p>
          {leadOverview.quoteAmount && (
            <p className="mt-2 font-heading text-[22px] text-charcoal">{leadOverview.quoteAmount}</p>
          )}
          <div className="mt-3 flex gap-2">
            <a
              href={leadOverview.quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[42px] flex-1 items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
            >
              {t("quote.view")}
            </a>
            {leadOverview.quoteAcceptedAt ? (
              <span className="flex h-[42px] flex-1 items-center justify-center bg-[#ece9e2] text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal">
                {t("quote.accepted")}
              </span>
            ) : (
              <button
                type="button"
                disabled={acceptStatus === "busy"}
                onClick={onAcceptQuote}
                className="flex h-[42px] flex-1 items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
              >
                {acceptStatus === "busy" ? t("quote.accepting") : acceptStatus === "error" ? t("quote.acceptError") : t("quote.accept")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
            {t("quote.pendingTitle")}
          </p>
          <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-warm-gray">
            {t("quote.pendingBody")}
          </p>
        </div>
      )}

      {leadOverview && leadOverview.quoteHistory.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
            {t("quote.previousQuotes")}
          </p>
          <div className="space-y-2">
            {leadOverview.quoteHistory.slice().reverse().map((revision, index) => (
              <div key={index} className="border border-charcoal/8 bg-[#ece9e2] p-3">
                <div className="flex items-center justify-between">
                  {revision.url ? (
                    <a
                      href={revision.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-charcoal underline underline-offset-2"
                    >
                      {revision.amount || t("quote.view")}
                    </a>
                  ) : (
                    <p className="text-[12px] text-warm-gray">{t("quote.noQuoteSet")}</p>
                  )}
                  <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">
                    {formatSampleDate(revision.changedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

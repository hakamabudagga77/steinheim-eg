"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import TradeStageTimeline from "@/components/trade/TradeStageTimeline";

const SCREEN_KEYS = ["overview", "status", "quote", "documents", "samples", "messages"] as const;
type ScreenKey = (typeof SCREEN_KEYS)[number];

// Reuse the real drawer's own tab/title copy so this mockup stays a pixel-accurate
// mirror of the actual product board instead of a separately-maintained fake.
const TAB_KEY: Record<ScreenKey, string> = {
  overview: "tabs.overview",
  status: "tabs.status",
  quote: "tabs.quote",
  documents: "tabs.documents",
  samples: "tabs.samples",
  messages: "tabs.messages",
};
const TITLE_KEY: Record<ScreenKey, string> = {
  overview: "titles.board",
  status: "titles.status",
  quote: "titles.quote",
  documents: "titles.documents",
  samples: "titles.samples",
  messages: "titles.messages",
};

const INTERVAL_MS = 4000;

export default function ProjectBoardShowcase() {
  const t = useTranslations("tradePage.projectBoard");
  const td = useTranslations("tradeProjectDrawer");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SCREEN_KEYS.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const screen = SCREEN_KEYS[index];

  return (
    <div
      className="mx-auto max-w-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-black/30">{t("previewLabel")}</p>
      <div className="overflow-hidden rounded-[4px] border border-black/10 bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.25)]">
        <div className="border-b border-charcoal/8 px-6 pt-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">{td("brand")}</p>
          <h3 className="mt-1 font-heading text-[22px] leading-tight text-charcoal">{td(TITLE_KEY[screen])}</h3>
          <div className="mt-4 flex gap-4 overflow-x-auto">
            {SCREEN_KEYS.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => setIndex(i)}
                className={`shrink-0 whitespace-nowrap border-t-2 pb-3 pt-2 text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  i === index ? "border-charcoal text-charcoal" : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {td(TAB_KEY[key])}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[240px] flex-col justify-center p-6">
          <AnimatePresence mode="wait">
            {screen === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
                  <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom1")}</p>
                  <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom1Count")}</p>
                </div>
                <div className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
                  <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom2")}</p>
                  <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom2Count")}</p>
                </div>
                <div className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
                  <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom3")}</p>
                  <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom3Count")}</p>
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                  <span>{t("mock.overviewTotalLabel")}</span>
                  <span className="text-charcoal">{t("mock.overviewTotal")}</span>
                </div>
              </motion.div>
            )}
            {screen === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <TradeStageTimeline status="in_production" />
              </motion.div>
            )}
            {screen === "quote" && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="border border-charcoal/10 bg-white p-4"
              >
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">{t("mock.quoteLabel")}</p>
                <p className="mt-2 font-heading text-[22px] text-charcoal">{t("mock.quoteAmount")}</p>
                <div className="mt-3 flex gap-2">
                  <span className="flex h-[42px] flex-1 items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal">
                    {t("mock.quoteView")}
                  </span>
                  <span className="flex h-[42px] flex-1 items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white">
                    {t("mock.quoteAccept")}
                  </span>
                </div>
              </motion.div>
            )}
            {screen === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
                  <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.documentInvoice")}</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-warm-gray">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </div>
                <div className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
                  <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.documentAgreement")}</p>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-warm-gray">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </div>
              </motion.div>
            )}
            {screen === "samples" && (
              <motion.div
                key="samples"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="border border-charcoal/8 bg-[#ece9e2] p-3"
              >
                <p className="text-[12px] text-charcoal">{t("mock.sampleNote")}</p>
                <p className="mt-1 text-[11px] text-warm-gray">{t("mock.sampleAddress")}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">{t("mock.sampleDate")}</p>
                  <span className="border border-charcoal/15 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-charcoal">
                    {t("mock.sampleStatus")}
                  </span>
                </div>
              </motion.div>
            )}
            {screen === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <div className="max-w-[85%] border border-charcoal/10 bg-[#ece9e2] px-4 py-2.5 text-[12.5px] leading-[1.5] text-charcoal">
                  {t("mock.messageSteinheim1")}
                </div>
                <div className="ms-auto max-w-[85%] bg-charcoal px-4 py-2.5 text-end text-[12.5px] leading-[1.5] text-white">
                  {t("mock.messageCustomer")}
                </div>
                <div className="max-w-[85%] border border-charcoal/10 bg-[#ece9e2] px-4 py-2.5 text-[12.5px] leading-[1.5] text-charcoal">
                  {t("mock.messageSteinheim2")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

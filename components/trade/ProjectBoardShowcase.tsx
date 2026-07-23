"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import TradeStageTimeline from "@/components/trade/TradeStageTimeline";
import { TRADE_LEAD_JOURNEY_STAGES } from "@/lib/trade-leads";

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

const SCREEN_INTERVAL_MS = 4000;
const STATUS_STEP_MS = 450;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function TypingDots({ dark }: { dark: boolean }) {
  return (
    <div className={`flex w-fit items-center gap-1 px-4 py-3 ${dark ? "ms-auto bg-charcoal" : "border border-charcoal/10 bg-[#ece9e2]"}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 animate-bounce rounded-full ${dark ? "bg-white/70" : "bg-charcoal/40"}`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

// Ticks a number up to whatever integer is embedded in `label`, keeping the rest of
// the (locale-specific) string intact - so it works for "EGP 1,284,000" and
// "1,284,000 جنيه مصري" alike without needing separate numeric translation keys.
function useCountUpFromLabel(label: string, durationMs = 900) {
  const target = useMemo(() => {
    const match = label.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
  }, [label]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return label.replace(/[\d,]+/, value.toLocaleString("en-US"));
}

function OverviewScreen() {
  const t = useTranslations("tradePage.projectBoard");
  return (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
      <motion.div variants={rowVariants} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
        <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom1")}</p>
        <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom1Count")}</p>
      </motion.div>
      <motion.div variants={rowVariants} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
        <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom2")}</p>
        <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom2Count")}</p>
      </motion.div>
      <motion.div variants={rowVariants} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
        <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.overviewRoom3")}</p>
        <p className="shrink-0 text-[11px] text-warm-gray">{t("mock.overviewRoom3Count")}</p>
      </motion.div>
      <motion.div variants={rowVariants} className="flex items-center justify-between pt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
        <span>{t("mock.overviewTotalLabel")}</span>
        <span className="text-charcoal">{t("mock.overviewTotal")}</span>
      </motion.div>
    </motion.div>
  );
}

// A fresh mount (courtesy of AnimatePresence swapping screens) is what resets this
// to step 0 each time - no effect-driven state reset needed.
function StatusScreen() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      if (step >= TRADE_LEAD_JOURNEY_STAGES.length) {
        window.clearInterval(id);
        return;
      }
      setStatusIndex(step);
    }, STATUS_STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  return <TradeStageTimeline status={TRADE_LEAD_JOURNEY_STAGES[statusIndex]} />;
}

function QuoteScreen() {
  const t = useTranslations("tradePage.projectBoard");
  const td = useTranslations("tradeProjectDrawer");
  const amountLabel = useCountUpFromLabel(t("mock.quoteAmount"));
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setAccepted(true), 2200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="border border-charcoal/10 bg-white p-4">
      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">{t("mock.quoteLabel")}</p>
      <p className="mt-2 font-heading text-[22px] text-charcoal">{amountLabel}</p>
      <div className="mt-3 flex gap-2">
        <span className="flex h-[42px] flex-1 items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal">
          {td("quote.view")}
        </span>
        <AnimatePresence mode="wait">
          {accepted ? (
            <motion.span
              key="accepted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex h-[42px] flex-1 items-center justify-center bg-[#ece9e2] text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal"
            >
              {td("quote.accepted")}
            </motion.span>
          ) : (
            <motion.span
              key="accept"
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex h-[42px] flex-1 items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white"
            >
              {td("quote.accept")}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DocumentsScreen() {
  const t = useTranslations("tradePage.projectBoard");
  return (
    <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-2">
      <motion.div variants={rowVariants} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
        <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.documentInvoice")}</p>
        <motion.svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          className="shrink-0 text-warm-gray"
          animate={{ x: [0, 2, 0], y: [0, -2, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
        >
          <path d="M7 17L17 7M7 7h10v10" />
        </motion.svg>
      </motion.div>
      <motion.div variants={rowVariants} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4">
        <p className="min-w-0 truncate text-[13px] text-charcoal">{t("mock.documentAgreement")}</p>
        <motion.svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          className="shrink-0 text-warm-gray"
          animate={{ x: [0, 2, 0], y: [0, -2, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, delay: 0.3 }}
        >
          <path d="M7 17L17 7M7 7h10v10" />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

function SamplesScreen() {
  const t = useTranslations("tradePage.projectBoard");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setSubmitted(true), 1100);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="border border-charcoal/8 bg-[#ece9e2] p-3">
      <p className="text-[12px] text-charcoal">{t("mock.sampleNote")}</p>
      <p className="mt-1 text-[11px] text-warm-gray">{t("mock.sampleAddress")}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">{t("mock.sampleDate")}</p>
        <AnimatePresence>
          {submitted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="border border-charcoal/15 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-charcoal"
            >
              {t("mock.sampleStatus")}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Same remount-resets-state approach: plays a typing/reply exchange once per mount.
function MessagesScreen() {
  const t = useTranslations("tradePage.projectBoard");
  const [visibleCount, setVisibleCount] = useState(0);
  const [typingWho, setTypingWho] = useState<"steinheim" | "customer" | null>("steinheim");

  useEffect(() => {
    const timers = [
      window.setTimeout(() => { setVisibleCount(1); setTypingWho("customer"); }, 700),
      window.setTimeout(() => { setVisibleCount(2); setTypingWho("steinheim"); }, 1300),
      window.setTimeout(() => { setVisibleCount(3); setTypingWho(null); }, 1900),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  return (
    <div className="space-y-2">
      {visibleCount >= 1 ? (
        <div className="max-w-[85%] border border-charcoal/10 bg-[#ece9e2] px-4 py-2.5 text-[12.5px] leading-[1.5] text-charcoal">
          {t("mock.messageSteinheim1")}
        </div>
      ) : typingWho === "steinheim" ? (
        <TypingDots dark={false} />
      ) : null}

      {visibleCount >= 2 ? (
        <div className="ms-auto max-w-[85%] bg-charcoal px-4 py-2.5 text-end text-[12.5px] leading-[1.5] text-white">
          {t("mock.messageCustomer")}
        </div>
      ) : typingWho === "customer" ? (
        <TypingDots dark />
      ) : null}

      {visibleCount >= 3 ? (
        <div className="max-w-[85%] border border-charcoal/10 bg-[#ece9e2] px-4 py-2.5 text-[12.5px] leading-[1.5] text-charcoal">
          {t("mock.messageSteinheim2")}
        </div>
      ) : visibleCount >= 2 && typingWho === "steinheim" ? (
        <TypingDots dark={false} />
      ) : null}
    </div>
  );
}

export default function ProjectBoardShowcase() {
  const t = useTranslations("tradePage.projectBoard");
  const td = useTranslations("tradeProjectDrawer");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SCREEN_KEYS.length);
    }, SCREEN_INTERVAL_MS);
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
          <div className="mt-4 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <motion.div key="overview" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <OverviewScreen />
              </motion.div>
            )}
            {screen === "status" && (
              <motion.div key="status" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <StatusScreen />
              </motion.div>
            )}
            {screen === "quote" && (
              <motion.div key="quote" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <QuoteScreen />
              </motion.div>
            )}
            {screen === "documents" && (
              <motion.div key="documents" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <DocumentsScreen />
              </motion.div>
            )}
            {screen === "samples" && (
              <motion.div key="samples" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <SamplesScreen />
              </motion.div>
            )}
            {screen === "messages" && (
              <motion.div key="messages" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
                <MessagesScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

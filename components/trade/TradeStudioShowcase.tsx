"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const SCREEN_KEYS = ["intro", "rooms", "needs", "shop"] as const;
const HEADLINE_KEY: Record<(typeof SCREEN_KEYS)[number], string> = {
  intro: "step0.headline",
  rooms: "step1.defaultHeadline",
  needs: "step2.headline",
  shop: "step3.headline",
};

const SCREEN_INTERVAL_MS = 4000;

function IntroScreen() {
  const t = useTranslations("tradePage.howShowcase.mock");
  return (
    <div className="space-y-3">
      <div className="border border-charcoal bg-charcoal px-4 py-3 text-[12px] font-medium text-white">
        {t("introPersona")}
      </div>
      <div className="border border-charcoal/10 bg-white px-4 py-3 text-[13px] text-charcoal">{t("introName")}</div>
      <div className="border border-charcoal/10 bg-white px-4 py-3 text-[13px] text-warm-gray">{t("introEmail")}</div>
    </div>
  );
}

function RoomsScreen() {
  const t = useTranslations("tradePage.howShowcase.mock");
  const rows: Array<[string, string]> = [
    [t("roomsMaster"), t("roomsMasterCount")],
    [t("roomsStandard"), t("roomsStandardCount")],
    [t("roomsPowder"), t("roomsPowderCount")],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, count]) => (
        <div key={label} className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white px-4 py-3">
          <p className="text-[13px] text-charcoal">{label}</p>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-charcoal/15 text-[11px] text-charcoal">{count}</span>
        </div>
      ))}
    </div>
  );
}

function NeedsScreen() {
  const t = useTranslations("tradePage.howShowcase.mock");
  const checkedRows: Array<[string, string]> = [
    [t("needsBasin"), t("needsBasinQty")],
    [t("needsShower"), t("needsShowerQty")],
  ];
  return (
    <div className="space-y-2">
      {checkedRows.map(([label, qty]) => (
        <div key={label} className="flex items-center justify-between gap-3 border border-charcoal bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal text-white">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <p className="text-[13px] text-charcoal">{label}</p>
          </div>
          <span className="text-[11px] text-warm-gray">{qty}</span>
        </div>
      ))}
      <div className="flex items-center gap-2.5 border border-charcoal/10 bg-white px-4 py-3 opacity-50">
        <span className="h-5 w-5 shrink-0 rounded-full border border-charcoal/25" />
        <p className="text-[13px] text-charcoal">{t("needsWallMounted")}</p>
      </div>
    </div>
  );
}

function ShopScreen() {
  const t = useTranslations("tradePage.howShowcase.mock");
  const rows: Array<[string, string]> = [
    [t("shopProduct1"), t("shopProduct1Meta")],
    [t("shopProduct2"), t("shopProduct2Meta")],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, meta]) => (
        <div key={label} className="border border-charcoal/10 bg-white px-4 py-3">
          <p className="text-[13px] text-charcoal">{label}</p>
          <p className="mt-0.5 text-[11px] text-warm-gray">{meta}</p>
        </div>
      ))}
      <div className="flex h-[42px] items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white">
        {t("shopCta")}
      </div>
    </div>
  );
}

// Mirrors SmartRoomCalculator's own numbered-circle progress stepper
// (same markup/classes) so this preview reads as the real thing, not a
// separately-styled mockup.
function Stepper({ tc, activeIndex, onSelect }: { tc: ReturnType<typeof useTranslations>; activeIndex: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      {SCREEN_KEYS.map((key, i) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(i)}
          className="group flex flex-1 flex-col items-center gap-2"
        >
          <div className="flex w-full items-center">
            {i > 0 && <div className={`h-[2px] flex-1 transition-colors duration-300 ${i <= activeIndex ? "bg-charcoal" : "bg-charcoal/10"}`} />}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium transition-all duration-300 ${
                i === activeIndex
                  ? "bg-charcoal text-white ring-4 ring-charcoal/10"
                  : i < activeIndex
                    ? "bg-charcoal text-white"
                    : "border border-charcoal/15 text-warm-gray"
              }`}
            >
              {i < activeIndex ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                i + 1
              )}
            </div>
            {i < SCREEN_KEYS.length - 1 && <div className={`h-[2px] flex-1 transition-colors duration-300 ${i < activeIndex ? "bg-charcoal" : "bg-charcoal/10"}`} />}
          </div>
          <span className={`hidden text-[8px] font-medium uppercase tracking-[0.1em] transition-colors sm:block ${i <= activeIndex ? "text-charcoal" : "text-warm-gray/50"}`}>
            {tc(`steps.${key}`)}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function TradeStudioShowcase() {
  const t = useTranslations("tradePage.howShowcase");
  const tc = useTranslations("smartRoomCalculator");
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
      <div className="border border-black/10 bg-white p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.25)]">
        <p className="mb-5 text-center text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">{tc("eyebrow")}</p>

        <Stepper tc={tc} activeIndex={index} onSelect={setIndex} />

        <div className="mt-8 flex min-h-[220px] flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>
              <h3 className="mb-4 font-heading text-[18px] leading-tight text-charcoal">{tc(HEADLINE_KEY[screen])}</h3>
              {screen === "intro" && <IntroScreen />}
              {screen === "rooms" && <RoomsScreen />}
              {screen === "needs" && <NeedsScreen />}
              {screen === "shop" && <ShopScreen />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

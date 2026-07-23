"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";

const DISMISSED_KEY = "steinheim-trade-popup-dismissed";
const DELAY_MS = 10_000;
const EXCLUDED_PREFIXES = ["/trade", "/admin", "/contact"];

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false; // storage unavailable — just don't persist the dismissal
  }
}

export default function TradeLeadPopup() {
  const t = useTranslations("tradeLeadPopup");
  const tOpenButton = useTranslations("tradeOpenButton");
  const features = t.raw("features") as string[];
  const pathname = usePathname();
  const { setSetupOpen, open, setupOpen, project } = useTradeProject();
  const [visible, setVisible] = useState(false);
  // This component is mounted via next/dynamic(..., { ssr: false }), so it never
  // renders on the server — window is always defined here. localStorage access
  // itself can still throw (blocked site data, sandboxed iframes), hence the guard.
  const [dismissed, setDismissed] = useState(readDismissed);

  const path = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const excluded = EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
  const hasEngaged = open || setupOpen || project.items.length > 0 || !!project.roomPlan;

  useEffect(() => {
    if (excluded || hasEngaged || dismissed) return;
    const timer = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [excluded, hasEngaged, dismissed]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable — the dismissal just won't persist across visits.
    }
  }

  function openSetup() {
    setSetupOpen(true);
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && !hasEngaged ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          role="complementary"
          aria-label={t("headline")}
          className="fixed bottom-6 left-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] border border-white/10 bg-[#0a0a0a] p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("dismiss")}
            className="absolute right-5 top-5 text-white/40 transition hover:text-white rtl:right-auto rtl:left-5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">{t("eyebrow")}</p>
          <p className="mt-3 max-w-[300px] font-heading text-[24px] leading-tight tracking-[-0.02em]">
            {t("headline")}
          </p>
          <p className="mt-3 text-[13px] leading-[1.65] text-white/60">{t("body")}</p>

          <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-baseline gap-2.5 text-[13px] leading-[1.5] text-white/70">
                <span className="text-white/30">—</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-5">
            <button
              type="button"
              onClick={openSetup}
              className="inline-flex h-[42px] items-center bg-white px-6 text-[10px] font-medium uppercase tracking-[0.15em] text-black transition hover:bg-white/90"
            >
              {tOpenButton("setupProject")}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-[11px] uppercase tracking-[0.1em] text-white/35 transition hover:text-white/60"
            >
              {t("notNow")}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

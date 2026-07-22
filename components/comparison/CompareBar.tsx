"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useComparison } from "@/components/comparison/ComparisonContext";
import CompareModal from "@/components/comparison/CompareModal";

export default function CompareBar() {
  const t = useTranslations("compare");
  const { itemCount, setOpen, clearComparison } = useComparison();

  return (
    <>
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
          >
            <div className="flex items-center gap-4 rounded-full border border-black/10 bg-[#ece9e2] px-5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
              <p className="text-[13px] text-black/70">{t("selectedCount", { count: itemCount })}</p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-9 items-center justify-center rounded-full bg-black px-5 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-black/85 cursor-pointer"
              >
                {t("compareNow")}
              </button>
              <button
                type="button"
                onClick={clearComparison}
                aria-label={t("clearAll")}
                className="text-black/40 transition hover:text-black cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <CompareModal />
    </>
  );
}

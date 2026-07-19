"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const SCHEDULING_URL = process.env.NEXT_PUBLIC_TRADE_SCHEDULING_URL || "";

export default function ScheduleCallModal({
  open,
  onClose,
  onRequestByMessage,
  title,
  fallbackCopy,
  ctaLabel,
}: {
  open: boolean;
  onClose: () => void;
  onRequestByMessage: () => void;
  title?: string;
  fallbackCopy?: string;
  ctaLabel?: string;
}) {
  const t = useTranslations("scheduleCallModal");
  const resolvedTitle = title ?? t("title");
  const resolvedFallback = fallbackCopy ?? t("fallbackCopy");
  const resolvedCta = ctaLabel ?? t("ctaLabel");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 0.76, 0.2, 1] }}
            className="fixed inset-x-4 top-1/2 z-[91] mx-auto max-w-[560px] -translate-y-1/2 bg-white sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-charcoal/8 px-6 py-5">
              <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
                {resolvedTitle}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
                aria-label={t("close")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {SCHEDULING_URL ? (
              <iframe
                src={SCHEDULING_URL}
                title={t("iframeTitle")}
                className="h-[560px] w-full"
                frameBorder="0"
              />
            ) : (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <p className="max-w-[320px] text-[13px] leading-relaxed text-warm-gray">
                  {resolvedFallback}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRequestByMessage();
                    onClose();
                  }}
                  className="mt-6 flex h-11 items-center justify-center bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                >
                  {resolvedCta}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

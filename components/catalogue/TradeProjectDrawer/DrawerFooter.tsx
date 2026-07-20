"use client";

import { useTranslations } from "next-intl";
import type { TradeProjectRoomPlan } from "@/lib/trade-project";
import type { DrawerStep } from "./shared";

export default function DrawerFooter({
  t,
  step,
  projectStatus,
  roomPlan,
  locale,
  setOpen,
  rowsLength,
  onGoToDetails,
  busy,
  onSubmit,
}: {
  t: ReturnType<typeof useTranslations>;
  step: DrawerStep;
  projectStatus: "draft" | "submitted";
  roomPlan: TradeProjectRoomPlan | null;
  locale: string;
  setOpen: (open: boolean) => void;
  rowsLength: number;
  onGoToDetails: () => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <>
      {step === "board" && projectStatus !== "submitted" && (
        <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/${locale}/trade#smart-room-calculator`}
              onClick={() => setOpen(false)}
              className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
            >
              {roomPlan ? t("footer.editProperty") : t("footer.setupProperty")}
            </a>
            <button
              type="button"
              disabled={rowsLength === 0}
              onClick={onGoToDetails}
              className="flex h-[50px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
            >
              {t("footer.detailsCta")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      )}

      {step === "details" && (
        <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
          <button
            type="button"
            disabled={busy}
            onClick={onSubmit}
            className="flex h-[50px] w-full items-center justify-center gap-3 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {t("footer.sending")}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                {t("footer.sendToSteinheim")}
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[9px] text-warm-gray/50">
            {t("footer.confirmationNote")}
          </p>
        </footer>
      )}
    </>
  );
}

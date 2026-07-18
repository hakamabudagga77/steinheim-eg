"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import RoomProgressPanel from "@/components/trade/RoomProgressPanel";
import { hasActiveRoomNeeds, type RequirementType } from "@/lib/trade-project";
import { getProductBySlug } from "@/lib/utils";

export default function FloatingRoomProgress({ locale }: { locale: string }) {
  const { project, setupJustCompleted, setSetupJustCompleted } = useTradeProject();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (setupJustCompleted) {
      setExpanded(true);
      setSetupJustCompleted(false);
    }
  }, [setupJustCompleted, setSetupJustCompleted]);

  if (!hasActiveRoomNeeds(project)) return null;

  const activeRooms = (project.roomPlan?.groups ?? []).filter(
    (group) => group.count > 0 && group.productNeeds.some((need) => need.quantity > 0)
  );

  let totalNeeded = 0;
  let totalSelected = 0;
  for (const room of activeRooms) {
    for (const need of room.productNeeds) {
      if (need.quantity <= 0) continue;
      totalNeeded += need.quantity;
      const selected = project.items
        .filter((item) => item.scopeId === room.scopeId && getProductBySlug(item.slug)?.type === need.type)
        .reduce((sum, item) => sum + item.quantity, 0);
      totalSelected += Math.min(selected, need.quantity);
    }
  }
  const remaining = Math.max(0, totalNeeded - totalSelected);
  const progressPct = totalNeeded > 0 ? Math.round((totalSelected / totalNeeded) * 100) : 0;

  function handleSelectNeed(_scopeId: string, _type: RequirementType) {
    window.location.href = `/${locale}/trade#smart-room-calculator`;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 0.76, 0.2, 1] }}
            className="absolute bottom-[56px] left-0 flex w-[min(380px,calc(100vw-3rem))] max-h-[75vh] flex-col overflow-hidden border border-black bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
          >
            <div className="shrink-0 bg-black px-5 pb-4 pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/40">
                    Steinheim Trade Studio
                  </p>
                  <p className="mt-1 font-heading text-[20px] leading-tight text-white" style={{ fontStyle: "italic" }}>
                    Your rooms
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-white/50 transition hover:text-white"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {totalNeeded > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
                    <span>{totalSelected} of {totalNeeded} selected</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="mt-2 h-[3px] w-full bg-white/15">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto bg-[#f4f3f1] px-5 py-4">
              <RoomProgressPanel onSelectNeed={handleSelectNeed} />
            </div>

            <div className="shrink-0 border-t border-black/10 bg-white p-4">
              <a
                href={`/${locale}/trade#smart-room-calculator`}
                className="flex h-11 w-full items-center justify-center border border-black bg-white text-[10px] font-medium uppercase tracking-[0.12em] text-black transition hover:bg-black hover:text-white"
              >
                Continue on trade page
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex h-11 items-center gap-2 border border-black bg-black px-5 text-[10px] font-medium uppercase tracking-[0.14em] text-white shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition hover:bg-white hover:text-black"
      >
        <span>Your rooms</span>
        {remaining > 0 && <span className="opacity-45">· {remaining} left</span>}
      </button>
    </div>
  );
}

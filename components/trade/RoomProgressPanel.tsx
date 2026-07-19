"use client";

import { useTranslations } from "next-intl";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { REQUIREMENT_TYPE_LABELS, type RequirementType } from "@/lib/trade-project";
import { getProductBySlug } from "@/lib/utils";

export default function RoomProgressPanel({
  onSelectNeed,
}: {
  onSelectNeed: (scopeId: string, type: RequirementType) => void;
}) {
  const t = useTranslations("roomProgressPanel");
  const { project } = useTradeProject();
  const activeRooms = (project.roomPlan?.groups ?? []).filter(
    (group) => group.count > 0 && group.productNeeds.some((need) => need.quantity > 0)
  );

  function selectedFor(scopeId: string, type: RequirementType) {
    return project.items
      .filter((item) => item.scopeId === scopeId && getProductBySlug(item.slug)?.type === type)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  if (activeRooms.length === 0) return null;

  return (
    <div className="space-y-5">
      {activeRooms.map((room) => (
        <div key={room.scopeId} className="border border-black/10">
          <div className="flex items-baseline justify-between border-b border-black/10 bg-black px-4 py-3">
            <p className="font-heading text-[15px] leading-tight text-white" style={{ fontStyle: "italic" }}>{room.roomLabel}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] text-white/45">{t("roomCount", { count: room.count })}</p>
          </div>
          <div className="divide-y divide-black/8 bg-white">
            {room.productNeeds.filter((need) => need.quantity > 0).map((need) => {
              const selected = selectedFor(room.scopeId, need.type);
              const met = selected >= need.quantity;
              return (
                <button
                  key={need.type}
                  type="button"
                  onClick={() => onSelectNeed(room.scopeId, need.type)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition hover:bg-black/[0.03]"
                >
                  <span className="text-[12px] text-black/75">{REQUIREMENT_TYPE_LABELS[need.type]}</span>
                  <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-medium ${met ? "text-black" : "text-black/35"}`}>
                    {t("selectedOfNeeded", { selected, needed: need.quantity })}
                    {met && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

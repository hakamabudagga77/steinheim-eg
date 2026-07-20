import { useState } from "react";
import type { RoomProductNeed, TradeProjectRoomPlan } from "@/lib/trade-project";
import { clampCount, presets, roomConfig, type RoomKey } from "@/lib/trade-schedule";

const emptyCounts: Record<RoomKey, number> = { master: 0, standard: 0, powder: 0, suite: 0 };

export interface CustomRoomDraft {
  roomKey: string;
  label: string;
  count: number;
}

function createDraftKey() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function countsFromPlan(plan: TradeProjectRoomPlan | null): Record<RoomKey, number> {
  if (!plan) return emptyCounts;
  const fixed = plan.groups.filter((group) => !group.isCustom);
  return Object.fromEntries(fixed.map((group) => [group.roomKey, group.count])) as Record<RoomKey, number>;
}

function customRoomsFromPlan(plan: TradeProjectRoomPlan | null): CustomRoomDraft[] {
  return (plan?.groups ?? [])
    .filter((group) => group.isCustom)
    .map((group) => ({ roomKey: group.roomKey, label: group.roomLabel, count: group.count }));
}

/**
 * Room-configuration wizard state shared by TradeSetupOverlay (drawer) and SmartRoomCalculator
 * (full-page stepper). The two callers hydrate/re-sync from `roomPlan` on different events (drawer
 * open vs. prop change on mount), so that decision stays with each caller: pass whatever value should
 * signal "re-sync now" as `hydrationTrigger` — this hook only reacts when its identity changes, the
 * same render-time compare-with-previous-value pattern used for prevRoomOptions in ProductCard.
 */
export function useRoomSetupState(
  roomPlan: TradeProjectRoomPlan | null,
  hydrationTrigger: unknown,
  fallbackLabel: string,
  updateProductNeeds: (roomKey: string, productNeeds: RoomProductNeed[]) => void,
  onApplyPreset: () => void
) {
  const [counts, setCounts] = useState<Record<RoomKey, number>>(() => countsFromPlan(roomPlan));
  const [activePresetId, setActivePresetId] = useState<string | null>(() => roomPlan?.presetId ?? null);
  const [customRooms, setCustomRooms] = useState<CustomRoomDraft[]>(() => customRoomsFromPlan(roomPlan));

  const [prevHydrationTrigger, setPrevHydrationTrigger] = useState(hydrationTrigger);
  if (hydrationTrigger !== prevHydrationTrigger) {
    setPrevHydrationTrigger(hydrationTrigger);
    if (roomPlan) {
      setCounts(countsFromPlan(roomPlan));
      setCustomRooms(customRoomsFromPlan(roomPlan));
      setActivePresetId(roomPlan.presetId);
    }
  }

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0) + customRooms.reduce((sum, r) => sum + r.count, 0);

  const activeRooms = [
    ...roomConfig.filter((entry) => counts[entry.key] > 0).map((entry) => ({ roomKey: entry.key as string, label: entry.label, count: counts[entry.key] })),
    ...customRooms.filter((room) => room.count > 0).map((room) => ({ roomKey: room.roomKey, label: room.label || fallbackLabel, count: room.count })),
  ];

  function applyPreset(preset: (typeof presets)[number]) {
    setCounts(preset.counts);
    setActivePresetId(preset.id);
    onApplyPreset();
  }

  function updateRoom(room: RoomKey, value: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(value) }));
    setActivePresetId(null);
  }

  function adjustRoom(room: RoomKey, delta: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(current[room] + delta) }));
    setActivePresetId(null);
  }

  function addCustomRoomDraft() {
    setCustomRooms((current) => [...current, { roomKey: createDraftKey(), label: "", count: 1 }]);
  }

  function updateCustomRoomDraft(roomKey: string, patch: Partial<CustomRoomDraft>) {
    setCustomRooms((current) => current.map((room) => (room.roomKey === roomKey ? { ...room, ...patch } : room)));
  }

  function removeCustomRoomDraft(roomKey: string) {
    setCustomRooms((current) => current.filter((room) => room.roomKey !== roomKey));
  }

  function toggleNeed(roomKey: string, type: RoomProductNeed["type"], checked: boolean) {
    const group = roomPlan?.groups.find((g) => g.roomKey === roomKey);
    const existing = group?.productNeeds ?? [];
    const next = checked
      ? existing.some((n) => n.type === type) ? existing : [...existing, { type, quantity: 1 }]
      : existing.filter((n) => n.type !== type);
    updateProductNeeds(roomKey, next);
  }

  function setNeedQuantity(roomKey: string, type: RoomProductNeed["type"], quantity: number) {
    const group = roomPlan?.groups.find((g) => g.roomKey === roomKey);
    const next = (group?.productNeeds ?? []).map((n) => (n.type === type ? { ...n, quantity: Math.max(1, Math.min(9999, Math.round(quantity) || 1)) } : n));
    updateProductNeeds(roomKey, next);
  }

  return {
    counts,
    activePresetId,
    customRooms,
    applyPreset,
    updateRoom,
    adjustRoom,
    addCustomRoomDraft,
    updateCustomRoomDraft,
    removeCustomRoomDraft,
    toggleNeed,
    setNeedQuantity,
    totalRooms,
    activeRooms,
  };
}

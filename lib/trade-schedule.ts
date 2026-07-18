import {
  ROOM_KEYS,
  scopeIdForRoom,
  type RequirementType,
  type RoomGroup,
  type RoomKey,
  type RoomProductNeed,
  type TradeProjectRoomPlan,
} from "@/lib/trade-project";

export type { RequirementType, RoomKey };

export const presets: Array<{
  id: string;
  label: string;
  icon: string;
  description: string;
  counts: Record<RoomKey, number>;
}> = [
  {
    id: "villa",
    label: "Villa",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    description: "1 master, 2 guest, 1 powder",
    counts: { master: 1, standard: 2, powder: 1, suite: 0 },
  },
  {
    id: "hotel",
    label: "Hotel",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    description: "40 standard rooms, 5 suites",
    counts: { master: 0, standard: 40, powder: 0, suite: 5 },
  },
  {
    id: "development",
    label: "Development",
    icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    description: "80 standard bathrooms",
    counts: { master: 0, standard: 80, powder: 0, suite: 0 },
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    description: "6 powder / public washrooms",
    counts: { master: 0, standard: 0, powder: 6, suite: 0 },
  },
];

export const roomConfig: Array<{ key: RoomKey; label: string; icon: string; helper: string }> = [
  {
    key: "master",
    label: "Master bathrooms",
    icon: "M5 3v18l7-3 7 3V3H5z",
    helper: "Full private bathrooms in villas or apartments",
  },
  {
    key: "standard",
    label: "Standard bathrooms",
    icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
    helper: "Hotel rooms, guest baths, or repeated apartment baths",
  },
  {
    key: "powder",
    label: "Powder rooms",
    icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
    helper: "Basin only — no shower included",
  },
  {
    key: "suite",
    label: "Signature suites",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    helper: "Statement bathrooms with premium fixtures",
  },
];

/** Default starting checklist for a room type — used only to seed the property-setup
 * checklist step the first time a room is configured. `buildSchedule()` reads directly off
 * whatever the user confirms in `RoomGroup.productNeeds`, not off this default. */
export function defaultProductNeedsFor(room: RoomKey): RoomProductNeed[] {
  if (room === "powder") {
    return [{ type: "basin-mixer", quantity: 1 }];
  }
  if (room === "suite") {
    return [
      { type: "wall-mounted", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
    ];
  }
  return [
    { type: room === "master" ? "tall-basin-mixer" : "basin-mixer", quantity: 1 },
    { type: "concealed-shower", quantity: 1 },
  ];
}

const ALL_REQUIREMENT_TYPES: RequirementType[] = [
  "basin-mixer",
  "tall-basin-mixer",
  "wall-mounted",
  "concealed-shower",
  "free-standing",
  "accessories",
  "bidet-spray",
];

/** The full product-type gallery, shown for every room regardless of kind — nobody should be
 * forced into a curated subset. Room kind only affects which needs are pre-checked by default. */
export function allRequirementTypesFor(_room: RoomKey): RequirementType[] {
  return ALL_REQUIREMENT_TYPES;
}

export function createEmptyRoomPlan(): TradeProjectRoomPlan {
  return {
    presetId: null,
    groups: ROOM_KEYS.map((roomKey) => ({
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: roomConfig.find((entry) => entry.key === roomKey)?.label ?? roomKey,
      count: 0,
      productNeeds: defaultProductNeedsFor(roomKey),
    })),
  };
}

export function createEmptyCustomRoomGroup(roomKey: string, label: string, count: number): RoomGroup {
  return {
    scopeId: scopeIdForRoom(roomKey),
    roomKey,
    roomLabel: label,
    count: clampCount(count),
    isCustom: true,
    productNeeds: defaultProductNeedsFor("master"),
  };
}

/** Builds/updates a room plan from the property-setup step, preserving any existing
 * product needs for rooms that already existed (matched by roomKey) — re-visiting property
 * setup should never silently discard needs already confirmed. */
export function buildRoomPlan(
  existingPlan: TradeProjectRoomPlan | null,
  presetId: string | null,
  counts: Record<RoomKey, number>,
  productNeedsByRoom: Record<string, RoomProductNeed[]>,
  customRooms: Array<{ roomKey: string; label: string; count: number }>
): TradeProjectRoomPlan {
  const existingByKey = new Map((existingPlan?.groups ?? []).map((group) => [group.roomKey, group]));

  const fixedGroups: RoomGroup[] = ROOM_KEYS.map((roomKey) => {
    const existing = existingByKey.get(roomKey);
    return {
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: roomConfig.find((entry) => entry.key === roomKey)?.label ?? roomKey,
      count: clampCount(counts[roomKey] ?? 0),
      productNeeds: productNeedsByRoom[roomKey] ?? existing?.productNeeds ?? defaultProductNeedsFor(roomKey),
    };
  });

  const customGroups: RoomGroup[] = customRooms.map((room) => {
    const existing = existingByKey.get(room.roomKey);
    return {
      scopeId: scopeIdForRoom(room.roomKey),
      roomKey: room.roomKey,
      roomLabel: room.label,
      count: clampCount(room.count),
      isCustom: true,
      productNeeds: productNeedsByRoom[room.roomKey] ?? existing?.productNeeds ?? defaultProductNeedsFor("master"),
    };
  });

  return { presetId, groups: [...fixedGroups, ...customGroups] };
}

export function clampCount(value: number) {
  return Math.max(0, Math.min(500, Math.round(value) || 0));
}

import { getProductsBySeries, type Product, type Series } from "@/lib/utils";
import {
  REQUIREMENT_TYPE_LABELS,
  ROOM_KEYS,
  scopeIdForRoom,
  type LevelKey,
  type RequirementType,
  type RoomGroup,
  type RoomKey,
  type RoomProductNeed,
  type TradeProjectRoomPlan,
} from "@/lib/trade-project";

export type { LevelKey, RequirementType, RoomKey };

export interface Requirement {
  type: RequirementType;
  quantity: number;
  optional?: boolean;
}

export interface GeneratedRow {
  product: Product;
  finish: string;
  model: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export const levelOptions: Array<{ id: LevelKey; label: string; tag: string; description: string }> = [
  {
    id: "practical",
    label: "Core",
    tag: "Essentials",
    description: "Main mixers and repeatable items for controlled project budgets.",
  },
  {
    id: "premium",
    label: "Complete",
    tag: "Most useful",
    description: "A fuller bathroom scope with basin, shower, and supporting items.",
  },
  {
    id: "signature",
    label: "Signature",
    tag: "Expanded",
    description: "Adds statement pieces where suites, villas, or show units need more presence.",
  },
];

export const presets: Array<{
  id: string;
  label: string;
  icon: string;
  description: string;
  counts: Record<RoomKey, number>;
  level: LevelKey;
}> = [
  {
    id: "villa",
    label: "Villa",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    description: "1 master, 2 guest, 1 powder",
    counts: { master: 1, standard: 2, powder: 1, suite: 0 },
    level: "premium",
  },
  {
    id: "hotel",
    label: "Hotel",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    description: "40 standard rooms, 5 suites",
    counts: { master: 0, standard: 40, powder: 0, suite: 5 },
    level: "premium",
  },
  {
    id: "development",
    label: "Development",
    icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    description: "80 standard bathrooms",
    counts: { master: 0, standard: 80, powder: 0, suite: 0 },
    level: "practical",
  },
  {
    id: "commercial",
    label: "Commercial",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    description: "6 powder / public washrooms",
    counts: { master: 0, standard: 0, powder: 6, suite: 0 },
    level: "practical",
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

/** Smart starting checklist for a room type at a given coverage level — used only to pre-fill
 * the property-setup checklist step. Not used for generation anymore; `buildSchedule()` reads
 * directly off whatever the user confirms in `RoomGroup.productNeeds`. */
export function requirementsFor(room: RoomKey, level: LevelKey): Requirement[] {
  if (room === "powder") {
    return [{ type: "basin-mixer", quantity: 1 }];
  }
  if (room === "suite") {
    return [
      { type: "wall-mounted", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
      { type: "free-standing", quantity: 1, optional: true },
      { type: "bidet-spray", quantity: 1, optional: true },
      { type: "accessories", quantity: 1, optional: true },
    ];
  }
  if (level === "signature") {
    const signatureRequirements: Requirement[] = [
      { type: "wall-mounted", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
      { type: "free-standing", quantity: room === "master" ? 1 : 0, optional: true },
      { type: "bidet-spray", quantity: 1, optional: true },
      { type: "accessories", quantity: 1, optional: true },
    ];
    return signatureRequirements.filter((item) => item.quantity > 0 || item.optional);
  }
  if (level === "premium") {
    return [
      { type: room === "master" ? "tall-basin-mixer" : "basin-mixer", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
      { type: "bidet-spray", quantity: 1, optional: true },
      { type: "accessories", quantity: 1, optional: true },
    ];
  }
  return [
    { type: "basin-mixer", quantity: 1 },
    { type: "concealed-shower", quantity: 1 },
    { type: "accessories", quantity: 1, optional: true },
  ];
}

/** The checklist rows to show in the property-setup step for a room type: required items
 * pre-checked with their default quantity, optional items shown unchecked (quantity 0). */
export function productNeedDefaultsFor(room: RoomKey, level: LevelKey): RoomProductNeed[] {
  return requirementsFor(room, level)
    .filter((req) => !req.optional)
    .map((req) => ({ type: req.type, quantity: req.quantity }));
}

/** Every product type that could plausibly apply to a room type, for building the full
 * checklist UI (required + optional), independent of which are checked by default. */
export function allRequirementTypesFor(room: RoomKey): RequirementType[] {
  const seen = new Set<RequirementType>();
  (["practical", "premium", "signature"] as LevelKey[]).forEach((level) => {
    requirementsFor(room, level).forEach((req) => seen.add(req.type));
  });
  return Array.from(seen);
}

export function createEmptyRoomPlan(): TradeProjectRoomPlan {
  return {
    presetId: null,
    groups: ROOM_KEYS.map((roomKey) => ({
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: roomConfig.find((entry) => entry.key === roomKey)?.label ?? roomKey,
      count: 0,
      productNeeds: productNeedDefaultsFor(roomKey, "premium"),
      allocations: [],
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
    productNeeds: productNeedDefaultsFor("master", "premium"),
    allocations: [],
  };
}

/** Builds/updates a room plan from the property-setup step, preserving any existing
 * allocations for rooms that already existed (matched by roomKey) — re-visiting property
 * setup should never silently discard collection assignments already made. */
export function buildRoomPlan(
  existingPlan: TradeProjectRoomPlan | null,
  presetId: string | null,
  counts: Record<RoomKey, number>,
  productNeedsByRoom: Record<string, RoomProductNeed[]>,
  customRooms: Array<{ roomKey: string; label: string; count: number }>
): TradeProjectRoomPlan {
  const existingByKey = new Map((existingPlan?.groups ?? []).map((group) => [group.roomKey, group]));
  const level = presets.find((preset) => preset.id === presetId)?.level ?? "premium";

  const fixedGroups: RoomGroup[] = ROOM_KEYS.map((roomKey) => {
    const existing = existingByKey.get(roomKey);
    return {
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: roomConfig.find((entry) => entry.key === roomKey)?.label ?? roomKey,
      count: clampCount(counts[roomKey] ?? 0),
      productNeeds: productNeedsByRoom[roomKey] ?? existing?.productNeeds ?? productNeedDefaultsFor(roomKey, level),
      allocations: existing?.allocations ?? [],
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
      productNeeds: productNeedsByRoom[room.roomKey] ?? existing?.productNeeds ?? productNeedDefaultsFor("master", "premium"),
      allocations: existing?.allocations ?? [],
    };
  });

  return { presetId, groups: [...fixedGroups, ...customGroups] };
}

export const collectionIntelligence: Record<string, { bestUse: string; note: string }> = {
  joy: {
    bestUse: "Villas, hotel suites, premium apartments",
    note: "Warm, round lines with the broadest product coverage in the Egypt range.",
  },
  up: {
    bestUse: "Hotels, compounds, repeatable schedules",
    note: "Streamlined and complete — the strongest trade recommendation.",
  },
  art: {
    bestUse: "Architect-led villas, boutique hospitality",
    note: "Stainless steel bodies create a stronger design statement.",
  },
  quatro: {
    bestUse: "Modern apartments, geometric interiors",
    note: "Linear forms for sharper, contemporary spaces.",
  },
};

export function clampCount(value: number) {
  return Math.max(0, Math.min(500, Math.round(value) || 0));
}

/** Generates product rows for ONE allocation: a single collection+finish, a single room count,
 * against an explicit list of needed product types (already decided at the room-group level). */
export function buildSchedule(series: Series, finish: string, productNeeds: RoomProductNeed[], roomCount: number) {
  const products = getProductsBySeries(series.id);
  const rows: GeneratedRow[] = [];
  const omitted: string[] = [];

  for (const need of productNeeds) {
    if (need.quantity <= 0 || roomCount <= 0) continue;
    const product = products.find((entry) => entry.type === need.type);
    const variant = product?.variants.find((entry) => entry.finish === finish);
    const totalQuantity = need.quantity * roomCount;
    if (!product || !variant) {
      omitted.push(`${REQUIREMENT_TYPE_LABELS[need.type]} (not available in ${series.name} in this finish)`);
      continue;
    }
    rows.push({
      product,
      finish,
      model: variant.model,
      unitPrice: variant.price,
      quantity: totalQuantity,
      lineTotal: totalQuantity * variant.price,
    });
  }

  return { rows, omitted };
}

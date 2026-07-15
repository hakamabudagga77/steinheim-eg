import { getProductsBySeries, type Product, type Series } from "@/lib/utils";
import {
  ROOM_KEYS,
  scopeIdForRoom,
  type LevelKey,
  type RoomKey,
  type TradeProjectRoomPlan,
} from "@/lib/trade-project";

export type { LevelKey, RoomKey };
export type RequirementType =
  | "basin-mixer"
  | "tall-basin-mixer"
  | "wall-mounted"
  | "concealed-shower"
  | "free-standing"
  | "accessories"
  | "bidet-spray";

export interface Requirement {
  type: RequirementType;
  label: string;
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

export function createEmptyRoomPlan(): TradeProjectRoomPlan {
  return {
    presetId: null,
    groups: ROOM_KEYS.map((roomKey) => ({
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: roomConfig.find((entry) => entry.key === roomKey)?.label ?? roomKey,
      count: 0,
      assignment: null,
    })),
  };
}

export function roomPlanFromCounts(presetId: string | null, counts: Record<RoomKey, number>): TradeProjectRoomPlan {
  const base = createEmptyRoomPlan();
  return {
    presetId,
    groups: base.groups.map((group) => ({ ...group, count: clampCount(counts[group.roomKey] ?? 0) })),
  };
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

export function requirementsFor(room: RoomKey, level: LevelKey): Requirement[] {
  if (room === "powder") {
    return [{ type: "basin-mixer", label: "Basin mixer", quantity: 1 }];
  }
  if (room === "suite") {
    return [
      { type: "wall-mounted", label: "Wall-mounted basin mixer", quantity: 1 },
      { type: "concealed-shower", label: "Concealed shower", quantity: 1 },
      { type: "free-standing", label: "Free-standing bath mixer", quantity: 1, optional: true },
      { type: "bidet-spray", label: "Bidet spray", quantity: 1, optional: true },
      { type: "accessories", label: "Accessories set", quantity: 1, optional: true },
    ];
  }
  if (level === "signature") {
    const signatureRequirements: Requirement[] = [
      { type: "wall-mounted", label: "Wall-mounted basin mixer", quantity: 1 },
      { type: "concealed-shower", label: "Concealed shower", quantity: 1 },
      { type: "free-standing", label: "Free-standing bath mixer", quantity: room === "master" ? 1 : 0, optional: true },
      { type: "bidet-spray", label: "Bidet spray", quantity: 1, optional: true },
      { type: "accessories", label: "Accessories set", quantity: 1, optional: true },
    ];

    return signatureRequirements.filter((item) => item.quantity > 0);
  }
  if (level === "premium") {
    return [
      { type: room === "master" ? "tall-basin-mixer" : "basin-mixer", label: room === "master" ? "Tall basin mixer" : "Basin mixer", quantity: 1 },
      { type: "concealed-shower", label: "Concealed shower", quantity: 1 },
      { type: "bidet-spray", label: "Bidet spray", quantity: 1, optional: true },
      { type: "accessories", label: "Accessories set", quantity: 1, optional: true },
    ];
  }
  return [
    { type: "basin-mixer", label: "Basin mixer", quantity: 1 },
    { type: "concealed-shower", label: "Concealed shower", quantity: 1 },
    { type: "accessories", label: "Accessories set", quantity: 1, optional: true },
  ];
}

export function buildSchedule(series: Series, finish: string, level: LevelKey, counts: Record<RoomKey, number>) {
  const products = getProductsBySeries(series.id);
  const aggregated = new Map<RequirementType, { quantity: number; label: string; optional: boolean }>();

  (Object.keys(counts) as RoomKey[]).forEach((room) => {
    const roomCount = counts[room];
    if (roomCount <= 0) return;
    for (const requirement of requirementsFor(room, level)) {
      const current = aggregated.get(requirement.type);
      const quantity = roomCount * requirement.quantity;
      aggregated.set(requirement.type, {
        quantity: (current?.quantity ?? 0) + quantity,
        label: requirement.label,
        optional: Boolean(current?.optional && requirement.optional) || Boolean(requirement.optional),
      });
    }
  });

  const rows: GeneratedRow[] = [];
  const omitted: string[] = [];

  for (const [type, requirement] of aggregated) {
    const product = products.find((entry) => entry.type === type);
    const variant = product?.variants.find((entry) => entry.finish === finish);
    if (!product || !variant) {
      omitted.push(
        `${requirement.label}${requirement.optional ? " (not available in this selection)" : " (missing from catalogue)"}`
      );
      continue;
    }
    rows.push({
      product,
      finish,
      model: variant.model,
      unitPrice: variant.price,
      quantity: requirement.quantity,
      lineTotal: requirement.quantity * variant.price,
    });
  }

  return { rows, omitted };
}

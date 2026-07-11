"use client";

import { useId, useState } from "react";
import Image from "next/image";
import {
  formatPrice,
  getAllFinishes,
  getAllSeries,
  getProductsBySeries,
  type Product,
  type Series,
} from "@/lib/utils";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";

type RoomKey = "master" | "standard" | "powder" | "suite";
type LevelKey = "practical" | "premium" | "signature";
type RequirementType =
  | "basin-mixer"
  | "tall-basin-mixer"
  | "wall-mounted"
  | "concealed-shower"
  | "free-standing"
  | "accessories"
  | "bidet-spray";

interface Requirement {
  type: RequirementType;
  label: string;
  quantity: number;
  optional?: boolean;
}

interface GeneratedRow {
  product: Product;
  finish: string;
  model: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

const STEPS = ["Scope", "Rooms", "Default style", "Add to board"] as const;
type Step = 0 | 1 | 2 | 3;

const levelOptions: Array<{ id: LevelKey; label: string; tag: string; description: string }> = [
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

const presets: Array<{
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

const roomConfig: Array<{ key: RoomKey; label: string; icon: string; helper: string }> = [
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

const collectionIntelligence: Record<string, { bestUse: string; note: string }> = {
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

function clampCount(value: number) {
  return Math.max(0, Math.min(500, Math.round(value) || 0));
}

function requirementsFor(room: RoomKey, level: LevelKey): Requirement[] {
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

function buildSchedule(series: Series, finish: string, level: LevelKey, counts: Record<RoomKey, number>) {
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

export default function SmartRoomCalculator() {
  const series = getAllSeries();
  const allFinishes = getAllFinishes();
  const [step, setStep] = useState<Step>(0);
  const [seriesId, setSeriesId] = useState(series[1]?.id ?? series[0]?.id ?? "joy");
  const selectedSeries = series.find((entry) => entry.id === seriesId) ?? series[0];
  const [finish, setFinish] = useState(selectedSeries.finishes[0]);
  const [level, setLevel] = useState<LevelKey>("premium");
  const [counts, setCounts] = useState<Record<RoomKey, number>>({
    master: 0,
    standard: 0,
    powder: 0,
    suite: 0,
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [scopeCounter, setScopeCounter] = useState(0);
  const { addItem, setOpen } = useTradeProject();
  const scopeBaseId = useId().replace(/[^a-z0-9]/gi, "");

  const availableFinishes = allFinishes.filter((entry) => selectedSeries.finishes.includes(entry.id));
  const activeFinish = selectedSeries.finishes.includes(finish) ? finish : selectedSeries.finishes[0];
  const activeFinishName = allFinishes.find((entry) => entry.id === activeFinish)?.name ?? activeFinish;
  const intelligence = collectionIntelligence[selectedSeries.id] ?? collectionIntelligence.joy;
  const schedule = buildSchedule(selectedSeries, activeFinish, level, counts);

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const totalUnits = schedule.rows.reduce((sum, row) => sum + row.quantity, 0);
  const totalPrice = schedule.rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const activePreset = presets.find((preset) => preset.id === activePresetId);
  const roomSummary = roomConfig
    .filter(({ key }) => counts[key] > 0)
    .map(({ key, label }) => `${counts[key]} ${label.toLowerCase()}`)
    .join(", ");
  const scopeName = activePreset ? `${activePreset.label} scope` : "Custom scope";
  const scopeSummary = `${roomSummary || `${totalRooms} rooms`} · ${selectedSeries.name} · ${activeFinishName}`;

  function applyPreset(preset: (typeof presets)[number]) {
    setCounts(preset.counts);
    setLevel(preset.level);
    setActivePresetId(preset.id);
    setAdded(false);
    setStep(1);
  }

  function updateRoom(room: RoomKey, value: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(value) }));
    setActivePresetId(null);
    setAdded(false);
  }

  function adjustRoom(room: RoomKey, delta: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(current[room] + delta) }));
    setActivePresetId(null);
    setAdded(false);
  }

  function addScheduleToProject() {
    if (added) {
      setOpen(true);
      return;
    }
    const nextScopeIndex = scopeCounter + 1;
    const scopeId = `scope-${scopeBaseId}-${nextScopeIndex}`;
    for (const row of schedule.rows) {
      addItem(row.product.slug, row.finish, row.quantity, {
        scopeId,
        scopeName,
        scopeSummary,
      });
    }
    setScopeCounter(nextScopeIndex);
    setAdded(true);
  }

  function startAnotherScope() {
    setCounts({
      master: 0,
      standard: 0,
      powder: 0,
      suite: 0,
    });
    setActivePresetId(null);
    setAdded(false);
    setStep(0);
  }

  const canGoNext = (s: Step): boolean => {
    if (s === 0) return true;
    if (s === 1) return totalRooms > 0;
    if (s === 2) return true;
    return false;
  };

  return (
    <section id="smart-room-calculator" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[960px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
            Steinheim Trade Studio
          </p>
          <h2 className="mt-3 font-heading text-[clamp(1.8rem,4vw,3rem)] leading-[1] text-charcoal">
            Build one scope at a time
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-warm-gray">
            Use this for one area of the project: guestrooms, suites, villas, public washrooms, or owner units.
          </p>
          <p className="mx-auto mt-3 max-w-lg border border-charcoal/10 bg-[#ece9e2] px-4 py-3 text-[11px] leading-[1.65] text-warm-gray">
            Need two collections? Build the first scope, add it to the board, then start another scope or add exact products manually. The board combines everything into one RFQ.
          </p>
        </div>

        {/* Progress stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (i <= step) setStep(i as Step);
                }}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div className={`h-[2px] flex-1 transition-colors duration-300 ${i <= step ? "bg-charcoal" : "bg-charcoal/10"}`} />
                  )}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-all duration-300 ${
                      i === step
                        ? "bg-charcoal text-white ring-4 ring-charcoal/10"
                        : i < step
                          ? "bg-charcoal text-white"
                          : "border border-charcoal/15 text-warm-gray"
                    }`}
                  >
                    {i < step ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-[2px] flex-1 transition-colors duration-300 ${i < step ? "bg-charcoal" : "bg-charcoal/10"}`} />
                  )}
                </div>
                <span className={`text-[9px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  i <= step ? "text-charcoal" : "text-warm-gray/50"
                } hidden sm:block`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[420px]">
          {/* Step 0: Project type */}
          {step === 0 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">Which scope are you building?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">Pick one project area. You can add another collection or area after this draft goes into the board.</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`group flex items-start gap-4 border p-6 text-left transition-all duration-200 hover:shadow-lg ${
                      activePresetId === preset.id
                        ? "border-charcoal bg-charcoal text-white shadow-lg"
                        : "border-charcoal/10 bg-white hover:border-charcoal"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                      activePresetId === preset.id ? "bg-white/15" : "bg-charcoal/5"
                    }`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                        className={activePresetId === preset.id ? "text-white" : "text-charcoal"}>
                        <path d={preset.icon} />
                      </svg>
                    </div>
                    <div>
                      <span className="block font-heading text-[20px] leading-tight">
                        {preset.label}
                      </span>
                      <span className={`mt-1 block text-[12px] leading-[1.6] ${
                        activePresetId === preset.id ? "text-white/60" : "text-warm-gray"
                      }`}>
                        {preset.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setActivePresetId("custom"); setStep(1); }}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-charcoal/20 p-5 text-[12px] font-medium text-warm-gray transition hover:border-charcoal hover:text-charcoal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 4v16m-8-8h16" />
                </svg>
                Custom scope configuration
              </button>
            </div>
          )}

          {/* Step 1: Room counts */}
          {step === 1 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">How many rooms in this scope?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">Keep this focused. For a hotel, standard rooms and suites should usually be separate scopes.</p>

              <div className="space-y-3">
                {roomConfig.map(({ key, label, icon, helper }) => (
                  <div key={key} className="flex items-center gap-4 border border-charcoal/8 bg-[#ece9e2] p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-charcoal/8">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-charcoal">
                        <path d={icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-charcoal">{label}</p>
                      <p className="text-[11px] text-warm-gray">
                        {key === "powder" ? "Basin only - no shower included" : helper}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustRoom(key, -1)}
                        disabled={counts[key] === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/12 text-[16px] text-charcoal transition hover:bg-charcoal hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-charcoal"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={counts[key]}
                        onChange={(e) => updateRoom(key, Number(e.target.value))}
                        className="h-9 w-14 bg-transparent text-center font-heading text-[20px] outline-none"
                        aria-label={label}
                      />
                      <button
                        type="button"
                        onClick={() => adjustRoom(key, 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/12 text-[16px] text-charcoal transition hover:bg-charcoal hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product coverage */}
              <div className="mt-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                  Product coverage
                </p>
                <p className="mb-3 text-[11px] leading-[1.6] text-warm-gray">
                  This is not the collection or price tier. It only decides how many product types this scope should include.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setLevel(opt.id); setAdded(false); }}
                      className={`border p-4 text-left transition-all ${
                        level === opt.id
                          ? "border-charcoal bg-charcoal text-white"
                          : "border-charcoal/10 hover:border-charcoal"
                      }`}
                    >
                      <span className={`text-[8px] font-medium uppercase tracking-[0.15em] ${
                        level === opt.id ? "text-white/50" : "text-warm-gray"
                      }`}>
                        {opt.tag}
                      </span>
                      <span className="mt-1 block text-[15px] font-medium">{opt.label}</span>
                      <span className={`mt-1 block text-[11px] leading-[1.5] ${
                        level === opt.id ? "text-white/60" : "text-warm-gray"
                      }`}>
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {totalRooms > 0 && (
                <div className="mt-6 flex items-center justify-between border border-charcoal/10 bg-charcoal/[0.02] px-5 py-3">
                  <span className="text-[13px] text-charcoal">
                    <strong>{totalRooms}</strong> {totalRooms === 1 ? "room" : "rooms"} configured
                  </span>
                  <span className="text-[11px] text-warm-gray">
                    {levelOptions.find((o) => o.id === level)?.label} spec
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Collection & Finish */}
          {step === 2 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">Choose the default style for this scope</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Pick the collection and finish for this area only. Other areas can use different collections, finishes, and product quantities.
              </p>

              {/* Collection selector */}
              <div className="mb-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                  Collection
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {series.map((s) => {
                    const intel = collectionIntelligence[s.id] ?? collectionIntelligence.joy;
                    const heroProduct = getProductsBySeries(s.id)[0];
                    const heroImg = heroProduct ? getProductImage(heroProduct.slug, s.finishes[0]) : null;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSeriesId(s.id);
                          if (!s.finishes.includes(finish)) setFinish(s.finishes[0]);
                          setAdded(false);
                        }}
                        className={`group flex gap-4 border p-4 text-left transition-all ${
                          seriesId === s.id
                            ? "border-charcoal bg-charcoal text-white"
                            : "border-charcoal/10 hover:border-charcoal"
                        }`}
                      >
                        <div className={`relative h-16 w-16 shrink-0 ${seriesId === s.id ? "bg-white/10" : "bg-[#ece9e2]"}`}>
                          {heroImg && (
                            <Image src={heroImg} alt={s.name} fill sizes="64px" className="object-contain p-1" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-heading text-[18px] leading-tight">{s.name}</span>
                          <span className={`mt-0.5 block text-[10px] uppercase tracking-[0.1em] ${
                            seriesId === s.id ? "text-white/40" : "text-warm-gray"
                          }`}>
                            {s.shape}
                          </span>
                          <span className={`mt-1 block text-[11px] leading-[1.5] ${
                            seriesId === s.id ? "text-white/60" : "text-warm-gray"
                          }`}>
                            {intel.bestUse}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Finish selector */}
              <div className="mb-6">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                  Finish — {activeFinishName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableFinishes.map((f) => {
                    const disc = getFinishDiscImage(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { setFinish(f.id); setAdded(false); }}
                        className={`flex items-center gap-2.5 border px-4 py-2.5 text-left transition-all ${
                          activeFinish === f.id
                            ? "border-charcoal bg-charcoal text-white"
                            : "border-charcoal/10 hover:border-charcoal"
                        }`}
                      >
                        {disc && (
                          <span className="relative h-5 w-5 overflow-hidden rounded-full border border-black/10">
                            <Image src={disc} alt="" fill sizes="20px" className="object-cover" />
                          </span>
                        )}
                        <span className="text-[12px] font-medium">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Collection note */}
              <div className="border border-charcoal/8 bg-[#ece9e2] p-5">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">Selection summary</p>
                <p className="mt-2 font-heading text-[20px] leading-tight text-charcoal">
                  {selectedSeries.name} · {activeFinishName}
                </p>
                <p className="mt-2 text-[12px] leading-[1.7] text-warm-gray">{intelligence.note}</p>
                <p className="mt-2 text-[11px] text-warm-gray/60">
                  {totalRooms} rooms · {levelOptions.find((o) => o.id === level)?.label} specification
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review schedule */}
          {step === 3 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">Add this scope to the board</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                {totalRooms} rooms with {selectedSeries.name} in {activeFinishName} — {totalUnits} product units.
                Add this scope, then repeat for another collection or refine individual rows in the project board.
              </p>

              {/* Summary cards */}
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Rooms", String(totalRooms)],
                  ["Product units", String(totalUnits)],
                  ["Retail reference", formatPrice(totalPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="border border-charcoal/8 bg-[#ece9e2] p-4">
                    <p className="text-[9px] font-medium uppercase tracking-[0.17em] text-warm-gray">{label}</p>
                    <p className="mt-1 font-heading text-[22px] leading-none text-charcoal">{value}</p>
                  </div>
                ))}
              </div>

              {/* Product rows */}
              {schedule.rows.length > 0 ? (
                <div className="divide-y divide-charcoal/8 border border-charcoal/8">
                  {schedule.rows.map((row) => {
                    const img = getProductImage(row.product.slug, row.finish);
                    const finishMeta = allFinishes.find((entry) => entry.id === row.finish);
                    const finishDisc = getFinishDiscImage(row.finish);
                    return (
                      <div key={`${row.product.slug}-${row.finish}`} className="flex items-center gap-4 bg-white p-4">
                        <div className="relative h-14 w-14 shrink-0 bg-[#ece9e2]">
                          {img ? (
                            <Image src={img} alt={row.product.name} fill sizes="56px" className="object-contain p-1.5" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-warm-gray">—</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-charcoal">
                            {selectedSeries.name} {row.product.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-warm-gray">
                            {finishDisc && (
                              <span className="relative h-3.5 w-3.5 overflow-hidden rounded-full border border-black/10">
                                <Image src={finishDisc} alt="" fill sizes="14px" className="object-cover" />
                              </span>
                            )}
                            <span>{finishMeta?.name ?? row.finish}</span>
                            <span>·</span>
                            <span>{row.model}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-medium text-charcoal">
                            {row.quantity} × {formatPrice(row.unitPrice)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-warm-gray">{formatPrice(row.lineTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="border border-dashed border-charcoal/15 p-6 text-center text-[13px] text-warm-gray">
                  No products matched this configuration.
                </p>
              )}

              {schedule.omitted.length > 0 && (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-900">
                    Not available in this selection
                  </p>
                  <ul className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-amber-900/80">
                    {schedule.omitted.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add to project */}
              {schedule.rows.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={addScheduleToProject}
                    className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                  >
                    {added ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Added — open project board
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 4v16m-8-8h16" />
                        </svg>
                        Add this scope to project board
                      </>
                    )}
                  </button>

                  {added && (
                    <div className="mt-4 border border-charcoal/12 bg-[#ece9e2] p-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-charcoal">
                        Scope added to board
                      </p>
                      <p className="mt-2 text-[12px] leading-[1.7] text-warm-gray">
                        Build another area with a different collection or finish, or open the board when the full project is ready.
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={startAnotherScope}
                          className="flex h-[44px] items-center justify-center border border-charcoal/15 bg-white text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
                        >
                          Add another scope
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpen(true)}
                          className="flex h-[44px] items-center justify-center bg-charcoal text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                        >
                          Open project board
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-4 text-[10px] leading-relaxed text-warm-gray/60">
                Retail references only. This draft can be edited or mixed with other products. Trade pricing, stock, lead times, and final package structure are confirmed by the Steinheim Egypt team after submission.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-charcoal/8 pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-warm-gray transition hover:text-charcoal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={!canGoNext(step)}
              onClick={() => setStep((step + 1) as Step)}
              className="flex h-[44px] items-center gap-2 bg-charcoal px-8 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black disabled:opacity-30"
            >
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </section>
  );
}

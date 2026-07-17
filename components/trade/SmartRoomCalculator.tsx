"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import {
  PERSONA_META,
  REQUIREMENT_TYPE_LABELS,
  TRADE_PERSONAS,
  TRADE_PERSONA_LABELS,
  type RoomProductNeed,
} from "@/lib/trade-project";
import {
  allRequirementTypesFor,
  buildRoomPlan,
  clampCount,
  presets,
  roomConfig,
  type RoomKey,
} from "@/lib/trade-schedule";
import { getRepresentativeProductForType } from "@/lib/utils";
import { getProductDefaultImage } from "@/data/images";
import ShopProductsStep from "@/components/trade/ShopProductsStep";

const STEPS = ["You & your project", "Rooms", "What's needed", "Shop products"] as const;
type Step = 0 | 1 | 2 | 3;

const emptyCounts: Record<RoomKey, number> = { master: 0, standard: 0, powder: 0, suite: 0 };

interface CustomRoomDraft {
  roomKey: string;
  label: string;
  count: number;
}

function createDraftKey() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function SmartRoomCalculator() {
  const { project, setRoomPlan, setOpen, setPersona, updateDetails, updateProductNeeds } = useTradeProject();
  const [step, setStep] = useState<Step>(0);
  const [counts, setCounts] = useState<Record<RoomKey, number>>(emptyCounts);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customRooms, setCustomRooms] = useState<CustomRoomDraft[]>([]);

  const persona = project.persona;
  const personaConfig = persona ? PERSONA_META[persona] : null;
  const details = project.details;
  const canContinueFromIntro = Boolean(
    persona &&
    details.contactName.trim() &&
    /^\S+@\S+\.\S+$/.test(details.email) &&
    details.projectName.trim()
  );

  // Pre-fill from an existing room plan so "Edit property composition" doesn't reset to zero.
  useEffect(() => {
    const plan = project.roomPlan;
    if (!plan) return;
    const fixed = plan.groups.filter((group) => !group.isCustom);
    const custom = plan.groups.filter((group) => group.isCustom);
    setCounts(Object.fromEntries(fixed.map((group) => [group.roomKey, group.count])) as Record<RoomKey, number>);
    setCustomRooms(custom.map((group) => ({ roomKey: group.roomKey, label: group.roomLabel, count: group.count })));
    setActivePresetId(plan.presetId);
  }, [project.roomPlan]);

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0) + customRooms.reduce((sum, r) => sum + r.count, 0);

  const activeRooms = [
    ...roomConfig.filter((entry) => counts[entry.key] > 0).map((entry) => ({ roomKey: entry.key as string, label: entry.label, count: counts[entry.key] })),
    ...customRooms.filter((room) => room.count > 0).map((room) => ({ roomKey: room.roomKey, label: room.label || "Custom room", count: room.count })),
  ];

  function applyPreset(preset: (typeof presets)[number]) {
    setCounts(preset.counts);
    setActivePresetId(preset.id);
    setStep(1);
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

  function enterAssignmentStep() {
    const plan = buildRoomPlan(project.roomPlan, activePresetId, counts, {}, customRooms.filter((r) => r.count > 0));
    setRoomPlan(plan);
    setStep(2);
  }

  function toggleNeed(roomKey: string, type: RoomProductNeed["type"], checked: boolean) {
    const group = project.roomPlan?.groups.find((g) => g.roomKey === roomKey);
    const existing = group?.productNeeds ?? [];
    const next = checked
      ? existing.some((n) => n.type === type) ? existing : [...existing, { type, quantity: 1 }]
      : existing.filter((n) => n.type !== type);
    updateProductNeeds(roomKey, next);
  }

  function setNeedQuantity(roomKey: string, type: RoomProductNeed["type"], quantity: number) {
    const group = project.roomPlan?.groups.find((g) => g.roomKey === roomKey);
    const next = (group?.productNeeds ?? []).map((n) => (n.type === type ? { ...n, quantity: Math.max(1, Math.min(9999, Math.round(quantity) || 1)) } : n));
    updateProductNeeds(roomKey, next);
  }

  return (
    <section id="smart-room-calculator" className="bg-[#ece9e2] py-16 sm:py-24">
      <div className="mx-auto max-w-[960px] px-5 sm:px-8">
        {/* Header */}
        <ScrollReveal className="mb-10 text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
            Steinheim Trade Studio
          </p>
          <h2
            className="mt-3 font-heading text-[clamp(1.8rem,4vw,3rem)] leading-[1] text-charcoal"
            style={{ fontStyle: "italic" }}
          >
            Tell us your property, once
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-warm-gray">
            Set your room composition, then assign real products to each room — right here on this
            page. Everything you pick is saved to your project board as you go.
          </p>
        </ScrollReveal>

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
          {/* Step 0: Who you are + your project */}
          {step === 0 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">What kind of project is this?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Pick the closest match — it shapes what we ask next. You can always adjust details later.
              </p>

              <StaggerContainer className="grid gap-3 sm:grid-cols-2">
                {TRADE_PERSONAS.map((id) => (
                  <StaggerItem key={id}>
                    <button
                      type="button"
                      onClick={() => setPersona(id)}
                      className={`group flex w-full items-start gap-4 border p-6 text-left transition-all duration-200 hover:shadow-lg ${
                        persona === id
                          ? "border-charcoal bg-charcoal text-white shadow-lg"
                          : "border-charcoal/10 bg-white hover:border-charcoal"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                        persona === id ? "bg-white/15" : "bg-charcoal/5"
                      }`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                          className={persona === id ? "text-white" : "text-charcoal"}>
                          <path d={PERSONA_META[id].icon} />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-heading text-[20px] leading-tight">
                          {TRADE_PERSONA_LABELS[id]}
                        </span>
                        <span className={`mt-1 block text-[12px] leading-[1.6] ${
                          persona === id ? "text-white/60" : "text-warm-gray"
                        }`}>
                          {PERSONA_META[id].description}
                        </span>
                      </div>
                    </button>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {persona && (
                <ScrollReveal className="mt-8 border-t border-charcoal/8 pt-8">
                  <p className="mb-1 font-heading text-[20px] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                    Tell us who to reach
                  </p>
                  <p className="mb-5 text-[12px] leading-[1.6] text-warm-gray">
                    So our team has everything they need before the first call — no back-and-forth just to get the basics.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Your name *"
                      value={details.contactName}
                      onChange={(e) => updateDetails({ contactName: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Email *"
                      type="email"
                      value={details.email}
                      onChange={(e) => updateDetails({ email: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Company"
                      value={details.company}
                      onChange={(e) => updateDetails({ company: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Phone"
                      value={details.phone}
                      onChange={(e) => updateDetails({ phone: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40 sm:col-span-2"
                      placeholder="Project name *"
                      value={details.projectName}
                      onChange={(e) => updateDetails({ projectName: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Location"
                      value={details.location}
                      onChange={(e) => updateDetails({ location: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder="Timeline (e.g. Q2 2027)"
                      value={details.timeline}
                      onChange={(e) => updateDetails({ timeline: e.target.value })}
                    />
                  </div>
                </ScrollReveal>
              )}
            </div>
          )}

          {/* Step 1: Room counts */}
          {step === 1 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">{personaConfig?.roomsTitle ?? "How many rooms in total?"}</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                {personaConfig?.roomsBody ?? "This is the full property. You'll assign a collection to each group next, right here on this page."}
              </p>

              {!personaConfig?.skipFixedRooms && (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] transition ${
                          activePresetId === preset.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-warm-gray hover:border-charcoal hover:text-charcoal"
                        }`}
                        title={preset.description}
                      >
                        Quick fill: {preset.label}
                      </button>
                    ))}
                  </div>

                  <StaggerContainer className="space-y-3">
                    {roomConfig.map(({ key, label, icon, helper }) => (
                      <StaggerItem key={key}>
                      <div className="flex items-center gap-4 border border-charcoal/8 bg-white p-5">
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
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </>
              )}

              {/* Custom rooms */}
              <div className={personaConfig?.skipFixedRooms ? "" : "mt-8"}>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                  {personaConfig?.skipFixedRooms ? "Add each space" : "Custom-named rooms"}
                </p>
                {!personaConfig?.skipFixedRooms && (
                  <p className="mb-3 text-[11px] leading-[1.6] text-warm-gray">
                    For a bespoke project — name a specific room instead of using the categories above (e.g. &ldquo;Primary Ensuite&rdquo;, &ldquo;Kids&apos; Bathroom&rdquo;).
                  </p>
                )}
                <div className="space-y-3">
                  {customRooms.map((room) => (
                    <div key={room.roomKey} className="flex items-center gap-3 border border-charcoal/8 bg-white p-4">
                      <input
                        type="text"
                        value={room.label}
                        onChange={(e) => updateCustomRoomDraft(room.roomKey, { label: e.target.value })}
                        placeholder={personaConfig?.customRoomCopy ?? "Room name — e.g. Primary Ensuite"}
                        className="h-10 flex-1 border border-charcoal/12 bg-white px-3 text-[13px] outline-none placeholder:text-warm-gray/50"
                      />
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={room.count}
                        onChange={(e) => updateCustomRoomDraft(room.roomKey, { count: clampCount(Number(e.target.value)) })}
                        className="h-10 w-16 border border-charcoal/12 bg-white text-center text-[13px] outline-none"
                        aria-label="Count"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomRoomDraft(room.roomKey)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-warm-gray/50 transition hover:text-charcoal"
                        aria-label="Remove"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addCustomRoomDraft}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 border border-dashed border-charcoal/20 text-[12px] font-medium text-warm-gray transition hover:border-charcoal hover:text-charcoal"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m-8-8h16" /></svg>
                  Add a custom room
                </button>
              </div>

              {totalRooms > 0 && (
                <div className="mt-6 flex items-center justify-between border border-charcoal/10 bg-white px-5 py-3">
                  <span className="text-[13px] text-charcoal">
                    <strong>{totalRooms}</strong> {totalRooms === 1 ? "room" : "rooms"} configured
                  </span>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={enterAssignmentStep}
                  disabled={totalRooms === 0}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
                >
                  Continue — assign products to each room
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: What each room needs */}
          {step === 2 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">What does each room need?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Pick what each room needs and how many. You&apos;ll shop for the exact products next.
              </p>

              <div className="relative left-1/2 w-screen -translate-x-1/2">
                <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
                  <div className="space-y-20">
                    {activeRooms.map((room) => {
                      const kind = (roomConfig.some((entry) => entry.key === room.roomKey) ? room.roomKey : "master") as RoomKey;
                      const candidateTypes = allRequirementTypesFor(kind);
                      const group = project.roomPlan?.groups.find((g) => g.roomKey === room.roomKey) ?? null;
                      const needs = group?.productNeeds ?? [];

                      return (
                        <section key={room.roomKey} className="border-t border-charcoal/8 pt-12 first:border-t-0 first:pt-0">
                          <div className="mb-10">
                            <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
                              {room.count} {room.count === 1 ? "room" : "rooms"}
                            </p>
                            <h4 className="mt-2 font-heading text-[clamp(2rem,4vw,3rem)] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                              {room.label}
                            </h4>
                          </div>

                          <StaggerContainer className="grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
                            {candidateTypes.map((type) => {
                              const existing = needs.find((n) => n.type === type);
                              const checked = Boolean(existing);
                              const repProduct = getRepresentativeProductForType(type);
                              const img = repProduct ? getProductDefaultImage(repProduct.slug) : null;
                              return (
                                <StaggerItem key={type}>
                                <div className="group">
                                  <button
                                    type="button"
                                    onClick={() => toggleNeed(room.roomKey, type, !checked)}
                                    className="block w-full text-left"
                                  >
                                    <div className={`relative aspect-square overflow-hidden bg-[#ece9e2] transition ${
                                      checked ? "ring-2 ring-charcoal ring-offset-4 ring-offset-[#ece9e2]" : "ring-1 ring-charcoal/8 ring-offset-4 ring-offset-[#ece9e2] group-hover:ring-charcoal/30"
                                    }`}>
                                      {img && (
                                        <Image
                                          src={img}
                                          alt={REQUIREMENT_TYPE_LABELS[type]}
                                          fill
                                          sizes="(max-width: 768px) 50vw, 25vw"
                                          className={`object-contain p-[16%] transition-opacity ${checked ? "opacity-100" : "opacity-60 group-hover:opacity-90"}`}
                                        />
                                      )}
                                      {checked && (
                                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-white">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                    <p className={`mt-4 text-[14px] font-medium leading-tight transition-colors ${checked ? "text-charcoal" : "text-warm-gray group-hover:text-charcoal"}`}>
                                      {REQUIREMENT_TYPE_LABELS[type]}
                                    </p>
                                  </button>
                                  {checked && (
                                    <div className="mt-3 flex h-8 w-fit items-center border border-charcoal/15 bg-white">
                                      <button
                                        type="button"
                                        onClick={() => setNeedQuantity(room.roomKey, type, existing!.quantity - 1)}
                                        className="flex h-full w-8 shrink-0 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min={1}
                                        max={9999}
                                        value={existing!.quantity}
                                        onChange={(e) => setNeedQuantity(room.roomKey, type, Number(e.target.value))}
                                        className="h-full w-12 border-x border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setNeedQuantity(room.roomKey, type, existing!.quantity + 1)}
                                        className="flex h-full w-8 shrink-0 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </div>
                                </StaggerItem>
                              );
                            })}
                          </StaggerContainer>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                >
                  Continue — shop your products
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Shop real products, by type, across all collections */}
          {step === 3 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">Shop your products</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Every collection, side by side. Mix products and finishes freely to fill what each room needs —
                everything you add is saved to your project board immediately.
              </p>

              <ShopProductsStep />

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m-10 4a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" /></svg>
                  Continue to project board
                </button>
                <p className="mt-4 text-[10px] leading-relaxed text-warm-gray/60">
                  Retail references only. Trade pricing, stock, lead times, and final package structure are
                  confirmed by the Steinheim Egypt team after submission.
                </p>
              </div>
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

          {step === 0 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canContinueFromIntro}
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

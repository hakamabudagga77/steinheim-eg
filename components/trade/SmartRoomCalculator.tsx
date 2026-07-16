"use client";

import { useEffect, useState } from "react";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { REQUIREMENT_TYPE_LABELS, type RoomProductNeed } from "@/lib/trade-project";
import {
  allRequirementTypesFor,
  buildRoomPlan,
  clampCount,
  levelOptions,
  presets,
  productNeedDefaultsFor,
  roomConfig,
  type LevelKey,
  type RoomKey,
} from "@/lib/trade-schedule";

const STEPS = ["Property", "Rooms", "What's needed"] as const;
type Step = 0 | 1 | 2;

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
  const { project, setRoomPlan, setOpen } = useTradeProject();
  const [step, setStep] = useState<Step>(0);
  const [counts, setCounts] = useState<Record<RoomKey, number>>(emptyCounts);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customRooms, setCustomRooms] = useState<CustomRoomDraft[]>([]);
  const [productNeedsByRoom, setProductNeedsByRoom] = useState<Record<string, RoomProductNeed[]>>({});
  const [saved, setSaved] = useState(false);

  // Pre-fill from an existing room plan so "Edit property composition" doesn't reset to zero.
  useEffect(() => {
    const plan = project.roomPlan;
    if (!plan) return;
    const fixed = plan.groups.filter((group) => !group.isCustom);
    const custom = plan.groups.filter((group) => group.isCustom);
    setCounts(Object.fromEntries(fixed.map((group) => [group.roomKey, group.count])) as Record<RoomKey, number>);
    setCustomRooms(custom.map((group) => ({ roomKey: group.roomKey, label: group.roomLabel, count: group.count })));
    setProductNeedsByRoom(Object.fromEntries(plan.groups.map((group) => [group.roomKey, group.productNeeds])));
    setActivePresetId(plan.presetId);
  }, [project.roomPlan]);

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0) + customRooms.reduce((sum, r) => sum + r.count, 0);
  const activeLevel: LevelKey = presets.find((p) => p.id === activePresetId)?.level ?? "premium";

  const activeRooms = [
    ...roomConfig.filter((entry) => counts[entry.key] > 0).map((entry) => ({ roomKey: entry.key as string, label: entry.label, count: counts[entry.key] })),
    ...customRooms.filter((room) => room.count > 0).map((room) => ({ roomKey: room.roomKey, label: room.label || "Custom room", count: room.count })),
  ];

  function ensureProductNeeds(roomKey: string, kindForDefaults: RoomKey) {
    setProductNeedsByRoom((current) => {
      if (current[roomKey]) return current;
      return { ...current, [roomKey]: productNeedDefaultsFor(kindForDefaults, activeLevel) };
    });
  }

  function applyPreset(preset: (typeof presets)[number]) {
    setCounts(preset.counts);
    setActivePresetId(preset.id);
    setSaved(false);
    setStep(1);
  }

  function updateRoom(room: RoomKey, value: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(value) }));
    setActivePresetId(null);
    setSaved(false);
  }

  function adjustRoom(room: RoomKey, delta: number) {
    setCounts((current) => ({ ...current, [room]: clampCount(current[room] + delta) }));
    setActivePresetId(null);
    setSaved(false);
  }

  function addCustomRoomDraft() {
    setCustomRooms((current) => [...current, { roomKey: createDraftKey(), label: "", count: 1 }]);
    setSaved(false);
  }

  function updateCustomRoomDraft(roomKey: string, patch: Partial<CustomRoomDraft>) {
    setCustomRooms((current) => current.map((room) => (room.roomKey === roomKey ? { ...room, ...patch } : room)));
    setSaved(false);
  }

  function removeCustomRoomDraft(roomKey: string) {
    setCustomRooms((current) => current.filter((room) => room.roomKey !== roomKey));
    setProductNeedsByRoom((current) => {
      const next = { ...current };
      delete next[roomKey];
      return next;
    });
  }

  function goToChecklistStep() {
    activeRooms.forEach((room) => {
      const kind = (roomConfig.some((entry) => entry.key === room.roomKey) ? room.roomKey : "master") as RoomKey;
      ensureProductNeeds(room.roomKey, kind);
    });
    setStep(2);
  }

  function toggleNeed(roomKey: string, type: RoomProductNeed["type"], checked: boolean) {
    setProductNeedsByRoom((current) => {
      const existing = current[roomKey] ?? [];
      if (checked) {
        if (existing.some((n) => n.type === type)) return current;
        return { ...current, [roomKey]: [...existing, { type, quantity: 1 }] };
      }
      return { ...current, [roomKey]: existing.filter((n) => n.type !== type) };
    });
    setSaved(false);
  }

  function setNeedQuantity(roomKey: string, type: RoomProductNeed["type"], quantity: number) {
    setProductNeedsByRoom((current) => ({
      ...current,
      [roomKey]: (current[roomKey] ?? []).map((n) => (n.type === type ? { ...n, quantity: Math.max(1, Math.min(20, Math.round(quantity) || 1)) } : n)),
    }));
    setSaved(false);
  }

  function applyLevelToRoom(roomKey: string, kind: RoomKey, level: LevelKey) {
    setProductNeedsByRoom((current) => ({ ...current, [roomKey]: productNeedDefaultsFor(kind, level) }));
    setSaved(false);
  }

  function saveComposition() {
    const plan = buildRoomPlan(project.roomPlan, activePresetId, counts, productNeedsByRoom, customRooms.filter((r) => r.count > 0));
    setRoomPlan(plan);
    setSaved(true);
    setOpen(true);
  }

  return (
    <section id="smart-room-calculator" className="bg-white py-16 sm:py-24">
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
            Set your room composition and what each room needs — you&apos;ll assign a collection to each
            room next, in the project board. Revisiting this later won&apos;t lose collections you&apos;ve already assigned.
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
          {/* Step 0: Project type */}
          {step === 0 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">What kind of project is this?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Pick a starting point — you can fine-tune every count on the next step.
              </p>

              <StaggerContainer className="grid gap-3 sm:grid-cols-2">
                {presets.map((preset) => (
                  <StaggerItem key={preset.id}>
                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`group flex w-full items-start gap-4 border p-6 text-left transition-all duration-200 hover:shadow-lg ${
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
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <button
                type="button"
                onClick={() => { setActivePresetId("custom"); setStep(1); }}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-charcoal/20 p-5 text-[12px] font-medium text-warm-gray transition hover:border-charcoal hover:text-charcoal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 4v16m-8-8h16" />
                </svg>
                Custom room composition
              </button>
            </div>
          )}

          {/* Step 1: Room counts */}
          {step === 1 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">How many rooms in total?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                This is the full property. You&apos;ll assign a collection to each group afterward — no need to
                repeat this step per collection.
              </p>

              <StaggerContainer className="space-y-3">
                {roomConfig.map(({ key, label, icon, helper }) => (
                  <StaggerItem key={key}>
                  <div className="flex items-center gap-4 border border-charcoal/8 bg-[#ece9e2] p-5">
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

              {/* Custom rooms */}
              <div className="mt-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                  Custom-named rooms
                </p>
                <p className="mb-3 text-[11px] leading-[1.6] text-warm-gray">
                  For a bespoke project — name a specific room instead of using the categories above (e.g. &ldquo;Primary Ensuite&rdquo;, &ldquo;Kids&apos; Bathroom&rdquo;).
                </p>
                <div className="space-y-3">
                  {customRooms.map((room) => (
                    <div key={room.roomKey} className="flex items-center gap-3 border border-charcoal/8 bg-[#ece9e2] p-4">
                      <input
                        type="text"
                        value={room.label}
                        onChange={(e) => updateCustomRoomDraft(room.roomKey, { label: e.target.value })}
                        placeholder="Room name — e.g. Primary Ensuite"
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
                <div className="mt-6 flex items-center justify-between border border-charcoal/10 bg-charcoal/[0.02] px-5 py-3">
                  <span className="text-[13px] text-charcoal">
                    <strong>{totalRooms}</strong> {totalRooms === 1 ? "room" : "rooms"} configured
                  </span>
                </div>
              )}

              <div className="mt-8">
                <button
                  type="button"
                  onClick={goToChecklistStep}
                  disabled={totalRooms === 0}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
                >
                  Continue — what does each room need?
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Product-needs checklist */}
          {step === 2 && (
            <div>
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">What does each room need?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Confirm or adjust the checklist for each room type. This decides what a collection needs to
                cover — not which collection. You&apos;ll pick collections next, in the project board.
              </p>

              <StaggerContainer className="space-y-6">
                {activeRooms.map((room) => {
                  const kind = (roomConfig.some((entry) => entry.key === room.roomKey) ? room.roomKey : "master") as RoomKey;
                  const candidateTypes = allRequirementTypesFor(kind);
                  const needs = productNeedsByRoom[room.roomKey] ?? [];
                  return (
                    <StaggerItem key={room.roomKey}>
                    <div className="border border-charcoal/8 bg-[#ece9e2] p-5">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-heading text-[18px] leading-tight text-charcoal">{room.label}</p>
                          <p className="text-[11px] text-warm-gray">{room.count} {room.count === 1 ? "room" : "rooms"}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {levelOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => applyLevelToRoom(room.roomKey, kind, opt.id)}
                              className="border border-charcoal/15 bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-charcoal transition hover:border-charcoal"
                              title={opt.description}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {candidateTypes.map((type) => {
                          const existing = needs.find((n) => n.type === type);
                          const checked = Boolean(existing);
                          return (
                            <label
                              key={type}
                              className={`flex items-center gap-3 border p-3 transition ${
                                checked ? "border-charcoal bg-white" : "border-charcoal/10 bg-white/40"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => toggleNeed(room.roomKey, type, e.target.checked)}
                                className="h-4 w-4 accent-charcoal"
                              />
                              <span className="flex-1 text-[13px] text-charcoal">{REQUIREMENT_TYPE_LABELS[type]}</span>
                              {checked && (
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={existing!.quantity}
                                  onChange={(e) => setNeedQuantity(room.roomKey, type, Number(e.target.value))}
                                  className="h-7 w-12 border border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
                                  onClick={(e) => e.preventDefault()}
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={saveComposition}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                >
                  {saved ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      Saved — open project board
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m-8-8h16" /></svg>
                      Save composition &amp; open project board
                    </>
                  )}
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
              className="flex h-[44px] items-center gap-2 bg-charcoal px-8 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black"
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

"use client";

import { useEffect, useState } from "react";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { clampCount, presets, roomConfig, roomPlanFromCounts, type RoomKey } from "@/lib/trade-schedule";

const STEPS = ["Property", "Rooms"] as const;
type Step = 0 | 1;

const emptyCounts: Record<RoomKey, number> = { master: 0, standard: 0, powder: 0, suite: 0 };

export default function SmartRoomCalculator() {
  const { project, setRoomPlan, setOpen } = useTradeProject();
  const [step, setStep] = useState<Step>(0);
  const [counts, setCounts] = useState<Record<RoomKey, number>>(emptyCounts);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Pre-fill from an existing room plan so "Edit property composition" doesn't reset to zero.
  useEffect(() => {
    const plan = project.roomPlan;
    if (!plan) return;
    setCounts(
      Object.fromEntries(plan.groups.map((group) => [group.roomKey, group.count])) as Record<RoomKey, number>
    );
    setActivePresetId(plan.presetId);
  }, [project.roomPlan]);

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0);

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

  function saveComposition() {
    setRoomPlan(roomPlanFromCounts(activePresetId, counts));
    setSaved(true);
    setOpen(true);
  }

  const canGoNext = (s: Step): boolean => {
    if (s === 0) return true;
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
            Tell us your property, once
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-warm-gray">
            Set your room composition — master, standard, powder, suite — and how many of each. You&apos;ll assign
            a collection to each room group next, in the project board.
          </p>
          <p className="mx-auto mt-3 max-w-lg border border-charcoal/10 bg-[#ece9e2] px-4 py-3 text-[11px] leading-[1.65] text-warm-gray">
            Each room group can use a different collection, or mix collections freely within the same group. Nothing
            here locks your product choices.
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
              <h3 className="mb-2 font-heading text-[22px] text-charcoal">What kind of project is this?</h3>
              <p className="mb-8 text-[13px] text-warm-gray">
                Pick a starting point — you can fine-tune every count on the next step.
              </p>

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
                  onClick={saveComposition}
                  disabled={totalRooms === 0}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
                >
                  {saved ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Saved — open project board
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 4v16m-8-8h16" />
                      </svg>
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

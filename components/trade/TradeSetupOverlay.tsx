"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
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

const STEP_KEYS = ["intro", "rooms", "needs"] as const;
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

export default function TradeSetupOverlay({ locale }: { locale: string }) {
  const t = useTranslations("tradeSetupOverlay");
  const isArabic = locale === "ar";
  const { project, setRoomPlan, setupOpen, setSetupOpen, setRoomProgressExpanded, setPersona, updateDetails, updateProductNeeds } = useTradeProject();
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

  const [prevSetupOpen, setPrevSetupOpen] = useState(setupOpen);
  const [prevRoomPlanForHydration, setPrevRoomPlanForHydration] = useState(project.roomPlan);
  if (setupOpen !== prevSetupOpen || project.roomPlan !== prevRoomPlanForHydration) {
    const justOpened = setupOpen !== prevSetupOpen && setupOpen;
    setPrevSetupOpen(setupOpen);
    setPrevRoomPlanForHydration(project.roomPlan);
    if (setupOpen && project.roomPlan) {
      const plan = project.roomPlan;
      const fixed = plan.groups.filter((group) => !group.isCustom);
      const custom = plan.groups.filter((group) => group.isCustom);
      setCounts(Object.fromEntries(fixed.map((group) => [group.roomKey, group.count])) as Record<RoomKey, number>);
      setCustomRooms(custom.map((group) => ({ roomKey: group.roomKey, label: group.roomLabel, count: group.count })));
      setActivePresetId(plan.presetId);
    }
    if (justOpened) setStep(0);
  }

  const totalRooms = Object.values(counts).reduce((sum, value) => sum + value, 0) + customRooms.reduce((sum, r) => sum + r.count, 0);

  const activeRooms = [
    ...roomConfig.filter((entry) => counts[entry.key] > 0).map((entry) => ({ roomKey: entry.key as string, label: entry.label, count: counts[entry.key] })),
    ...customRooms.filter((room) => room.count > 0).map((room) => ({ roomKey: room.roomKey, label: room.label || t("step1.fallbackLabel"), count: room.count })),
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

  function enterNeedsStep() {
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

  function handleClose() {
    setSetupOpen(false);
  }

  function finishSetup() {
    setSetupOpen(false);
    setRoomProgressExpanded(true);
  }

  return (
    <AnimatePresence>
      {setupOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.aside
            initial={{ x: isArabic ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isArabic ? "-100%" : "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 0.76, 0.2, 1] }}
            className={`fixed bottom-0 top-0 z-[80] flex w-full max-w-[100vw] sm:max-w-[560px] flex-col bg-white ${isArabic ? "left-0" : "right-0"}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <header className="shrink-0 border-b border-charcoal/8 px-7 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
                    {t("studioLabel")}
                  </p>
                  <h2 className="mt-1 font-heading text-[26px] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                    {t("headline")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-warm-gray transition hover:text-charcoal"
                  aria-label={t("close")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {STEP_KEYS.map((key, i) => (
                  <div key={key} className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium transition-colors ${
                        i === step ? "bg-charcoal text-white" : i < step ? "bg-charcoal text-white" : "border border-charcoal/15 text-warm-gray"
                      }`}
                    >
                      {i < step ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-[9px] font-medium uppercase tracking-[0.1em] ${i <= step ? "text-charcoal" : "text-warm-gray/50"}`}>
                      {t(`steps.${key}`)}
                    </span>
                    {i < STEP_KEYS.length - 1 && <div className="h-px flex-1 bg-charcoal/10" />}
                  </div>
                ))}
              </div>
            </header>

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
              {step === 0 && (
                <div>
                  <h3 className="mb-2 font-heading text-[18px] text-charcoal">{t("step0.headline")}</h3>
                  <p className="mb-5 text-[12px] text-warm-gray">
                    {t("step0.body")}
                  </p>
                  <div className="grid gap-2">
                    {TRADE_PERSONAS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPersona(id)}
                        className={`flex items-center gap-3 border p-4 text-left transition ${
                          persona === id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 bg-white hover:border-charcoal"
                        }`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${persona === id ? "bg-white/15" : "bg-charcoal/5"}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={persona === id ? "text-white" : "text-charcoal"}>
                            <path d={PERSONA_META[id].icon} />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[13px] font-medium">{TRADE_PERSONA_LABELS[id]}</span>
                          <span className={`mt-0.5 block text-[11px] leading-[1.4] ${persona === id ? "text-white/60" : "text-warm-gray"}`}>
                            {PERSONA_META[id].description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {persona && (
                    <div className="mt-6 border-t border-charcoal/8 pt-6">
                      <p className="mb-3 text-[12px] font-medium text-charcoal">{t("step0.reachTitle")}</p>
                      <div className="grid gap-2.5">
                        <input
                          className="h-10 border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder={t("step0.fields.name")}
                          value={details.contactName}
                          onChange={(e) => updateDetails({ contactName: e.target.value })}
                        />
                        <input
                          className="h-10 border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder={t("step0.fields.email")}
                          type="email"
                          value={details.email}
                          onChange={(e) => updateDetails({ email: e.target.value })}
                        />
                        <input
                          className="h-10 border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder={t("step0.fields.projectName")}
                          value={details.projectName}
                          onChange={(e) => updateDetails({ projectName: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h3 className="mb-2 font-heading text-[18px] text-charcoal">{personaConfig?.roomsTitle ?? t("step1.defaultHeadline")}</h3>
                  <p className="mb-5 text-[12px] text-warm-gray">
                    {personaConfig?.roomsBody ?? t("step1.defaultBody")}
                  </p>

                  {!personaConfig?.skipFixedRooms && (
                    <>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.06em] transition ${
                              activePresetId === preset.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-warm-gray hover:border-charcoal hover:text-charcoal"
                            }`}
                          >
                            {t("step1.quickFill", { label: preset.label })}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2.5">
                        {roomConfig.map(({ key, label, helper }) => (
                          <div key={key} className="flex items-center gap-3 border border-charcoal/8 bg-[#ece9e2]/60 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-charcoal">{label}</p>
                              <p className="text-[10px] text-warm-gray">{helper}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustRoom(key, -1)}
                                disabled={counts[key] === 0}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal/12 text-[14px] text-charcoal transition hover:bg-charcoal hover:text-white disabled:opacity-20"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={500}
                                value={counts[key]}
                                onChange={(e) => updateRoom(key, Number(e.target.value))}
                                className="h-7 w-12 bg-transparent text-center font-heading text-[16px] outline-none"
                                aria-label={label}
                              />
                              <button
                                type="button"
                                onClick={() => adjustRoom(key, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-charcoal/12 text-[14px] text-charcoal transition hover:bg-charcoal hover:text-white"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className={personaConfig?.skipFixedRooms ? "" : "mt-6"}>
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                      {personaConfig?.skipFixedRooms ? t("step1.addEachSpace") : t("step1.customNamedRooms")}
                    </p>
                    <div className="space-y-2">
                      {customRooms.map((room) => (
                        <div key={room.roomKey} className="flex items-center gap-2 border border-charcoal/8 bg-[#ece9e2]/60 p-3">
                          <input
                            type="text"
                            value={room.label}
                            onChange={(e) => updateCustomRoomDraft(room.roomKey, { label: e.target.value })}
                            placeholder={personaConfig?.customRoomCopy ?? t("step1.defaultCustomPlaceholder")}
                            className="h-9 flex-1 border border-charcoal/12 bg-white px-3 text-[12px] outline-none"
                          />
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={room.count}
                            onChange={(e) => updateCustomRoomDraft(room.roomKey, { count: clampCount(Number(e.target.value)) })}
                            className="h-9 w-14 border border-charcoal/12 bg-white text-center text-[12px] outline-none"
                            aria-label={t("step1.count")}
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomRoomDraft(room.roomKey)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center text-warm-gray/50 transition hover:text-charcoal"
                            aria-label={t("step1.remove")}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addCustomRoomDraft}
                      className="mt-2 flex h-9 w-full items-center justify-center gap-2 border border-dashed border-charcoal/20 text-[11px] font-medium text-warm-gray transition hover:border-charcoal hover:text-charcoal"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m-8-8h16" /></svg>
                      {t("step1.addCustomRoom")}
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="mb-2 font-heading text-[18px] text-charcoal">{t("step2.headline")}</h3>
                  <p className="mb-5 text-[12px] text-warm-gray">
                    {t("step2.body")}
                  </p>

                  <div className="space-y-6">
                    {activeRooms.map((room) => {
                      const kind = (roomConfig.some((entry) => entry.key === room.roomKey) ? room.roomKey : "master") as RoomKey;
                      const candidateTypes = allRequirementTypesFor(kind);
                      const group = project.roomPlan?.groups.find((g) => g.roomKey === room.roomKey) ?? null;
                      const needs = group?.productNeeds ?? [];

                      return (
                        <div key={room.roomKey} className="border border-charcoal/8 bg-[#ece9e2]/60 p-4">
                          <p className="mb-3 font-heading text-[14px] text-charcoal">{room.label} <span className="text-[10px] font-sans text-warm-gray">{t("step2.roomCount", { count: room.count })}</span></p>
                          <div className="space-y-1.5">
                            {candidateTypes.map((type) => {
                              const existing = needs.find((n) => n.type === type);
                              const checked = Boolean(existing);
                              return (
                                <label
                                  key={type}
                                  className={`flex items-center gap-2.5 border p-2 transition ${checked ? "border-charcoal bg-white" : "border-charcoal/10 bg-white/50"}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => toggleNeed(room.roomKey, type, e.target.checked)}
                                    className="h-4 w-4 accent-charcoal"
                                  />
                                  <span className="flex-1 text-[12px] text-charcoal">{REQUIREMENT_TYPE_LABELS[type]}</span>
                                  {checked && (
                                    <input
                                      type="number"
                                      min={1}
                                      max={9999}
                                      value={existing!.quantity}
                                      onClick={(e) => e.preventDefault()}
                                      onChange={(e) => setNeedQuantity(room.roomKey, type, Number(e.target.value))}
                                      className="h-6 w-12 border border-charcoal/12 bg-transparent text-center text-[11px] outline-none"
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 border border-charcoal/10 bg-[#ece9e2]/60 p-4">
                    <p className="text-[12px] leading-[1.6] text-charcoal">
                      <span className="font-medium">{t("step2.doneLead")}</span>{" "}
                      {t.rich("step2.doneNote", {
                        shop: (chunks) => <span className="font-medium">{chunks}</span>,
                        project: details.projectName || t("step2.yourProject"),
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
              <div className="grid grid-cols-2 gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as Step)}
                    className="flex h-[48px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal transition hover:border-charcoal"
                  >
                    {t("back")}
                  </button>
                ) : (
                  <div />
                )}

                {step === 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={!canContinueFromIntro}
                    className="flex h-[48px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black disabled:opacity-30"
                  >
                    {t("continue")}
                  </button>
                )}
                {step === 1 && (
                  <button
                    type="button"
                    onClick={enterNeedsStep}
                    disabled={totalRooms === 0}
                    className="flex h-[48px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black disabled:opacity-30"
                  >
                    {t("continue")}
                  </button>
                )}
                {step === 2 && (
                  <button
                    type="button"
                    onClick={finishSetup}
                    className="flex h-[48px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black"
                  >
                    {t("done")}
                  </button>
                )}
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

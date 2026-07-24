"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import {
  isRequirementType,
  PERSONA_META,
  REQUIREMENT_TYPE_LABELS,
  TRADE_PERSONAS,
  TRADE_PERSONA_LABELS,
} from "@/lib/trade-project";
import {
  allRequirementTypesFor,
  buildRoomPlan,
  clampCount,
  presets,
  roomConfig,
  type RoomKey,
} from "@/lib/trade-schedule";
import { getVariantMosaicForType } from "@/lib/utils";
import ShopProductsStep from "@/components/trade/ShopProductsStep";
import { useRoomSetupState } from "@/components/trade/useRoomSetupState";

const STEP_KEYS = ["intro", "rooms", "needs", "shop"] as const;
type Step = 0 | 1 | 2 | 3;

export default function SmartRoomCalculator() {
  const t = useTranslations("smartRoomCalculator");
  const { project, setRoomPlan, setOpen, setPersona, updateDetails, updateProductNeeds } = useTradeProject();
  const [step, setStep] = useState<Step>(0);

  const persona = project.persona;
  const personaConfig = persona ? PERSONA_META[persona] : null;
  const details = project.details;
  const canContinueFromIntro = Boolean(
    persona &&
    details.contactName.trim() &&
    /^\S+@\S+\.\S+$/.test(details.email) &&
    details.projectName.trim()
  );

  // Deep link from the floating room-progress widget: jump straight to the shop
  // step with the right room + product type focused, instead of step 0.
  const searchParams = useSearchParams();
  const focusScopeId = searchParams.get("focusScope");
  const rawFocusType = searchParams.get("focusType");
  const focusType = isRequirementType(rawFocusType) ? rawFocusType : null;
  const focusKey = focusScopeId && focusType ? `${focusScopeId}:${focusType}` : null;
  const [prevFocusKey, setPrevFocusKey] = useState<string | null>(null);
  if (focusKey && focusKey !== prevFocusKey) {
    setPrevFocusKey(focusKey);
    setStep(3);
  }

  // Pre-fill from an existing room plan so "Edit property composition" doesn't reset to zero.
  const {
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
  } = useRoomSetupState(
    project.roomPlan,
    project.roomPlan,
    t("step1.fallbackLabel"),
    updateProductNeeds,
    () => setStep(1)
  );

  function enterAssignmentStep() {
    const plan = buildRoomPlan(project.roomPlan, activePresetId, counts, {}, customRooms.filter((r) => r.count > 0));
    setRoomPlan(plan);
    setStep(2);
  }

  return (
    <section id="smart-room-calculator" className="bg-[#ece9e2] py-16 sm:py-24">
      <div className="mx-auto max-w-[960px] px-5 sm:px-8">
        {/* Header */}
        <ScrollReveal className="mb-10 text-center">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
              {t("eyebrow")}
            </p>
            <h2
              className="mt-3 font-heading text-[clamp(1.8rem,4vw,3rem)] leading-[1] text-charcoal"
              style={{ fontStyle: "italic" }}
            >
              {t("headline")}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-[1.7] text-warm-gray">
              {t("body")}
            </p>
          </div>
        </ScrollReveal>

        {/* Progress stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEP_KEYS.map((key, i) => (
              <button
                key={key}
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
                  {i < STEP_KEYS.length - 1 && (
                    <div className={`h-[2px] flex-1 transition-colors duration-300 ${i < step ? "bg-charcoal" : "bg-charcoal/10"}`} />
                  )}
                </div>
                <span className={`text-[9px] font-medium uppercase tracking-[0.12em] transition-colors ${
                  i <= step ? "text-charcoal" : "text-warm-gray/50"
                } hidden sm:block`}>
                  {t(`steps.${key}`)}
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
              <div className="text-start">
                <h3 className="mb-2 font-heading text-[22px] text-charcoal">{t("step0.headline")}</h3>
                <p className="mb-8 text-[13px] text-warm-gray">
                  {t("step0.body")}
                </p>
              </div>

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
                      <div className="text-start">
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
                  <div className="text-start">
                    <p className="mb-1 font-heading text-[20px] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                      {t("step0.reachTitle")}
                    </p>
                    <p className="mb-5 text-[12px] leading-[1.6] text-warm-gray">
                      {t("step0.reachBody")}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.name")}
                      value={details.contactName}
                      onChange={(e) => updateDetails({ contactName: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.email")}
                      type="email"
                      value={details.email}
                      onChange={(e) => updateDetails({ email: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.company")}
                      value={details.company}
                      onChange={(e) => updateDetails({ company: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.phone")}
                      value={details.phone}
                      onChange={(e) => updateDetails({ phone: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40 sm:col-span-2"
                      placeholder={t("step0.fields.projectName")}
                      value={details.projectName}
                      onChange={(e) => updateDetails({ projectName: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.location")}
                      value={details.location}
                      onChange={(e) => updateDetails({ location: e.target.value })}
                    />
                    <input
                      className="h-11 border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                      placeholder={t("step0.fields.timeline")}
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
              <div className="text-start">
                <h3 className="mb-2 font-heading text-[22px] text-charcoal">{personaConfig?.roomsTitle ?? t("step1.defaultHeadline")}</h3>
                <p className="mb-8 text-[13px] text-warm-gray">
                  {personaConfig?.roomsBody ?? t("step1.defaultBody")}
                </p>
              </div>

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
                        {t("step1.quickFill", { label: preset.label })}
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
                            {key === "powder" ? t("step1.powderHelper") : helper}
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
                  {personaConfig?.skipFixedRooms ? t("step1.addEachSpace") : t("step1.customNamedRooms")}
                </p>
                {!personaConfig?.skipFixedRooms && (
                  <p className="mb-3 text-[11px] leading-[1.6] text-warm-gray">
                    {t("step1.customRoomsNote")}
                  </p>
                )}
                <div className="space-y-3">
                  {customRooms.map((room) => (
                    <div key={room.roomKey} className="flex items-center gap-3 border border-charcoal/8 bg-white p-4">
                      <input
                        type="text"
                        value={room.label}
                        onChange={(e) => updateCustomRoomDraft(room.roomKey, { label: e.target.value })}
                        placeholder={personaConfig?.customRoomCopy ?? t("step1.defaultCustomPlaceholder")}
                        className="h-10 flex-1 border border-charcoal/12 bg-white px-3 text-[13px] outline-none placeholder:text-warm-gray/50"
                      />
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={room.count}
                        onChange={(e) => updateCustomRoomDraft(room.roomKey, { count: clampCount(Number(e.target.value)) })}
                        className="h-10 w-16 border border-charcoal/12 bg-white text-center text-[13px] outline-none"
                        aria-label={t("step1.count")}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomRoomDraft(room.roomKey)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-warm-gray/50 transition hover:text-charcoal"
                        aria-label={t("step1.remove")}
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
                  {t("step1.addCustomRoom")}
                </button>
              </div>

              {totalRooms > 0 && (
                <div className="mt-6 flex items-center justify-between border border-charcoal/10 bg-white px-5 py-3">
                  <span className="text-[13px] text-charcoal">
                    <strong>{totalRooms}</strong> {t("step1.roomsConfigured", { count: totalRooms })}
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
                  {t("step1.continueAssign")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: What each room needs */}
          {step === 2 && (
            <div>
              <div className="text-start">
                <h3 className="mb-2 font-heading text-[22px] text-charcoal">{t("step2.headline")}</h3>
                <p className="mb-8 text-[13px] text-warm-gray">
                  {t("step2.body")}
                </p>
              </div>

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
                              {room.count} {t("step2.roomCount", { count: room.count })}
                            </p>
                            <h4 className="mt-2 font-heading text-[clamp(2rem,4vw,3rem)] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
                              {room.label}
                            </h4>
                          </div>

                          <StaggerContainer className="grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-3 lg:grid-cols-4">
                            {candidateTypes.map((type) => {
                              const existing = needs.find((n) => n.type === type);
                              const checked = Boolean(existing);
                              const mosaic = getVariantMosaicForType(type);
                              const mosaicCols = Math.min(mosaic.length, 2) || 1;
                              const mosaicRows = mosaic.length > 2 ? 2 : 1;
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
                                      <div
                                        className={`grid h-full w-full gap-px transition-opacity ${checked ? "opacity-100" : "opacity-60 group-hover:opacity-90"}`}
                                        style={{
                                          gridTemplateColumns: `repeat(${mosaicCols}, 1fr)`,
                                          gridTemplateRows: `repeat(${mosaicRows}, 1fr)`,
                                        }}
                                      >
                                        {mosaic.map(({ product, image }) => (
                                          <div key={product.slug} className="relative">
                                            <Image
                                              src={image}
                                              alt={REQUIREMENT_TYPE_LABELS[type]}
                                              fill
                                              sizes={mosaic.length > 1 ? "(max-width: 768px) 25vw, 12vw" : "(max-width: 768px) 50vw, 25vw"}
                                              className={mosaic.length > 1 ? "object-contain p-[10%]" : "object-contain p-[16%]"}
                                            />
                                          </div>
                                        ))}
                                      </div>
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
                  {t("step2.continueShop")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Shop real products, by type, across all collections */}
          {step === 3 && (
            <div>
              <div className="text-start">
                <h3 className="mb-2 font-heading text-[22px] text-charcoal">{t("step3.headline")}</h3>
                <p className="mb-8 text-[13px] text-warm-gray">
                  {t("step3.body")}
                </p>
              </div>

              <ShopProductsStep focusScopeId={focusScopeId} focusType={focusType} />

              <div className="mt-10">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="flex h-[52px] w-full items-center justify-center gap-3 bg-charcoal text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m-10 4a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z" /></svg>
                  {t("step3.continueBoard")}
                </button>
                <p className="mt-4 text-start text-[10px] leading-relaxed text-warm-gray/60">
                  {t("step3.disclaimer")}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t("back")}
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
              {t("continue")}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180">
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

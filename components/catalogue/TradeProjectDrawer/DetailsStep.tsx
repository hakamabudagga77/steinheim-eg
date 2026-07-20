"use client";

import type { Dispatch, SetStateAction } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { TradeProjectDetails, TradeProjectRoomPlan } from "@/lib/trade-project";
import type { DrawerStep, Row } from "./shared";

export default function DetailsStep({
  t,
  rows,
  totalItems,
  setStep,
  locale,
  setOpen,
  roomPlan,
  details,
  updateDetails,
  includePrices,
  setIncludePrices,
  includeSpecs,
  setIncludeSpecs,
  error,
}: {
  t: ReturnType<typeof useTranslations>;
  rows: Row[];
  totalItems: number;
  setStep: (step: DrawerStep) => void;
  locale: string;
  setOpen: (open: boolean) => void;
  roomPlan: TradeProjectRoomPlan | null;
  details: TradeProjectDetails;
  updateDetails: (details: Partial<TradeProjectDetails>) => void;
  includePrices: boolean;
  setIncludePrices: Dispatch<SetStateAction<boolean>>;
  includeSpecs: boolean;
  setIncludeSpecs: Dispatch<SetStateAction<boolean>>;
  error: string | null;
}) {
  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-5"
    >
      {/* Summary strip */}
      <div className="mb-6 border border-charcoal/8 bg-[#ece9e2] p-4">
        <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-warm-gray">
          {t("details.yourSelection")}
        </p>
        <p className="mt-1 text-[13px]">
          {t("details.productAndUnits", { products: rows.length, units: totalItems })}
        </p>
        <button
          type="button"
          onClick={() => setStep("board")}
          className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray underline underline-offset-2 transition hover:text-charcoal"
        >
          {t("details.editProducts")}
        </button>
        <a
          href={`/${locale}/trade#smart-room-calculator`}
          onClick={() => setOpen(false)}
          className="mt-3 inline-flex text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray underline underline-offset-2 transition hover:text-charcoal"
        >
          {roomPlan ? t("details.editPropertyBeforeSend") : t("details.setupPropertyBeforeSend")}
        </a>
      </div>

      {/* Contact form */}
      <div className="space-y-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal">
          {t("details.aboutYou")}
        </p>
        <input
          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.name")}
          value={details.contactName}
          onChange={(e) => updateDetails({ contactName: e.target.value })}
        />
        <input
          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.email")}
          type="email"
          value={details.email}
          onChange={(e) => updateDetails({ email: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
            placeholder={t("details.fields.company")}
            value={details.company}
            onChange={(e) => updateDetails({ company: e.target.value })}
          />
          <select
            className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
            value={details.role}
            onChange={(e) => updateDetails({ role: e.target.value })}
          >
            <option value="">{t("details.fields.role")}</option>
            <option>{t("details.roles.interiorDesigner")}</option>
            <option>{t("details.roles.architect")}</option>
            <option>{t("details.roles.developer")}</option>
            <option>{t("details.roles.projectManager")}</option>
            <option>{t("details.roles.procurement")}</option>
            <option>{t("details.roles.contractor")}</option>
            <option>{t("details.roles.homeowner")}</option>
          </select>
        </div>
        <input
          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.phone")}
          value={details.phone}
          onChange={(e) => updateDetails({ phone: e.target.value })}
        />

        <div className="mt-2 border-t border-charcoal/8 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal">
            {t("details.aboutProject")}
          </p>
        </div>
        <input
          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.projectName")}
          value={details.projectName}
          onChange={(e) => updateDetails({ projectName: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
            value={details.projectType}
            onChange={(e) => updateDetails({ projectType: e.target.value })}
          >
            <option value="">{t("details.fields.projectType")}</option>
            <option>{t("details.projectTypes.hospitality")}</option>
            <option>{t("details.projectTypes.residential")}</option>
            <option>{t("details.projectTypes.villa")}</option>
            <option>{t("details.projectTypes.commercial")}</option>
            <option>{t("details.projectTypes.other")}</option>
          </select>
          <input
            className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
            placeholder={t("details.fields.location")}
            value={details.location}
            onChange={(e) => updateDetails({ location: e.target.value })}
          />
        </div>
        <input
          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.timeline")}
          value={details.timeline}
          onChange={(e) => updateDetails({ timeline: e.target.value })}
        />
        <textarea
          className="min-h-[80px] w-full border border-charcoal/12 bg-white p-4 text-[13px] outline-none transition focus:border-charcoal/40"
          placeholder={t("details.fields.notes")}
          value={details.notes}
          onChange={(e) => updateDetails({ notes: e.target.value })}
        />

        <div className="border-t border-charcoal/8 pt-4">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal">
            {t("details.pdfSpecSheet")}
          </p>
          <label className="flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={includePrices}
              onChange={(e) => setIncludePrices(e.target.checked)}
              className="h-4 w-4 accent-charcoal"
            />
            <span className="text-[12px] text-charcoal">{t("details.includePrices")}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={includeSpecs}
              onChange={(e) => setIncludeSpecs(e.target.checked)}
              className="h-4 w-4 accent-charcoal"
            />
            <span className="text-[12px] text-charcoal">{t("details.includeSpecs")}</span>
          </label>
        </div>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-800">
          {error}
        </p>
      )}
    </motion.div>
  );
}

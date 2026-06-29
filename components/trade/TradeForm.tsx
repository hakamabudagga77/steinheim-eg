"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function TradeForm() {
  const t = useTranslations("trade");
  const [submitted, setSubmitted] = useState(false);
  const inputClass = "w-full border-0 border-b border-border-dark bg-transparent px-0 py-4 text-sm text-charcoal outline-none transition placeholder:text-warm-gray/55 focus:border-charcoal";
  const labelClass = "block text-[9px] font-medium uppercase tracking-[0.16em] text-warm-gray";

  return (
    <ScrollReveal>
      {submitted ? (
        <div className="border border-charcoal bg-white p-8 sm:p-12">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">Demo enquiry saved</p>
          <h3 className="mt-4 font-heading text-4xl text-charcoal">Your brief is ready.</h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-warm-gray">
            This prototype does not email Kareem or any Steinheim team member. Use the proposal workspace to add exact products and generate a review-ready PDF.
          </p>
          <button type="button" onClick={() => setSubmitted(false)} className="mt-8 border-b border-charcoal pb-1 text-[10px] font-medium uppercase tracking-[0.14em]">Edit details</button>
        </div>
      ) : (
        <form className="space-y-10" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <div className="grid gap-8 md:grid-cols-2">
            <label><span className={labelClass}>{t("companyName")}</span><input name="company" type="text" className={inputClass} required /></label>
            <label><span className={labelClass}>{t("yourRole")}</span><select name="role" className={inputClass} required defaultValue=""><option value="">Select role</option><option value="architect">{t("roles.architect")}</option><option value="interiorDesigner">{t("roles.interiorDesigner")}</option><option value="developer">{t("roles.developer")}</option><option value="contractor">{t("roles.contractor")}</option><option value="other">{t("roles.other")}</option></select></label>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <label><span className={labelClass}>{t("projectName")}</span><input name="project" type="text" className={inputClass} /></label>
            <label><span className={labelClass}>{t("projectLocation")}</span><input name="location" type="text" className={inputClass} /></label>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <label><span className={labelClass}>{t("estimatedUnits")}</span><input name="units" type="number" min="1" className={inputClass} /></label>
            <label><span className={labelClass}>{t("timeline")}</span><input name="timeline" type="text" className={inputClass} placeholder="e.g. Q2 2027" /></label>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <label><span className={labelClass}>{t("email")}</span><input name="email" type="email" className={inputClass} required /></label>
            <label><span className={labelClass}>{t("phone")}</span><input name="phone" type="tel" className={inputClass} /></label>
          </div>
          <label className="block"><span className={labelClass}>{t("message")}</span><textarea name="message" rows={4} className={`${inputClass} resize-none`} placeholder="Room mix, preferred finishes, installation stage, or operator requirements" /></label>
          <div className="flex flex-col gap-4 border-t border-border-light pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-[10px] leading-5 text-warm-gray">Prototype mode: submitting here does not send an email or contact Kareem.</p>
            <button type="submit" className="h-13 bg-charcoal px-9 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black">{t("submit")}</button>
          </div>
        </form>
      )}
    </ScrollReveal>
  );
}

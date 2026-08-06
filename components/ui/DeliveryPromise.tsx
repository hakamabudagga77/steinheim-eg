"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getDeliveryWindow, GOVERNORATES } from "@/lib/delivery";

// "Delivery Promise": pick a governorate and get an honest delivery window in
// business days. Shown on the product page and, compactly, in the cart footer.
export default function DeliveryPromise({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("deliveryPromise");
  const [governorate, setGovernorate] = useState("");
  const window = getDeliveryWindow(governorate || null);

  return (
    <div
      className={
        compact
          ? "rounded-[4px] border border-charcoal/10 bg-[#faf8f4] p-3"
          : "mt-5 rounded-[4px] border border-black/12 p-4"
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/60">{t("title")}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={governorate}
          onChange={(event) => setGovernorate(event.target.value)}
          aria-label={t("label")}
          className="h-10 min-w-[180px] flex-1 rounded-[4px] border border-black/15 bg-white px-3 text-[13px] text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black"
        >
          <option value="">{t("placeholder")}</option>
          {GOVERNORATES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nameEn} · {g.nameAr}
            </option>
          ))}
        </select>

        {governorate && (
          <p className="text-[12px] leading-relaxed text-black/70" aria-live="polite">
            {t("estimate", { min: window.minDays, max: window.maxDays })}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";

export default function TradeSetupOpenButton({
  variant = "primary",
  label,
}: {
  variant?: "primary" | "outline" | "outline-light" | "white";
  label?: string;
}) {
  const t = useTranslations("tradeOpenButton");
  const { setSetupOpen } = useTradeProject();

  const base =
    "inline-flex h-[50px] items-center gap-3 px-9 text-[10px] font-medium uppercase tracking-[0.15em] transition cursor-pointer";

  const styles = {
    primary: "bg-charcoal text-white hover:bg-black",
    outline: "border border-charcoal text-charcoal hover:bg-charcoal hover:text-white",
    "outline-light": "border border-white/40 text-white hover:bg-white hover:text-black",
    white: "bg-white text-charcoal hover:bg-white/90",
  };

  return (
    <button type="button" onClick={() => setSetupOpen(true)} className={`${base} ${styles[variant]}`}>
      {label ?? t("setupProject")}
    </button>
  );
}

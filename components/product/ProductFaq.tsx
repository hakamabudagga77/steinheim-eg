"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/utils";

const SHOWER_TYPES = ["concealed-shower", "shower-column"];
const ACCESSORY_TYPES = ["accessories", "bidet-spray", "click-clack", "angle-valve"];

function installationCategory(type: string): "shower" | "accessory" | "mixer" {
  if (SHOWER_TYPES.includes(type)) return "shower";
  if (ACCESSORY_TYPES.includes(type)) return "accessory";
  return "mixer";
}

export default function ProductFaq({ product }: { product: Product }) {
  const t = useTranslations("productFaq");
  const [openKey, setOpenKey] = useState<string | null>("installation");

  const category = installationCategory(product.type);

  const entries = [
    {
      key: "installation",
      question: t("installation.question"),
      answer: t(`installation.${category}`, {
        connectionSize: product.connectionSize || t("installation.unspecified"),
        mountingAperture: product.mountingAperture || t("installation.unspecified"),
      }),
    },
    {
      key: "care",
      question: t("care.question"),
      answer: t("care.answer"),
    },
    {
      key: "warranty",
      question: t("warranty.question"),
      answer: t("warranty.answer"),
    },
    {
      key: "shipping",
      question: t("shipping.question"),
      answer: t("shipping.answer"),
    },
  ];

  return (
    <div className="border-t border-black/8 pt-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">{t("title")}</p>
      <div className="mt-4 divide-y divide-black/6 border-y border-black/8">
        {entries.map((entry) => {
          const open = openKey === entry.key;
          return (
            <div key={entry.key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : entry.key)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 py-4 text-start"
              >
                <span className="text-[14px] font-medium text-black/85">{entry.question}</span>
                <span className={`shrink-0 text-black/35 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
                  ⌄
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 text-[13px] leading-[1.7] text-black/60">{entry.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-black/40">
        {t("moreQuestions")}{" "}
        <Link href="/contact" className="underline decoration-black/25 hover:text-black">
          {t("contactUs")}
        </Link>
      </p>
    </div>
  );
}

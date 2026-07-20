"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LeadOverview } from "./shared";

export default function DocumentsStep({
  t,
  leadOverview,
}: {
  t: ReturnType<typeof useTranslations>;
  leadOverview: LeadOverview | null;
}) {
  return (
    <motion.div
      key="documents"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="px-7 py-5"
    >
      {leadOverview && leadOverview.documents.length > 0 ? (
        <div className="space-y-2">
          {leadOverview.documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 border border-charcoal/10 bg-white p-4 transition hover:border-charcoal"
            >
              <p className="min-w-0 truncate text-[13px] text-charcoal">{doc.label}</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-warm-gray">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </a>
          ))}
        </div>
      ) : !leadOverview?.warrantyReference && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
            {t("documents.emptyTitle")}
          </p>
          <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-warm-gray">
            {t("documents.emptyBody")}
          </p>
        </div>
      )}

      {leadOverview?.warrantyReference && (
        <div className={leadOverview.documents.length > 0 ? "mt-5 border border-charcoal/10 bg-white p-4" : "border border-charcoal/10 bg-white p-4"}>
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
            {t("documents.warrantyReference")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[13px] text-charcoal">{leadOverview.warrantyReference}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-warm-gray">
            {t("documents.warrantyNote")}
          </p>
        </div>
      )}
    </motion.div>
  );
}

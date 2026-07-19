"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  sanitizeTradeProject,
  sanitizeTradeWorkspace,
  TRADE_WORKSPACE_STORAGE_KEY,
} from "@/lib/trade-project";

type State = "loading" | "success" | "error";

export default function TradeRestoreClient({ id, locale }: { id: string; locale: string }) {
  const t = useTranslations("tradeRestore");
  const [state, setState] = useState<State>("loading");
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trade/leads/${id}`, { cache: "no-store" });
        if (!res.ok) {
          setState("error");
          return;
        }
        const data = await res.json();
        const project = sanitizeTradeProject(data.project);
        if (!project) {
          setState("error");
          return;
        }

        const stored = window.localStorage.getItem(TRADE_WORKSPACE_STORAGE_KEY);
        const existing = stored ? sanitizeTradeWorkspace(JSON.parse(stored)) : null;
        const others = (existing?.projects ?? []).filter((entry) => entry.id !== project.id);
        const workspace = { activeProjectId: project.id, projects: [project, ...others].slice(0, 25) };
        window.localStorage.setItem(TRADE_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));

        setProjectName(project.details.projectName || t("yourProject"));
        setState("success");
        window.setTimeout(() => {
          window.location.href = `/${locale}/trade`;
        }, 1800);
      } catch {
        setState("error");
      }
    })();
  }, [id, locale]);

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center bg-[#ece9e2] px-5 pt-24 text-center">
      {state === "loading" && (
        <>
          <svg className="h-8 w-8 animate-spin text-charcoal/40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="mt-5 text-[13px] text-warm-gray">{t("restoring")}</p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-8 font-heading text-[28px] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
            {t("welcomeBack")}
          </h1>
          <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-warm-gray">
            {t("restoredBody", { name: projectName })}
          </p>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="font-heading text-[26px] leading-tight text-charcoal" style={{ fontStyle: "italic" }}>
            {t("notFoundTitle")}
          </h1>
          <p className="mt-3 max-w-[320px] text-[14px] leading-relaxed text-warm-gray">
            {t("notFoundBody")}
          </p>
          <Link
            href="/trade"
            className="mt-8 flex h-[46px] items-center justify-center bg-charcoal px-8 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
          >
            {t("goToTradeStudio")}
          </Link>
        </>
      )}
    </div>
  );
}

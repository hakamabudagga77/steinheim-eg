"use client";

import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import type { TradeProject } from "@/lib/trade-project";
import type { DrawerStep } from "./shared";

export default function DrawerHeader({
  t,
  step,
  setStep,
  setError,
  showProjectsMenu,
  setShowProjectsMenu,
  projects,
  project,
  switchProject,
  duplicateProject,
  deleteProject,
  newProject,
  hasRows,
  onClose,
}: {
  t: ReturnType<typeof useTranslations>;
  step: DrawerStep;
  setStep: (step: DrawerStep) => void;
  setError: (error: string | null) => void;
  showProjectsMenu: boolean;
  setShowProjectsMenu: Dispatch<SetStateAction<boolean>>;
  projects: TradeProject[];
  project: TradeProject;
  switchProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  newProject: () => void;
  hasRows: boolean;
  onClose: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-charcoal/8 px-7 py-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => setShowProjectsMenu((v) => !v)}
            className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray transition hover:text-charcoal"
          >
            {t("brand")}
            {projects.length > 1 && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            )}
          </button>
          <h2 className="mt-1 font-heading text-[28px] leading-tight">
            {step === "board"
              ? t("titles.board")
              : step === "details"
                ? t("titles.details")
                : step === "messages"
                  ? t("titles.messages")
                  : step === "status"
                    ? t("titles.status")
                    : step === "quote"
                      ? t("titles.quote")
                      : step === "samples"
                        ? t("titles.samples")
                        : step === "documents"
                          ? t("titles.documents")
                          : t("titles.sent")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
          aria-label={t("close")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {showProjectsMenu && (
        <div className="mt-4 border border-charcoal/10 bg-[#ece9e2]">
          {projects.map((entry) => (
            <div key={entry.id} className={`flex items-center justify-between gap-2 border-b border-charcoal/8 p-3 last:border-b-0 ${entry.id === project.id ? "bg-white" : ""}`}>
              <button
                type="button"
                onClick={() => { switchProject(entry.id); setShowProjectsMenu(false); }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-[12px] font-medium text-charcoal">{entry.details.projectName || t("projectsMenu.untitled")}</p>
                <p className="text-[10px] text-warm-gray">{t("projectsMenu.productCount", { count: entry.items.length })}</p>
              </button>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => duplicateProject(entry.id)} className="rounded-full border border-charcoal/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-charcoal transition hover:border-charcoal">
                  {t("projectsMenu.duplicate")}
                </button>
                {projects.length > 1 && (
                  <button type="button" onClick={() => deleteProject(entry.id)} className="rounded-full border border-charcoal/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-charcoal transition hover:border-charcoal">
                    {t("projectsMenu.delete")}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => { newProject(); setShowProjectsMenu(false); }}
            className="flex w-full items-center justify-center gap-2 p-3 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal transition hover:bg-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m-8-8h16" /></svg>
            {t("projectsMenu.newProject")}
          </button>
        </div>
      )}

      {step !== "sent" && (
        <div className="mt-5 flex gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setStep("board"); setError(null); }}
            className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
              step === "board"
                ? "border-charcoal text-charcoal"
                : "border-charcoal/15 text-warm-gray hover:text-charcoal"
            }`}
          >
            {project.status === "submitted" ? t("tabs.overview") : t("tabs.products")}
          </button>
          {project.status !== "submitted" && (
            <button
              type="button"
              onClick={() => { if (hasRows) setStep("details"); }}
              className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                step === "details"
                  ? "border-charcoal text-charcoal"
                  : hasRows
                    ? "border-charcoal/15 text-warm-gray hover:text-charcoal"
                    : "border-charcoal/8 text-warm-gray/40 cursor-default"
              }`}
            >
              {t("tabs.detailsAndSend")}
            </button>
          )}
          {project.status === "submitted" && project.submittedLeadId && (
            <>
              <button
                type="button"
                onClick={() => setStep("status")}
                className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  step === "status"
                    ? "border-charcoal text-charcoal"
                    : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {t("tabs.status")}
              </button>
              <button
                type="button"
                onClick={() => setStep("quote")}
                className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  step === "quote"
                    ? "border-charcoal text-charcoal"
                    : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {t("tabs.quote")}
              </button>
              <button
                type="button"
                onClick={() => setStep("documents")}
                className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  step === "documents"
                    ? "border-charcoal text-charcoal"
                    : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {t("tabs.documents")}
              </button>
              <button
                type="button"
                onClick={() => setStep("samples")}
                className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  step === "samples"
                    ? "border-charcoal text-charcoal"
                    : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {t("tabs.samples")}
              </button>
              <button
                type="button"
                onClick={() => setStep("messages")}
                className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                  step === "messages"
                    ? "border-charcoal text-charcoal"
                    : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                }`}
              >
                {t("tabs.messages")}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

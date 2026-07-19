"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ScaleIn, StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { formatPrice, getAllFinishes, getProductBySlug } from "@/lib/utils";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { RoomBasketCard, ProjectItemRow } from "@/components/trade/RoomBasketCard";
import TradeMessagesPanel from "@/components/trade/TradeMessagesPanel";
import TradeStageTimeline from "@/components/trade/TradeStageTimeline";
import ScheduleCallModal from "@/components/trade/ScheduleCallModal";
import { TRADE_LEAD_STATUS_LABELS, type TradeLeadDeliveryDetails, type TradeLeadDocument, type TradeLeadQuoteRevision, type TradeLeadSampleRequest, type TradeLeadScopeStatus, type TradeLeadStatus } from "@/lib/trade-leads";

interface RelatedProject {
  id: string;
  reference: string;
  projectName: string;
  status: TradeLeadStatus;
  submittedAt: string;
}

interface LeadOverview {
  status: TradeLeadStatus;
  quoteUrl?: string;
  quoteAmount?: string;
  quoteAcceptedAt?: string;
  quoteHistory: TradeLeadQuoteRevision[];
  sampleRequests: TradeLeadSampleRequest[];
  deliveryDetails?: TradeLeadDeliveryDetails;
  documents: TradeLeadDocument[];
  scopeStatuses: TradeLeadScopeStatus[];
  warrantyReference?: string;
  relatedProjects: RelatedProject[];
}

function formatSampleDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function TradeProjectDrawer({ locale }: { locale: string }) {
  const t = useTranslations("tradeProjectDrawer");
  const isArabic = locale === "ar";
  const {
    project,
    projects,
    open,
    setOpen,
    updateQuantity,
    removeItem,
    updateDetails,
    markSubmitted,
    clearProject,
    newProject,
    switchProject,
    deleteProject,
    duplicateProject,
  } = useTradeProject();
  const [step, setStep] = useState<"board" | "details" | "sent" | "messages" | "status" | "quote" | "samples" | "documents">("board");
  // Generated once per submit attempt and reused across retries (e.g. a
  // flaky network) so the server can dedupe if our fetch succeeded but the
  // response never reached us. Cleared once the lead is submitted so a
  // genuinely new project gets a fresh key.
  const submitIdempotencyKeyRef = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);
  const [includePrices, setIncludePrices] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [leadOverview, setLeadOverview] = useState<LeadOverview | null>(null);
  const [acceptStatus, setAcceptStatus] = useState<"idle" | "busy" | "error">("idle");
  const [sampleNote, setSampleNote] = useState("");
  const [sampleAddress, setSampleAddress] = useState("");
  const [sampleSending, setSampleSending] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [showroomOpen, setShowroomOpen] = useState(false);
  const [deliveryContactName, setDeliveryContactName] = useState("");
  const [deliveryContactPhone, setDeliveryContactPhone] = useState("");
  const [deliveryAccessNotes, setDeliveryAccessNotes] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryHydrated, setDeliveryHydrated] = useState(false);
  const [liveStock, setLiveStock] = useState<Record<string, boolean>>({});
  const finishes = useMemo(() => getAllFinishes(), []);

  const submittedLeadId = project.status === "submitted" ? project.submittedLeadId : undefined;

  useEffect(() => {
    if (!open) return;
    fetch("/api/shopify/prices")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, { variants: Array<{ finish: string; inStock: boolean }> }>) => {
        const map: Record<string, boolean> = {};
        for (const [slug, entry] of Object.entries(data)) {
          for (const v of entry.variants) map[`${slug}::${v.finish}`] = v.inStock;
        }
        setLiveStock(map);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !submittedLeadId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/trade/leads/${submittedLeadId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setLeadOverview({
          status: data.status,
          quoteUrl: data.quoteUrl,
          quoteAmount: data.quoteAmount,
          quoteAcceptedAt: data.quoteAcceptedAt,
          quoteHistory: Array.isArray(data.quoteHistory) ? data.quoteHistory : [],
          sampleRequests: Array.isArray(data.sampleRequests) ? data.sampleRequests : [],
          deliveryDetails: data.deliveryDetails,
          documents: Array.isArray(data.documents) ? data.documents : [],
          scopeStatuses: Array.isArray(data.scopeStatuses) ? data.scopeStatuses : [],
          warrantyReference: data.warrantyReference,
          relatedProjects: Array.isArray(data.relatedProjects) ? data.relatedProjects : [],
        });
        setDeliveryHydrated((hydrated) => {
          if (hydrated) return hydrated;
          if (data.deliveryDetails) {
            setDeliveryContactName(data.deliveryDetails.contactName);
            setDeliveryContactPhone(data.deliveryDetails.contactPhone);
            setDeliveryAccessNotes(data.deliveryDetails.accessNotes);
          }
          return true;
        });
      } catch {
        // Keep whatever we last had; the next poll will retry.
      }
    }
    void load();
    // Skip polling while the tab is hidden — the first visible poll catches up.
    const interval = window.setInterval(() => {
      if (!document.hidden) load();
    }, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [open, submittedLeadId]);

  async function handleAcceptQuote() {
    if (!submittedLeadId) return;
    setAcceptStatus("busy");
    try {
      const res = await fetch(`/api/trade/leads/${submittedLeadId}/accept-quote`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeadOverview((current) => current ? { ...current, quoteAcceptedAt: data.quoteAcceptedAt, status: data.status ?? current.status } : current);
      setAcceptStatus("idle");
    } catch {
      setAcceptStatus("error");
      setTimeout(() => setAcceptStatus("idle"), 2500);
    }
  }

  async function handleRequestSamples() {
    const note = sampleNote.trim();
    const address = sampleAddress.trim();
    if (!note || !address || !submittedLeadId || sampleSending) return;
    setSampleSending(true);
    setSampleError(null);
    try {
      const res = await fetch(`/api/trade/leads/${submittedLeadId}/sample-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, address }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeadOverview((current) => current ? { ...current, sampleRequests: [...current.sampleRequests, data.request] } : current);
      setSampleNote("");
      setSampleAddress("");
    } catch {
      setSampleError(t("samples.requestError"));
    } finally {
      setSampleSending(false);
    }
  }

  async function handleSaveDeliveryDetails() {
    const contactName = deliveryContactName.trim();
    const contactPhone = deliveryContactPhone.trim();
    if (!contactName || !contactPhone || !submittedLeadId || deliverySaving) return;
    setDeliverySaving(true);
    setDeliveryError(null);
    try {
      const res = await fetch(`/api/trade/leads/${submittedLeadId}/delivery-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName, contactPhone, accessNotes: deliveryAccessNotes.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLeadOverview((current) => current ? { ...current, deliveryDetails: data.deliveryDetails } : current);
    } catch {
      setDeliveryError(t("status.saveError"));
    } finally {
      setDeliverySaving(false);
    }
  }

  const rows = project.items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    return [{ item, product, variant, finish: finishes.find((f) => f.id === item.finish) }];
  });

  const totalItems = rows.reduce((sum, r) => sum + r.item.quantity, 0);
  const retailReferenceTotal = rows.reduce((sum, row) => sum + row.variant.price * row.item.quantity, 0);

  const roomPlan = project.roomPlan;
  const activeRoomGroups = (roomPlan?.groups ?? []).filter((group) => group.count > 0);
  const roomPlanScopeIds = new Set(activeRoomGroups.map((group) => group.scopeId));

  const scopeGroups = Array.from(
    rows.reduce((groups, row) => {
      const key = row.item.scopeId || "manual";
      const existing = groups.get(key) ?? {
        id: key,
        name: row.item.scopeName || t("board.manualScopeName"),
        summary: row.item.scopeSummary || t("board.manualScopeSummary"),
        rows: [] as typeof rows,
      };
      existing.rows.push(row);
      groups.set(key, existing);
      return groups;
    }, new Map<string, { id: string; name: string; summary: string; rows: typeof rows }>())
  ).map(([, group]) => ({
    ...group,
    totalUnits: group.rows.reduce((sum, row) => sum + row.item.quantity, 0),
    totalValue: group.rows.reduce((sum, row) => sum + row.variant.price * row.item.quantity, 0),
  }));
  // Each room group's own basket gets a dedicated card below — exclude it here so it isn't
  // rendered twice. Legacy counter-scoped items and true manual adds still render through
  // this generic list, unchanged.
  const otherScopeGroups = scopeGroups.filter((group) => !roomPlanScopeIds.has(group.id));

  const allScopeEntries = [
    ...activeRoomGroups.map((group) => ({ id: group.scopeId, name: group.roomLabel })),
    ...otherScopeGroups.map((group) => ({ id: group.id, name: group.name })),
  ];

  async function handleSubmit() {
    if (!project.items.length) {
      setError(t("errors.addProduct"));
      return;
    }
    if (!project.details.contactName.trim()) {
      setError(t("errors.addName"));
      return;
    }
    if (!project.details.email.trim() || !/^\S+@\S+\.\S+$/.test(project.details.email)) {
      setError(t("errors.addEmail"));
      return;
    }
    if (!project.details.projectName.trim()) {
      setError(t("errors.addProjectName"));
      return;
    }

    setError(null);
    setBusy(true);

    if (!submitIdempotencyKeyRef.current) {
      submitIdempotencyKeyRef.current = `${project.id}-${crypto.randomUUID()}`;
    }

    try {
      const res = await fetch("/api/trade/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, locale, source: "project-board", idempotencyKey: submitIdempotencyKeyRef.current }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || t("errors.submitFailed"));
      }

      const data = await res.json();
      submitIdempotencyKeyRef.current = null;
      markSubmitted(data.id);
      setSentRef(data.reference);
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadPdf() {
    setPdfDownloading(true);
    try {
      const res = await fetch("/api/trade/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, includePrices, includeSpecs }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = (project.details.projectName || "project")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      a.href = url;
      a.download = `steinheim-${safe}-spec.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(t("errors.pdfFailed"));
    } finally {
      setPdfDownloading(false);
    }
  }

  async function handleUpdateSteinheim() {
    if (!project.submittedLeadId) return;
    setUpdateStatus("busy");
    try {
      const res = await fetch(`/api/trade/leads/${project.submittedLeadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) throw new Error();
      setUpdateStatus("success");
      setTimeout(() => setUpdateStatus("idle"), 2500);
    } catch {
      setUpdateStatus("error");
      setTimeout(() => setUpdateStatus("idle"), 2500);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      if (step === "sent") {
        setStep("board");
        setSentRef(null);
      }
      setError(null);
    }, 300);
  }

  function handleNewProject() {
    clearProject();
    setStep("board");
    setSentRef(null);
    setError(null);
  }

  return (
    <AnimatePresence>
      {open && (
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
            className={`fixed bottom-0 top-0 z-[80] flex w-full max-w-[100vw] sm:max-w-[480px] flex-col bg-white ${isArabic ? "left-0" : "right-0"}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {/* Header */}
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
                  onClick={handleClose}
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
                      onClick={() => { if (rows.length) setStep("details"); }}
                      className={`shrink-0 whitespace-nowrap border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                        step === "details"
                          ? "border-charcoal text-charcoal"
                          : rows.length
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

            {/* Content */}
            <div data-lenis-prevent className="catalogue-paper min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "board" ? (
                  <motion.div
                    key="board"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {rows.length === 0 && activeRoomGroups.length === 0 ? (
                      <ScaleIn className="flex flex-col items-center justify-center px-7 py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-warm-gray">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M12 8v8M8 12h8" />
                          </svg>
                        </div>
                        <h3 className="mt-6 font-heading text-2xl" style={{ fontStyle: "italic" }}>
                          {t("board.startTitle")}
                        </h3>
                        <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-warm-gray">
                          {t("board.startBody")}
                        </p>
                        <a
                          href={`/${locale}/trade#smart-room-calculator`}
                          onClick={() => setOpen(false)}
                          className="mt-8 flex h-[46px] items-center justify-center bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                        >
                          {t("board.setupProperty")}
                        </a>
                      </ScaleIn>
                    ) : (
                      <div className="px-7 py-5">
                        <div className="flex items-center justify-between pb-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                            {t("board.productAndUnitCount", { products: rows.length, units: totalItems })}
                          </p>
                          {rows.length > 0 && (
                            <button
                              type="button"
                              onClick={clearProject}
                              className="text-[9px] uppercase tracking-[0.12em] text-warm-gray/60 transition hover:text-charcoal"
                            >
                              {t("board.clearAll")}
                            </button>
                          )}
                        </div>

                        <p className="mb-4 text-[11px] text-warm-gray">
                          {t("board.retailTotal")} <span className="text-charcoal">{formatPrice(retailReferenceTotal)}</span>
                        </p>

                        <div className="mb-5 grid grid-cols-2 gap-2">
                          <a
                            href={`/${locale}/trade#smart-room-calculator`}
                            onClick={() => setOpen(false)}
                            className="flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                          >
                            {roomPlan ? t("board.editProperty") : t("board.setupPropertyShort")}
                          </a>
                          <button
                            type="button"
                            disabled={pdfDownloading}
                            onClick={handleDownloadPdf}
                            className="flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal disabled:opacity-50"
                          >
                            {pdfDownloading ? t("board.generating") : t("board.downloadPdf")}
                          </button>

                          {project.status === "submitted" && project.submittedLeadId && (
                            <button
                              type="button"
                              disabled={updateStatus === "busy"}
                              onClick={handleUpdateSteinheim}
                              className="col-span-2 flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal disabled:opacity-50"
                            >
                              {updateStatus === "busy"
                                ? t("board.sendingUpdate")
                                : updateStatus === "success"
                                  ? t("board.sentNotified")
                                  : updateStatus === "error"
                                    ? t("board.sendError")
                                    : t("board.sendUpdate")}
                            </button>
                          )}

                          {project.status === "submitted" && (
                            <button
                              type="button"
                              onClick={() => duplicateProject(project.id)}
                              className="col-span-2 flex h-[42px] items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                            >
                              {t("board.reorder")}
                            </button>
                          )}
                        </div>

                        <StaggerContainer className="space-y-5">
                          {activeRoomGroups.map((group) => {
                            const basketRows = rows.filter((row) => row.item.scopeId === group.scopeId);
                            const neededTotal = group.productNeeds.reduce((sum, need) => sum + need.quantity, 0);
                            const selectedTotal = basketRows.reduce((sum, row) => sum + row.item.quantity, 0);
                            const stillNeeds = neededTotal > 0 && selectedTotal < neededTotal;

                            return (
                              <StaggerItem key={group.scopeId}>
                              <section className="border border-charcoal/10 bg-white">
                                <div className="border-b border-charcoal/8 bg-[#ece9e2] p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                                        {t("board.roomCount", { count: group.count })}
                                      </p>
                                      <h3 className="mt-1 font-heading text-[22px] leading-none text-charcoal">
                                        {group.roomLabel}
                                      </h3>
                                    </div>
                                    {stillNeeds && (
                                      <a
                                        href={`/${locale}/trade#smart-room-calculator`}
                                        onClick={() => setOpen(false)}
                                        className="shrink-0 rounded-full border border-charcoal bg-charcoal px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black"
                                      >
                                        {t("board.shopOnTradePage")}
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <div className="p-3">
                                  {basketRows.length > 0 ? (
                                    <RoomBasketCard
                                      title={group.roomLabel}
                                      itemRows={basketRows}
                                      liveStock={liveStock}
                                      onRemoveItem={(slug, finish) => removeItem(slug, finish, group.scopeId)}
                                      onQuantityChange={(slug, finish, quantity) => updateQuantity(slug, finish, quantity, group.scopeId)}
                                    />
                                  ) : (
                                    <p className="p-2 text-[11px] font-medium uppercase tracking-[0.08em] text-amber-700">{t("board.notYetAssigned")}</p>
                                  )}
                                </div>
                              </section>
                              </StaggerItem>
                            );
                          })}

                          {otherScopeGroups.map((group) => (
                            <StaggerItem key={group.id}>
                            <section className="border border-charcoal/10 bg-white">
                              <div className="border-b border-charcoal/8 bg-[#ece9e2] p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                                      {t("board.scope")}
                                    </p>
                                    <h3 className="mt-1 font-heading text-[22px] leading-none text-charcoal">
                                      {group.name}
                                    </h3>
                                    <p className="mt-2 text-[11px] leading-[1.6] text-warm-gray">
                                      {group.summary}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-[11px] font-medium text-charcoal">{t("board.unitsCount", { count: group.totalUnits })}</p>
                                    <p className="mt-1 text-[10px] text-warm-gray">{formatPrice(group.totalValue)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="divide-y divide-charcoal/8">
                                {group.rows.map(({ item, product, variant, finish }) => (
                                  <ProjectItemRow
                                    key={`${item.scopeId || "manual"}-${item.slug}-${item.finish}`}
                                    item={item}
                                    product={product}
                                    variant={variant}
                                    finish={finish}
                                    inStock={liveStock[`${item.slug}::${item.finish}`]}
                                    onRemove={() => removeItem(item.slug, item.finish, item.scopeId)}
                                    onQuantityChange={(quantity) => updateQuantity(item.slug, item.finish, quantity, item.scopeId)}
                                  />
                                ))}
                              </div>
                            </section>
                            </StaggerItem>
                          ))}
                        </StaggerContainer>

                        <p className="mt-4 text-[9px] leading-relaxed text-warm-gray/60">
                          {t("board.priceDisclaimer")}
                        </p>

                        {leadOverview && leadOverview.relatedProjects.length > 0 && (
                          <div className="mt-5 border border-charcoal/10 bg-white p-4">
                            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                              {t("board.otherProjects")}
                            </p>
                            <div className="mt-3 space-y-2">
                              {leadOverview.relatedProjects.map((rp) => (
                                <a
                                  key={rp.id}
                                  href={`/${locale}/trade/restore/${rp.id}`}
                                  className="flex items-center justify-between gap-3 border border-charcoal/8 bg-[#ece9e2] p-3 transition hover:border-charcoal"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-[12px] text-charcoal">{rp.projectName}</p>
                                    <p className="text-[10px] text-warm-gray">{rp.reference}</p>
                                  </div>
                                  <span className="shrink-0 border border-charcoal/15 bg-white px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-charcoal">
                                    {TRADE_LEAD_STATUS_LABELS[rp.status]}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : step === "details" ? (
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
                        value={project.details.contactName}
                        onChange={(e) => updateDetails({ contactName: e.target.value })}
                      />
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder={t("details.fields.email")}
                        type="email"
                        value={project.details.email}
                        onChange={(e) => updateDetails({ email: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder={t("details.fields.company")}
                          value={project.details.company}
                          onChange={(e) => updateDetails({ company: e.target.value })}
                        />
                        <select
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
                          value={project.details.role}
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
                        value={project.details.phone}
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
                        value={project.details.projectName}
                        onChange={(e) => updateDetails({ projectName: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
                          value={project.details.projectType}
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
                          value={project.details.location}
                          onChange={(e) => updateDetails({ location: e.target.value })}
                        />
                      </div>
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder={t("details.fields.timeline")}
                        value={project.details.timeline}
                        onChange={(e) => updateDetails({ timeline: e.target.value })}
                      />
                      <textarea
                        className="min-h-[80px] w-full border border-charcoal/12 bg-white p-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder={t("details.fields.notes")}
                        value={project.details.notes}
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
                ) : step === "status" && project.submittedLeadId ? (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="px-7 py-5"
                  >
                    {leadOverview ? (
                      <TradeStageTimeline status={leadOverview.status} />
                    ) : (
                      <p className="text-[12px] text-warm-gray">{t("status.loading")}</p>
                    )}

                    {leadOverview && allScopeEntries.length > 1 && (
                      <div className="mt-5 border border-charcoal/10 bg-white p-4">
                        <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {t("status.progressByRoom")}
                        </p>
                        <div className="space-y-2">
                          {allScopeEntries.map((entry) => {
                            const override = leadOverview.scopeStatuses.find((s) => s.scopeId === entry.id);
                            const roomStatus = override?.status ?? leadOverview.status;
                            return (
                              <div key={entry.id} className="flex items-center justify-between gap-3 border-b border-charcoal/8 pb-2 last:border-b-0 last:pb-0">
                                <p className="min-w-0 truncate text-[12px] text-charcoal">{entry.name}</p>
                                <span className="shrink-0 border border-charcoal/15 px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-charcoal">
                                  {TRADE_LEAD_STATUS_LABELS[roomStatus]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {leadOverview && (
                      <div className="mt-5 border border-charcoal/10 bg-white p-4">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {t("status.deliveryDetails")}
                        </p>
                        <p className="mt-2 text-[11px] leading-relaxed text-warm-gray">
                          {t("status.deliveryIntro")}
                        </p>
                        <input
                          value={deliveryContactName}
                          onChange={(e) => setDeliveryContactName(e.target.value)}
                          placeholder={t("status.contactName")}
                          className="mt-3 h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
                        />
                        <input
                          value={deliveryContactPhone}
                          onChange={(e) => setDeliveryContactPhone(e.target.value)}
                          placeholder={t("status.contactPhone")}
                          className="mt-2 h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] outline-none transition focus:border-charcoal/40"
                        />
                        <textarea
                          value={deliveryAccessNotes}
                          onChange={(e) => setDeliveryAccessNotes(e.target.value)}
                          placeholder={t("status.accessNotes")}
                          rows={2}
                          className="mt-2 min-h-[54px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
                        />
                        {deliveryError && <p className="mt-2 text-[11px] text-red-700">{deliveryError}</p>}
                        <button
                          type="button"
                          disabled={!deliveryContactName.trim() || !deliveryContactPhone.trim() || deliverySaving}
                          onClick={handleSaveDeliveryDetails}
                          className="mt-3 flex h-[42px] w-full items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-40"
                        >
                          {deliverySaving ? t("status.saving") : t("status.save")}
                        </button>
                        {leadOverview.deliveryDetails && (
                          <p className="mt-2 text-[10px] text-warm-gray">
                            {t("status.lastSaved", { date: formatSampleDate(leadOverview.deliveryDetails.updatedAt) })}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : step === "quote" && project.submittedLeadId ? (
                  <motion.div
                    key="quote"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="px-7 py-5"
                  >
                    {leadOverview?.quoteUrl ? (
                      <div className="border border-charcoal/10 bg-white p-4">
                        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {t("quote.label")}
                        </p>
                        {leadOverview.quoteAmount && (
                          <p className="mt-2 font-heading text-[22px] text-charcoal">{leadOverview.quoteAmount}</p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <a
                            href={leadOverview.quoteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-[42px] flex-1 items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                          >
                            {t("quote.view")}
                          </a>
                          {leadOverview.quoteAcceptedAt ? (
                            <span className="flex h-[42px] flex-1 items-center justify-center bg-[#ece9e2] text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal">
                              {t("quote.accepted")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={acceptStatus === "busy"}
                              onClick={handleAcceptQuote}
                              className="flex h-[42px] flex-1 items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
                            >
                              {acceptStatus === "busy" ? t("quote.accepting") : acceptStatus === "error" ? t("quote.acceptError") : t("quote.accept")}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
                          {t("quote.pendingTitle")}
                        </p>
                        <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-warm-gray">
                          {t("quote.pendingBody")}
                        </p>
                      </div>
                    )}

                    {leadOverview && leadOverview.quoteHistory.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                          {t("quote.previousQuotes")}
                        </p>
                        <div className="space-y-2">
                          {leadOverview.quoteHistory.slice().reverse().map((revision, index) => (
                            <div key={index} className="border border-charcoal/8 bg-[#ece9e2] p-3">
                              <div className="flex items-center justify-between">
                                {revision.url ? (
                                  <a
                                    href={revision.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[12px] text-charcoal underline underline-offset-2"
                                  >
                                    {revision.amount || t("quote.view")}
                                  </a>
                                ) : (
                                  <p className="text-[12px] text-warm-gray">{t("quote.noQuoteSet")}</p>
                                )}
                                <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">
                                  {formatSampleDate(revision.changedAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : step === "documents" && project.submittedLeadId ? (
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
                ) : step === "samples" && project.submittedLeadId ? (
                  <motion.div
                    key="samples"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="px-7 py-5"
                  >
                    <button
                      type="button"
                      onClick={() => setShowroomOpen(true)}
                      className="mb-5 flex h-[46px] w-full items-center justify-center border border-charcoal/15 bg-white text-[9px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                    >
                      {t("samples.bookShowroom")}
                    </button>

                    <div className="border border-charcoal/10 bg-white p-4">
                      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                        {t("samples.requestSamples")}
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-warm-gray">
                        {t("samples.intro")}
                      </p>
                      <textarea
                        value={sampleNote}
                        onChange={(e) => setSampleNote(e.target.value)}
                        placeholder={t("samples.notePlaceholder")}
                        rows={3}
                        className="mt-3 min-h-[70px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
                      />
                      <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                        {t("samples.deliveryAddress")}
                      </p>
                      <textarea
                        value={sampleAddress}
                        onChange={(e) => setSampleAddress(e.target.value)}
                        placeholder={t("samples.addressPlaceholder")}
                        rows={2}
                        className="mt-3 min-h-[54px] w-full resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
                      />
                      {sampleError && <p className="mt-2 text-[11px] text-red-700">{sampleError}</p>}
                      <button
                        type="button"
                        disabled={!sampleNote.trim() || !sampleAddress.trim() || sampleSending}
                        onClick={handleRequestSamples}
                        className="mt-3 flex h-[42px] w-full items-center justify-center bg-charcoal text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-40"
                      >
                        {sampleSending ? t("samples.sending") : t("samples.requestSamples")}
                      </button>
                    </div>

                    {leadOverview && leadOverview.sampleRequests.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                          {t("samples.yourRequests")}
                        </p>
                        {leadOverview.sampleRequests.slice().reverse().map((entry) => (
                          <div key={entry.id} className="border border-charcoal/8 bg-[#ece9e2] p-3">
                            <p className="whitespace-pre-wrap text-[12px] text-charcoal">{entry.note}</p>
                            <p className="mt-1 whitespace-pre-wrap text-[11px] text-warm-gray">{entry.address}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-[9px] uppercase tracking-[0.08em] text-warm-gray">
                                {formatSampleDate(entry.requestedAt)}
                              </p>
                              <span className={`px-2 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] ${
                                entry.fulfilledAt ? "bg-charcoal text-white" : "border border-charcoal/15 text-charcoal"
                              }`}>
                                {entry.fulfilledAt ? t("samples.fulfilled") : t("samples.requested")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <ScheduleCallModal
                      open={showroomOpen}
                      onClose={() => setShowroomOpen(false)}
                      onRequestByMessage={() => setStep("messages")}
                      title={t("samples.showroomTitle")}
                      fallbackCopy={t("samples.showroomFallback")}
                      ctaLabel={t("samples.showroomCta")}
                    />
                  </motion.div>
                ) : step === "messages" && project.submittedLeadId ? (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-full flex-col"
                  >
                    <TradeMessagesPanel leadId={project.submittedLeadId} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center px-7 py-16 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charcoal">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>

                    <h3 className="mt-8 font-heading text-[28px] leading-tight">
                      {t("sent.title")}
                    </h3>

                    {sentRef && (
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                        {t("sent.reference", { ref: sentRef })}
                      </p>
                    )}

                    <p className="mt-5 max-w-[300px] text-[14px] leading-relaxed text-stone">
                      {t("sent.body")}
                    </p>

                    <div className="mt-10 w-full max-w-[280px] space-y-3">
                      <button
                        type="button"
                        disabled={pdfDownloading}
                        onClick={handleDownloadPdf}
                        className="flex h-[46px] w-full items-center justify-center gap-2 border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.13em] text-charcoal transition hover:border-charcoal disabled:opacity-40"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        {pdfDownloading ? t("sent.generating") : t("sent.downloadSpec")}
                      </button>

                      {project.submittedLeadId && (
                        <button
                          type="button"
                          onClick={() => setStep("messages")}
                          className="flex h-[46px] w-full items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.13em] text-white transition hover:bg-black"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                          {t("sent.messageSteinheim")}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleNewProject}
                        className="flex h-[42px] w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray transition hover:text-charcoal"
                      >
                        {t("sent.newProject")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            {step === "board" && project.status !== "submitted" && (
              <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`/${locale}/trade#smart-room-calculator`}
                    onClick={() => setOpen(false)}
                    className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                  >
                    {roomPlan ? t("footer.editProperty") : t("footer.setupProperty")}
                  </a>
                  <button
                    type="button"
                    disabled={rows.length === 0}
                    onClick={() => setStep("details")}
                    className="flex h-[50px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
                  >
                    {t("footer.detailsCta")}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rtl:rotate-180">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </footer>
            )}

            {step === "details" && (
              <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSubmit}
                  className="flex h-[50px] w-full items-center justify-center gap-3 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {t("footer.sending")}
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      {t("footer.sendToSteinheim")}
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-[9px] text-warm-gray/50">
                  {t("footer.confirmationNote")}
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

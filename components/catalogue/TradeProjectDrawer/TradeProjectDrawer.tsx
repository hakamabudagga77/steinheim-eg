"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getAllFinishes, getProductBySlug } from "@/lib/utils";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import DrawerHeader from "./DrawerHeader";
import BoardStep from "./BoardStep";
import DetailsStep from "./DetailsStep";
import StatusStep from "./StatusStep";
import QuoteStep from "./QuoteStep";
import DocumentsStep from "./DocumentsStep";
import SamplesStep from "./SamplesStep";
import MessagesStep from "./MessagesStep";
import SentStep from "./SentStep";
import DrawerFooter from "./DrawerFooter";
import type { DrawerStep, LeadOverview } from "./shared";

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
  const [step, setStep] = useState<DrawerStep>("board");
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
  const [, setDeliveryHydrated] = useState(false);
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
            <DrawerHeader
              t={t}
              step={step}
              setStep={setStep}
              setError={setError}
              showProjectsMenu={showProjectsMenu}
              setShowProjectsMenu={setShowProjectsMenu}
              projects={projects}
              project={project}
              switchProject={switchProject}
              duplicateProject={duplicateProject}
              deleteProject={deleteProject}
              newProject={newProject}
              hasRows={rows.length > 0}
              onClose={handleClose}
            />

            {/* Content */}
            <div data-lenis-prevent className="catalogue-paper min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "board" ? (
                  <BoardStep
                    key="board"
                    t={t}
                    locale={locale}
                    setOpen={setOpen}
                    rows={rows}
                    activeRoomGroups={activeRoomGroups}
                    totalItems={totalItems}
                    clearProject={clearProject}
                    retailReferenceTotal={retailReferenceTotal}
                    roomPlan={roomPlan}
                    pdfDownloading={pdfDownloading}
                    onDownloadPdf={handleDownloadPdf}
                    project={project}
                    updateStatus={updateStatus}
                    onUpdateSteinheim={handleUpdateSteinheim}
                    duplicateProject={duplicateProject}
                    otherScopeGroups={otherScopeGroups}
                    liveStock={liveStock}
                    removeItem={removeItem}
                    updateQuantity={updateQuantity}
                    leadOverview={leadOverview}
                  />
                ) : step === "details" ? (
                  <DetailsStep
                    key="details"
                    t={t}
                    rows={rows}
                    totalItems={totalItems}
                    setStep={setStep}
                    locale={locale}
                    setOpen={setOpen}
                    roomPlan={roomPlan}
                    details={project.details}
                    updateDetails={updateDetails}
                    includePrices={includePrices}
                    setIncludePrices={setIncludePrices}
                    includeSpecs={includeSpecs}
                    setIncludeSpecs={setIncludeSpecs}
                    error={error}
                  />
                ) : step === "status" && project.submittedLeadId ? (
                  <StatusStep
                    key="status"
                    t={t}
                    leadOverview={leadOverview}
                    allScopeEntries={allScopeEntries}
                    deliveryContactName={deliveryContactName}
                    setDeliveryContactName={setDeliveryContactName}
                    deliveryContactPhone={deliveryContactPhone}
                    setDeliveryContactPhone={setDeliveryContactPhone}
                    deliveryAccessNotes={deliveryAccessNotes}
                    setDeliveryAccessNotes={setDeliveryAccessNotes}
                    deliveryError={deliveryError}
                    deliverySaving={deliverySaving}
                    onSaveDeliveryDetails={handleSaveDeliveryDetails}
                  />
                ) : step === "quote" && project.submittedLeadId ? (
                  <QuoteStep
                    key="quote"
                    t={t}
                    leadOverview={leadOverview}
                    acceptStatus={acceptStatus}
                    onAcceptQuote={handleAcceptQuote}
                  />
                ) : step === "documents" && project.submittedLeadId ? (
                  <DocumentsStep
                    key="documents"
                    t={t}
                    leadOverview={leadOverview}
                  />
                ) : step === "samples" && project.submittedLeadId ? (
                  <SamplesStep
                    key="samples"
                    t={t}
                    showroomOpen={showroomOpen}
                    setShowroomOpen={setShowroomOpen}
                    sampleNote={sampleNote}
                    setSampleNote={setSampleNote}
                    sampleAddress={sampleAddress}
                    setSampleAddress={setSampleAddress}
                    sampleError={sampleError}
                    sampleSending={sampleSending}
                    onRequestSamples={handleRequestSamples}
                    leadOverview={leadOverview}
                    setStep={setStep}
                  />
                ) : step === "messages" && project.submittedLeadId ? (
                  <MessagesStep key="messages" leadId={project.submittedLeadId} />
                ) : (
                  <SentStep
                    key="sent"
                    t={t}
                    sentRef={sentRef}
                    pdfDownloading={pdfDownloading}
                    onDownloadPdf={handleDownloadPdf}
                    submittedLeadId={project.submittedLeadId}
                    setStep={setStep}
                    onNewProject={handleNewProject}
                  />
                )}
              </AnimatePresence>
            </div>

            <DrawerFooter
              t={t}
              step={step}
              projectStatus={project.status}
              roomPlan={roomPlan}
              locale={locale}
              setOpen={setOpen}
              rowsLength={rows.length}
              onGoToDetails={() => setStep("details")}
              busy={busy}
              onSubmit={handleSubmit}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

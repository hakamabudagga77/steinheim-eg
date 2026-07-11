"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { formatPrice, getAllFinishes, getProductBySlug } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import TradeProjectReviewPanel from "@/components/catalogue/TradeProjectReviewPanel";

export default function TradeProjectDrawer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const {
    project,
    open,
    setOpen,
    addItem,
    updateQuantity,
    removeItem,
    updateDetails,
    markSubmitted,
    clearProject,
  } = useTradeProject();
  const [step, setStep] = useState<"board" | "details" | "sent">("board");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const finishes = useMemo(() => getAllFinishes(), []);

  const rows = project.items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    return [{ item, product, variant, finish: finishes.find((f) => f.id === item.finish) }];
  });

  const totalItems = rows.reduce((sum, r) => sum + r.item.quantity, 0);
  const selectedSeries = Array.from(new Set(rows.map((row) => row.product.series)));
  const selectedFinishes = Array.from(new Set(rows.map((row) => row.finish?.name ?? row.item.finish)));
  const retailReferenceTotal = rows.reduce((sum, row) => sum + row.variant.price * row.item.quantity, 0);
  const scopeGroups = Array.from(
    rows.reduce((groups, row) => {
      const key = row.item.scopeId || "manual";
      const existing = groups.get(key) ?? {
        id: key,
        name: row.item.scopeName || "Manually added products",
        summary: row.item.scopeSummary || "Products added directly from collection and product pages.",
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

  async function handleSubmit() {
    if (!project.items.length) {
      setError("Add at least one product.");
      return;
    }
    if (!project.details.contactName.trim()) {
      setError("Add your name.");
      return;
    }
    if (!project.details.email.trim() || !/^\S+@\S+\.\S+$/.test(project.details.email)) {
      setError("Add a valid email.");
      return;
    }
    if (!project.details.projectName.trim()) {
      setError("Add the project name.");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/trade/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, locale, source: "project-board" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not submit. Please try again.");
      }

      const data = await res.json();
      markSubmitted(data.id);
      setSentRef(data.reference);
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
        body: JSON.stringify(project),
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
      setError("Could not generate the PDF. Try again.");
    } finally {
      setPdfDownloading(false);
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
                  <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
                    Steinheim
                  </p>
                  <h2 className="mt-1 font-heading text-[28px] leading-tight">
                    {step === "board" ? "Project board" : step === "details" ? "Your details" : "Sent"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-1 flex h-8 w-8 items-center justify-center text-warm-gray transition hover:text-charcoal"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {step !== "sent" && (
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep("board"); setError(null); }}
                    className={`flex-1 border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                      step === "board"
                        ? "border-charcoal text-charcoal"
                        : "border-charcoal/15 text-warm-gray hover:text-charcoal"
                    }`}
                  >
                    1 — Products
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (rows.length) setStep("details"); }}
                    className={`flex-1 border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                      step === "details"
                        ? "border-charcoal text-charcoal"
                        : rows.length
                          ? "border-charcoal/15 text-warm-gray hover:text-charcoal"
                          : "border-charcoal/8 text-warm-gray/40 cursor-default"
                    }`}
                  >
                    2 — Details & send
                  </button>
                </div>
              )}
            </header>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "board" ? (
                  <motion.div
                    key="board"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {rows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-7 py-20 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-charcoal/10">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-warm-gray">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M12 8v8M8 12h8" />
                          </svg>
                        </div>
                        <h3 className="mt-6 font-heading text-2xl">
                          Start your project
                        </h3>
                        <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-warm-gray">
                          Start with a scope from the trade page, or browse products and tap &ldquo;Add to project&rdquo; to build a mixed specification list.
                        </p>
                        <a
                          href={`/${locale}/trade#smart-room-calculator`}
                          onClick={() => setOpen(false)}
                          className="mt-8 flex h-[46px] items-center justify-center bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black"
                        >
                          Start first scope
                        </a>
                      </div>
                    ) : (
                      <div className="px-7 py-5">
                        <div className="flex items-center justify-between pb-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                            {rows.length} {rows.length === 1 ? "product" : "products"} · {totalItems} {totalItems === 1 ? "unit" : "units"}
                          </p>
                          {rows.length > 0 && (
                            <button
                              type="button"
                              onClick={clearProject}
                              className="text-[9px] uppercase tracking-[0.12em] text-warm-gray/60 transition hover:text-charcoal"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        <div className="mb-5 border border-charcoal/10 bg-charcoal p-4 text-white">
                          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/45">
                            Board overview
                          </p>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {[
                              [String(selectedSeries.length), selectedSeries.length === 1 ? "Collection" : "Collections"],
                              [String(selectedFinishes.length), selectedFinishes.length === 1 ? "Finish" : "Finishes"],
                              [String(totalItems), totalItems === 1 ? "Unit" : "Units"],
                            ].map(([value, label]) => (
                              <div key={label} className="border border-white/10 bg-white/[0.04] p-3">
                                <p className="font-heading text-[24px] leading-none">{value}</p>
                                <p className="mt-2 text-[8px] uppercase tracking-[0.14em] text-white/45">{label}</p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-4 text-[11px] leading-[1.7] text-white/55">
                            This board can combine multiple scopes: standard rooms, suites, public washrooms, and custom product lines.
                          </p>
                          <p className="mt-2 text-[10px] text-white/35">
                            Retail reference total: {formatPrice(retailReferenceTotal)}
                          </p>
                          <a
                            href={`/${locale}/trade#smart-room-calculator`}
                            onClick={() => setOpen(false)}
                            className="mt-4 flex h-[42px] items-center justify-center border border-white/20 bg-white/5 text-[9px] font-medium uppercase tracking-[0.15em] text-white transition hover:border-white hover:bg-white/10"
                          >
                            Add another scope
                          </a>
                        </div>

                        <TradeProjectReviewPanel
                          project={project}
                          rows={rows}
                          totalItems={totalItems}
                          onAddItem={addItem}
                          onGoDetails={() => setStep("details")}
                          onDownloadPdf={handleDownloadPdf}
                          pdfDownloading={pdfDownloading}
                        />

                        <div className="space-y-5">
                          {scopeGroups.map((group) => (
                            <section key={group.id} className="border border-charcoal/10 bg-white">
                              <div className="border-b border-charcoal/8 bg-[#ece9e2] p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                                      Scope
                                    </p>
                                    <h3 className="mt-1 font-heading text-[22px] leading-none text-charcoal">
                                      {group.name}
                                    </h3>
                                    <p className="mt-2 text-[11px] leading-[1.6] text-warm-gray">
                                      {group.summary}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-[11px] font-medium text-charcoal">{group.totalUnits} units</p>
                                    <p className="mt-1 text-[10px] text-warm-gray">{formatPrice(group.totalValue)}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="divide-y divide-charcoal/8">
                                {group.rows.map(({ item, product, variant, finish }) => {
                                  const img = getProductImage(product.slug, variant.finish);
                                  return (
                                    <motion.div
                                      key={`${item.scopeId || "manual"}-${item.slug}-${item.finish}`}
                                      layout
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="group bg-white"
                                    >
                                      <div className="flex gap-4 p-4">
                                        <div className="relative h-[72px] w-[72px] shrink-0 bg-[#ece9e2]">
                                          {img && (
                                            <Image
                                              src={img}
                                              alt={product.name}
                                              fill
                                              sizes="72px"
                                              className="object-contain p-1"
                                            />
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <p className="font-heading text-[17px] leading-tight">
                                                {product.name}
                                              </p>
                                              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-warm-gray">
                                                {product.series[0].toUpperCase() + product.series.slice(1)} · {finish?.name ?? item.finish}
                                              </p>
                                              <p className="mt-0.5 text-[9px] text-warm-gray/60">
                                                {variant.model}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => removeItem(item.slug, item.finish, item.scopeId)}
                                              className="mt-0.5 text-warm-gray/40 transition hover:text-charcoal"
                                              aria-label="Remove"
                                            >
                                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>

                                          <div className="mt-3 flex items-center gap-3">
                                            <div className="flex items-center border border-charcoal/12">
                                              <button
                                                type="button"
                                                onClick={() => updateQuantity(item.slug, item.finish, item.quantity - 1, item.scopeId)}
                                                className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
                                              >
                                                −
                                              </button>
                                              <input
                                                type="number"
                                                min="1"
                                                max="10000"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                  updateQuantity(item.slug, item.finish, Number(e.target.value), item.scopeId)
                                                }
                                                className="h-7 w-12 border-x border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => updateQuantity(item.slug, item.finish, item.quantity + 1, item.scopeId)}
                                                className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal"
                                              >
                                                +
                                              </button>
                                            </div>
                                            <p className="text-[12px] font-medium text-charcoal">
                                              {formatPrice(variant.price * item.quantity)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </section>
                          ))}
                        </div>

                        <p className="mt-4 text-[9px] leading-relaxed text-warm-gray/60">
                          Prices shown are retail references. Trade pricing confirmed after submission.
                        </p>
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
                        Your selection
                      </p>
                      <p className="mt-1 text-[13px]">
                        {rows.length} {rows.length === 1 ? "product" : "products"} · {totalItems} units
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep("board")}
                        className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray underline underline-offset-2 transition hover:text-charcoal"
                      >
                        Edit products
                      </button>
                      <a
                        href={`/${locale}/trade#smart-room-calculator`}
                        onClick={() => setOpen(false)}
                        className="mt-3 inline-flex text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray underline underline-offset-2 transition hover:text-charcoal"
                      >
                        Add another scope before sending
                      </a>
                    </div>

                    {/* Contact form */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal">
                        About you
                      </p>
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Your name *"
                        value={project.details.contactName}
                        onChange={(e) => updateDetails({ contactName: e.target.value })}
                      />
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Email *"
                        type="email"
                        value={project.details.email}
                        onChange={(e) => updateDetails({ email: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder="Company"
                          value={project.details.company}
                          onChange={(e) => updateDetails({ company: e.target.value })}
                        />
                        <select
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
                          value={project.details.role}
                          onChange={(e) => updateDetails({ role: e.target.value })}
                        >
                          <option value="">Your role</option>
                          <option>Interior Designer</option>
                          <option>Architect</option>
                          <option>Developer</option>
                          <option>Project Manager</option>
                          <option>Procurement</option>
                          <option>Contractor</option>
                          <option>Homeowner</option>
                        </select>
                      </div>
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Phone"
                        value={project.details.phone}
                        onChange={(e) => updateDetails({ phone: e.target.value })}
                      />

                      <div className="mt-2 border-t border-charcoal/8 pt-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal">
                          About the project
                        </p>
                      </div>
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Project name *"
                        value={project.details.projectName}
                        onChange={(e) => updateDetails({ projectName: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] text-charcoal outline-none transition focus:border-charcoal/40"
                          value={project.details.projectType}
                          onChange={(e) => updateDetails({ projectType: e.target.value })}
                        >
                          <option value="">Project type</option>
                          <option>Hotel / Hospitality</option>
                          <option>Residential Development</option>
                          <option>Villa / Private</option>
                          <option>Commercial / Retail</option>
                          <option>Other</option>
                        </select>
                        <input
                          className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                          placeholder="Location"
                          value={project.details.location}
                          onChange={(e) => updateDetails({ location: e.target.value })}
                        />
                      </div>
                      <input
                        className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Timeline (e.g. Q2 2027)"
                        value={project.details.timeline}
                        onChange={(e) => updateDetails({ timeline: e.target.value })}
                      />
                      <textarea
                        className="min-h-[80px] w-full border border-charcoal/12 bg-white p-4 text-[13px] outline-none transition focus:border-charcoal/40"
                        placeholder="Notes — room mix, finishes, quantities per room type, anything helpful"
                        value={project.details.notes}
                        onChange={(e) => updateDetails({ notes: e.target.value })}
                      />
                    </div>

                    {error && (
                      <p className="mt-4 border border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-800">
                        {error}
                      </p>
                    )}
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
                      Sent to Steinheim
                    </h3>

                    {sentRef && (
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-warm-gray">
                        Reference: {sentRef}
                      </p>
                    )}

                    <p className="mt-5 max-w-[300px] text-[14px] leading-relaxed text-stone">
                      The team will review your project and respond with trade pricing within 24 hours.
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
                        {pdfDownloading ? "Generating…" : "Download your spec sheet"}
                      </button>

                      <button
                        type="button"
                        onClick={handleNewProject}
                        className="flex h-[42px] w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.12em] text-warm-gray transition hover:text-charcoal"
                      >
                        Start a new project
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            {step === "board" && (
              <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`/${locale}/trade#smart-room-calculator`}
                    onClick={() => setOpen(false)}
                    className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                  >
                    Add another scope
                  </a>
                  <button
                    type="button"
                    disabled={rows.length === 0}
                    onClick={() => setStep("details")}
                    className="flex h-[50px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
                  >
                    Details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                      Sending…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      Send to Steinheim
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-[9px] text-warm-gray/50">
                  You&apos;ll receive a confirmation with your spec sheet
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

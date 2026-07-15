"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  formatPrice,
  getAllFinishes,
  getAllProducts,
  getAllSeries,
  getProductBySlug,
  getProductsBySeries,
  type Series,
} from "@/lib/utils";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { buildSchedule, collectionIntelligence, levelOptions } from "@/lib/trade-schedule";
import type { LevelKey, RoomGroup } from "@/lib/trade-project";

interface CustomLine {
  slug: string;
  finish: string;
  quantity: number;
}

type Mode = "tier" | "custom";

function fullCounts(roomGroup: RoomGroup) {
  return { master: 0, standard: 0, powder: 0, suite: 0, [roomGroup.roomKey]: roomGroup.count } as Record<
    "master" | "standard" | "powder" | "suite",
    number
  >;
}

export default function RoomAssignmentEditor({
  roomGroup,
  existingItems,
  onClose,
}: {
  roomGroup: RoomGroup;
  existingItems: CustomLine[];
  onClose: () => void;
}) {
  const { assignRoomGroup, clearRoomGroupAssignment } = useTradeProject();
  const series = useAllSeries();
  const allFinishes = useMemo(() => getAllFinishes(), []);
  const allProducts = useMemo(() => getAllProducts(), []);

  const existingAssignment = roomGroup.assignment;
  const [mode, setMode] = useState<Mode>(existingAssignment?.mode ?? "tier");

  // Tier mode state
  const [seriesId, setSeriesId] = useState(existingAssignment?.seriesId ?? series[1]?.id ?? series[0]?.id ?? "joy");
  const selectedSeries = series.find((entry) => entry.id === seriesId) ?? series[0];
  const [finish, setFinish] = useState(existingAssignment?.finish ?? selectedSeries.finishes[0]);
  const [level, setLevel] = useState<LevelKey>(existingAssignment?.level ?? "premium");

  // Custom mode state
  const [customLines, setCustomLines] = useState<CustomLine[]>(
    existingAssignment?.mode === "custom" ? existingItems : []
  );
  const [pickerSeriesId, setPickerSeriesId] = useState(series[0]?.id ?? "joy");
  const pickerProducts = getProductsBySeries(pickerSeriesId);
  const [pickerSlug, setPickerSlug] = useState(pickerProducts[0]?.slug ?? "");
  const pickerProduct = pickerProducts.find((p) => p.slug === pickerSlug) ?? pickerProducts[0];
  const pickerFinishes = pickerProduct?.variants.map((v) => v.finish) ?? [];
  const [pickerFinish, setPickerFinish] = useState(pickerFinishes[0] ?? "");
  const [pickerQuantity, setPickerQuantity] = useState(roomGroup.count || 1);

  const activeFinish = selectedSeries.finishes.includes(finish) ? finish : selectedSeries.finishes[0];
  const activeFinishName = allFinishes.find((entry) => entry.id === activeFinish)?.name ?? activeFinish;
  const intelligence = collectionIntelligence[selectedSeries.id] ?? collectionIntelligence.joy;
  const schedule = buildSchedule(selectedSeries, activeFinish, level, fullCounts(roomGroup));
  const tierTotalUnits = schedule.rows.reduce((sum, row) => sum + row.quantity, 0);
  const tierTotalPrice = schedule.rows.reduce((sum, row) => sum + row.lineTotal, 0);

  const customRows = customLines.flatMap((line) => {
    const product = getProductBySlug(line.slug);
    const variant = product?.variants.find((v) => v.finish === line.finish);
    if (!product || !variant) return [];
    return [{ line, product, variant }];
  });
  const customTotalUnits = customRows.reduce((sum, r) => sum + r.line.quantity, 0);
  const customTotalPrice = customRows.reduce((sum, r) => sum + r.variant.price * r.line.quantity, 0);
  const customCollections = Array.from(
    new Set(customRows.map((r) => series.find((s) => s.id === r.product.series)?.name ?? r.product.series))
  );

  function addCustomLine() {
    if (!pickerProduct || !pickerFinish || pickerQuantity < 1) return;
    setCustomLines((current) => {
      const existing = current.find((l) => l.slug === pickerProduct.slug && l.finish === pickerFinish);
      if (existing) {
        return current.map((l) =>
          l === existing ? { ...l, quantity: Math.min(10_000, l.quantity + pickerQuantity) } : l
        );
      }
      return [...current, { slug: pickerProduct.slug, finish: pickerFinish, quantity: pickerQuantity }];
    });
  }

  function removeCustomLine(slug: string, lineFinish: string) {
    setCustomLines((current) => current.filter((l) => !(l.slug === slug && l.finish === lineFinish)));
  }

  function updateCustomQuantity(slug: string, lineFinish: string, quantity: number) {
    setCustomLines((current) =>
      current.map((l) =>
        l.slug === slug && l.finish === lineFinish
          ? { ...l, quantity: Math.max(1, Math.min(10_000, Math.round(quantity) || 1)) }
          : l
      )
    );
  }

  function saveTier() {
    if (!schedule.rows.length) return;
    assignRoomGroup(
      roomGroup.roomKey,
      { mode: "tier", seriesId: selectedSeries.id, finish: activeFinish, level },
      schedule.rows.map((row) => ({ slug: row.product.slug, finish: row.finish, quantity: row.quantity })),
      roomGroup.roomLabel,
      `${roomGroup.count} ${roomGroup.count === 1 ? "room" : "rooms"} · ${selectedSeries.name} · ${activeFinishName}`
    );
    onClose();
  }

  function saveCustom() {
    if (!customLines.length) return;
    const summary = customCollections.length > 1
      ? `${roomGroup.count} ${roomGroup.count === 1 ? "room" : "rooms"} · ${customRows.length} products across ${customCollections.join(", ")}`
      : `${roomGroup.count} ${roomGroup.count === 1 ? "room" : "rooms"} · ${customRows.length} products · ${customCollections[0] ?? ""}`;
    assignRoomGroup(roomGroup.roomKey, { mode: "custom" }, customLines, roomGroup.roomLabel, summary);
    onClose();
  }

  function handleClear() {
    clearRoomGroupAssignment(roomGroup.roomKey);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="room-assignment-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="room-assignment-panel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.3, ease: [0.22, 0.76, 0.2, 1] }}
        className="fixed inset-x-0 bottom-0 top-0 z-[96] mx-auto flex w-full max-w-[720px] flex-col bg-white sm:top-6 sm:bottom-6 sm:rounded-[4px] sm:shadow-2xl"
      >
        {/* Header */}
        <header className="shrink-0 border-b border-charcoal/8 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">
                Assign a room group
              </p>
              <h2 className="mt-1 font-heading text-[26px] leading-tight text-charcoal">
                {roomGroup.roomLabel}
              </h2>
              <p className="mt-1 text-[12px] text-warm-gray">
                {roomGroup.count} {roomGroup.count === 1 ? "room" : "rooms"} in this group
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-warm-gray transition hover:text-charcoal"
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode switch */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setMode("tier")}
              className={`flex-1 border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                mode === "tier" ? "border-charcoal text-charcoal" : "border-charcoal/15 text-warm-gray hover:text-charcoal"
              }`}
            >
              Quick — one collection
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 border-t-2 pt-2 text-left text-[9px] font-medium uppercase tracking-[0.15em] transition ${
                mode === "custom" ? "border-charcoal text-charcoal" : "border-charcoal/15 text-warm-gray hover:text-charcoal"
              }`}
            >
              Custom — mix collections
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {mode === "tier" ? (
            <div>
              <div className="mb-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Collection</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {series.map((s) => {
                    const intel = collectionIntelligence[s.id] ?? collectionIntelligence.joy;
                    const heroProduct = getProductsBySeries(s.id)[0];
                    const heroImg = heroProduct ? getProductImage(heroProduct.slug, s.finishes[0]) : null;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSeriesId(s.id);
                          if (!s.finishes.includes(finish)) setFinish(s.finishes[0]);
                        }}
                        className={`group flex gap-4 border p-4 text-left transition-all ${
                          seriesId === s.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 hover:border-charcoal"
                        }`}
                      >
                        <div className={`relative h-16 w-16 shrink-0 ${seriesId === s.id ? "bg-white/10" : "bg-[#ece9e2]"}`}>
                          {heroImg && <Image src={heroImg} alt={s.name} fill sizes="64px" className="object-contain p-1" />}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-heading text-[18px] leading-tight">{s.name}</span>
                          <span className={`mt-0.5 block text-[10px] uppercase tracking-[0.1em] ${seriesId === s.id ? "text-white/40" : "text-warm-gray"}`}>
                            {s.shape}
                          </span>
                          <span className={`mt-1 block text-[11px] leading-[1.5] ${seriesId === s.id ? "text-white/60" : "text-warm-gray"}`}>
                            {intel.bestUse}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Finish — {activeFinishName}</p>
                <div className="flex flex-wrap gap-2">
                  {allFinishes.filter((f) => selectedSeries.finishes.includes(f.id)).map((f) => {
                    const disc = getFinishDiscImage(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFinish(f.id)}
                        className={`flex items-center gap-2.5 border px-4 py-2.5 text-left transition-all ${
                          activeFinish === f.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 hover:border-charcoal"
                        }`}
                      >
                        {disc && (
                          <span className="relative h-5 w-5 overflow-hidden rounded-full border border-black/10">
                            <Image src={disc} alt="" fill sizes="20px" className="object-cover" />
                          </span>
                        )}
                        <span className="text-[12px] font-medium">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Product coverage</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLevel(opt.id)}
                      className={`border p-4 text-left transition-all ${
                        level === opt.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 hover:border-charcoal"
                      }`}
                    >
                      <span className={`text-[8px] font-medium uppercase tracking-[0.15em] ${level === opt.id ? "text-white/50" : "text-warm-gray"}`}>
                        {opt.tag}
                      </span>
                      <span className="mt-1 block text-[15px] font-medium">{opt.label}</span>
                      <span className={`mt-1 block text-[11px] leading-[1.5] ${level === opt.id ? "text-white/60" : "text-warm-gray"}`}>
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 border border-charcoal/8 bg-[#ece9e2] p-5">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">Selection summary</p>
                <p className="mt-2 font-heading text-[20px] leading-tight text-charcoal">{selectedSeries.name} · {activeFinishName}</p>
                <p className="mt-2 text-[12px] leading-[1.7] text-warm-gray">{intelligence.note}</p>
              </div>

              {/* Preview */}
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                Preview — {tierTotalUnits} units · {formatPrice(tierTotalPrice)}
              </p>
              {schedule.rows.length > 0 ? (
                <div className="divide-y divide-charcoal/8 border border-charcoal/8">
                  {schedule.rows.map((row) => {
                    const img = getProductImage(row.product.slug, row.finish);
                    return (
                      <div key={`${row.product.slug}-${row.finish}`} className="flex items-center gap-4 bg-white p-4">
                        <div className="relative h-14 w-14 shrink-0 bg-[#ece9e2]">
                          {img && <Image src={img} alt={row.product.name} fill sizes="56px" className="object-contain p-1.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-charcoal">{selectedSeries.name} {row.product.name}</p>
                          <p className="mt-0.5 text-[10px] text-warm-gray">{row.model}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-medium text-charcoal">{row.quantity} × {formatPrice(row.unitPrice)}</p>
                          <p className="mt-0.5 text-[11px] text-warm-gray">{formatPrice(row.lineTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="border border-dashed border-charcoal/15 p-6 text-center text-[13px] text-warm-gray">
                  No products matched this configuration.
                </p>
              )}
              {schedule.omitted.length > 0 && (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-900">Not available in this selection</p>
                  <ul className="mt-2 space-y-0.5 text-[11px] leading-relaxed text-amber-900/80">
                    {schedule.omitted.map((item) => <li key={item}>· {item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-6 text-[13px] leading-[1.7] text-warm-gray">
                Add exact products one at a time — mix any collection, product, and finish inside this room group.
              </p>

              {/* Product picker */}
              <div className="mb-6 border border-charcoal/10 bg-[#ece9e2] p-5">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">Add a product</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    className="h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] text-charcoal outline-none"
                    value={pickerSeriesId}
                    onChange={(e) => {
                      setPickerSeriesId(e.target.value);
                      const nextProducts = getProductsBySeries(e.target.value);
                      setPickerSlug(nextProducts[0]?.slug ?? "");
                      setPickerFinish(nextProducts[0]?.variants[0]?.finish ?? "");
                    }}
                  >
                    {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select
                    className="h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] text-charcoal outline-none"
                    value={pickerSlug}
                    onChange={(e) => {
                      setPickerSlug(e.target.value);
                      const product = pickerProducts.find((p) => p.slug === e.target.value);
                      setPickerFinish(product?.variants[0]?.finish ?? "");
                    }}
                  >
                    {pickerProducts.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                  </select>
                  <select
                    className="h-11 w-full border border-charcoal/12 bg-white px-3 text-[13px] text-charcoal outline-none"
                    value={pickerFinish}
                    onChange={(e) => setPickerFinish(e.target.value)}
                  >
                    {pickerFinishes.map((finishId) => {
                      const f = allFinishes.find((entry) => entry.id === finishId);
                      return <option key={finishId} value={finishId}>{f?.name ?? finishId}</option>;
                    })}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={pickerQuantity}
                      onChange={(e) => setPickerQuantity(Math.max(1, Math.round(Number(e.target.value)) || 1))}
                      className="h-11 w-24 border border-charcoal/12 bg-white px-3 text-center text-[13px] outline-none"
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      onClick={addCustomLine}
                      className="flex h-11 flex-1 items-center justify-center gap-2 bg-charcoal text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 4v16m-8-8h16" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines */}
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
                {customRows.length ? `${customRows.length} products · ${customTotalUnits} units · ${formatPrice(customTotalPrice)}` : "No products added yet"}
              </p>
              {customRows.length > 0 && (
                <div className="divide-y divide-charcoal/8 border border-charcoal/8">
                  {customRows.map(({ line, product, variant }) => {
                    const img = getProductImage(product.slug, variant.finish);
                    const finishMeta = allFinishes.find((entry) => entry.id === variant.finish);
                    const seriesName = series.find((s) => s.id === product.series)?.name ?? product.series;
                    return (
                      <div key={`${product.slug}-${variant.finish}`} className="flex items-center gap-4 bg-white p-4">
                        <div className="relative h-14 w-14 shrink-0 bg-[#ece9e2]">
                          {img && <Image src={img} alt={product.name} fill sizes="56px" className="object-contain p-1.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-charcoal">{seriesName} {product.name}</p>
                          <p className="mt-0.5 text-[10px] text-warm-gray">{finishMeta?.name ?? variant.finish} · {variant.model}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <div className="flex items-center border border-charcoal/12">
                            <button type="button" onClick={() => updateCustomQuantity(product.slug, variant.finish, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal">−</button>
                            <input
                              type="number"
                              min={1}
                              max={10000}
                              value={line.quantity}
                              onChange={(e) => updateCustomQuantity(product.slug, variant.finish, Number(e.target.value))}
                              className="h-7 w-12 border-x border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
                            />
                            <button type="button" onClick={() => updateCustomQuantity(product.slug, variant.finish, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal">+</button>
                          </div>
                          <button type="button" onClick={() => removeCustomLine(product.slug, variant.finish)} className="text-warm-gray/40 transition hover:text-charcoal" aria-label="Remove">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            {existingAssignment ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
              >
                Clear assignment
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              disabled={mode === "tier" ? schedule.rows.length === 0 : customLines.length === 0}
              onClick={mode === "tier" ? saveTier : saveCustom}
              className="flex h-[50px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
            >
              Save assignment
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

function useAllSeries(): Series[] {
  return useMemo(() => getAllSeries(), []);
}

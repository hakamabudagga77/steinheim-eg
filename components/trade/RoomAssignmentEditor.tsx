"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import {
  formatPrice,
  getAllFinishes,
  getProductBySlug,
  getProductsBySeries,
  getAllSeries,
} from "@/lib/utils";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { buildSchedule, collectionIntelligence } from "@/lib/trade-schedule";
import { REQUIREMENT_TYPE_LABELS, type RoomGroup, type RoomGroupAllocation } from "@/lib/trade-project";

interface EditorLine {
  slug: string;
  finish: string;
  quantity: number;
}

export default function RoomAssignmentEditor({
  roomGroup,
  allocation,
  capacityRoomCount,
  existingItems,
  onClose,
}: {
  roomGroup: RoomGroup;
  allocation: RoomGroupAllocation | null;
  capacityRoomCount: number;
  existingItems: EditorLine[];
  onClose: () => void;
}) {
  const { addAllocation, updateAllocation, removeAllocation, flyToProject } = useTradeProject();
  const pickerImageRef = useRef<HTMLDivElement>(null);
  const series = useMemo(() => getAllSeries(), []);
  const allFinishes = useMemo(() => getAllFinishes(), []);

  const maxRoomCount = Math.max(1, capacityRoomCount);
  const [roomCount, setRoomCount] = useState(() => Math.max(1, Math.min(maxRoomCount, allocation?.roomCount ?? maxRoomCount)));
  const [label, setLabel] = useState(allocation?.label ?? "");
  const [lines, setLines] = useState<EditorLine[]>(existingItems);
  const [customized, setCustomized] = useState(allocation?.assignment.mode === "custom");
  const [lastOmitted, setLastOmitted] = useState<string[]>([]);

  const [fillSeriesId, setFillSeriesId] = useState(allocation?.assignment.seriesId ?? series[1]?.id ?? series[0]?.id ?? "joy");
  const selectedFillSeries = series.find((s) => s.id === fillSeriesId) ?? series[0];
  const [fillFinish, setFillFinish] = useState(allocation?.assignment.finish ?? selectedFillSeries.finishes[0]);
  const activeFillFinish = selectedFillSeries.finishes.includes(fillFinish) ? fillFinish : selectedFillSeries.finishes[0];
  const activeFillFinishName = allFinishes.find((f) => f.id === activeFillFinish)?.name ?? activeFillFinish;
  const intelligence = collectionIntelligence[selectedFillSeries.id] ?? collectionIntelligence.joy;

  const [pickerSeriesId, setPickerSeriesId] = useState(series[0]?.id ?? "joy");
  const pickerProducts = getProductsBySeries(pickerSeriesId);
  const [pickerSlug, setPickerSlug] = useState(pickerProducts[0]?.slug ?? "");
  const pickerProduct = pickerProducts.find((p) => p.slug === pickerSlug) ?? pickerProducts[0];
  const pickerFinishes = pickerProduct?.variants.map((v) => v.finish) ?? [];
  const [pickerFinish, setPickerFinish] = useState(pickerFinishes[0] ?? "");
  const [pickerQuantity, setPickerQuantity] = useState(1);
  const pickerImage = pickerProduct ? getProductImage(pickerProduct.slug, pickerFinish) : null;

  const rows = lines.flatMap((line) => {
    const product = getProductBySlug(line.slug);
    const variant = product?.variants.find((v) => v.finish === line.finish);
    if (!product || !variant) return [];
    return [{ line, product, variant }];
  });
  const totalUnits = rows.reduce((sum, r) => sum + r.line.quantity, 0);
  const totalPrice = rows.reduce((sum, r) => sum + r.variant.price * r.line.quantity, 0);
  const usedCollections = Array.from(
    new Set(rows.map((r) => series.find((s) => s.id === r.product.series)?.name ?? r.product.series))
  );

  function handleFill() {
    const schedule = buildSchedule(selectedFillSeries, activeFillFinish, roomGroup.productNeeds, roomCount);
    setLines(schedule.rows.map((row) => ({ slug: row.product.slug, finish: row.finish, quantity: row.quantity })));
    setLastOmitted(schedule.omitted);
    setCustomized(false);
  }

  function addPickerLine() {
    if (!pickerProduct || !pickerFinish || pickerQuantity < 1) return;
    const pickerImage = getProductImage(pickerProduct.slug, pickerFinish);
    if (pickerImage) flyToProject(pickerImageRef.current, pickerImage);
    setLines((current) => {
      const existing = current.find((l) => l.slug === pickerProduct.slug && l.finish === pickerFinish);
      if (existing) {
        return current.map((l) => (l === existing ? { ...l, quantity: Math.min(10_000, l.quantity + pickerQuantity) } : l));
      }
      return [...current, { slug: pickerProduct.slug, finish: pickerFinish, quantity: pickerQuantity }];
    });
    setCustomized(true);
  }

  function removeLine(slug: string, finish: string) {
    setLines((current) => current.filter((l) => !(l.slug === slug && l.finish === finish)));
    setCustomized(true);
  }

  function updateLineQuantity(slug: string, finish: string, quantity: number) {
    setLines((current) =>
      current.map((l) =>
        l.slug === slug && l.finish === finish
          ? { ...l, quantity: Math.max(1, Math.min(10_000, Math.round(quantity) || 1)) }
          : l
      )
    );
    setCustomized(true);
  }

  function handleSave() {
    if (!lines.length) return;
    const roomWord = roomCount === 1 ? "room" : "rooms";
    const assignment = !customized
      ? { mode: "tier" as const, seriesId: selectedFillSeries.id, finish: activeFillFinish }
      : { mode: "custom" as const };
    const scopeName = label.trim() ? `${roomGroup.roomLabel} — ${label.trim()}` : roomGroup.roomLabel;
    const scopeSummary = !customized
      ? `${roomCount} ${roomWord} · ${selectedFillSeries.name} · ${activeFillFinishName}`
      : usedCollections.length > 1
        ? `${roomCount} ${roomWord} · ${rows.length} products across ${usedCollections.join(", ")}`
        : `${roomCount} ${roomWord} · ${rows.length} products · ${usedCollections[0] ?? ""}`;

    if (allocation) {
      updateAllocation(roomGroup.roomKey, allocation.id, roomCount, assignment, lines, scopeName, scopeSummary, label);
    } else {
      addAllocation(roomGroup.roomKey, roomCount, assignment, lines, scopeName, scopeSummary, label);
    }
    onClose();
  }

  function handleRemoveAllocation() {
    if (allocation) removeAllocation(roomGroup.roomKey, allocation.id);
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
                {allocation ? "Edit allocation" : "New allocation"}
              </p>
              <h2 className="mt-1 font-heading text-[26px] leading-tight text-charcoal">
                {roomGroup.roomLabel}
              </h2>
              <p className="mt-1 text-[12px] text-warm-gray">
                Up to {capacityRoomCount} {capacityRoomCount === 1 ? "room" : "rooms"} available to this allocation
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
        </header>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {/* Room count + label */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Rooms covered</p>
              <input
                type="number"
                min={1}
                max={maxRoomCount}
                value={roomCount}
                onChange={(e) => setRoomCount(Math.max(1, Math.min(maxRoomCount, Math.round(Number(e.target.value)) || 1)))}
                className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[14px] outline-none"
              />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">Label (optional)</p>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. West wing, Primary ensuite"
                className="h-11 w-full border border-charcoal/12 bg-white px-4 text-[14px] outline-none placeholder:text-warm-gray/50"
              />
            </div>
          </div>

          {roomGroup.productNeeds.length > 0 && (
            <p className="mb-6 border border-charcoal/8 bg-[#ece9e2] px-4 py-3 text-[11px] leading-[1.6] text-warm-gray">
              This room needs: {roomGroup.productNeeds.map((need) => `${REQUIREMENT_TYPE_LABELS[need.type]}${need.quantity > 1 ? ` ×${need.quantity}` : ""}`).join(", ")}
            </p>
          )}

          {/* Quick fill from a collection */}
          <div className="mb-8">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
              Start from a collection (optional)
            </p>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              {series.map((s) => {
                const intel = collectionIntelligence[s.id] ?? collectionIntelligence.joy;
                const heroProduct = getProductsBySeries(s.id)[0];
                const heroImg = heroProduct ? getProductImage(heroProduct.slug, s.finishes[0]) : null;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFillSeriesId(s.id);
                      if (!s.finishes.includes(fillFinish)) setFillFinish(s.finishes[0]);
                    }}
                    className={`group flex gap-4 border p-4 text-left transition-all ${
                      fillSeriesId === s.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 hover:border-charcoal"
                    }`}
                  >
                    <div className={`relative h-16 w-16 shrink-0 ${fillSeriesId === s.id ? "bg-white/10" : "bg-[#ece9e2]"}`}>
                      {heroImg && <Image src={heroImg} alt={s.name} fill sizes="64px" className="object-contain p-1" />}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-heading text-[18px] leading-tight">{s.name}</span>
                      <span className={`mt-0.5 block text-[10px] uppercase tracking-[0.1em] ${fillSeriesId === s.id ? "text-white/40" : "text-warm-gray"}`}>
                        {s.shape}
                      </span>
                      <span className={`mt-1 block text-[11px] leading-[1.5] ${fillSeriesId === s.id ? "text-white/60" : "text-warm-gray"}`}>
                        {intel.bestUse}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {allFinishes.filter((f) => selectedFillSeries.finishes.includes(f.id)).map((f) => {
                const disc = getFinishDiscImage(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFillFinish(f.id)}
                    className={`flex items-center gap-2.5 border px-4 py-2.5 text-left transition-all ${
                      activeFillFinish === f.id ? "border-charcoal bg-charcoal text-white" : "border-charcoal/10 hover:border-charcoal"
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

            <div className="mb-4 border border-charcoal/8 bg-[#ece9e2] p-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">{selectedFillSeries.name} · {activeFillFinishName}</p>
              <p className="mt-1.5 text-[11px] leading-[1.6] text-warm-gray">{intelligence.note}</p>
            </div>

            <button
              type="button"
              onClick={handleFill}
              disabled={roomGroup.productNeeds.length === 0}
              className="flex h-11 w-full items-center justify-center gap-2 border border-charcoal bg-white text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:bg-charcoal hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Fill from {selectedFillSeries.name} · {activeFillFinishName}
            </button>
            {roomGroup.productNeeds.length === 0 && (
              <p className="mt-2 text-[11px] text-warm-gray/70">
                This room type has no product needs set yet — add products manually below.
              </p>
            )}
            {lastOmitted.length > 0 && (
              <div className="mt-3 border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-900">Not available in this selection</p>
                <ul className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-amber-900/80">
                  {lastOmitted.map((item) => <li key={item}>· {item}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Add a specific product */}
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
                <div ref={pickerImageRef} className="relative h-11 w-11 shrink-0 overflow-hidden border border-charcoal/12 bg-white">
                  {pickerImage && <Image src={pickerImage} alt="" fill sizes="44px" className="object-contain p-1" />}
                </div>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={pickerQuantity}
                  onChange={(e) => setPickerQuantity(Math.max(1, Math.round(Number(e.target.value)) || 1))}
                  className="h-11 w-16 border border-charcoal/12 bg-white px-2 text-center text-[13px] outline-none"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={addPickerLine}
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

          {/* Line list */}
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-warm-gray">
            {rows.length ? `${rows.length} products · ${totalUnits} units · ${formatPrice(totalPrice)}` : "No products yet"}
          </p>
          {rows.length > 0 && (
            <StaggerContainer className="divide-y divide-charcoal/8 border border-charcoal/8">
              {rows.map(({ line, product, variant }) => {
                const img = getProductImage(product.slug, variant.finish);
                const finishMeta = allFinishes.find((entry) => entry.id === variant.finish);
                const seriesName = series.find((s) => s.id === product.series)?.name ?? product.series;
                return (
                  <StaggerItem key={`${product.slug}-${variant.finish}`}>
                  <div className="flex items-center gap-4 bg-white p-4">
                    <div className="relative h-14 w-14 shrink-0 bg-[#ece9e2]">
                      {img && <Image src={img} alt={product.name} fill sizes="56px" className="object-contain p-1.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-charcoal">{seriesName} {product.name}</p>
                      <p className="mt-0.5 text-[10px] text-warm-gray">{finishMeta?.name ?? variant.finish} · {variant.model}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center border border-charcoal/12">
                        <button type="button" onClick={() => updateLineQuantity(product.slug, variant.finish, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal">−</button>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          value={line.quantity}
                          onChange={(e) => updateLineQuantity(product.slug, variant.finish, Number(e.target.value))}
                          className="h-7 w-12 border-x border-charcoal/12 bg-transparent text-center text-[12px] outline-none"
                        />
                        <button type="button" onClick={() => updateLineQuantity(product.slug, variant.finish, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center text-[14px] text-warm-gray transition hover:text-charcoal">+</button>
                      </div>
                      <button type="button" onClick={() => removeLine(product.slug, variant.finish)} className="text-warm-gray/40 transition hover:text-charcoal" aria-label="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>

        {/* Footer */}
        <footer className="shrink-0 border-t border-charcoal/8 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            {allocation ? (
              <button
                type="button"
                onClick={handleRemoveAllocation}
                className="flex h-[50px] items-center justify-center border border-charcoal/15 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
              >
                Remove allocation
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
              disabled={lines.length === 0}
              onClick={handleSave}
              className="flex h-[50px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black disabled:opacity-30"
            >
              Save allocation
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}

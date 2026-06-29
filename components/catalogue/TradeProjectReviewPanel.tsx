"use client";

import { Link } from "@/i18n/navigation";
import {
  getProductsBySeries,
  type Finish,
  type Product,
  type Variant,
} from "@/lib/utils";
import type { TradeProject, TradeProjectItem } from "@/lib/trade-project";

type ProjectRow = {
  item: TradeProjectItem;
  product: Product;
  variant: Variant;
  finish: Finish | undefined;
};

type ReviewLevel = "ready" | "warning" | "missing";

type ReviewItem = {
  level: ReviewLevel;
  title: string;
  body: string;
};

type SupportRow = {
  slug: string;
  finish: string;
  quantity: number;
  label: string;
  model: string;
};

type TradeProjectReviewPanelProps = {
  project: TradeProject;
  rows: ProjectRow[];
  totalItems: number;
  onAddItem: (slug: string, finish: string, quantity?: number, meta?: Pick<TradeProjectItem, "scopeId" | "scopeName" | "scopeSummary">) => void;
  onGoDetails: () => void;
  onDownloadPdf: () => void;
  pdfDownloading: boolean;
};

const basinTypes = new Set(["basin-mixer", "tall-basin-mixer", "wall-mounted"]);
const showerTypes = new Set(["concealed-shower", "shower-column"]);
const supportTypes = ["accessories", "bidet-spray", "click-clack", "angle-valve"];

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function projectTypeLabel(value: string) {
  return value || "Unspecified project type";
}

function levelStyles(level: ReviewLevel) {
  if (level === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-red-200 bg-red-50 text-red-950";
}

export default function TradeProjectReviewPanel({
  project,
  rows,
  totalItems,
  onAddItem,
  onGoDetails,
  onDownloadPdf,
  pdfDownloading,
}: TradeProjectReviewPanelProps) {
  if (!rows.length) return null;

  const selectedTypes = new Set(rows.map((row) => row.product.type));
  const selectedFinishes = Array.from(new Set(rows.map((row) => row.item.finish)));
  const selectedSeries = Array.from(new Set(rows.map((row) => row.product.series)));
  const primarySeries = mostCommon(rows.flatMap((row) => Array(row.item.quantity).fill(row.product.series)));
  const primaryFinish = mostCommon(rows.flatMap((row) => Array(row.item.quantity).fill(row.item.finish)));
  const primaryFinishName = rows.find((row) => row.item.finish === primaryFinish)?.finish?.name ?? primaryFinish;
  const primarySeriesName = primarySeries ? primarySeries[0].toUpperCase() + primarySeries.slice(1) : "Steinheim";

  const basinQty = rows
    .filter((row) => basinTypes.has(row.product.type))
    .reduce((sum, row) => sum + row.item.quantity, 0);
  const showerQty = rows
    .filter((row) => showerTypes.has(row.product.type))
    .reduce((sum, row) => sum + row.item.quantity, 0);
  const roomLikeQty = Math.max(basinQty, showerQty, 1);

  const primarySeriesProducts = getProductsBySeries(primarySeries);
  const supportRows: SupportRow[] = supportTypes.flatMap((type) => {
    if (selectedTypes.has(type)) return [];
    const product = primarySeriesProducts.find((entry) => entry.type === type);
    const variant = product?.variants.find((entry) => entry.finish === primaryFinish);
    if (!product || !variant) return [];
    return [{
      slug: product.slug,
      finish: variant.finish,
      quantity: type === "angle-valve" ? roomLikeQty * 2 : roomLikeQty,
      label: `${primarySeriesName} ${product.name}`,
      model: variant.model,
    }];
  });

  const unavailableSupport = supportTypes.filter((type) => {
    if (selectedTypes.has(type)) return false;
    const product = primarySeriesProducts.find((entry) => entry.type === type);
    const variant = product?.variants.find((entry) => entry.finish === primaryFinish);
    return !product || !variant;
  });

  const missingDetails = [
    ["Project name", project.details.projectName],
    ["Project type", project.details.projectType],
    ["Location", project.details.location],
    ["Timeline", project.details.timeline],
    ["Contact name", project.details.contactName],
    ["Email", project.details.email],
    ["Phone", project.details.phone],
  ].filter(([, value]) => !String(value).trim());

  const reviewItems: ReviewItem[] = [];

  if (selectedFinishes.length > 1) {
    reviewItems.push({
      level: "warning",
      title: "Mixed finishes",
      body: `This board includes ${selectedFinishes.length} finishes. That can be intentional, but for project pricing it should be clearly noted.`,
    });
  } else {
    reviewItems.push({
      level: "ready",
      title: "Finish language is consistent",
      body: `All current products are in ${primaryFinishName}.`,
    });
  }

  if (selectedSeries.length > 1) {
    reviewItems.push({
      level: "ready",
      title: "Mixed collections supported",
      body: `This board includes ${selectedSeries.map((series) => series[0].toUpperCase() + series.slice(1)).join(", ")}. That is valid for layered B2B projects; use notes to explain which scope each collection belongs to.`,
    });
  }

  if (basinQty > 0 && showerQty === 0) {
    reviewItems.push({
      level: "missing",
      title: "Basin selected without shower package",
      body: "This looks incomplete for a full bathroom. If it is only a powder room, that is fine; otherwise add a shower package or clarify the room type.",
    });
  }

  if (showerQty > 0 && basinQty === 0) {
    reviewItems.push({
      level: "warning",
      title: "Shower selected without basin mixer",
      body: "This may be intentional for shower-only zones, but most complete bathrooms also need a basin mixer.",
    });
  }

  if (supportRows.length > 0) {
    reviewItems.push({
      level: "warning",
      title: "Support items can be added",
      body: `The board does not yet include ${supportRows.map((row) => row.label.replace(`${primarySeriesName} `, "")).join(", ")} in ${primaryFinishName}.`,
    });
  }

  if (unavailableSupport.length > 0) {
    reviewItems.push({
      level: "warning",
      title: "Some support items are not active here",
      body: `${primarySeriesName} does not list ${unavailableSupport.map((type) => type.replace(/-/g, " ")).join(", ")} in ${primaryFinishName}. Confirm compatible support items with Steinheim Egypt if required.`,
    });
  }

  if (totalItems >= 20 && !project.details.notes.toLowerCase().includes("standard")) {
    reviewItems.push({
      level: "warning",
      title: "Large quantity needs room logic",
      body: "For hotel, compound, or repeated-unit projects, add room mix notes or use the Smart Room Calculator so the request is easier to price.",
    });
  }

  if (project.details.projectType.toLowerCase().includes("hotel") && !/suite|standard|room mix/i.test(project.details.notes)) {
    reviewItems.push({
      level: "warning",
      title: "Hotel room mix missing",
      body: "For hotel projects, add standard room count, suite count, and whether the package is basin-only or full bathroom.",
    });
  }

  if (project.details.projectType.toLowerCase().includes("residential") && !/one-bedroom|two-bedroom|unit|apartment/i.test(project.details.notes)) {
    reviewItems.push({
      level: "warning",
      title: "Residential unit mix missing",
      body: "For developments, add unit types and bathrooms per unit so Steinheim can understand the schedule.",
    });
  }

  if (missingDetails.length > 0) {
    reviewItems.push({
      level: "missing",
      title: "Commercial details missing",
      body: `Before sending, add: ${missingDetails.map(([label]) => label).join(", ")}.`,
    });
  } else {
    reviewItems.push({
      level: "ready",
      title: "Ready for trade review",
      body: "The board has products and core contact/project details. Steinheim Egypt can review trade pricing, stock, and lead time after submission.",
    });
  }

  const missingCount = reviewItems.filter((item) => item.level === "missing").length;
  const warningCount = reviewItems.filter((item) => item.level === "warning").length;
  const readiness = missingCount > 0 ? "Needs details" : warningCount > 0 ? "Review recommended" : "Ready to send";
  const readinessTone = missingCount > 0 ? "text-red-900 bg-red-50 border-red-200" : warningCount > 0 ? "text-amber-950 bg-amber-50 border-amber-200" : "text-emerald-900 bg-emerald-50 border-emerald-200";

  function addSupportItems() {
    for (const row of supportRows) {
      onAddItem(row.slug, row.finish, row.quantity);
    }
  }

  return (
    <div className="mb-5 border border-charcoal/10 bg-white">
      <div className="border-b border-charcoal/8 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-warm-gray">
              Specification review
            </p>
            <h3 className="mt-2 font-heading text-[22px] leading-none text-charcoal">
              {readiness}
            </h3>
          </div>
          <span className={`shrink-0 border px-2.5 py-1.5 text-[8px] font-medium uppercase tracking-[0.14em] ${readinessTone}`}>
            {projectTypeLabel(project.details.projectType)}
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-[1.7] text-warm-gray">
          The board checks product types, finishes, support items, quantities, and commercial handoff details.
        </p>
      </div>

      <div className="space-y-2 p-4">
        {reviewItems.slice(0, 5).map((item) => (
          <div key={`${item.level}-${item.title}`} className={`border p-3 ${levelStyles(item.level)}`}>
            <p className="text-[11px] font-medium">{item.title}</p>
            <p className="mt-1 text-[11px] leading-[1.6] opacity-80">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-charcoal/8 p-4">
        {supportRows.length > 0 && (
          <button
            type="button"
            onClick={addSupportItems}
            className="inline-flex h-9 items-center justify-center bg-charcoal px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
          >
            Add support items
          </button>
        )}
        <button
          type="button"
          onClick={onGoDetails}
          className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
        >
          Add details
        </button>
        <Link
          href="/trade#smart-room-calculator"
          className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
        >
          Room calculator
        </Link>
        <button
          type="button"
          disabled={pdfDownloading}
          onClick={onDownloadPdf}
          className="inline-flex h-9 items-center justify-center border border-charcoal/15 bg-white px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal disabled:opacity-40"
        >
          {pdfDownloading ? "PDF..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
}

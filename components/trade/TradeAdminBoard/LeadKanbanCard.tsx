"use client";

import { formatPrice } from "@/lib/utils";
import type { TradeLead } from "@/lib/trade-leads";

export function LeadKanbanCard({ lead, onSelect }: { lead: TradeLead; onSelect: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onSelect}
      className="cursor-grab rounded-lg border border-white/[0.08] bg-[#131316] p-3 transition hover:border-white/20 active:cursor-grabbing"
    >
      <p className="truncate text-[12px] font-medium text-white/90">
        {lead.project.details.projectName || "Untitled project"}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-white/40">{lead.project.details.company || "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-white/40">{lead.totalUnits} units</p>
        <p className="text-[10px] text-white/40">{formatPrice(lead.retailReferenceTotal)}</p>
      </div>
    </div>
  );
}

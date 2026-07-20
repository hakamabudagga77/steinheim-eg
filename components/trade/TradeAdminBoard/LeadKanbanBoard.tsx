"use client";

import { useState } from "react";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";
import { LeadKanbanCard } from "./LeadKanbanCard";

export function LeadKanbanBoard({ leads, onMove, onSelect }: { leads: TradeLead[]; onMove: (id: string, status: TradeLeadStatus) => void; onSelect: (id: string) => void }) {
  const [dragOverStatus, setDragOverStatus] = useState<TradeLeadStatus | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {tradeLeadStatuses.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(status);
            }}
            onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const leadId = e.dataTransfer.getData("text/plain");
              if (leadId) onMove(leadId, status);
            }}
            className={`w-[220px] shrink-0 rounded-xl border p-2 transition ${
              dragOverStatus === status ? "border-[#c9a961]/50 bg-[#c9a961]/[0.06]" : "border-white/[0.08] bg-white/[0.02]"
            }`}
          >
            <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.12em] text-white/35">
              {TRADE_LEAD_STATUS_LABELS[status]} · {columnLeads.length}
            </p>
            <div className="space-y-2">
              {columnLeads.map((lead) => (
                <LeadKanbanCard key={lead.id} lead={lead} onSelect={() => onSelect(lead.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

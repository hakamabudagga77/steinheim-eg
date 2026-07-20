"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";
import { PageHeader, Panel, Badge, SegmentedControl, EmptyState, ErrorState, type BadgeTone } from "@/components/admin/ui";
import { priorityTone, formatDate } from "./helpers";
import { LeadKanbanBoard } from "./LeadKanbanBoard";
import { LeadDetail } from "./LeadDetail";

function statusTone(status: TradeLeadStatus): BadgeTone {
  if (status === "lost") return "muted";
  if (status === "delivered") return "positive";
  if (status === "won" || status === "in_production" || status === "shipped") return "accent";
  if (status === "quoted") return "warning";
  return "neutral";
}

export default function TradeAdminBoard() {
  const [leads, setLeads] = useState<TradeLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradeLeadStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    async function loadLeads() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/trade/leads");
        if (!res.ok) throw new Error("Could not load leads.");
        const data = await res.json();
        setLeads(data.leads);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    void loadLeads();
  }, []);

  async function handleUpdate(id: string, update: { status?: TradeLeadStatus; internalNotes?: string; quoteUrl?: string; quoteAmount?: string; warrantyReference?: string }) {
    const res = await fetch("/api/trade/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...update }),
    });
    if (!res.ok) {
      setError("Could not save changes. Try again.");
      return;
    }
    const data = await res.json();
    setLeads((current) => current?.map((lead) => (lead.id === id ? data.lead : lead)) ?? null);
  }

  const searchFilteredLeads =
    leads?.filter((lead) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const d = lead.project.details;
      return [d.projectName, d.company, d.contactName, lead.reference].some((value) => (value || "").toLowerCase().includes(q));
    }) ?? [];

  const statusOptions = [
    { value: "all" as const, label: `All · ${leads?.length ?? 0}` },
    ...tradeLeadStatuses
      .filter((s) => leads?.some((lead) => lead.status === s))
      .map((s) => ({ value: s, label: `${TRADE_LEAD_STATUS_LABELS[s]} · ${leads?.filter((l) => l.status === s).length ?? 0}` })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Trade Leads" title="Lead review" subtitle="B2B project quotes and specification requests" />
        <SegmentedControl
          options={[
            { value: "list" as const, label: "List" },
            { value: "board" as const, label: "Board" },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {error && <ErrorState>{error}</ErrorState>}
      {loading && !leads && <p className="mt-8 text-[13px] text-white/35">Loading leads…</p>}

      {leads && leads.length === 0 && <EmptyState>No leads submitted yet.</EmptyState>}

      {leads && leads.length > 0 && (
        <div className="mt-8 mb-6 space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, company, contact, or reference…"
            className="h-11 w-full rounded-lg border border-white/10 bg-[#131316] px-4 text-[13px] text-white outline-none transition focus:border-[#c9a961]"
          />
          {viewMode === "list" && <SegmentedControl options={statusOptions} value={statusFilter} onChange={setStatusFilter} />}
        </div>
      )}

      {viewMode === "board" ? (
        <LeadKanbanBoard
          leads={searchFilteredLeads}
          onMove={(id, status) => void handleUpdate(id, { status })}
          onSelect={(id) => {
            setExpandedId(id);
            setViewMode("list");
          }}
        />
      ) : (
        <div className="space-y-3">
          {searchFilteredLeads
            .filter((lead) => statusFilter === "all" || lead.status === statusFilter)
            .map((lead) => {
              const expanded = expandedId === lead.id;
              return (
                <Panel key={lead.id} padded={false} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : lead.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={priorityTone(lead.priority)}>{lead.priority}</Badge>
                        {lead.project.persona && <Badge tone="muted">{TRADE_PERSONA_LABELS[lead.project.persona]}</Badge>}
                        <p className="truncate text-[14px] font-medium text-white/90">{lead.project.details.projectName || "Untitled project"}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-white/40">
                        {lead.project.details.company || "—"} · {lead.reference} · {formatDate(lead.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-right">
                      <div>
                        <p className="text-[13px] font-medium text-white/85">{lead.totalUnits} units</p>
                        <p className="text-[11px] text-white/40">{formatPrice(lead.retailReferenceTotal)}</p>
                      </div>
                      <Badge tone={statusTone(lead.status)}>{TRADE_LEAD_STATUS_LABELS[lead.status]}</Badge>
                      <ChevronDown className={`h-4 w-4 text-white/30 transition ${expanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  {expanded && <LeadDetail lead={lead} onSave={handleUpdate} />}
                </Panel>
              );
            })}
        </div>
      )}
    </div>
  );
}

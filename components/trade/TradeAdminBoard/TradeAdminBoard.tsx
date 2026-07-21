"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";
import { PageHeader, Panel, Badge, SegmentedControl, EmptyState, ErrorState, type BadgeTone } from "@/components/admin/ui";
import { formatDate } from "./helpers";
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
  const [leadScope, setLeadScope] = useState<"active" | "archived">("active");
  const [archiving, setArchiving] = useState(false);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeads();
  }, []);

  async function handleUpdate(id: string, update: { status?: TradeLeadStatus; internalNotes?: string; quoteUrl?: string; quoteAmount?: string; warrantyReference?: string; archived?: boolean }) {
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

  async function handleArchiveAll() {
    const activeCount = leads?.filter((lead) => !lead.archivedAt).length ?? 0;
    if (!activeCount || !window.confirm(`Archive all ${activeCount} active trade leads? You can restore them from the Archived view.`)) return;
    setArchiving(true);
    setError(null);
    try {
      const res = await fetch("/api/trade/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveAll: true }),
      });
      if (!res.ok) throw new Error("Could not archive leads.");
      const data = await res.json();
      setLeads(data.leads);
      setExpandedId(null);
      setLeadScope("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive leads.");
    } finally {
      setArchiving(false);
    }
  }

  const scopedLeads = leads?.filter((lead) => (leadScope === "archived" ? Boolean(lead.archivedAt) : !lead.archivedAt)) ?? [];
  const searchFilteredLeads =
    scopedLeads.filter((lead) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const d = lead.project.details;
      return [d.projectName, d.company, d.contactName, lead.reference].some((value) => (value || "").toLowerCase().includes(q));
    });

  const statusOptions = [
    { value: "all" as const, label: `All · ${scopedLeads.length}` },
    ...tradeLeadStatuses
      .filter((s) => scopedLeads.some((lead) => lead.status === s))
      .map((s) => ({ value: s, label: `${TRADE_LEAD_STATUS_LABELS[s]} · ${scopedLeads.filter((l) => l.status === s).length}` })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Trade Leads" title="Lead review" subtitle="B2B project quotes and specification requests" />
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={[
              { value: "active" as const, label: `Active · ${leads?.filter((lead) => !lead.archivedAt).length ?? 0}` },
              { value: "archived" as const, label: `Archived · ${leads?.filter((lead) => Boolean(lead.archivedAt)).length ?? 0}` },
            ]}
            value={leadScope}
            onChange={(value) => { setLeadScope(value); setExpandedId(null); setStatusFilter("all"); }}
          />
          <SegmentedControl options={[{ value: "list" as const, label: "List" }, { value: "board" as const, label: "Board" }]} value={viewMode} onChange={setViewMode} />
          {leadScope === "active" && (leads?.some((lead) => !lead.archivedAt) ?? false) && (
            <button type="button" onClick={() => void handleArchiveAll()} disabled={archiving} className="h-9 rounded-lg border border-white/10 px-3 text-[12px] text-white/55 transition hover:border-white/20 hover:text-white disabled:opacity-40">
              {archiving ? "Archiving…" : "Archive all"}
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState>{error}</ErrorState>}
      {loading && !leads && <p className="mt-8 text-[13px] text-white/35">Loading leads…</p>}

      {leads && scopedLeads.length === 0 && <EmptyState>{leadScope === "archived" ? "No archived trade leads." : "No active trade leads. The workspace is ready for new requests."}</EmptyState>}

      {leads && scopedLeads.length > 0 && (
        <div className="mt-8 mb-6 space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, company, contact, or reference…"
            className="h-11 w-full rounded-lg border border-white/10 bg-[#131316] px-4 text-[13px] text-white outline-none transition focus:border-[#0a84ff]"
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

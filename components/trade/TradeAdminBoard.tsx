"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";

const STORAGE_KEY = "steinheim-trade-admin-key";

function priorityStyles(priority: TradeLead["priority"]) {
  if (priority === "hot") return "border-red-200 bg-red-50 text-red-900";
  if (priority === "warm") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-charcoal/15 bg-[#ece9e2] text-warm-gray";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LeadDetail({ lead, onSave }: { lead: TradeLead; onSave: (id: string, update: { status?: TradeLeadStatus; internalNotes?: string }) => Promise<void> }) {
  const [status, setStatus] = useState<TradeLeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.internalNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const d = lead.project.details;
  const dirty = status !== lead.status || notes !== lead.internalNotes;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(lead.id, { status, internalNotes: notes });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-charcoal/8 bg-[#faf9f7] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Contact</p>
          <p className="text-[13px] text-charcoal">{d.contactName || "—"}{d.role ? ` · ${d.role}` : ""}</p>
          <p className="text-[13px] text-charcoal">{d.company || "—"}</p>
          <p className="text-[12px] text-warm-gray">{d.email || "—"}</p>
          <p className="text-[12px] text-warm-gray">{d.phone || "—"}</p>
        </div>
        <div>
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Project</p>
          <p className="text-[13px] text-charcoal">
            {lead.project.persona ? TRADE_PERSONA_LABELS[lead.project.persona] : d.projectType || "—"}
          </p>
          <p className="text-[13px] text-charcoal">{d.location || "—"}</p>
          <p className="text-[12px] text-warm-gray">Timeline: {d.timeline || "—"}</p>
        </div>
      </div>

      {d.notes && (
        <div className="mt-4">
          <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Client notes</p>
          <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-charcoal">{d.notes}</p>
        </div>
      )}

      {lead.riskFlags.length > 0 && (
        <div className="mt-4 border border-amber-200 bg-amber-50 p-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-amber-900">Flags</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-amber-900/80">
            {lead.riskFlags.map((flag) => <li key={flag}>· {flag}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Scope breakdown</p>
        <div className="divide-y divide-charcoal/8 border border-charcoal/8 bg-white">
          {lead.scopeBreakdown.map((scope) => (
            <div key={scope.scopeId} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-charcoal">{scope.scopeName}</p>
                <p className="text-[10px] text-warm-gray">{scope.scopeSummary}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-charcoal">{scope.totalUnits} units</p>
                <p className="text-[10px] text-warm-gray">{formatPrice(scope.retailReferenceTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
        <div>
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Status</p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TradeLeadStatus)}
            className="h-10 w-full border border-charcoal/15 bg-white px-3 text-[13px] text-charcoal outline-none"
          >
            {tradeLeadStatuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Internal notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for the Steinheim Egypt team — not visible to the client"
            className="min-h-[80px] w-full border border-charcoal/15 bg-white p-3 text-[13px] outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || saving}
        className="mt-4 flex h-10 items-center justify-center bg-charcoal px-6 text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black disabled:opacity-40"
      >
        {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save changes"}
      </button>
    </div>
  );
}

export default function TradeAdminBoard() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [leads, setLeads] = useState<TradeLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setAdminKey(stored);
  }, []);

  useEffect(() => {
    if (adminKey !== null) void loadLeads(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  async function loadLeads(key: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trade/leads", { headers: { "x-steinheim-admin-key": key } });
      if (!res.ok) {
        sessionStorage.removeItem(STORAGE_KEY);
        setAdminKey(null);
        throw new Error(res.status === 401 ? "Incorrect admin key." : "Could not load leads.");
      }
      const data = await res.json();
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeySubmit() {
    if (!keyInput.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, keyInput.trim());
    setAdminKey(keyInput.trim());
  }

  async function handleUpdate(id: string, update: { status?: TradeLeadStatus; internalNotes?: string }) {
    if (!adminKey) return;
    const res = await fetch("/api/trade/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
      body: JSON.stringify({ id, ...update }),
    });
    if (!res.ok) {
      setError("Could not save changes. Try again.");
      return;
    }
    const data = await res.json();
    setLeads((current) => current?.map((lead) => (lead.id === id ? data.lead : lead)) ?? null);
  }

  if (adminKey === null) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">Steinheim Trade Studio</p>
        <h1 className="mt-2 font-heading text-[28px] text-charcoal">Lead review</h1>
        <p className="mt-3 text-center text-[13px] text-warm-gray">Enter the admin key to view submitted trade leads.</p>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
          placeholder="Admin key"
          className="mt-6 h-11 w-full border border-charcoal/15 bg-white px-4 text-[13px] outline-none focus:border-charcoal/40"
        />
        {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
        <button
          type="button"
          onClick={handleKeySubmit}
          className="mt-4 flex h-11 w-full items-center justify-center bg-charcoal text-[11px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
        >
          View leads
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">Steinheim Trade Studio</p>
          <h1 className="mt-2 font-heading text-[32px] text-charcoal">Lead review</h1>
        </div>
        <button
          type="button"
          onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setAdminKey(null); setLeads(null); }}
          className="h-9 shrink-0 border border-charcoal/15 px-4 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal transition hover:border-charcoal"
        >
          Log out
        </button>
      </div>

      {error && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-800">{error}</p>}
      {loading && <p className="text-[13px] text-warm-gray">Loading leads…</p>}

      {leads && leads.length === 0 && (
        <p className="text-[13px] text-warm-gray">No leads submitted yet.</p>
      )}

      <div className="space-y-3">
        {leads?.map((lead) => {
          const expanded = expandedId === lead.id;
          return (
            <div key={lead.id} className="border border-charcoal/10 bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : lead.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 border px-2 py-1 text-[8px] font-medium uppercase tracking-[0.1em] ${priorityStyles(lead.priority)}`}>
                      {lead.priority}
                    </span>
                    {lead.project.persona && (
                      <span className="shrink-0 border border-charcoal/15 bg-[#f4f2ec] px-2 py-1 text-[8px] font-medium uppercase tracking-[0.1em] text-charcoal">
                        {TRADE_PERSONA_LABELS[lead.project.persona]}
                      </span>
                    )}
                    <p className="truncate text-[14px] font-medium text-charcoal">
                      {lead.project.details.projectName || "Untitled project"}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-warm-gray">
                    {lead.project.details.company || "—"} · {lead.reference} · {formatDate(lead.submittedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-right">
                  <div>
                    <p className="text-[13px] font-medium text-charcoal">{lead.totalUnits} units</p>
                    <p className="text-[11px] text-warm-gray">{formatPrice(lead.retailReferenceTotal)}</p>
                  </div>
                  <span className="border border-charcoal/15 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-charcoal">
                    {lead.status}
                  </span>
                </div>
              </button>
              {expanded && <LeadDetail lead={lead} onSave={handleUpdate} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

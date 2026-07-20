"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";
import { Panel } from "@/components/admin/ui";
import { formatDate } from "./helpers";
import { MessagesThread } from "./MessagesThread";
import { SampleRequestsList } from "./SampleRequestsList";
import { DocumentsList } from "./DocumentsList";
import { ScopeStatusList } from "./ScopeStatusList";

export function LeadDetail({
  lead,
  onSave,
}: {
  lead: TradeLead;
  onSave: (id: string, update: { status?: TradeLeadStatus; internalNotes?: string; quoteUrl?: string; quoteAmount?: string; warrantyReference?: string }) => Promise<void>;
}) {
  const [status, setStatus] = useState<TradeLeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.internalNotes);
  const [quoteUrl, setQuoteUrl] = useState(lead.quoteUrl ?? "");
  const [quoteAmount, setQuoteAmount] = useState(lead.quoteAmount ?? "");
  const [warrantyReference, setWarrantyReference] = useState(lead.warrantyReference ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const d = lead.project.details;

  async function handleDownloadInvoice() {
    setInvoiceDownloading(true);
    try {
      const res = await fetch(`/api/trade/leads/${lead.id}/invoice`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `steinheim-invoice-draft-${lead.reference}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Silent — admin can retry the button.
    } finally {
      setInvoiceDownloading(false);
    }
  }
  const dirty =
    status !== lead.status ||
    notes !== lead.internalNotes ||
    quoteUrl !== (lead.quoteUrl ?? "") ||
    quoteAmount !== (lead.quoteAmount ?? "") ||
    warrantyReference !== (lead.warrantyReference ?? "");

  async function handleSave() {
    if (!window.confirm(`Save these changes to ${lead.reference}? This updates what the client sees.`)) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(lead.id, { status, internalNotes: notes, quoteUrl, quoteAmount, warrantyReference });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-white/[0.08] p-5">
      <Panel className="bg-black/20">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Contact</p>
            <p className="text-[13px] text-white/85">
              {d.contactName || "—"}
              {d.role ? ` · ${d.role}` : ""}
            </p>
            <p className="text-[13px] text-white/85">{d.company || "—"}</p>
            <p className="text-[12px] text-white/45">{d.email || "—"}</p>
            <p className="text-[12px] text-white/45">{d.phone || "—"}</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Project</p>
            <p className="text-[13px] text-white/85">
              {lead.project.persona ? TRADE_PERSONA_LABELS[lead.project.persona] : d.projectType || "—"}
            </p>
            <p className="text-[13px] text-white/85">{d.location || "—"}</p>
            <p className="text-[12px] text-white/45">Timeline: {d.timeline || "—"}</p>
          </div>
        </div>

        {d.notes && (
          <div className="mt-4 border-t border-white/[0.08] pt-4">
            <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-white/35">Client notes</p>
            <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-white/70">{d.notes}</p>
          </div>
        )}
      </Panel>

      {lead.riskFlags.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300">Flags</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-amber-200/80">
            {lead.riskFlags.map((flag) => (
              <li key={flag}>· {flag}</li>
            ))}
          </ul>
        </div>
      )}

      <MessagesThread leadId={lead.id} initialMessages={lead.messages} />

      <SampleRequestsList leadId={lead.id} initialRequests={lead.sampleRequests} />

      {lead.deliveryDetails && (
        <Panel className="mt-5 bg-black/20">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Delivery details</p>
          <p className="text-[13px] text-white/85">
            {lead.deliveryDetails.contactName} · {lead.deliveryDetails.contactPhone}
          </p>
          {lead.deliveryDetails.accessNotes && (
            <p className="mt-1 whitespace-pre-wrap text-[12px] text-white/45">{lead.deliveryDetails.accessNotes}</p>
          )}
          <p className="mt-1 text-[10px] text-white/30">Saved {formatDate(lead.deliveryDetails.updatedAt)}</p>
        </Panel>
      )}

      <DocumentsList leadId={lead.id} initialDocuments={lead.documents} />

      <div className="mt-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Scope breakdown</p>
        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/20">
          {lead.scopeBreakdown.map((scope) => (
            <div key={scope.scopeId} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white/85">{scope.scopeName}</p>
                <p className="text-[10px] text-white/40">{scope.scopeSummary}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-white/70">{scope.totalUnits} units</p>
                <p className="text-[10px] text-white/40">{formatPrice(scope.retailReferenceTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ScopeStatusList leadId={lead.id} lead={lead} />

      <Panel className="mt-5 bg-black/20">
        <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/35">Manage this lead</p>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TradeLeadStatus)}
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[13px] text-white outline-none focus:border-[#c9a961]"
            >
              {tradeLeadStatuses.map((s) => (
                <option key={s} value={s} className="bg-[#131316]">
                  {TRADE_LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Internal notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for the Steinheim Egypt team — not visible to the client"
              className="min-h-[80px] w-full rounded-lg border border-white/10 bg-black/30 p-3 text-[13px] text-white outline-none focus:border-[#c9a961]"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Quote link</p>
            <input
              value={quoteUrl}
              onChange={(e) => setQuoteUrl(e.target.value)}
              placeholder="https://… link to the quote PDF"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[13px] text-white outline-none focus:border-[#c9a961]"
            />
            <p className="mt-1 text-[10px] text-white/35">Client sees a &ldquo;View quote&rdquo; button and can accept in-app once this is set.</p>
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Quote amount</p>
            <input
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. LE 42,500"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[13px] text-white outline-none focus:border-[#c9a961]"
            />
            {lead.quoteAcceptedAt && <p className="mt-1 text-[10px] text-white/35">Accepted {formatDate(lead.quoteAcceptedAt)}</p>}
          </div>
        </div>

        <button
          type="button"
          disabled={invoiceDownloading}
          onClick={handleDownloadInvoice}
          className="mt-4 flex h-9 items-center justify-center rounded-full border border-white/15 px-4 text-[11px] text-white/70 transition hover:border-[#c9a961]/50 hover:text-[#c9a961] disabled:opacity-40"
        >
          {invoiceDownloading ? "Generating…" : "Download draft Egyptian invoice (prototype)"}
        </button>

        {lead.quoteHistory.length > 0 && (
          <div className="mt-4 border-t border-white/[0.08] pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Quote history</p>
            <div className="space-y-1">
              {lead.quoteHistory
                .slice()
                .reverse()
                .map((revision, index) => (
                  <p key={index} className="text-[11px] text-white/40">
                    {revision.amount || revision.url || "No quote"} · replaced {formatDate(revision.changedAt)}
                  </p>
                ))}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-white/[0.08] pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Warranty reference</p>
          <textarea
            value={warrantyReference}
            onChange={(e) => setWarrantyReference(e.target.value)}
            placeholder="Batch / serial reference for this order, e.g. Batch STM-2026-04, Serials 1001–1050"
            className="min-h-[60px] w-full rounded-lg border border-white/10 bg-black/30 p-3 text-[13px] text-white outline-none focus:border-[#c9a961]"
          />
          <p className="mt-1 text-[10px] text-white/35">Client sees this in their Documents tab for warranty claims.</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="mt-4 flex h-10 items-center justify-center rounded-full bg-[#c9a961] px-6 text-[12px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-40"
        >
          {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save changes"}
        </button>
      </Panel>
    </div>
  );
}

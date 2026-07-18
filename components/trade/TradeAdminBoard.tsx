"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadMessage, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function MessagesThread({ leadId, adminKey, initialMessages }: { leadId: string; adminKey: string; initialMessages: TradeLeadMessage[] }) {
  const [messages, setMessages] = useState<TradeLeadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
        body: JSON.stringify({ from: "steinheim", body: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((current) => [...current, data.message]);
      setDraft("");
    } catch {
      setError("Could not send. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Messages</p>
      <div className="border border-charcoal/8 bg-white">
        <div ref={listRef} className="max-h-[280px] space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="p-2 text-[12px] text-warm-gray">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === "steinheim" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 text-[12px] leading-[1.5] ${
                  message.from === "steinheim" ? "bg-charcoal text-white" : "border border-charcoal/10 bg-[#ece9e2] text-charcoal"
                }`}>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className={`mt-1 text-[9px] uppercase tracking-[0.08em] ${message.from === "steinheim" ? "text-white/40" : "text-warm-gray"}`}>
                    {message.from === "steinheim" ? "Steinheim" : "Client"} · {formatMessageTime(message.sentAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-charcoal/8 p-3">
          {error && <p className="mb-2 text-[11px] text-red-700">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Reply to client…"
              rows={2}
              className="min-h-[40px] flex-1 resize-none border border-charcoal/12 bg-white p-2.5 text-[12px] outline-none"
            />
            <button
              type="button"
              disabled={!draft.trim() || sending}
              onClick={handleSend}
              className="flex h-9 shrink-0 items-center justify-center bg-charcoal px-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-black disabled:opacity-30"
            >
              {sending ? "…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleRequestsList({ leadId, adminKey, initialRequests }: { leadId: string; adminKey: string; initialRequests: TradeLead["sampleRequests"] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleFulfill(requestId: string) {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/sample-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
        body: JSON.stringify({ requestId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data.sampleRequests);
    } catch {
      // Leave the list as-is; admin can retry.
    } finally {
      setBusyId(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Sample requests</p>
      <div className="divide-y divide-charcoal/8 border border-charcoal/8 bg-white">
        {requests.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="whitespace-pre-wrap text-[12px] text-charcoal">{entry.note}</p>
              <p className="mt-1 whitespace-pre-wrap text-[11px] text-warm-gray">Deliver to: {entry.address}</p>
            </div>
            {entry.fulfilledAt ? (
              <span className="shrink-0 border border-charcoal/15 bg-[#ece9e2] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-charcoal">
                Fulfilled
              </span>
            ) : (
              <button
                type="button"
                disabled={busyId === entry.id}
                onClick={() => handleFulfill(entry.id)}
                className="shrink-0 border border-charcoal/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.08em] text-charcoal transition hover:border-charcoal disabled:opacity-40"
              >
                {busyId === entry.id ? "…" : "Mark fulfilled"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsList({ leadId, adminKey, initialDocuments }: { leadId: string; adminKey: string; initialDocuments: TradeLead["documents"] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!label.trim() || !url.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
        body: JSON.stringify({ label, url }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents);
      setLabel("");
      setUrl("");
    } catch {
      // Leave the form as-is; admin can retry.
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(documentId: string) {
    setRemovingId(documentId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
        body: JSON.stringify({ documentId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocuments(data.documents);
    } catch {
      // Leave the list as-is; admin can retry.
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mt-5">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Documents</p>
      <div className="border border-charcoal/8 bg-white">
        {documents.length > 0 && (
          <div className="divide-y divide-charcoal/8">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[12px] text-charcoal underline underline-offset-2">
                  {doc.label}
                </a>
                <button
                  type="button"
                  disabled={removingId === doc.id}
                  onClick={() => handleRemove(doc.id)}
                  className="shrink-0 text-[9px] uppercase tracking-[0.08em] text-warm-gray transition hover:text-red-700 disabled:opacity-40"
                >
                  {removingId === doc.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2 border-t border-charcoal/8 p-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Commercial invoice"
            className="h-9 min-w-[160px] flex-1 border border-charcoal/15 bg-white px-2.5 text-[12px] outline-none"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 min-w-[160px] flex-1 border border-charcoal/15 bg-white px-2.5 text-[12px] outline-none"
          />
          <button
            type="button"
            disabled={!label.trim() || !url.trim() || adding}
            onClick={handleAdd}
            className="flex h-9 shrink-0 items-center justify-center bg-charcoal px-4 text-[10px] font-medium uppercase tracking-[0.1em] text-white transition hover:bg-black disabled:opacity-30"
          >
            {adding ? "…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScopeStatusList({ leadId, adminKey, lead }: { leadId: string; adminKey: string; lead: TradeLead }) {
  const [statuses, setStatuses] = useState(lead.scopeStatuses);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleChange(scopeId: string, status: TradeLeadStatus) {
    setSavingId(scopeId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/scope-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-steinheim-admin-key": adminKey },
        body: JSON.stringify({ scopeId, status }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatuses(data.scopeStatuses);
    } catch {
      // Leave as-is; admin can retry.
    } finally {
      setSavingId(null);
    }
  }

  if (lead.scopeBreakdown.length < 2) return null;

  return (
    <div className="mt-5">
      <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Status by room</p>
      <div className="divide-y divide-charcoal/8 border border-charcoal/8 bg-white">
        {lead.scopeBreakdown.map((scope) => {
          const current = statuses.find((s) => s.scopeId === scope.scopeId)?.status ?? lead.status;
          return (
            <div key={scope.scopeId} className="flex items-center justify-between gap-3 p-3">
              <p className="min-w-0 truncate text-[12px] text-charcoal">{scope.scopeName}</p>
              <select
                value={current}
                disabled={savingId === scope.scopeId}
                onChange={(e) => handleChange(scope.scopeId, e.target.value as TradeLeadStatus)}
                className="h-8 shrink-0 border border-charcoal/15 bg-white px-2 text-[11px] text-charcoal outline-none disabled:opacity-40"
              >
                {tradeLeadStatuses.map((s) => <option key={s} value={s}>{TRADE_LEAD_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadKanbanCard({ lead, onSelect }: { lead: TradeLead; onSelect: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onSelect}
      className="cursor-grab border border-charcoal/10 bg-white p-3 transition hover:border-charcoal active:cursor-grabbing"
    >
      <div className="flex items-center gap-1.5">
        <span className={`shrink-0 border px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.08em] ${priorityStyles(lead.priority)}`}>
          {lead.priority}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[12px] font-medium text-charcoal">
        {lead.project.details.projectName || "Untitled project"}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-warm-gray">{lead.project.details.company || "—"}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-warm-gray">{lead.totalUnits} units</p>
        <p className="text-[10px] text-warm-gray">{formatPrice(lead.retailReferenceTotal)}</p>
      </div>
    </div>
  );
}

function LeadKanbanBoard({ leads, onMove, onSelect }: { leads: TradeLead[]; onMove: (id: string, status: TradeLeadStatus) => void; onSelect: (id: string) => void }) {
  const [dragOverStatus, setDragOverStatus] = useState<TradeLeadStatus | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {tradeLeadStatuses.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const leadId = e.dataTransfer.getData("text/plain");
              if (leadId) onMove(leadId, status);
            }}
            className={`w-[220px] shrink-0 border p-2 transition ${
              dragOverStatus === status ? "border-charcoal bg-[#ece9e2]" : "border-charcoal/10 bg-[#faf9f7]"
            }`}
          >
            <p className="mb-2 px-1 text-[9px] font-medium uppercase tracking-[0.12em] text-warm-gray">
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

const STORAGE_KEY = "steinheim-trade-admin-key";

function priorityStyles(priority: TradeLead["priority"]) {
  if (priority === "hot") return "border-red-200 bg-red-50 text-red-900";
  if (priority === "warm") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-charcoal/15 bg-[#ece9e2] text-warm-gray";
}

function statusStyles(status: TradeLeadStatus) {
  if (status === "lost") return "border-charcoal/15 bg-transparent text-warm-gray";
  if (status === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "won" || status === "in_production" || status === "shipped") return "border-charcoal bg-charcoal text-white";
  if (status === "quoted") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-charcoal/15 bg-[#ece9e2] text-charcoal";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LeadDetail({ lead, adminKey, onSave }: { lead: TradeLead; adminKey: string; onSave: (id: string, update: { status?: TradeLeadStatus; internalNotes?: string; quoteUrl?: string; quoteAmount?: string; warrantyReference?: string }) => Promise<void> }) {
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
      const res = await fetch(`/api/trade/leads/${lead.id}/invoice`, {
        headers: { "x-steinheim-admin-key": adminKey },
      });
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
  const dirty = status !== lead.status || notes !== lead.internalNotes
    || quoteUrl !== (lead.quoteUrl ?? "") || quoteAmount !== (lead.quoteAmount ?? "")
    || warrantyReference !== (lead.warrantyReference ?? "");

  async function handleSave() {
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
    <div className="border-t border-charcoal/8 bg-[#faf9f7] p-5">
      <div className="border border-charcoal/8 bg-white p-4">
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
          <div className="mt-4 border-t border-charcoal/8 pt-4">
            <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Client notes</p>
            <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-charcoal">{d.notes}</p>
          </div>
        )}
      </div>

      {lead.riskFlags.length > 0 && (
        <div className="mt-5 border border-amber-200 bg-amber-50 p-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-amber-900">Flags</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-amber-900/80">
            {lead.riskFlags.map((flag) => <li key={flag}>· {flag}</li>)}
          </ul>
        </div>
      )}

      <MessagesThread leadId={lead.id} adminKey={adminKey} initialMessages={lead.messages} />

      <SampleRequestsList leadId={lead.id} adminKey={adminKey} initialRequests={lead.sampleRequests} />

      {lead.deliveryDetails && (
        <div className="mt-5 border border-charcoal/8 bg-white p-4">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Delivery details</p>
          <p className="text-[13px] text-charcoal">{lead.deliveryDetails.contactName} · {lead.deliveryDetails.contactPhone}</p>
          {lead.deliveryDetails.accessNotes && (
            <p className="mt-1 whitespace-pre-wrap text-[12px] text-warm-gray">{lead.deliveryDetails.accessNotes}</p>
          )}
          <p className="mt-1 text-[10px] text-warm-gray/70">Saved {formatDate(lead.deliveryDetails.updatedAt)}</p>
        </div>
      )}

      <DocumentsList leadId={lead.id} adminKey={adminKey} initialDocuments={lead.documents} />

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

      <ScopeStatusList leadId={lead.id} adminKey={adminKey} lead={lead} />

      <div className="mt-5 border border-charcoal/8 bg-white p-4">
        <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Manage this lead</p>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TradeLeadStatus)}
              className="h-10 w-full border border-charcoal/15 bg-white px-3 text-[13px] text-charcoal outline-none"
            >
              {tradeLeadStatuses.map((s) => <option key={s} value={s}>{TRADE_LEAD_STATUS_LABELS[s]}</option>)}
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

        <div className="mt-4 grid gap-4 border-t border-charcoal/8 pt-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Quote link</p>
            <input
              value={quoteUrl}
              onChange={(e) => setQuoteUrl(e.target.value)}
              placeholder="https://… link to the quote PDF"
              className="h-10 w-full border border-charcoal/15 bg-white px-3 text-[13px] outline-none"
            />
            <p className="mt-1 text-[10px] text-warm-gray">Client sees a &ldquo;View quote&rdquo; button and can accept in-app once this is set.</p>
          </div>
          <div>
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Quote amount</p>
            <input
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="e.g. LE 42,500"
              className="h-10 w-full border border-charcoal/15 bg-white px-3 text-[13px] outline-none"
            />
            {lead.quoteAcceptedAt && (
              <p className="mt-1 text-[10px] text-warm-gray">Accepted {formatDate(lead.quoteAcceptedAt)}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={invoiceDownloading}
          onClick={handleDownloadInvoice}
          className="mt-4 flex h-9 items-center justify-center border border-charcoal/15 px-4 text-[9px] font-medium uppercase tracking-[0.1em] text-charcoal transition hover:border-charcoal disabled:opacity-40"
        >
          {invoiceDownloading ? "Generating…" : "Download draft Egyptian invoice (prototype)"}
        </button>

        {lead.quoteHistory.length > 0 && (
          <div className="mt-4 border-t border-charcoal/8 pt-4">
            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Quote history</p>
            <div className="space-y-1">
              {lead.quoteHistory.slice().reverse().map((revision, index) => (
                <p key={index} className="text-[11px] text-warm-gray">
                  {revision.amount || revision.url || "No quote"} · replaced {formatDate(revision.changedAt)}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-charcoal/8 pt-4">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Warranty reference</p>
          <textarea
            value={warrantyReference}
            onChange={(e) => setWarrantyReference(e.target.value)}
            placeholder="Batch / serial reference for this order, e.g. Batch STM-2026-04, Serials 1001–1050"
            className="min-h-[60px] w-full border border-charcoal/15 bg-white p-3 text-[13px] outline-none"
          />
          <p className="mt-1 text-[10px] text-warm-gray">Client sees this in their Documents tab for warranty claims.</p>
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradeLeadStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

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

  async function handleUpdate(id: string, update: { status?: TradeLeadStatus; internalNotes?: string; quoteUrl?: string; quoteAmount?: string; warrantyReference?: string }) {
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
    <div className={`mx-auto px-5 py-10 sm:px-8 ${viewMode === "board" ? "max-w-[1400px]" : "max-w-[900px]"}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">Steinheim Trade Studio</p>
          <h1 className="mt-2 font-heading text-[32px] text-charcoal">Lead review</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-charcoal/15">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-9 px-4 text-[9px] font-medium uppercase tracking-[0.1em] transition ${
                viewMode === "list" ? "bg-charcoal text-white" : "text-charcoal hover:bg-[#ece9e2]"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={`h-9 px-4 text-[9px] font-medium uppercase tracking-[0.1em] transition ${
                viewMode === "board" ? "bg-charcoal text-white" : "text-charcoal hover:bg-[#ece9e2]"
              }`}
            >
              Board
            </button>
          </div>
          <button
            type="button"
            onClick={() => { sessionStorage.removeItem(STORAGE_KEY); setAdminKey(null); setLeads(null); }}
            className="h-9 shrink-0 border border-charcoal/15 px-4 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal transition hover:border-charcoal"
          >
            Log out
          </button>
        </div>
      </div>

      {error && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-800">{error}</p>}
      {loading && <p className="text-[13px] text-warm-gray">Loading leads…</p>}

      {leads && leads.length === 0 && (
        <p className="text-[13px] text-warm-gray">No leads submitted yet.</p>
      )}

      {leads && leads.length > 0 && (
        <div className="mb-6 space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, company, contact, or reference…"
            className="h-11 w-full border border-charcoal/15 bg-white px-4 text-[13px] outline-none transition focus:border-charcoal/40"
          />
          {viewMode === "list" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] transition ${
                  statusFilter === "all" ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-charcoal hover:border-charcoal"
                }`}
              >
                All · {leads.length}
              </button>
              {tradeLeadStatuses.map((s) => {
                const count = leads.filter((lead) => lead.status === s).length;
                if (count === 0) return null;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`border px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] transition ${
                      statusFilter === s ? "border-charcoal bg-charcoal text-white" : "border-charcoal/15 text-charcoal hover:border-charcoal"
                    }`}
                  >
                    {TRADE_LEAD_STATUS_LABELS[s]} · {count}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(() => {
        const searchFilteredLeads = leads?.filter((lead) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          const d = lead.project.details;
          return [d.projectName, d.company, d.contactName, lead.reference].some((value) => (value || "").toLowerCase().includes(q));
        }) ?? [];

        if (viewMode === "board") {
          return (
            <LeadKanbanBoard
              leads={searchFilteredLeads}
              onMove={(id, status) => void handleUpdate(id, { status })}
              onSelect={(id) => { setExpandedId(id); setViewMode("list"); }}
            />
          );
        }

        return (
          <div className="space-y-3">
            {searchFilteredLeads.filter((lead) => statusFilter === "all" || lead.status === statusFilter).map((lead) => {
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
                      <span className={`border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] ${statusStyles(lead.status)}`}>
                        {TRADE_LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </div>
                  </button>
                  {expanded && <LeadDetail lead={lead} adminKey={adminKey} onSave={handleUpdate} />}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadMessage, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";
import { PageHeader, Panel, Badge, SegmentedControl, EmptyState, ErrorState, type BadgeTone } from "@/components/admin/ui";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function MessagesThread({ leadId, initialMessages }: { leadId: string; initialMessages: TradeLeadMessage[] }) {
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
        headers: { "Content-Type": "application/json" },
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
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Messages</p>
      <div className="rounded-xl border border-white/[0.08] bg-black/20">
        <div ref={listRef} className="max-h-[280px] space-y-2 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <p className="p-2 text-[12px] text-white/35">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === "steinheim" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-[12px] leading-[1.5] ${
                    message.from === "steinheim" ? "bg-[#c9a961] text-black" : "border border-white/10 bg-white/[0.04] text-white/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className={`mt-1 text-[9px] uppercase tracking-[0.08em] ${message.from === "steinheim" ? "text-black/50" : "text-white/35"}`}>
                    {message.from === "steinheim" ? "Steinheim" : "Client"} · {formatMessageTime(message.sentAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-white/[0.08] p-3">
          {error && <p className="mb-2 text-[11px] text-red-400">{error}</p>}
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
              className="min-h-[40px] flex-1 resize-none rounded-lg border border-white/10 bg-black/30 p-2.5 text-[12px] text-white outline-none focus:border-[#c9a961]"
            />
            <button
              type="button"
              disabled={!draft.trim() || sending}
              onClick={handleSend}
              className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a961] px-4 text-[11px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-30"
            >
              {sending ? "…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleRequestsList({ leadId, initialRequests }: { leadId: string; initialRequests: TradeLead["sampleRequests"] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleFulfill(requestId: string) {
    if (!window.confirm("Mark this sample request as fulfilled?")) return;
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/sample-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Sample requests</p>
      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/20">
        {requests.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="whitespace-pre-wrap text-[12px] text-white/80">{entry.note}</p>
              <p className="mt-1 whitespace-pre-wrap text-[11px] text-white/40">Deliver to: {entry.address}</p>
            </div>
            {entry.fulfilledAt ? (
              <Badge tone="positive">Fulfilled</Badge>
            ) : (
              <button
                type="button"
                disabled={busyId === entry.id}
                onClick={() => handleFulfill(entry.id)}
                className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-white/60 transition hover:border-[#c9a961]/50 hover:text-[#c9a961] disabled:opacity-40"
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

function DocumentsList({ leadId, initialDocuments }: { leadId: string; initialDocuments: TradeLead["documents"] }) {
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
        headers: { "Content-Type": "application/json" },
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
    if (!window.confirm("Remove this document from the lead? The client will no longer see it.")) return;
    setRemovingId(documentId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Documents</p>
      <div className="rounded-xl border border-white/[0.08] bg-black/20">
        {documents.length > 0 && (
          <div className="divide-y divide-white/[0.06]">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-[12px] text-[#c9a961] underline decoration-white/20">
                  {doc.label}
                </a>
                <button
                  type="button"
                  disabled={removingId === doc.id}
                  onClick={() => handleRemove(doc.id)}
                  className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-white/35 transition hover:text-red-400 disabled:opacity-40"
                >
                  {removingId === doc.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-2 border-t border-white/[0.08] p-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label, e.g. Commercial invoice"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 text-[12px] text-white outline-none focus:border-[#c9a961]"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 text-[12px] text-white outline-none focus:border-[#c9a961]"
          />
          <button
            type="button"
            disabled={!label.trim() || !url.trim() || adding}
            onClick={handleAdd}
            className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#c9a961] px-4 text-[11px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-30"
          >
            {adding ? "…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScopeStatusList({ leadId, lead }: { leadId: string; lead: TradeLead }) {
  const [statuses, setStatuses] = useState(lead.scopeStatuses);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleChange(scopeId: string, status: TradeLeadStatus) {
    setSavingId(scopeId);
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/scope-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/35">Status by room</p>
      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/20">
        {lead.scopeBreakdown.map((scope) => {
          const current = statuses.find((s) => s.scopeId === scope.scopeId)?.status ?? lead.status;
          return (
            <div key={scope.scopeId} className="flex items-center justify-between gap-3 p-3">
              <p className="min-w-0 truncate text-[12px] text-white/80">{scope.scopeName}</p>
              <select
                value={current}
                disabled={savingId === scope.scopeId}
                onChange={(e) => handleChange(scope.scopeId, e.target.value as TradeLeadStatus)}
                className="h-8 shrink-0 rounded-lg border border-white/10 bg-black/30 px-2 text-[11px] text-white/80 outline-none disabled:opacity-40"
              >
                {tradeLeadStatuses.map((s) => (
                  <option key={s} value={s} className="bg-[#131316]">
                    {TRADE_LEAD_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function priorityTone(priority: TradeLead["priority"]): BadgeTone {
  if (priority === "hot") return "danger";
  if (priority === "warm") return "warning";
  return "neutral";
}

function statusTone(status: TradeLeadStatus): BadgeTone {
  if (status === "lost") return "muted";
  if (status === "delivered") return "positive";
  if (status === "won" || status === "in_production" || status === "shipped") return "accent";
  if (status === "quoted") return "warning";
  return "neutral";
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
      className="cursor-grab rounded-lg border border-white/[0.08] bg-[#131316] p-3 transition hover:border-white/20 active:cursor-grabbing"
    >
      <Badge tone={priorityTone(lead.priority)}>{lead.priority}</Badge>
      <p className="mt-1.5 truncate text-[12px] font-medium text-white/90">
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

function LeadKanbanBoard({ leads, onMove, onSelect }: { leads: TradeLead[]; onMove: (id: string, status: TradeLeadStatus) => void; onSelect: (id: string) => void }) {
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LeadDetail({
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

export default function TradeAdminBoard() {
  const [leads, setLeads] = useState<TradeLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TradeLeadStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    void loadLeads();
  }, []);

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

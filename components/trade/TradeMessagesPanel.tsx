"use client";

import { useEffect, useRef, useState } from "react";
import { TRADE_LEAD_STATUS_LABELS, type TradeLeadMessage, type TradeLeadStatus } from "@/lib/trade-leads";
import ScheduleCallModal from "@/components/trade/ScheduleCallModal";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";

const CALL_TEMPLATE =
  "I'd like to schedule a call to discuss this project. Here are some times that work for me: ";
const SERVICE_TEMPLATE =
  "I'd like to book a service visit for a product from this project. Here are some times that work for me: ";

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TradeMessagesPanel({ leadId }: { leadId: string }) {
  const { markMessagesSeen } = useTradeProject();
  const [messages, setMessages] = useState<TradeLeadMessage[] | null>(null);
  const [status, setStatus] = useState<TradeLeadStatus | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"call" | "service" | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch(`/api/trade/leads/${leadId}/messages`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      if (data.status) setStatus(data.status);
    } catch {
      // Keep whatever we last had; a poll will retry shortly.
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Opening this panel counts as reading whatever Steinheim has sent so far.
  useEffect(() => {
    markMessagesSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, messages]);

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
        body: JSON.stringify({ from: "customer", body: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((current) => [...(current ?? []), data.message]);
      setDraft("");
    } catch {
      setError("Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {status && (
        <div className="flex shrink-0 items-center justify-between border-b border-charcoal/8 bg-[#ece9e2] px-7 py-3">
          <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Project status</p>
          <span className="border border-charcoal/15 bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-charcoal">
            {TRADE_LEAD_STATUS_LABELS[status]}
          </span>
        </div>
      )}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-7 py-5">
        {messages === null ? (
          <p className="text-[12px] text-warm-gray">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-heading text-[18px] text-charcoal" style={{ fontStyle: "italic" }}>
              Talk to Steinheim
            </p>
            <p className="mt-2 max-w-[260px] text-[12px] leading-relaxed text-warm-gray">
              Ask a question, request a call, or follow up on your submission — the team replies here and by email.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.from === "customer" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-[1.5] ${
                message.from === "customer" ? "bg-charcoal text-white" : "border border-charcoal/10 bg-[#ece9e2] text-charcoal"
              }`}>
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1.5 text-[9px] uppercase tracking-[0.08em] ${message.from === "customer" ? "text-white/40" : "text-warm-gray"}`}>
                  {message.from === "customer" ? "You" : "Steinheim"} · {formatTime(message.sentAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t border-charcoal/8 p-5">
        {error && <p className="mb-2 text-[11px] text-red-700">{error}</p>}
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => setScheduleMode("call")}
            className="flex h-8 items-center gap-1.5 border border-charcoal/15 px-3 text-[10px] font-medium uppercase tracking-[0.1em] text-warm-gray transition hover:border-charcoal hover:text-charcoal"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Schedule a call
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("service")}
            className="flex h-8 items-center gap-1.5 border border-charcoal/15 px-3 text-[10px] font-medium uppercase tracking-[0.1em] text-warm-gray transition hover:border-charcoal hover:text-charcoal"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.4-3.4a5 5 0 01-6.8 6.8L5 22l-3-3 9.3-9.3a5 5 0 016.8-6.8l-3.4 3.4z" /></svg>
            Request a service visit
          </button>
        </div>
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
            placeholder="Message Steinheim…"
            rows={2}
            className="min-h-[42px] flex-1 resize-none border border-charcoal/12 bg-white p-3 text-[13px] outline-none transition focus:border-charcoal/40"
          />
          <button
            type="button"
            disabled={!draft.trim() || sending}
            onClick={handleSend}
            className="flex h-[42px] shrink-0 items-center justify-center bg-charcoal px-5 text-[10px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-black disabled:opacity-30"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>
      </div>

      <ScheduleCallModal
        open={scheduleMode !== null}
        onClose={() => setScheduleMode(null)}
        onRequestByMessage={() => setDraft((current) => (current ? current : scheduleMode === "service" ? SERVICE_TEMPLATE : CALL_TEMPLATE))}
        title={scheduleMode === "service" ? "Request a service visit" : "Schedule a call"}
        fallbackCopy={
          scheduleMode === "service"
            ? "Live booking isn't set up yet — send Steinheim a message with a few times that work for a technician to visit, and the team will confirm one directly in this thread."
            : undefined
        }
        ctaLabel={scheduleMode === "service" ? "Request a service visit by message" : undefined}
      />
    </div>
  );
}

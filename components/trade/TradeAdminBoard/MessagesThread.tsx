"use client";

import { useEffect, useRef, useState } from "react";
import type { TradeLeadMessage } from "@/lib/trade-leads";

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function MessagesThread({ leadId, initialMessages }: { leadId: string; initialMessages: TradeLeadMessage[] }) {
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
                    message.from === "steinheim" ? "bg-[#0a84ff] text-white" : "border border-white/10 bg-white/[0.04] text-white/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className={`mt-1 text-[9px] uppercase tracking-[0.08em] ${message.from === "steinheim" ? "text-white/70" : "text-white/35"}`}>
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
              className="min-h-[40px] flex-1 resize-none rounded-lg border border-white/10 bg-black/30 p-2.5 text-[12px] text-white outline-none focus:border-[#0a84ff]"
            />
            <button
              type="button"
              disabled={!draft.trim() || sending}
              onClick={handleSend}
              className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#0a84ff] px-4 text-[11px] font-medium text-white transition hover:bg-[#3d9dff] disabled:opacity-30"
            >
              {sending ? "…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

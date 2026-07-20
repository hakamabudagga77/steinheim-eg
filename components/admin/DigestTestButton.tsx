"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

export default function DigestTestButton() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/cron/daily-digest");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.sent) {
        setStatus("error");
        setMessage(data.reason || data.error || "Could not send.");
        return;
      }
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setMessage("Could not reach the server.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={send}
        disabled={status === "sending"}
        className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[12px] text-white/60 transition hover:border-[#c9a961]/50 hover:text-[#c9a961] disabled:opacity-40"
      >
        {status === "sent" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Mail className="h-3.5 w-3.5" />}
        {status === "sending" ? "Sending…" : status === "sent" ? "Sent" : "Send test digest"}
      </button>
      {message && <span className="text-[11px] text-amber-300">{message}</span>}
    </div>
  );
}

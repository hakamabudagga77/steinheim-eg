"use client";

import { useState } from "react";
import { Badge } from "@/components/admin/ui";
import type { TradeLead } from "@/lib/trade-leads";

export function SampleRequestsList({ leadId, initialRequests }: { leadId: string; initialRequests: TradeLead["sampleRequests"] }) {
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

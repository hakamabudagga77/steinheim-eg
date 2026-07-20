"use client";

import { useState } from "react";
import { tradeLeadStatuses, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadStatus } from "@/lib/trade-leads";

export function ScopeStatusList({ leadId, lead }: { leadId: string; lead: TradeLead }) {
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

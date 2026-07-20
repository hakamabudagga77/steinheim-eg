import "server-only";

import type { TradeLead } from "@/lib/trade-leads";
import { createRedisJsonStore } from "@/lib/server/redis-json-store";

const store = createRedisJsonStore<TradeLead>({
  redisKey: "steinheim:trade:leads",
  localFileName: "trade-leads.json",
  maxEntries: 500,
  notConfiguredError: "TRADE_STORE_NOT_CONFIGURED",
});

function normalizeLead(lead: TradeLead): TradeLead {
  return {
    ...lead,
    messages: Array.isArray(lead.messages) ? lead.messages : [],
    sampleRequests: Array.isArray(lead.sampleRequests) ? lead.sampleRequests : [],
    documents: Array.isArray(lead.documents) ? lead.documents : [],
    scopeStatuses: Array.isArray(lead.scopeStatuses) ? lead.scopeStatuses : [],
    quoteHistory: Array.isArray(lead.quoteHistory) ? lead.quoteHistory : [],
  };
}

export async function listTradeLeads() {
  const leads = await store.list();
  return leads.map(normalizeLead).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getTradeLead(id: string): Promise<TradeLead | null> {
  const lead = await store.get(id);
  return lead ? normalizeLead(lead) : null;
}

export async function saveTradeLead(lead: TradeLead) {
  await store.save(lead);
}

export async function updateTradeLead(id: string, update: Partial<TradeLead>) {
  const leads = await listTradeLeads();
  const existing = leads.find((entry) => entry.id === id);
  if (!existing) return null;
  const lead: TradeLead = { ...existing, ...update, id: existing.id, updatedAt: new Date().toISOString() };
  await saveTradeLead(lead);
  return lead;
}

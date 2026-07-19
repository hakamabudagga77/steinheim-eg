import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { TradeLead } from "@/lib/trade-leads";
import { redisCommand, redisConfig } from "@/lib/server/redis";

const REDIS_KEY = "steinheim:trade:leads";
const localFile = path.join(process.cwd(), "data", "runtime", "trade-leads.json");

async function readLocalLeads() {
  try {
    const value = JSON.parse(await readFile(localFile, "utf8"));
    return Array.isArray(value) ? value as TradeLead[] : [];
  } catch {
    return [];
  }
}

async function writeLocalLeads(leads: TradeLead[]) {
  await mkdir(path.dirname(localFile), { recursive: true });
  await writeFile(localFile, JSON.stringify(leads.slice(0, 500), null, 2), "utf8");
}

function requireConfiguredProductionStore() {
  if (process.env.NODE_ENV === "production" && !redisConfig()) {
    throw new Error("TRADE_STORE_NOT_CONFIGURED");
  }
}

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
  requireConfiguredProductionStore();
  const redisResult = await redisCommand(["HGETALL", REDIS_KEY]);
  let leads: TradeLead[];
  if (redisResult) {
    const entries = Array.isArray(redisResult) ? redisResult : [];
    leads = entries.flatMap((value, index) => {
      if (index % 2 === 0 || typeof value !== "string") return [];
      try {
        return [JSON.parse(value) as TradeLead];
      } catch {
        return [];
      }
    });
  } else {
    leads = await readLocalLeads();
  }
  return leads.map(normalizeLead).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getTradeLead(id: string): Promise<TradeLead | null> {
  requireConfiguredProductionStore();
  const config = redisConfig();
  if (config) {
    const redisResult = await redisCommand(["HGET", REDIS_KEY, id]);
    if (typeof redisResult !== "string") return null;
    try {
      return normalizeLead(JSON.parse(redisResult) as TradeLead);
    } catch {
      return null;
    }
  }
  const leads = await readLocalLeads();
  const found = leads.find((entry) => entry.id === id);
  return found ? normalizeLead(found) : null;
}

export async function saveTradeLead(lead: TradeLead) {
  requireConfiguredProductionStore();
  const redisResult = await redisCommand(["HSET", REDIS_KEY, lead.id, JSON.stringify(lead)]);
  if (redisResult !== null) return;
  const leads = await readLocalLeads();
  const next = [lead, ...leads.filter((entry) => entry.id !== lead.id)];
  await writeLocalLeads(next);
}

export async function updateTradeLead(id: string, update: Partial<TradeLead>) {
  const leads = await listTradeLeads();
  const existing = leads.find((entry) => entry.id === id);
  if (!existing) return null;
  const lead: TradeLead = { ...existing, ...update, id: existing.id, updatedAt: new Date().toISOString() };
  await saveTradeLead(lead);
  return lead;
}

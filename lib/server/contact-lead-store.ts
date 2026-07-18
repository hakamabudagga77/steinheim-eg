import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ContactLead } from "@/lib/contact-leads";

const REDIS_KEY = "steinheim:contact:leads";
const localFile = path.join(process.cwd(), "data", "runtime", "contact-leads.json");

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function redisCommand(command: Array<string | number>) {
  const config = redisConfig();
  if (!config) return null;
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Contact lead store returned ${response.status}`);
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

async function readLocalLeads() {
  try {
    const value = JSON.parse(await readFile(localFile, "utf8"));
    return Array.isArray(value) ? (value as ContactLead[]) : [];
  } catch {
    return [];
  }
}

async function writeLocalLeads(leads: ContactLead[]) {
  await mkdir(path.dirname(localFile), { recursive: true });
  await writeFile(localFile, JSON.stringify(leads.slice(0, 1000), null, 2), "utf8");
}

function requireConfiguredProductionStore() {
  if (process.env.NODE_ENV === "production" && !redisConfig()) {
    throw new Error("CONTACT_STORE_NOT_CONFIGURED");
  }
}

export async function listContactLeads(): Promise<ContactLead[]> {
  requireConfiguredProductionStore();
  const redisResult = await redisCommand(["HGETALL", REDIS_KEY]);
  let leads: ContactLead[];
  if (redisResult) {
    const entries = Array.isArray(redisResult) ? redisResult : [];
    leads = entries.flatMap((value, index) => {
      if (index % 2 === 0 || typeof value !== "string") return [];
      try {
        return [JSON.parse(value) as ContactLead];
      } catch {
        return [];
      }
    });
  } else {
    leads = await readLocalLeads();
  }
  return leads.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function saveContactLead(lead: ContactLead) {
  requireConfiguredProductionStore();
  const redisResult = await redisCommand(["HSET", REDIS_KEY, lead.id, JSON.stringify(lead)]);
  if (redisResult !== null) return;
  const leads = await readLocalLeads();
  const next = [lead, ...leads.filter((entry) => entry.id !== lead.id)];
  await writeLocalLeads(next);
}

export async function updateContactLead(id: string, update: Partial<ContactLead>) {
  const leads = await listContactLeads();
  const existing = leads.find((entry) => entry.id === id);
  if (!existing) return null;
  const lead: ContactLead = { ...existing, ...update, id: existing.id };
  await saveContactLead(lead);
  return lead;
}

import "server-only";

import type { ContactLead } from "@/lib/contact-leads";
import { createRedisJsonStore } from "@/lib/server/redis-json-store";

const store = createRedisJsonStore<ContactLead>({
  redisKey: "steinheim:contact:leads",
  localFileName: "contact-leads.json",
  maxEntries: 1000,
  notConfiguredError: "CONTACT_STORE_NOT_CONFIGURED",
});

export async function listContactLeads(): Promise<ContactLead[]> {
  const leads = await store.list();
  return leads.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function saveContactLead(lead: ContactLead) {
  await store.save(lead);
}

export async function updateContactLead(id: string, update: Partial<ContactLead>) {
  const leads = await listContactLeads();
  const existing = leads.find((entry) => entry.id === id);
  if (!existing) return null;
  const lead: ContactLead = { ...existing, ...update, id: existing.id };
  await saveContactLead(lead);
  return lead;
}

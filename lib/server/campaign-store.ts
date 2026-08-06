import "server-only";

import { createRedisJsonStore } from "@/lib/server/redis-json-store";
import { CAMPAIGNS, type CampaignRecord } from "@/lib/campaigns";

// Persistence for the no-code campaign manager (admin UI at /admin/campaigns).
// Redis-backed in production with the same atomic local-file fallback the lead
// stores use in local dev. The repo-seeded CAMPAIGNS records double as the
// fallback so the public banner works before anything is written.

const store = createRedisJsonStore<CampaignRecord>({
  redisKey: "steinheim:campaigns",
  localFileName: "campaigns.json",
  maxEntries: 50,
  notConfiguredError: "Campaigns store requires Redis in production.",
});

/** Returns persisted records, or the shipped seeds when nothing is stored yet. */
export async function listCampaigns(): Promise<CampaignRecord[]> {
  const records = await store.list();
  if (records.length > 0) return records;
  return CAMPAIGNS.map((campaign) => ({ ...campaign }));
}

export function saveCampaign(record: CampaignRecord): Promise<void> {
  return store.save(record);
}

export function deleteCampaign(id: string): Promise<void> {
  return store.remove(id);
}

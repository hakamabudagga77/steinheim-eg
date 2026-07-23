import "server-only";

import type { RestockAlertSubscription } from "@/lib/restock-alerts";
import { createRedisJsonStore } from "@/lib/server/redis-json-store";

const store = createRedisJsonStore<RestockAlertSubscription>({
  redisKey: "steinheim:restock-alerts",
  localFileName: "restock-alerts.json",
  maxEntries: 5000,
  notConfiguredError: "RESTOCK_ALERT_STORE_NOT_CONFIGURED",
});

export async function listRestockAlerts(): Promise<RestockAlertSubscription[]> {
  return store.list();
}

export async function listPendingRestockAlerts(): Promise<RestockAlertSubscription[]> {
  const all = await listRestockAlerts();
  return all.filter((entry) => !entry.notifiedAt);
}

export async function saveRestockAlert(subscription: RestockAlertSubscription) {
  await store.save(subscription);
}

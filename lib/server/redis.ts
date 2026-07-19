import "server-only";

// Shared Upstash Redis REST client. Centralizes what used to be duplicated
// verbatim across contact-lead-store.ts and trade-lead-store.ts, and backs
// the rate limiter and the Shopify product cache below.

export function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export async function redisCommand(command: Array<string | number>): Promise<unknown> {
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
  if (!response.ok) throw new Error(`Redis command failed: ${response.status}`);
  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

/** Runs multiple commands in one round trip via Upstash's pipeline endpoint. */
export async function redisPipeline(commands: Array<Array<string | number>>): Promise<unknown[] | null> {
  const config = redisConfig();
  if (!config) return null;
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis pipeline failed: ${response.status}`);
  const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  return payload.map((entry) => entry.result ?? null);
}

export async function redisGet(key: string): Promise<string | null> {
  const result = await redisCommand(["GET", key]);
  return typeof result === "string" ? result : null;
}

export async function redisSetEx(key: string, seconds: number, value: string): Promise<void> {
  await redisCommand(["SET", key, value, "EX", seconds]);
}

export async function redisDel(key: string): Promise<void> {
  await redisCommand(["DEL", key]);
}

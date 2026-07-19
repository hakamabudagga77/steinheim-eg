import "server-only";

import { redisCommand, redisConfig } from "@/lib/server/redis";

// In-memory fallback so rate limiting still works locally (no Redis
// configured) and never throws — an unreachable limiter must never block
// a real request. On serverless with Redis configured, this map is
// per-instance only and the Redis path below is what actually matters.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request, scope: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  return `steinheim:ratelimit:${scope}:${ip}`;
}

/**
 * Fixed-window rate limit shared across all serverless instances via Redis
 * (falls back to a per-instance in-memory window when Redis isn't
 * configured, e.g. local dev). Returns true when the request is allowed.
 */
export async function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const key = clientKey(request, scope);

  if (redisConfig()) {
    try {
      const count = (await redisCommand(["INCR", key])) as number;
      if (count === 1) {
        await redisCommand(["EXPIRE", key, windowSeconds]);
      }
      return count <= limit;
    } catch {
      // Redis unreachable — fail open to the in-memory fallback rather
      // than blocking legitimate traffic on an infrastructure hiccup.
    }
  }

  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

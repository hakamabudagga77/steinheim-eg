import "server-only";

import { redisConfig, redisPipeline } from "@/lib/server/redis";

// In-memory fallback so rate limiting still works locally (no Redis
// configured) and never throws — an unreachable limiter must never block
// a real request. On serverless with Redis configured, this map is
// per-instance only and the Redis path below is what actually matters.
const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

const MAX_MEMORY_BUCKETS = 5000;

/**
 * Resolves a reasonably trustworthy client identifier for rate limiting.
 *
 * Precedence:
 *   1. `request.ip` — populated by the platform runtime (Vercel, Node) and
 *      not client-settable.
 *   2. Platform proxy headers that only the host can set.
 *   3. The *last* segment of `x-forwarded-for`. The header starts as
 *      client-supplied and each trusted proxy appends the address it sees,
 *      so the final hop is the closest to the real client. Reading hop [0]
 *      (the previous behavior) let any caller mint a fresh bucket per
 *      request and defeat every limit in the app.
 */
export function clientIp(request: Request): string {
  const runtimeIp = (request as Request & { ip?: string }).ip;
  if (runtimeIp) return runtimeIp;

  for (const header of ["x-vercel-forwarded-for", "x-vercel-ip", "cf-connecting-ip", "x-real-ip"]) {
    const value = request.headers.get(header)?.trim();
    if (value) return value.split(",")[0]!.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((hop) => hop.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }

  return "anonymous";
}

function clientKey(request: Request, scope: string) {
  return `steinheim:ratelimit:${scope}:${clientIp(request)}`;
}

function pruneExpiredMemoryBuckets(now: number) {
  if (memoryBuckets.size < MAX_MEMORY_BUCKETS) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
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
      // Window creation and the increment travel as one pipelined round trip:
      // SET NX sets the TTL atomically at creation, INCR counts the request.
      // The old INCR-then-EXPIRE pair could leave a permanent bucket if the
      // process died between the two calls.
      const results = await redisPipeline([
        ["SET", key, "0", "EX", windowSeconds, "NX"],
        ["INCR", key],
      ]);
      const count = Number(results?.[1] ?? 0);
      return count <= limit;
    } catch {
      // Redis unreachable — fail open to the in-memory fallback rather
      // than blocking legitimate traffic on an infrastructure hiccup.
    }
  }

  const now = Date.now();
  pruneExpiredMemoryBuckets(now);
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

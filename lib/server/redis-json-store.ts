import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { redisCommand, redisConfig } from "@/lib/server/redis";

// Shared by trade-lead-store.ts and contact-lead-store.ts, which used to
// duplicate this Redis-hash-with-local-file-fallback pattern verbatim.
// Production requires Redis (see requireConfiguredProductionStore); the local
// file is a local-dev convenience only. Two things this version fixes over
// the old duplicated copies:
//   1. Local-file writes are now atomic (write to a temp file, then rename
//      over the target) instead of a plain writeFile, so a reader never sees
//      a partially-written file and two concurrent writers can't interleave
//      bytes into a corrupt result.
//   2. Redis calls are caught rather than left to throw uncaught -- a
//      transient Redis blip now falls back to the local file instead of
//      hard-failing the request with a 500.

interface RedisJsonStoreOptions {
  /** Redis hash key holding every record, keyed by id. */
  redisKey: string;
  /** Filename (not a path) for the local dev fallback, under data/runtime/. */
  localFileName: string;
  /** Max records retained in the local-file fallback. */
  maxEntries: number;
  /** Error message thrown when running in production with no Redis configured. */
  notConfiguredError: string;
}

export function createRedisJsonStore<T extends { id: string }>(options: RedisJsonStoreOptions) {
  const localFile = path.join(process.cwd(), "data", "runtime", options.localFileName);

  async function readLocal(): Promise<T[]> {
    try {
      const value = JSON.parse(await readFile(localFile, "utf8"));
      return Array.isArray(value) ? (value as T[]) : [];
    } catch {
      return [];
    }
  }

  async function writeLocal(records: T[]): Promise<void> {
    await mkdir(path.dirname(localFile), { recursive: true });
    const tmpFile = `${localFile}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpFile, JSON.stringify(records.slice(0, options.maxEntries), null, 2), "utf8");
    await rename(tmpFile, localFile);
  }

  function requireConfiguredProductionStore() {
    if (process.env.NODE_ENV === "production" && !redisConfig()) {
      throw new Error(options.notConfiguredError);
    }
  }

  async function list(): Promise<T[]> {
    requireConfiguredProductionStore();
    const redisResult = await redisCommand(["HGETALL", options.redisKey]).catch(() => null);
    if (redisResult) {
      const entries = Array.isArray(redisResult) ? redisResult : [];
      return entries.flatMap((value, index) => {
        if (index % 2 === 0 || typeof value !== "string") return [];
        try {
          return [JSON.parse(value) as T];
        } catch {
          return [];
        }
      });
    }
    return readLocal();
  }

  async function get(id: string): Promise<T | null> {
    requireConfiguredProductionStore();
    if (redisConfig()) {
      const redisResult = await redisCommand(["HGET", options.redisKey, id]).catch(() => undefined);
      if (typeof redisResult === "string") {
        try {
          return JSON.parse(redisResult) as T;
        } catch {
          return null;
        }
      }
      if (redisResult === null) return null;
      // redisResult is undefined here only when the Redis call itself
      // errored -- fall through to the local file rather than failing.
    }
    const records = await readLocal();
    return records.find((entry) => entry.id === id) ?? null;
  }

  async function save(record: T): Promise<void> {
    requireConfiguredProductionStore();
    const redisResult = await redisCommand(["HSET", options.redisKey, record.id, JSON.stringify(record)]).catch(
      () => undefined
    );
    if (redisResult !== null && redisResult !== undefined) return;
    const records = await readLocal();
    const next = [record, ...records.filter((entry) => entry.id !== record.id)];
    await writeLocal(next);
  }

  return { list, get, save };
}

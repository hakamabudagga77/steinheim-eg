"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RECENTLY_VIEWED_STORAGE_KEY,
  recordView,
  sanitizeRecentlyViewed,
  type RecentlyViewedEntry,
} from "@/lib/recently-viewed";

function readStored(): RecentlyViewedEntry[] {
  try {
    const stored = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!stored) return [];
    return sanitizeRecentlyViewed(JSON.parse(stored)) ?? [];
  } catch {
    return [];
  }
}

/** Read-only: the current recently-viewed list, refreshed on mount. */
export function useRecentlyViewed(): RecentlyViewedEntry[] {
  const [entries, setEntries] = useState<RecentlyViewedEntry[]>([]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setEntries(readStored()), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  return entries;
}

/** Records a product view once per mount (call with the viewed product's slug). */
export function useRecordProductView(slug: string) {
  const record = useCallback((s: string) => {
    const next = recordView(readStored(), s);
    try {
      window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private browsing, quota) — viewing history is a nice-to-have, fail silently.
    }
  }, []);

  useEffect(() => {
    record(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-record when the viewed product itself changes, not on every render
  }, [slug]);
}

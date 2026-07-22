"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  COMPARISON_MAX_ITEMS,
  COMPARISON_STORAGE_KEY,
  createEmptyComparison,
  sanitizeComparison,
  type Comparison,
} from "@/lib/comparison";

interface ComparisonContextValue {
  comparison: Comparison;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (slug: string, finish: string) => void;
  removeItem: (slug: string, finish: string) => void;
  toggleItem: (slug: string, finish: string) => void;
  isInComparison: (slug: string, finish: string) => boolean;
  clearComparison: () => void;
  itemCount: number;
  atMax: boolean;
}

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

function readStoredComparison() {
  try {
    const stored = window.localStorage.getItem(COMPARISON_STORAGE_KEY);
    return stored ? sanitizeComparison(JSON.parse(stored)) : null;
  } catch {
    window.localStorage.removeItem(COMPARISON_STORAGE_KEY);
    return null;
  }
}

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparison, setComparison] = useState<Comparison>(createEmptyComparison);
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const parsed = readStoredComparison();
      hydrated.current = true;
      if (parsed) setComparison(parsed);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(comparison));
  }, [comparison]);

  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key !== COMPARISON_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = sanitizeComparison(JSON.parse(e.newValue));
        if (parsed) setComparison(parsed);
      } catch {}
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const isInComparison = useCallback(
    (slug: string, finish: string) => comparison.items.some((i) => i.slug === slug && i.finish === finish),
    [comparison]
  );

  const addItem = useCallback((slug: string, finish: string) => {
    setComparison((prev) => {
      if (prev.items.some((i) => i.slug === slug && i.finish === finish)) return prev;
      if (prev.items.length >= COMPARISON_MAX_ITEMS) return prev;
      return { items: [...prev.items, { slug, finish }], updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeItem = useCallback((slug: string, finish: string) => {
    setComparison((prev) => ({
      items: prev.items.filter((i) => !(i.slug === slug && i.finish === finish)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const toggleItem = useCallback(
    (slug: string, finish: string) => {
      if (isInComparison(slug, finish)) removeItem(slug, finish);
      else addItem(slug, finish);
    },
    [isInComparison, addItem, removeItem]
  );

  const clearComparison = useCallback(() => {
    setComparison({ items: [], updatedAt: new Date().toISOString() });
    setOpen(false);
  }, []);

  const itemCount = comparison.items.length;
  const atMax = itemCount >= COMPARISON_MAX_ITEMS;

  const value = useMemo(
    () => ({ comparison, open, setOpen, addItem, removeItem, toggleItem, isInComparison, clearComparison, itemCount, atMax }),
    [comparison, open, addItem, removeItem, toggleItem, isInComparison, clearComparison, itemCount, atMax]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const value = useContext(ComparisonContext);
  if (!value) throw new Error("useComparison must be used inside ComparisonProvider");
  return value;
}

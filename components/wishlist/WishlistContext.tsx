"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyWishlist,
  sanitizeWishlist,
  WISHLIST_STORAGE_KEY,
  type Wishlist,
} from "@/lib/wishlist";

interface WishlistContextValue {
  wishlist: Wishlist;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (slug: string, finish: string) => void;
  removeItem: (slug: string, finish: string) => void;
  toggleItem: (slug: string, finish: string) => void;
  isInWishlist: (slug: string, finish: string) => boolean;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStoredWishlist() {
  try {
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return stored ? sanitizeWishlist(JSON.parse(stored)) : null;
  } catch {
    window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
    return null;
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Wishlist>(createEmptyWishlist);
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const parsed = readStoredWishlist();
      hydrated.current = true;
      if (parsed) setWishlist(parsed);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key !== WISHLIST_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = sanitizeWishlist(JSON.parse(e.newValue));
        if (parsed) setWishlist(parsed);
      } catch {}
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const addItem = useCallback((slug: string, finish: string) => {
    setWishlist((prev) => {
      if (prev.items.some((i) => i.slug === slug && i.finish === finish)) return prev;
      return { items: [...prev.items, { slug, finish }], updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeItem = useCallback((slug: string, finish: string) => {
    setWishlist((prev) => ({
      items: prev.items.filter((i) => !(i.slug === slug && i.finish === finish)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const isInWishlist = useCallback(
    (slug: string, finish: string) => wishlist.items.some((i) => i.slug === slug && i.finish === finish),
    [wishlist]
  );

  const toggleItem = useCallback(
    (slug: string, finish: string) => {
      if (isInWishlist(slug, finish)) removeItem(slug, finish);
      else addItem(slug, finish);
    },
    [isInWishlist, addItem, removeItem]
  );

  const clearWishlist = useCallback(() => {
    setWishlist({ items: [], updatedAt: new Date().toISOString() });
  }, []);

  const itemCount = wishlist.items.length;

  // Stable value identity so consumers only re-render on real wishlist changes.
  const value = useMemo(
    () => ({ wishlist, open, setOpen, addItem, removeItem, toggleItem, isInWishlist, clearWishlist, itemCount }),
    [wishlist, open, addItem, removeItem, toggleItem, isInWishlist, clearWishlist, itemCount]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}

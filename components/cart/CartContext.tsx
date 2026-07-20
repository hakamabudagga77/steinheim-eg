"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyCart,
  sanitizeCart,
  CART_STORAGE_KEY,
  type Cart,
  type CartItem,
} from "@/lib/cart";
import { useFlyAnimation } from "@/components/ui/useFlyAnimation";

interface CartContextValue {
  cart: Cart;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (slug: string, finish: string, quantity?: number) => void;
  updateQuantity: (slug: string, finish: string, quantity: number) => void;
  removeItem: (slug: string, finish: string) => void;
  clearCart: () => void;
  itemCount: number;
  cartIconRef: React.RefObject<HTMLButtonElement | null>;
  flyToCart: (originEl: HTMLElement | null, image: string) => void;
  bump: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart() {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? sanitizeCart(JSON.parse(stored)) : null;
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
    return null;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(createEmptyCart);
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);
  const cartIconRef = useRef<HTMLButtonElement | null>(null);
  const [bump, setBump] = useState(0);
  const { fly, FlightLayer } = useFlyAnimation(cartIconRef);

  const flyToCart = useCallback(
    (originEl: HTMLElement | null, image: string) => {
      fly(originEl, image, () => setBump((b) => b + 1));
    },
    [fly]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const parsed = readStoredCart();
      hydrated.current = true;
      if (parsed) setCart(parsed);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    function sync(e: StorageEvent) {
      if (e.key !== CART_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = sanitizeCart(JSON.parse(e.newValue));
        if (parsed) setCart(parsed);
      } catch {}
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const update = useCallback((fn: (items: CartItem[]) => CartItem[]) => {
    setCart((prev) => ({
      items: fn(prev.items),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addItem = useCallback(
    (slug: string, finish: string, quantity = 1) => {
      update((items) => {
        const existing = items.find((i) => i.slug === slug && i.finish === finish);
        if (existing) {
          return items.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i
          );
        }
        return [...items, { slug, finish, quantity: Math.max(1, quantity) }];
      });
      setOpen(true);
    },
    [update]
  );

  const updateQuantity = useCallback(
    (slug: string, finish: string, quantity: number) => {
      update((items) =>
        items.map((i) =>
          i.slug === slug && i.finish === finish
            ? { ...i, quantity: Math.max(1, Math.min(99, Math.round(quantity) || 1)) }
            : i
        )
      );
    },
    [update]
  );

  const removeItem = useCallback(
    (slug: string, finish: string) => {
      update((items) => items.filter((i) => !(i.slug === slug && i.finish === finish)));
    },
    [update]
  );

  const clearCart = useCallback(() => {
    setCart({ items: [], updatedAt: new Date().toISOString() });
  }, []);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  // Stable value identity: flight animations update provider-local state and
  // must not re-render every context consumer mid-animation.
  const value = useMemo(
    () => ({
      cart,
      open,
      setOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount,
      cartIconRef,
      flyToCart,
      bump,
    }),
    [cart, open, addItem, updateQuantity, removeItem, clearCart, itemCount, flyToCart, bump]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <FlightLayer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

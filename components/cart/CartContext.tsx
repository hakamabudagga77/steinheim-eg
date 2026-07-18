"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createEmptyCart,
  sanitizeCart,
  CART_STORAGE_KEY,
  type Cart,
  type CartItem,
} from "@/lib/cart";

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

interface Flight {
  id: number;
  image: string;
  start: DOMRect;
  end: DOMRect;
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
  const flightId = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bump, setBump] = useState(0);

  const flyToCart = useCallback((originEl: HTMLElement | null, image: string) => {
    if (!originEl || !cartIconRef.current) return;
    const start = originEl.getBoundingClientRect();
    const end = cartIconRef.current.getBoundingClientRect();
    const id = ++flightId.current;
    setFlights((f) => [...f, { id, image, start, end }]);
    window.setTimeout(() => {
      setFlights((f) => f.filter((item) => item.id !== id));
      setBump((b) => b + 1);
    }, 750);
  }, []);

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
      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.id}
            initial={{
              left: flight.start.left,
              top: flight.start.top,
              width: flight.start.width,
              height: flight.start.height,
              opacity: 1,
              borderRadius: 20,
            }}
            animate={{
              left: flight.end.left + flight.end.width / 2 - 13,
              top: flight.end.top + flight.end.height / 2 - 13,
              width: 26,
              height: 26,
              opacity: [1, 1, 0],
              borderRadius: 999,
            }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "fixed", zIndex: 200, overflow: "hidden", pointerEvents: "none" }}
          >
            <img src={flight.image} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

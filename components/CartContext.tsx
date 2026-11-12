'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '@/lib/types';

export type CartItem = { product: Product; qty: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'hms-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load from localStorage after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i?.product?.id));
      }
    } catch {
      // ignore corrupt storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full / unavailable — cart still works in memory
    }
  }, [items, loaded]);

  const addItem = useCallback((product: Product, qty = 1) => {
    if (product.is_sold_out) return;
    setItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product.id !== id)
        : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const i of items) {
      c += i.qty;
      s += i.qty * i.product.price;
    }
    return { count: c, subtotal: s };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [items, count, subtotal, addItem, removeItem, updateQty, clearCart, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

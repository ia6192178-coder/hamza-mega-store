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
import type { Product, ProductVariant } from '@/lib/types';

// One cart line = one product + one chosen variant (or no variant for
// simple products). Lines are keyed by product+variant so the same product
// in two sizes stays as two separate lines.
export type CartItem = {
  product: Product;
  qty: number;
  variant?: ProductVariant | null;
};

export function lineKey(productId: number, variantId?: number | null): string {
  return `${productId}:${variantId ?? 0}`;
}

export function itemKey(item: CartItem): string {
  return lineKey(item.product.id, item.variant?.id);
}

/** Price actually paid for a line — the variant's price when one is chosen. */
export function linePrice(item: CartItem): number {
  return item.variant ? item.variant.price : item.product.price;
}

/** Display name for a line, e.g. "Men's Running Shoes — UK 9". */
export function lineName(item: CartItem): string {
  return item.variant
    ? `${item.product.name} — ${item.variant.label}`
    : item.product.name;
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, qty?: number, variant?: ProductVariant | null) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
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
  // Carts saved before the variants update have no `variant` field — they
  // load as plain lines and keep working.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(
            parsed
              .filter((i) => i?.product?.id)
              .map((i) => ({ ...i, variant: i.variant ?? null })),
          );
        }
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

  const addItem = useCallback(
    (product: Product, qty = 1, variant: ProductVariant | null = null) => {
      if (product.is_sold_out) return;
      if (variant && variant.stock <= 0) return;
      if (!variant && product.stock <= 0) return;
      const key = lineKey(product.id, variant?.id);
      setItems((prev) => {
        const found = prev.find((i) => itemKey(i) === key);
        if (found) {
          return prev.map((i) =>
            itemKey(i) === key ? { ...i, qty: i.qty + qty } : i,
          );
        }
        return [...prev, { product, qty, variant: variant ?? null }];
      });
    },
    [],
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => itemKey(i) !== key));
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => itemKey(i) !== key)
        : prev.map((i) => (itemKey(i) === key ? { ...i, qty } : i)),
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
      s += i.qty * linePrice(i);
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

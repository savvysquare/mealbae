import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  cartItemId: string;
  mealId: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  customLabel?: string;
}

// Legacy shape kept as a computed view so existing screens keep working
export interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
}

const KEY = "mealbae.cart.v3";
const LEGACY_KEY = "mealbae.cart.v2";

interface Ctx {
  cart: CartState;
  itemsByRestaurant: { restaurantId: string; restaurantName: string; items: CartItem[]; subtotal: number }[];
  add: (restaurantId: string, restaurantName: string, item: Omit<CartItem, "restaurantId" | "restaurantName">) => void;
  setQty: (cartItemId: string, qty: number) => void;
  remove: (cartItemId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        // migrate old single-restaurant cart
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (parsed?.items?.length && parsed.restaurantId) {
            setItems(
              parsed.items.map((i: Omit<CartItem, "restaurantId" | "restaurantName">) => ({
                ...i,
                restaurantId: parsed.restaurantId,
                restaurantName: parsed.restaurantName ?? "",
              })),
            );
          }
        }
      }
    } catch { /* noop */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* noop */ }
  }, [items, ready]);

  const add: Ctx["add"] = (restaurantId, restaurantName, item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === item.cartItemId);
      const next = existing
        ? prev.map((i) => (i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...prev, { ...item, restaurantId, restaurantName }];
      toast.success(`${item.name.split(" ")[0]} added!`);
      return next;
    });
  };

  const setQty: Ctx["setQty"] = (cartItemId, qty) => {
    setItems((prev) => prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, qty) } : i)));
  };

  const remove: Ctx["remove"] = (cartItemId) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clear = () => setItems([]);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  // Group by restaurant
  const grouped = new Map<string, { restaurantId: string; restaurantName: string; items: CartItem[]; subtotal: number }>();
  for (const it of items) {
    const g = grouped.get(it.restaurantId);
    if (g) {
      g.items.push(it);
      g.subtotal += it.price * it.quantity;
    } else {
      grouped.set(it.restaurantId, {
        restaurantId: it.restaurantId,
        restaurantName: it.restaurantName,
        items: [it],
        subtotal: it.price * it.quantity,
      });
    }
  }
  const itemsByRestaurant = Array.from(grouped.values());

  // Legacy view — first restaurant, for pages not yet updated
  const first = itemsByRestaurant[0];
  const cart: CartState = {
    restaurantId: first?.restaurantId ?? null,
    restaurantName: first?.restaurantName ?? null,
    items,
  };

  return (
    <CartContext.Provider value={{ cart, itemsByRestaurant, add, setQty, remove, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  cartItemId: string;  // unique per customization combo: mealId + options hash
  mealId: string;
  name: string;        // includes customization label e.g. "Amala (2 wraps) + Egusi + 2× Grilled Chicken"
  price: number;       // total for this line (base + extras) × qty
  quantity: number;
  imageUrl?: string | null;
  // customization snapshot for display
  customLabel?: string;
}
export interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
}

const KEY = "mealbae.cart.v2";
const initial: CartState = { restaurantId: null, restaurantName: null, items: [] };

interface Ctx {
  cart: CartState;
  add: (restaurantId: string, restaurantName: string, item: CartItem) => void;
  setQty: (cartItemId: string, qty: number) => void;
  remove: (cartItemId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setCart(JSON.parse(raw));
    } catch { /* noop */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* noop */ }
  }, [cart, ready]);

  const add: Ctx["add"] = (restaurantId, restaurantName, item) => {
    setCart((prev) => {
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        const proceed =
          typeof window !== "undefined" &&
          window.confirm(
            `Clear your cart from ${prev.restaurantName} and start a new order from ${restaurantName}?`
          );
        if (!proceed) return prev;
        toast.success(`${item.name} added to cart`);
        return { restaurantId, restaurantName, items: [item] };
      }
      // Each customization is a separate cart line — no merging by mealId
      // Only merge if cartItemId matches exactly (e.g. re-adding same exact combo)
      const existing = prev.items.find((i) => i.cartItemId === item.cartItemId);
      const items = existing
        ? prev.items.map((i) =>
            i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        : [...prev.items, item];
      toast.success(`${item.name.split(" ")[0]} added!`);
      return { restaurantId, restaurantName, items };
    });
  };

  const setQty: Ctx["setQty"] = (cartItemId, qty) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, qty) } : i
      ),
    }));
  };

  const remove: Ctx["remove"] = (cartItemId) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.cartItemId !== cartItemId);
      return items.length === 0 ? initial : { ...prev, items };
    });
  };

  const clear = () => setCart(initial);
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, add, setQty, remove, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

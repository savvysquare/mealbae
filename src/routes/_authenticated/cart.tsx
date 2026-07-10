import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cart")({ component: CartPage });

function CartPage() {
  const { cart, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();
  return (
    <AppShell title="Your cart">
      {cart.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/home" className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Browse restaurants</Link>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 text-sm text-muted-foreground">Ordering from <span className="font-medium text-foreground">{cart.restaurantName}</span></div>
          <div className="card-soft divide-y divide-border">
            {cart.items.map((i) => (
              <div key={i.mealId} className="flex items-center gap-3 p-3">
                {i.imageUrl && <img src={i.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-sm text-primary">{formatNaira(i.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(i.mealId, i.quantity - 1)} className="rounded-full border border-border p-1"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm">{i.quantity}</span>
                  <button onClick={() => setQty(i.mealId, i.quantity + 1)} className="rounded-full border border-border p-1"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => remove(i.mealId)} className="ml-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 card-soft p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatNaira(subtotal)}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Delivery fee shown at checkout.</div>
            <button onClick={() => nav({ to: "/checkout" })} className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground">
              Continue to checkout
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

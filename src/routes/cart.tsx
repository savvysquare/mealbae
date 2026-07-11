import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { LazyImage } from "@/components/LazyImage";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { cart, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();

  return (
    <AppShell title="Your Cart">
      <div className="mx-auto max-w-2xl">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-9 w-9 text-muted-foreground/60" />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Add items from a restaurant or store to start a new cart
            </p>
            <Link
              to="/home"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all cursor-pointer"
            >
              Browse Restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="mb-4 pb-3 border-b border-border">
                <h1 className="font-display text-2xl font-extrabold text-foreground">Your Cart</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Ordering from{" "}
                  <span className="font-bold text-foreground">{cart.restaurantName}</span>
                </p>
              </div>

              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {cart.items.map((item) => (
                  <div key={item.mealId} className="flex items-center gap-4 p-4 bg-white hover:bg-secondary/30 transition-colors">
                    {/* Meal Image */}
                    {item.imageUrl && (
                      <LazyImage
                        src={item.imageUrl}
                        alt={item.name}
                        width={128}
                        className="h-16 w-16 rounded-lg border border-border/60 shrink-0"
                      />
                    )}

                    {/* Meal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-sm">{item.name}</div>
                      <div className="text-sm font-semibold text-primary mt-0.5">
                        {formatNaira(item.price)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setQty(item.mealId, item.quantity - 1)}
                        className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setQty(item.mealId, item.quantity + 1)}
                        className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:brightness-105 transition cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(item.mealId)}
                        className="ml-1 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-xl border border-border bg-white p-5 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-foreground mb-4 pb-3 border-b border-border">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">{formatNaira(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery fee</span>
                    <span className="font-semibold text-foreground">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-extrabold text-foreground text-base">
                    <span>Estimated total</span>
                    <span>{formatNaira(subtotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => nav({ to: "/checkout" })}
                  className="mt-5 w-full rounded-full bg-primary py-3.5 font-bold text-sm text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Go to Checkout <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  to="/home"
                  className="mt-3 w-full rounded-full border border-border py-3 text-xs font-bold text-muted-foreground text-center hover:bg-secondary transition flex items-center justify-center cursor-pointer"
                >
                  Add more items
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

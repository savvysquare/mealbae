import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Store } from "lucide-react";

export const Route = createFileRoute("/cart")({ component: CartPage });

function parseCartLabel(label: string): { baseName: string; additions: string[] } {
  const parts = label.split(" + ");
  return { baseName: parts[0] ?? label, additions: parts.slice(1).filter(Boolean) };
}

function CartPage() {
  const { itemsByRestaurant, setQty, remove, subtotal, count } = useCart();
  const nav = useNavigate();

  if (count === 0) {
    return (
      <AppShell title="Your Cart">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-9 w-9 text-muted-foreground/60" />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Your cart is empty</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">Add items from one or more restaurants to start a new order</p>
            <Link to="/home" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all cursor-pointer">
              Browse Restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Your Cart">
      <div className="mx-auto max-w-2xl">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-4 pb-3 border-b border-border">
              <h1 className="font-display text-2xl font-extrabold text-foreground">Your Cart</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {itemsByRestaurant.length === 1
                  ? <>Ordering from <span className="font-bold text-foreground">{itemsByRestaurant[0].restaurantName}</span></>
                  : <>Ordering from <span className="font-bold text-foreground">{itemsByRestaurant.length} restaurants</span> in one delivery</>}
              </p>
            </div>

            <div className="space-y-6">
              {itemsByRestaurant.map((group) => (
                <div key={group.restaurantId}>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-primary" />
                    <div className="text-sm font-extrabold text-foreground">{group.restaurantName}</div>
                    <div className="text-xs text-muted-foreground ml-auto">{formatNaira(group.subtotal)}</div>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const { baseName, additions } = parseCartLabel(item.customLabel ?? item.name);
                      return (
                        <div key={item.cartItemId} className="bg-white border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                          <div className="flex items-start gap-3 p-4">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-14 w-14 rounded-xl object-cover border border-border/40 shrink-0" />
                            ) : (
                              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 text-2xl">🍽️</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-foreground text-sm leading-tight">{baseName}</div>
                              <div className="text-xs text-primary font-semibold mt-1">{formatNaira(item.price)} × {item.quantity}</div>
                              <div className="text-sm font-extrabold text-foreground mt-0.5">= {formatNaira(item.price * item.quantity)}</div>
                            </div>
                            <button onClick={() => remove(item.cartItemId)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer shrink-0 mt-0.5">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {additions.length > 0 && (
                            <div className="border-t border-border/40 px-4 py-3 bg-secondary/20 space-y-1">
                              <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Includes</div>
                              {additions.map((a, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="text-base leading-none">➕</span>
                                  <span className="font-medium">{a}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="border-t border-border/40 px-4 py-2.5 flex items-center justify-between bg-white">
                            <span className="text-xs text-muted-foreground font-medium">Repeat this order:</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setQty(item.cartItemId, item.quantity - 1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition cursor-pointer">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                              <button onClick={() => setQty(item.cartItemId, item.quantity + 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:brightness-105 transition cursor-pointer">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-xl border border-border bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-extrabold text-foreground mb-4 pb-3 border-b border-border">Order Summary</h2>
              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-semibold text-foreground">{formatNaira(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Delivery fee</span><span className="font-semibold text-foreground">Calculated at checkout</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-extrabold text-foreground text-base"><span>Estimated total</span><span>{formatNaira(subtotal)}</span></div>
              </div>
              <button onClick={() => nav({ to: "/checkout" })} className="mt-5 w-full rounded-full bg-primary py-3.5 font-bold text-sm text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer">
                Go to Checkout <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/home" className="mt-3 w-full rounded-full border border-border py-3 text-xs font-bold text-muted-foreground text-center hover:bg-secondary transition flex items-center justify-center cursor-pointer">Add more items</Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

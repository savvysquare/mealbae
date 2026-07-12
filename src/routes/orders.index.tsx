import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { RefreshCw, ShoppingBag, ArrowRight, Phone, ListOrdered, Loader2 } from "lucide-react";

export const Route = createFileRoute("/orders/")({ component: OrdersList });

function OrdersList() {
  const { user } = useSession();
  const nav = useNavigate();
  const { add } = useCart();

  const [phoneInput, setPhoneInput] = useState("");
  const [savedPhone, setSavedPhone] = useState<string>("");
  const [isReorderingId, setIsReorderingId] = useState<string | null>(null);

  // Load saved phone number on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = localStorage.getItem("mealbae_guest_phone") || "";
      setSavedPhone(p);
      setPhoneInput(p);
    }
  }, []);

  // Fetch orders for logged-in user
  const { data: authOrders, isLoading: authLoading } = useQuery({
    queryKey: ["my-orders-auth", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name), order_items(*)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for guest user based on phone number
  const { data: guestOrders, isLoading: guestLoading, refetch: refetchGuest } = useQuery({
    queryKey: ["my-orders-guest", savedPhone],
    enabled: !user && !!savedPhone,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("track_orders_by_phone", {
        _phone: savedPhone,
      });
      if (error) throw error;
      return data as {
        id: string;
        short_code: string;
        status: keyof typeof STATUS_LABELS;
        total_naira: number;
        created_at: string;
        restaurant_name: string;
      }[];
    },
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    localStorage.setItem("mealbae_guest_phone", phoneInput.trim());
    setSavedPhone(phoneInput.trim());
    toast.success("Phone number saved! Loading orders...");
  };

  const handleClearPhone = () => {
    localStorage.removeItem("mealbae_guest_phone");
    setSavedPhone("");
    setPhoneInput("");
  };

  async function reorder(orderId: string, restaurantId: string, restaurantName: string, phone: string | null) {
    setIsReorderingId(orderId);
    try {
      let items: any[] = [];
      
      // If we have local authOrders, try to grab them
      const authOrder = authOrders?.find((o: any) => o.id === orderId);
      if (authOrder && authOrder.order_items) {
        items = authOrder.order_items;
      } else {
        // Fetch items using the get_order_tracking RPC
        const { data, error } = await (supabase.rpc as any)("get_order_tracking", {
          _order_id: orderId,
          _phone: phone || savedPhone,
        });
        
        if (error || !data) {
          throw new Error(error?.message || "Failed to fetch order details");
        }
        items = data.items.map((i: any) => ({
          meal_id: i.meal_id,
          name_snapshot: i.name_snapshot,
          price_snapshot: i.price_snapshot,
          quantity: i.quantity,
        }));
      }

      if (!items || items.length === 0) {
        toast.error("No items found to reorder");
        return;
      }

      // Add each item to cart
      for (const i of items) {
        add(restaurantId, restaurantName, {
          cartItemId: `${i.meal_id || i.mealId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          mealId: i.meal_id || i.mealId,
          name: i.name_snapshot || i.name,
          price: i.price_snapshot || i.price,
          quantity: i.quantity,
          imageUrl: null,
        });
      }
      
      toast.success(`Reordered all items from ${restaurantName}!`);
      nav({ to: "/cart" });
    } catch (err: any) {
      toast.error(err.message || "Failed to reorder. Please try again.");
    } finally {
      setIsReorderingId(null);
    }
  }

  const isLoading = user ? authLoading : (savedPhone ? guestLoading : false);
  const orders = user ? authOrders : guestOrders;

  return (
    <AppShell title="Your Orders">
      <div className="mx-auto max-w-xl pb-24">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="font-display text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ListOrdered className="h-6 w-6 text-primary" /> Track & History
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your past orders and track active deliveries.
          </p>
        </div>

        {/* Guest user: Phone identification form */}
        {!user && (
          <div className="mb-6 rounded-2xl bg-secondary/50 border border-border/60 p-5 shadow-xs">
            {savedPhone ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Viewing orders for
                  </div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> {savedPhone}
                  </div>
                </div>
                <button
                  onClick={handleClearPhone}
                  className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Change Phone
                </button>
              </div>
            ) : (
              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Track Guest Orders</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter the phone number used during checkout to view and track your orders.
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 08141894696"
                      className="w-full rounded-full border border-border bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 transition cursor-pointer"
                  >
                    View Orders
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading your orders...</p>
          </div>
        ) : !orders || orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-white p-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">No orders found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              {user
                ? "You haven't placed any orders yet."
                : savedPhone
                ? "No orders found matching this phone number."
                : "Enter your phone number above or log in to view order history."}
            </p>
            <Link
              to="/home"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition"
            >
              Order Delicious Meal <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-4">
            {orders.map((o: any) => {
              const orderId = o.id;
              const shortCode = o.short_code;
              const status = o.status;
              const total = o.total_naira;
              const date = new Date(o.created_at);
              const rName = o.restaurant_name || o.restaurants?.name || "Restaurant";
              const rId = o.restaurant_id;

              return (
                <div key={orderId} className="group overflow-hidden rounded-2xl bg-white border border-border/80 hover:border-border hover:shadow-xs transition duration-300 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground">
                        Order #{shortCode}
                      </div>
                      <h3 className="font-display text-base font-extrabold text-foreground group-hover:text-primary transition-colors mt-0.5">
                        {rName}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {date.toLocaleString("en-NG", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-accent-foreground">
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Total:</span>{" "}
                      <span className="font-extrabold text-foreground">{formatNaira(total)}</span>
                    </div>

                    <div className="flex gap-2">
                      {/* Track details: pointing to track/$id with phone query parameter */}
                      <Link
                        to="/track/$id"
                        params={{ id: orderId }}
                        search={{ phone: user ? undefined : savedPhone }}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 shadow-xs transition"
                      >
                        Track Status
                      </Link>

                      <button
                        disabled={isReorderingId !== null}
                        onClick={() => reorder(orderId, rId, rName, o.delivery_phone || null)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary disabled:opacity-50 cursor-pointer"
                      >
                        {isReorderingId === orderId ? (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

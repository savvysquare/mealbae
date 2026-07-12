import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { getSavedPhone, savePhone } from "@/lib/user-phone";
import { LazyImage } from "@/components/LazyImage";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Phone, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — MealBae" },
      { name: "description", content: "Your cart, ongoing and completed MealBae orders in one place." },
      { property: "og:title", content: "Orders — MealBae" },
      { property: "og:description", content: "Your cart, ongoing and completed MealBae orders in one place." },
    ],
  }),
});

type Tab = "cart" | "ongoing" | "completed";

const ONGOING_STATUSES = new Set([
  "pending_payment",
  "payment_confirmed",
  "awaiting_restaurant_acceptance",
  "accepted_by_restaurant",
  "preparing",
  "ready_for_pickup",
  "rider_arrived_at_restaurant",
  "out_for_delivery",
  "rider_arrived_at_delivery",
]);

interface TrackedOrder {
  id: string;
  short_code: string;
  status: keyof typeof STATUS_LABELS;
  total_naira: number;
  created_at: string;
  restaurant_name: string;
}

function OrdersPage() {
  const [tab, setTab] = useState<Tab>("cart");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setPhone(getSavedPhone());
  }, []);

  return (
    <AppShell title="Orders" right={<HeaderActions />}>
      <div className="mx-auto max-w-2xl pb-24">
        <div className="mb-5 grid grid-cols-3 rounded-full bg-secondary p-1">
          {(["cart", "ongoing", "completed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 text-xs font-bold capitalize transition ${
                tab === t ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "cart" ? "My Cart" : t}
            </button>
          ))}
        </div>

        {tab === "cart" && <CartTab />}
        {tab === "ongoing" && <PhoneOrders phone={phone} setPhone={setPhone} filter="ongoing" />}
        {tab === "completed" && <PhoneOrders phone={phone} setPhone={setPhone} filter="completed" />}
      </div>
    </AppShell>
  );
}

function CartTab() {
  const { cart, setQty, remove, subtotal, clear } = useCart();
  const nav = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-secondary">
          <ShoppingBag className="h-9 w-9 text-muted-foreground/60" />
        </div>
        <h2 className="font-display text-xl font-extrabold">Your cart is empty</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Add items from a restaurant to start a new cart.
        </p>
        <Link
          to="/home"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition"
        >
          Browse restaurants <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm">
          Ordering from <span className="font-bold">{cart.restaurantName}</span>
        </div>
        <button
          onClick={clear}
          className="text-xs font-bold text-muted-foreground hover:text-destructive"
        >
          Clear cart
        </button>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
        {cart.items.map((item) => (
          <div key={item.mealId} className="flex items-center gap-3 p-3.5">
            {item.imageUrl && (
              <LazyImage
                src={item.imageUrl}
                alt={item.name}
                width={128}
                className="h-14 w-14 shrink-0 rounded-lg border border-border/60"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">{item.name}</div>
              <div className="mt-0.5 text-sm font-semibold text-primary">{formatNaira(item.price)}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQty(item.mealId, item.quantity - 1)}
                className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-secondary"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => setQty(item.mealId, item.quantity + 1)}
                className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                <Plus className="h-3 w-3" />
              </button>
              <button
                onClick={() => remove(item.mealId)}
                className="ml-1 grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-bold">{formatNaira(subtotal)}</span>
        </div>
        <button
          onClick={() => nav({ to: "/checkout" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition"
        >
          Checkout <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PhoneOrders({
  phone,
  setPhone,
  filter,
}: {
  phone: string;
  setPhone: (p: string) => void;
  filter: "ongoing" | "completed";
}) {
  const [input, setInput] = useState(phone);
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => {
    setInput(phone);
  }, [phone]);

  const { data: orders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["phone-orders", phone],
    enabled: phone.replace(/\D/g, "").length >= 7,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: TrackedOrder[] | null; error: { message: string } | null }>)(
        "track_orders_by_phone",
        { _phone: phone },
      );
      if (error) throw new Error(error.message);
      return (data ?? []) as TrackedOrder[];
    },
    refetchInterval: filter === "ongoing" ? 30000 : false,
  });

  if (!phone) {
    return (
      <div>
        <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
          <Phone className="mx-auto mb-3 h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">Enter the phone you used to order</p>
          <p className="mt-1 text-xs text-muted-foreground">We'll show your orders on this device.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const p = input.trim();
              if (p.replace(/\D/g, "").length < 7) {
                toast.error("Enter a valid phone number.");
                return;
              }
              savePhone(p);
              setPhone(p);
            }}
            className="mt-4 grid grid-cols-[1fr_auto] gap-2"
          >
            <input
              type="tel"
              inputMode="tel"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0803 123 4567"
              className="rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:brightness-105"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const list = (orders ?? []).filter((o) =>
    filter === "ongoing" ? ONGOING_STATUSES.has(o.status) : !ONGOING_STATUSES.has(o.status),
  );

  async function reorder(o: TrackedOrder) {
    const { data: items } = await supabase
      .from("order_items")
      .select("meal_id, name_snapshot, price_snapshot, quantity")
      .eq("order_id", o.id);
    if (!items?.length) {
      toast.error("Couldn't load original items.");
      return;
    }
    for (const i of items) {
      add(o.id, o.restaurant_name, {
        mealId: i.meal_id as string,
        name: i.name_snapshot as string,
        price: i.price_snapshot as number,
        quantity: i.quantity as number,
        imageUrl: null,
      });
    }
    toast.success("Added to cart");
    nav({ to: "/orders" });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs">
        <div className="text-muted-foreground">
          Showing for <span className="font-bold text-foreground">{phone}</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 font-semibold hover:bg-secondary disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center text-sm text-muted-foreground">
          No {filter} orders yet.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">
                    #{o.short_code} · {o.restaurant_name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-NG")}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{formatNaira(o.total_naira)}</div>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/track/$id"
                  params={{ id: o.id }}
                  search={{ phone }}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Track
                </Link>
                {filter === "completed" && (
                  <button
                    onClick={() => reorder(o)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold hover:bg-secondary"
                  >
                    <RefreshCw className="h-3 w-3" /> Reorder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

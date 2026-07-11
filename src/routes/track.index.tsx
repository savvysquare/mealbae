import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Search, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/track/")({
  component: TrackPage,
  head: () => ({
    meta: [
      { title: "Track my Meal — MealBae" },
      { name: "description", content: "Track your MealBae order in real time using your phone number." },
    ],
  }),
});

interface TrackedOrder {
  id: string;
  short_code: string;
  status: keyof typeof STATUS_LABELS;
  total_naira: number;
  created_at: string;
  restaurant_name: string;
}

function TrackPage() {
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = phone.trim();
    if (p.replace(/\D/g, "").length < 7) {
      toast.error("Enter the phone number you used to order.");
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: TrackedOrder[] | null; error: { message: string } | null }>)(
      "track_orders_by_phone",
      { _phone: p },
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data ?? []) as TrackedOrder[];
    setOrders(rows);
    if (rows.length === 0) {
      toast.message("No orders found for that phone number.");
    } else if (rows.length === 1) {
      nav({ to: "/track/$id", params: { id: rows[0].id }, search: { phone: p } });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90">
            <Logo className="text-xl" />
          </Link>
          <Link
            to="/home"
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-xs hover:brightness-105 transition-all"
          >
            Order Now
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-16 md:py-24">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Track my Meal</h1>
        <p className="mt-3 text-muted-foreground">
          Enter the phone number you used when placing your order to see live status.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Phone number</span>
            <div className="relative mt-2">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 123 4567"
                className="w-full rounded-2xl border border-border bg-white pl-11 pr-4 py-3 text-base font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-xs hover:brightness-105 transition-all disabled:opacity-60"
          >
            <Search className="h-4 w-4" /> {loading ? "Searching…" : "Track order"}
          </button>
        </form>

        {orders && orders.length > 1 && (
          <div className="mt-10 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your recent orders</h2>
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 hover:border-primary transition"
              >
                <div>
                  <div className="font-bold text-foreground">#{o.short_code} · {o.restaurant_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleString()} · {STATUS_LABELS[o.status]}
                  </div>
                </div>
                <div className="text-sm font-bold">{formatNaira(o.total_naira)}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

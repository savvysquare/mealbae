import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({ component: OrdersList });

function OrdersList() {
  const { user } = useSession();
  const nav = useNavigate();
  const { add } = useCart();

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, restaurants(name), order_items(*)").eq("customer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function reorder(o: any) {
    if (!o.order_items?.length) return;
    // add each item
    for (const i of o.order_items) {
      add(o.restaurant_id, o.restaurants?.name ?? "Restaurant", {
        mealId: i.meal_id, name: i.name_snapshot, price: i.price_snapshot, quantity: i.quantity, imageUrl: null,
      });
    }
    toast.success("Reordered — review your cart");
    nav({ to: "/cart" });
  }

  return (
    <AppShell title="Your orders">
      {(!orders || orders.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No orders yet. <Link to="/home" className="text-primary underline">Order now</Link>.
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="card-soft p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link to="/orders/$id" params={{ id: o.id }} className="font-medium hover:underline">#{o.short_code} · {o.restaurants?.name}</Link>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</div>
                </div>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{STATUS_LABELS[o.status]}</span>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{o.order_items?.length ?? 0} items · {formatNaira(o.total_naira)}</div>
              <div className="mt-3 flex gap-2">
                <Link to="/orders/$id" params={{ id: o.id }} className="rounded-full border border-border px-3 py-1.5 text-xs">Track</Link>
                <button onClick={() => reorder(o)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                  <RefreshCw className="h-3 w-3" /> Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

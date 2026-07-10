import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/restaurant/orders")({ component: RestaurantOrders });

const ACTIVE_STATUSES = ["awaiting_restaurant_acceptance", "accepted_by_restaurant", "preparing", "ready_for_pickup"] as const;

function RestaurantOrders() {
  const { restaurantId } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["restaurant-orders", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase.channel(`rest-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        qc.invalidateQueries({ queryKey: ["restaurant-orders", restaurantId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, qc]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["restaurant-orders", restaurantId] });
  }

  const newOnes = orders?.filter((o: any) => o.status === "awaiting_restaurant_acceptance") ?? [];
  const active = orders?.filter((o: any) => o.status !== "awaiting_restaurant_acceptance") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <h2 className="mb-3 font-display text-2xl font-bold">New orders <span className="text-sm font-medium text-muted-foreground">({newOnes.length})</span></h2>
        {newOnes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No new orders right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {newOnes.map((o: any) => (
              <div key={o.id} className="card-soft p-5">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">#{o.short_code}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</div>
                  </div>
                  <div className="text-right font-medium">{formatNaira(o.total_naira)}</div>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.order_items?.map((i: any) => <li key={i.id}>{i.quantity}× {i.name_snapshot}</li>)}
                </ul>
                <div className="mt-2 text-xs text-muted-foreground">To: {o.delivery_address} — {o.delivery_phone}</div>
                {o.notes && <div className="mt-1 text-xs italic">"{o.notes}"</div>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => updateStatus(o.id, "accepted_by_restaurant")} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-medium text-primary-foreground">Accept</button>
                  <button onClick={() => updateStatus(o.id, "rejected")} className="flex-1 rounded-2xl border border-destructive py-2.5 text-sm font-medium text-destructive">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold">Active orders</h2>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nothing in progress.</p>
        ) : (
          <div className="space-y-3">
            {active.map((o: any) => {
              const next = o.status === "accepted_by_restaurant" ? "preparing" : o.status === "preparing" ? "ready_for_pickup" : null;
              const nextLabel = next === "preparing" ? "Mark preparing" : next === "ready_for_pickup" ? "Mark ready for pickup" : null;
              return (
                <div key={o.id} className="card-soft flex items-center justify-between p-4">
                  <div>
                    <div className="font-semibold">#{o.short_code} · {STATUS_LABELS[o.status]}</div>
                    <div className="text-sm text-muted-foreground">{o.order_items?.length} items · {formatNaira(o.total_naira)}</div>
                  </div>
                  {next && (
                    <button onClick={() => updateStatus(o.id, next)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                      {nextLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

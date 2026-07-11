import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";
import { VendorShell } from "@/components/PanelShells";
import { ChevronDown, ChevronUp, MapPin, Phone, User, ClipboardList, Navigation } from "lucide-react";

export const Route = createFileRoute("/vendor/orders")({ component: VendorOrders });

const ACTIVE_STATUSES = ["awaiting_restaurant_acceptance", "accepted_by_restaurant", "preparing", "ready_for_pickup", "rider_arrived_at_restaurant", "out_for_delivery", "rider_arrived_at_delivery"] as const;

function VendorOrders() {
  const { restaurantId } = Route.useRouteContext() as { restaurantId: string };
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["vendor-orders", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurantId)
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const ch = supabase.channel(`rest-${restaurantId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` }, () => {
        qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId, qc]);

  async function updateStatus(id: string, nextStatus: string) {
    const { error } = await supabase.from("orders").update({ status: nextStatus as any }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Order status updated");
    qc.invalidateQueries({ queryKey: ["vendor-orders", restaurantId] });
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const newOnes = orders?.filter((o: any) => o.status === "awaiting_restaurant_acceptance") ?? [];
  const active = orders?.filter((o: any) => o.status !== "awaiting_restaurant_acceptance") ?? [];

  return (
    <VendorShell>
      <div className="mx-auto max-w-4xl space-y-8 px-2 sm:px-4">
        {/* New Orders Section */}
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold">New orders <span className="text-sm font-medium text-muted-foreground">({newOnes.length})</span></h2>
          {newOnes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No new orders right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {newOnes.map((o: any) => (
                <div key={o.id} className="card-soft p-5 border-l-4 border-primary">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold text-lg">#{o.short_code}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</div>
                    </div>
                    <div className="text-right font-semibold">{formatNaira(o.total_naira)}</div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm bg-white p-2.5 rounded-xl border border-border/60">
                    {o.order_items?.map((i: any) => <li key={i.id} className="flex justify-between"><span>{i.quantity}× {i.name_snapshot}</span></li>)}
                  </ul>
                  <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>To: {o.delivery_address} — {o.delivery_phone}</span>
                  </div>
                  {o.notes && <div className="mt-1 text-xs italic bg-secondary/30 p-2 rounded-lg text-muted-foreground">"{o.notes}"</div>}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => updateStatus(o.id, "accepted_by_restaurant")} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap">Accept</button>
                    <button onClick={() => updateStatus(o.id, "rejected")} className="flex-1 rounded-2xl border border-destructive py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 transition whitespace-nowrap">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Orders Section */}
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold">Active orders <span className="text-sm font-medium text-muted-foreground">({active.length})</span></h2>
          {active.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nothing in progress.</p>
          ) : (
            <div className="space-y-3">
              {active.map((o: any) => {
                const isExpanded = expandedId === o.id;
                const next = o.status === "accepted_by_restaurant" ? "preparing" : o.status === "preparing" ? "ready_for_pickup" : null;
                const nextLabel = next === "preparing" ? "Mark preparing" : next === "ready_for_pickup" ? "Mark ready for pickup" : null;

                return (
                  <Fragment key={o.id}>
                    {/* Main Row */}
                    <div
                      onClick={() => toggleExpand(o.id)}
                      className={`card-soft p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-secondary/20 transition-colors ${
                        isExpanded ? "bg-secondary/10 border-b border-border" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">#{o.short_code}</span>
                          <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {o.order_items?.length} items · {formatNaira(o.total_naira)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {next && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(o.id, next); }}
                            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
                          >
                            {nextLabel}
                          </button>
                        )}
                        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold py-1 px-2.5 rounded-full border border-border bg-white transition whitespace-nowrap">
                          {isExpanded ? (
                            <>Hide <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>Details <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details Container */}
                    {isExpanded && (
                      <div className="p-5 bg-secondary/5 border border-t-0 border-border rounded-b-2xl -mt-3 mb-3 space-y-4 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Order Details & Items */}
                          <div>
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                              <ClipboardList className="h-3.5 w-3.5" /> Order Items
                            </h4>
                            <ul className="space-y-1 bg-white p-3 rounded-xl border border-border/80 text-xs">
                              {o.order_items?.map((item: any) => (
                                <li key={item.id} className="flex justify-between">
                                  <span>{item.quantity}× {item.name_snapshot}</span>
                                  <span className="font-medium">{formatNaira(item.price_snapshot * item.quantity)}</span>
                                </li>
                              ))}
                              <li className="pt-1.5 mt-1.5 border-t border-dashed flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-primary">{formatNaira(o.total_naira)}</span>
                              </li>
                            </ul>
                          </div>

                          {/* Customer & Rider Info */}
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded-xl border border-border/80 space-y-1 text-xs">
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                                <User className="h-3.5 w-3.5" /> Delivery details
                              </h4>
                              <div className="font-semibold">{o.customer_name ?? "No Name"}</div>
                              <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {o.delivery_phone}</div>
                              <div className="flex items-start gap-1 mt-1"><MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" /> <span className="text-muted-foreground">{o.delivery_address}</span></div>
                              {o.notes && <div className="mt-2 p-1.5 bg-secondary/30 rounded italic text-muted-foreground">Notes: "{o.notes}"</div>}
                            </div>

                            {o.rider_name && (
                              <div className="bg-white p-3 rounded-xl border border-border/80 space-y-1 text-xs">
                                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                                  <Navigation className="h-3.5 w-3.5 text-primary" /> Dispatch Rider
                                </h4>
                                <div className="font-semibold">{o.rider_name}</div>
                                <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {o.rider_phone}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Controls: Allow vendors to override to preparing, ready_for_pickup, etc. if needed */}
                        <div className="bg-white p-3 rounded-xl border border-border/80">
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Force Status Override</h4>
                          <div className="flex flex-wrap gap-1">
                            {["accepted_by_restaurant", "preparing", "ready_for_pickup", "rejected"].map((st) => (
                              <button
                                key={st}
                                onClick={() => updateStatus(o.id, st)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                                  o.status === st
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                }`}
                              >
                                {STATUS_LABELS[st] ?? st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </VendorShell>
  );
}

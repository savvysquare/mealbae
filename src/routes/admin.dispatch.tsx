import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";
import { AdminShell } from "@/components/PanelShells";
import { Bike, MapPin, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/dispatch")({ component: Dispatch });

function Dispatch() {
  const qc = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name, address, phone)")
        .in("status", ["preparing", "ready_for_pickup", "rider_arrived_at_restaurant", "out_for_delivery", "rider_arrived_at_delivery"])
        .order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  // Fetch all active riders
  const { data: allRiders } = useQuery({
    queryKey: ["riders-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("riders").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data as { id: string; name: string; phone: string }[];
    },
    refetchInterval: 10000,
  });

  // Phones currently on assignment
  const busyPhones = new Set(
    (orders ?? []).filter((o: any) => o.rider_phone).map((o: any) => o.rider_phone)
  );

  const availableRiders = (allRiders ?? []).filter((r) => !busyPhones.has(r.phone));

  async function assign(orderId: string, rider: { name: string; phone: string }) {
    const { error } = await supabase
      .from("orders")
      .update({ rider_name: rider.name, rider_phone: rider.phone })
      .eq("id", orderId);
    if (error) toast.error(error.message);
    else toast.success(`${rider.name} assigned to order`);
    qc.invalidateQueries({ queryKey: ["dispatch"] });
    qc.invalidateQueries({ queryKey: ["riders-list"] });
  }

  async function unassign(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ rider_name: null, rider_phone: null })
      .eq("id", orderId);
    if (error) toast.error(error.message);
    else toast.success("Rider unassigned");
    qc.invalidateQueries({ queryKey: ["dispatch"] });
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-4 px-2 sm:px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Dispatch</h1>
            <p className="text-sm text-muted-foreground">
              {(orders ?? []).length} active · {availableRiders.length} riders available
            </p>
          </div>
        </div>

        {(orders ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <Bike className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            Nothing waiting for dispatch.
          </div>
        )}

        {(orders ?? []).map((o: any) => (
          <DispatchCard
            key={o.id}
            order={o}
            availableRiders={availableRiders}
            allRiders={allRiders ?? []}
            onAssign={assign}
            onUnassign={unassign}
          />
        ))}
      </div>
    </AdminShell>
  );
}

function DispatchCard({ order, availableRiders, allRiders, onAssign, onUnassign }: {
  order: any;
  availableRiders: { id: string; name: string; phone: string }[];
  allRiders: { id: string; name: string; phone: string }[];
  onAssign: (orderId: string, rider: { name: string; phone: string }) => void;
  onUnassign: (orderId: string) => void;
}) {
  const [selectedRiderId, setSelectedRiderId] = useState("");

  const assignedRider = order.rider_name
    ? allRiders.find((r) => r.phone === order.rider_phone) ?? { name: order.rider_name, phone: order.rider_phone }
    : null;

  function handleAssign() {
    const rider = availableRiders.find((r) => r.id === selectedRiderId);
    if (!rider) { toast.error("Select a rider first"); return; }
    onAssign(order.id, { name: rider.name, phone: rider.phone });
    setSelectedRiderId("");
  }

  return (
    <div className="card-soft p-5">
      {/* Order header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">#{order.short_code}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-1 font-semibold text-sm">{order.restaurants?.name}</div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Pickup: {order.restaurants?.address}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Deliver to: {order.delivery_address} — {order.delivery_phone}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="font-bold text-base">{formatNaira(order.total_naira)}</div>
        </div>
      </div>

      {/* Rider Assignment Section */}
      <div className="mt-4 pt-4 border-t border-border">
        {assignedRider ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bike className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold">{assignedRider.name}</div>
                <div className="text-xs text-muted-foreground">{assignedRider.phone}</div>
              </div>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold text-success">
                <CheckCircle2 className="h-3 w-3" /> Assigned
              </span>
            </div>
            <button
              onClick={() => onUnassign(order.id)}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition whitespace-nowrap"
            >
              Change rider
            </button>
          </div>
        ) : (
          <div>
            {availableRiders.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
                <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                <span>No riders available right now. All riders are on assignment or none are registered.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-xl border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select available rider —</option>
                  {availableRiders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.phone}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedRiderId}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap disabled:opacity-50"
                >
                  Dispatch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

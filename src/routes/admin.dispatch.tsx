import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { AdminShell } from "@/components/PanelShells";

export const Route = createFileRoute("/admin/dispatch")({ component: Dispatch });

function Dispatch() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, restaurants(name, address, phone)").in("status", ["ready_for_pickup", "out_for_delivery"]).order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  async function assign(id: string, rider_name: string, rider_phone: string) {
    if (!rider_name.trim()) { toast.error("Rider name required"); return; }
    const { error } = await supabase.from("orders").update({ rider_name, rider_phone, status: "out_for_delivery" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Rider assigned");
    qc.invalidateQueries({ queryKey: ["dispatch"] });
  }
  async function markDelivered(id: string) {
    const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Marked delivered");
    qc.invalidateQueries({ queryKey: ["dispatch"] });
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-3">
        {(data ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing waiting for dispatch.</div>}
        {data?.map((o: any) => <DispatchCard key={o.id} order={o} onAssign={assign} onDelivered={markDelivered} />)}
      </div>
    </AdminShell>
  );
}

function DispatchCard({ order, onAssign, onDelivered }: any) {
  const [name, setName] = useState(order.rider_name ?? "");
  const [phone, setPhone] = useState(order.rider_phone ?? "");
  return (
    <div className="card-soft p-5">
      <div className="flex justify-between">
        <div>
          <div className="font-semibold">#{order.short_code} · {order.restaurants?.name}</div>
          <div className="text-xs text-muted-foreground">Pickup: {order.restaurants?.address}</div>
          <div className="mt-1 text-xs text-muted-foreground">Deliver to: {order.delivery_address} — {order.delivery_phone}</div>
        </div>
        <div className="text-right font-medium">{formatNaira(order.total_naira)}</div>
      </div>
      {order.status === "ready_for_pickup" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rider name" className="min-w-[140px] flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Rider phone" className="min-w-[140px] flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-sm" />
          <button onClick={() => onAssign(order.id, name, phone)} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground whitespace-nowrap">Dispatch</button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div>Rider: <span className="font-medium">{order.rider_name}</span> — {order.rider_phone}</div>
          <button onClick={() => onDelivered(order.id)} className="rounded-full bg-success px-3 py-1.5 text-xs font-medium text-success-foreground whitespace-nowrap">Mark delivered</button>
        </div>
      )}
    </div>
  );
}

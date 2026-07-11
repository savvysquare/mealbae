import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { StatusTimeline } from "@/components/StatusTimeline";
import { Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$id")({ component: OrderTracking });

function OrderTracking() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, restaurants(name, phone)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });
  const { data: items } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data;
    },
  });
  const { data: events } = useQuery({
    queryKey: ["order-events", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_status_events").select("*").eq("order_id", id).order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });
  const { data: bank } = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*").eq("is_active", true).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["order", id] });
        qc.invalidateQueries({ queryKey: ["order-events", id] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_status_events", filter: `order_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["order-events", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  async function markPaid() {
    const { error } = await supabase.from("orders").update({ payment_submitted_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Payment noted. Awaiting confirmation.");
    qc.invalidateQueries({ queryKey: ["order", id] });
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  if (!order) return <AppShell title="Order"><div className="p-8 text-center text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell title={`Order #${order.short_code}`}>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <section className="card-soft p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Current status</div>
            <div className="mt-1 font-display text-2xl font-bold">{STATUS_LABELS[order.status]}</div>
            <p className="mt-1 text-sm text-muted-foreground">{order.restaurants?.name}</p>
            <div className="mt-6"><StatusTimeline current={order.status} events={events ?? []} /></div>
          </section>
        </div>
        <div className="space-y-4 md:col-span-2">
          {order.status === "pending_payment" && bank && (
            <section className="card-soft p-5">
              <h2 className="font-display text-lg font-bold">Bank transfer</h2>
              <p className="text-sm text-muted-foreground">Send {formatNaira(order.total_naira)} to:</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{bank.bank_name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{bank.account_name}</dd></div>
                <div className="flex justify-between items-center"><dt className="text-muted-foreground">Account no.</dt>
                  <dd className="flex items-center gap-2 font-mono font-medium">{bank.account_number} <button onClick={() => copy(bank.account_number)}><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button></dd>
                </div>

              </dl>
              <button onClick={markPaid} disabled={!!order.payment_submitted_at} className="mt-4 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {order.payment_submitted_at ? <><CheckCircle2 className="mr-1 inline h-4 w-4" /> Payment marked — awaiting confirmation</> : "I have paid"}
              </button>
            </section>
          )}
          <section className="card-soft p-5">
            <h2 className="font-display text-lg font-bold">Order</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {items?.map((i) => (
                <li key={i.id} className="flex justify-between"><span>{i.quantity}× {i.name_snapshot}</span><span>{formatNaira(i.price_snapshot * i.quantity)}</span></li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(order.subtotal_naira)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(order.delivery_fee_naira)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatNaira(order.total_naira)}</span></div>
            </div>
          </section>
          <section className="card-soft p-5 text-sm">
            <div className="font-medium">Delivering to</div>
            <div className="mt-1 text-muted-foreground">{order.delivery_address}</div>
            <div className="text-muted-foreground">{order.delivery_phone}</div>
            {order.rider_name && <div className="mt-3 border-t border-border pt-3">Rider: <span className="font-medium">{order.rider_name}</span> {order.rider_phone}</div>}
          </section>
          <Link to="/orders" className="block text-center text-sm text-primary underline">All my orders</Link>
        </div>
      </div>
    </AppShell>
  );
}

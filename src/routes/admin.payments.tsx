import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/PanelShells";

export const Route = createFileRoute("/admin/payments")({ component: Payments });

function Payments() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, restaurants(name)").eq("status", "pending_payment").order("created_at");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  async function confirm(id: string) {
    const { error } = await supabase.from("orders").update({ status: "payment_confirmed" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Payment confirmed");
    qc.invalidateQueries({ queryKey: ["pending-payments"] });
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-3">
        <h2 className="font-display text-2xl font-bold">Pending payments</h2>
        {(data ?? []).length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No pending payments.</div>}
        {data?.map((o: any) => (
          <div key={o.id} className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-semibold">#{o.short_code} · {o.restaurants?.name}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")} · {o.customer_name ?? "Customer"} — {o.delivery_phone}</div>
              <div className="text-xs">Ref: <span className="font-mono">MB-{o.short_code}</span> · {o.payment_submitted_at ? <span className="text-success">Customer marked paid</span> : <span className="text-muted-foreground">Awaiting customer</span>}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right font-medium">{formatNaira(o.total_naira)}</div>
              <button onClick={() => confirm(o.id)} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                <CheckCircle2 className="h-4 w-4" /> Confirm payment
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/overview")({ component: Overview });

function Overview() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let query = supabase.from("orders").select("*, restaurants(name)").order("created_at", { ascending: false }).limit(200);
      if (status) query = query.eq("status", status as any);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  const filtered = (data ?? []).filter((o: any) => !q || o.short_code.toLowerCase().includes(q.toLowerCase()) || o.delivery_phone.includes(q) || o.delivery_address.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, phone, address" className="w-full rounded-xl border border-input bg-surface pl-10 pr-4 py-2 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-input bg-surface px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Restaurant</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((o: any) => (
              <tr key={o.id}>
                <td className="px-3 py-2 font-medium">#{o.short_code}</td>
                <td className="px-3 py-2">{o.restaurants?.name}</td>
                <td className="px-3 py-2">{STATUS_LABELS[o.status]}</td>
                <td className="px-3 py-2">{formatNaira(o.total_naira)}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No orders match.</div>}
      </div>
    </div>
  );
}

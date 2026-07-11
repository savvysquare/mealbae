import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { VendorShell } from "@/components/PanelShells";

export const Route = createFileRoute("/vendor/history")({ component: History });

function History() {
  const { restaurantId } = Route.useRouteContext() as { restaurantId: string };
  const { data } = useQuery({
    queryKey: ["r-history", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("status", ["delivered", "rejected", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <VendorShell>
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-3 font-display text-2xl font-bold">Order history</h2>
        <div className="card-soft divide-y divide-border">
          {(data ?? []).map((o) => (
            <div key={o.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">#{o.short_code}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{formatNaira(o.total_naira)}</div>
                <div className="text-xs text-muted-foreground">{STATUS_LABELS[o.status]}</div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && <div className="p-8 text-center text-sm text-muted-foreground">No past orders yet.</div>}
        </div>
      </div>
    </VendorShell>
  );
}

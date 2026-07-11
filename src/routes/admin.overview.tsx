import { createFileRoute } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { Search, ChevronDown, ChevronUp, User, Phone, MapPin, ClipboardList, KeyRound, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/PanelShells";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/overview")({ component: Overview });

function Overview() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Draft states for editing rider info inline per expanded order
  const [riderDrafts, setRiderDrafts] = useState<Record<string, { name: string; phone: string }>>({});

  const { data, refetch } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, restaurants(name, address, phone), order_items(*)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status) query = query.eq("status", status as any);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const filtered = (data ?? []).filter(
    (o: any) =>
      !q ||
      o.short_code.toLowerCase().includes(q.toLowerCase()) ||
      o.delivery_phone.includes(q) ||
      o.delivery_address.toLowerCase().includes(q.toLowerCase()) ||
      o.restaurants?.name?.toLowerCase().includes(q.toLowerCase())
  );

  async function updateOrderStatus(orderId: string, nextStatus: string) {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus as any })
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Order status updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  }

  async function updateRiderDetails(orderId: string) {
    const draft = riderDrafts[orderId];
    if (!draft) return;
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          rider_name: draft.name.trim() || null,
          rider_phone: draft.phone.trim() || null
        })
        .eq("id", orderId);
      if (error) throw error;
      toast.success("Rider details updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update rider");
    }
  }

  const toggleExpand = (order: any) => {
    if (expandedId === order.id) {
      setExpandedId(null);
    } else {
      setExpandedId(order.id);
      // Initialize draft states for rider name and phone
      setRiderDrafts((prev) => ({
        ...prev,
        [order.id]: {
          name: order.rider_name ?? "",
          phone: order.rider_phone ?? ""
        }
      }));
    }
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-2 sm:px-4">
        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, phone, address, restaurant..."
              className="w-full rounded-2xl border border-input bg-surface pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-input bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Table & Expanded details container */}
        <div className="card-soft overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[600px]">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o: any) => {
                const isExpanded = expandedId === o.id;
                const riderName = riderDrafts[o.id]?.name ?? o.rider_name ?? "";
                const riderPhone = riderDrafts[o.id]?.phone ?? o.rider_phone ?? "";

                return (
                  <Fragment key={o.id}>
                    {/* Main Row */}
                    <tr
                      onClick={() => toggleExpand(o)}
                      className={`hover:bg-secondary/40 cursor-pointer transition-colors ${
                        isExpanded ? "bg-secondary/20" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold text-primary">
                        #{o.short_code}
                      </td>
                      <td className="px-4 py-4 font-medium">{o.restaurants?.name}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {formatNaira(o.total_naira)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold py-1 px-2.5 rounded-full border border-border bg-white transition whitespace-nowrap">
                          {isExpanded ? (
                            <>
                              Hide details <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              View & Manage <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-secondary/10">
                        <td colSpan={5} className="px-6 py-6 border-b border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Side: Order details */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-display font-bold text-base flex items-center gap-2 mb-2 text-foreground">
                                  <ClipboardList className="h-4 w-4 text-primary" /> Order Details
                                </h4>
                                <ul className="space-y-1.5 text-sm bg-white p-3 rounded-2xl border border-border/80">
                                  {o.order_items?.map((item: any) => (
                                    <li key={item.id} className="flex justify-between">
                                      <span>
                                        {item.quantity}× {item.name_snapshot}
                                      </span>
                                      <span className="font-medium text-muted-foreground">
                                        {formatNaira(item.price_snapshot * item.quantity)}
                                      </span>
                                    </li>
                                  ))}
                                  <li className="pt-2 border-t border-dashed flex justify-between font-semibold">
                                    <span>Total Amount</span>
                                    <span className="text-primary">{formatNaira(o.total_naira)}</span>
                                  </li>
                                </ul>
                              </div>

                              <div className="text-sm bg-white p-3 rounded-2xl border border-border/80 space-y-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                                  <User className="h-3 w-3" /> Customer details
                                </div>
                                <div className="font-semibold">{o.customer_name ?? "No Name"}</div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{o.delivery_phone}</span>
                                </div>
                                <div className="flex items-start gap-1 mt-1.5 pt-1.5 border-t border-border">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                  <span className="text-xs text-muted-foreground">{o.delivery_address}</span>
                                </div>
                                {o.notes && (
                                  <div className="mt-2 text-xs italic bg-secondary/30 p-2 rounded-xl text-muted-foreground">
                                    Notes: "{o.notes}"
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Management actions */}
                            <div className="space-y-4">
                              {/* Order Status Management */}
                              <div className="bg-white p-4 rounded-2xl border border-border/80">
                                <h4 className="font-semibold text-sm mb-2">Manage Order Status</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(STATUS_LABELS)
                                    .filter(([k]) => ["pending_payment", "payment_confirmed", "cancelled"].includes(k) || o.status === k)
                                    .map(([k, label]) => {
                                      const isActive = o.status === k;
                                    return (
                                      <button
                                        key={k}
                                        onClick={() => updateOrderStatus(o.id, k)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                                          isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary/40 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Dispatch Rider Assignment */}
                              <div className="bg-white p-4 rounded-2xl border border-border/80 space-y-3">
                                <h4 className="font-semibold text-sm">Assign Dispatch Rider</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    placeholder="Rider name"
                                    value={riderName}
                                    onChange={(e) =>
                                      setRiderDrafts((prev) => ({
                                        ...prev,
                                        [o.id]: { ...prev[o.id], name: e.target.value }
                                      }))
                                    }
                                    className="rounded-xl border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                  <input
                                    placeholder="Rider phone"
                                    value={riderPhone}
                                    onChange={(e) =>
                                      setRiderDrafts((prev) => ({
                                        ...prev,
                                        [o.id]: { ...prev[o.id], phone: e.target.value }
                                      }))
                                    }
                                    className="rounded-xl border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => updateRiderDetails(o.id)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
                                  >
                                    Save Rider Info
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No orders match the filters.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

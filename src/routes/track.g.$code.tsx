import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { StatusTimeline } from "@/components/StatusTimeline";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";
import { Copy, MapPin } from "lucide-react";

export const Route = createFileRoute("/track/g/$code")({
  validateSearch: z.object({ phone: z.string().optional() }),
  component: TrackGroup,
  head: () => ({
    meta: [
      { title: "Track order — MealBae" },
      { name: "description", content: "Live status of your MealBae multi-restaurant order." },
    ],
  }),
});

interface TrackingItem { id: string; name_snapshot: string; price_snapshot: number; quantity: number }
interface TrackingEvent { status: string; created_at: string }
interface TrackingOrder {
  id: string; short_code: string; status: keyof typeof STATUS_LABELS;
  subtotal_naira: number; delivery_fee_naira: number; total_naira: number;
  restaurant_id: string; restaurant_name: string; restaurant_phone: string | null;
  rider_name: string | null; rider_phone: string | null;
  created_at: string;
  items: TrackingItem[];
  events: TrackingEvent[];
}
interface TrackingGroup {
  id: string; code: string;
  delivery_address: string; delivery_phone: string; customer_name: string | null;
  subtotal_naira: number; delivery_fee_naira: number; total_naira: number;
  payment_status: string; payment_submitted_at: string | null; created_at: string;
}
interface TrackingPayload { group: TrackingGroup; orders: TrackingOrder[] }

function TrackGroup() {
  const { code } = Route.useParams();
  const { phone } = Route.useSearch();

  const { data: bank } = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const { data } = await supabase.from("bank_accounts").select("*").eq("is_active", true).limit(1).maybeSingle();
      return data;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["track-group", code, phone],
    enabled: !!phone,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ data: TrackingPayload | null; error: { message: string } | null }>)(
        "get_group_tracking", { _code: code, _phone: phone },
      );
      if (error) throw new Error(error.message);
      return data;
    },
  });

  async function markPaid() {
    if (!phone) return;
    const { error } = await (supabase.rpc as unknown as (
      fn: string, args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("mark_group_paid_by_phone", { _code: code, _phone: phone });
    if (error) toast.error(error.message);
    else { toast.success("Payment noted. Awaiting confirmation."); refetch(); }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90"><Logo className="text-xl" /></Link>
          <Link to="/track" className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary">Track another</Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 pb-28">
        {!phone ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            To view this order, <Link to="/track" className="text-primary underline">enter your phone number</Link>.
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : !data ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Order not found for that phone number. <Link to="/track" className="text-primary underline">Try again</Link>.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Group header */}
            <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order #{data.group.code}</div>
              <div className="mt-1.5 font-display text-2xl font-black">
                {formatNaira(data.group.total_naira)}
                <span className="ml-2 text-sm font-semibold text-muted-foreground">
                  · {data.orders.length} restaurant{data.orders.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{data.group.delivery_address}</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {formatNaira(data.group.subtotal_naira)} subtotal · {formatNaira(data.group.delivery_fee_naira)} delivery
              </div>
            </section>

            {/* Payment card if pending on any child */}
            {data.orders.some((o) => o.status === "pending_payment") && bank && !data.group.payment_submitted_at && (
              <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5">
                <h2 className="font-display text-lg font-bold">Bank transfer</h2>
                <p className="text-sm text-muted-foreground">Send {formatNaira(data.group.total_naira)} to:</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{bank.bank_name}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{bank.account_name}</dd></div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Account no.</dt>
                    <dd className="flex items-center gap-2 font-mono font-medium">
                      {bank.account_number}
                      <button onClick={() => copy(bank.account_number)} className="cursor-pointer"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </dd>
                  </div>
                </dl>
                <button onClick={markPaid} className="mt-4 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:brightness-105 transition cursor-pointer">
                  I have paid
                </button>
              </section>
            )}

            {/* Per-restaurant sub-orders */}
            {data.orders.map((o) => (
              <section key={o.id} className="bg-white rounded-2xl border border-border/80 shadow-xs p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground">#{o.short_code}</div>
                    <div className="font-display text-lg font-extrabold text-foreground">{o.restaurant_name}</div>
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-accent-foreground">
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <div className="mt-3">
                  <StatusTimeline current={o.status} events={o.events} />
                </div>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.quantity}× {i.name_snapshot}</span>
                      <span>{formatNaira(i.price_snapshot * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {o.rider_name && (
                  <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-xs">
                    Rider: <span className="font-bold text-foreground">{o.rider_name}</span>
                    {o.rider_phone && <> · <a href={`tel:${o.rider_phone}`} className="text-primary underline">{o.rider_phone}</a></>}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

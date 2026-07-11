import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { StatusTimeline } from "@/components/StatusTimeline";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { Copy, CheckCircle2, MessageCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track/$id")({
  validateSearch: z.object({ phone: z.string().optional() }),
  component: TrackDetail,
  head: () => ({
    meta: [
      { title: "Track order — MealBae" },
      { name: "description", content: "Live status of your MealBae order." },
    ],
  }),
});

interface TrackingItem { id: string; name_snapshot: string; price_snapshot: number; quantity: number }
interface TrackingEvent { status: string; created_at: string }
interface TrackingOrder {
  id: string;
  short_code: string;
  status: keyof typeof STATUS_LABELS;
  subtotal_naira: number;
  delivery_fee_naira: number;
  total_naira: number;
  delivery_address: string;
  delivery_phone: string;
  payment_submitted_at: string | null;
  rider_name: string | null;
  rider_phone: string | null;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_phone: string | null;
  created_at: string;
}
interface TrackingPayload { order: TrackingOrder; items: TrackingItem[]; events: TrackingEvent[] }

function TrackDetail() {
  const { id } = Route.useParams();
  const { phone } = Route.useSearch();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["track-order", id, phone],
    enabled: !!phone,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: TrackingPayload | null; error: { message: string } | null }>)(
        "get_order_tracking",
        { _order_id: id, _phone: phone },
      );
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: bank } = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*").eq("is_active", true).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  async function markPaid() {
    if (!phone || !data) return;
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("mark_order_paid_guest", { _order_id: id, _phone: phone });
    if (error) toast.error(error.message);
    else { toast.success("Payment noted. Awaiting confirmation."); refetch(); }
  }

  async function markReceived() {
    if (!phone || !data) return;
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("confirm_delivery_received", { _order_id: id, _phone: phone });
    if (error) toast.error(error.message);
    else { toast.success("Order confirmed received! Enjoy your meal 🎉"); refetch(); }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90"><Logo className="text-xl" /></Link>
          <Link to="/track" className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary">Track another</Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <section className="card-soft p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Order #{data.order.short_code}</div>
                <div className="mt-1 font-display text-2xl font-bold">{STATUS_LABELS[data.order.status]}</div>
                <p className="mt-1 text-sm text-muted-foreground">{data.order.restaurant_name}</p>
                <div className="mt-6"><StatusTimeline current={data.order.status} events={data.events} /></div>
              </section>
            </div>
            <div className="space-y-4 md:col-span-2">
              {/* Confirm Received — shown when rider has marked as delivered */}
              {data.order.status === "delivered" && (
                <section className="card-soft p-5 border-l-4 border-success bg-success/5">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-5 w-5 text-success" />
                    <h2 className="font-display text-lg font-bold text-success">Your order has arrived!</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The rider has marked your order as delivered. Please confirm once you've received your food.
                  </p>
                  <button
                    onClick={markReceived}
                    className="mt-4 w-full rounded-2xl bg-success px-4 py-3 text-sm font-bold text-success-foreground hover:opacity-90 transition"
                  >
                    ✓ Confirm Order Received
                  </button>
                </section>
              )}

              {/* Already received confirmation */}
              {data.order.status === "received" && (
                <section className="card-soft p-5 border-l-4 border-primary bg-primary/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-base font-bold text-primary">Order received! Enjoy your meal 🎉</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Thank you for ordering with MealBae!</p>
                </section>
              )}

              {data.order.status === "pending_payment" && bank && (
                <section className="card-soft p-5">
                  <h2 className="font-display text-lg font-bold">Bank transfer</h2>
                  <p className="text-sm text-muted-foreground">Send {formatNaira(data.order.total_naira)} to:</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">{bank.bank_name}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Account name</dt><dd className="font-medium">{bank.account_name}</dd></div>
                    <div className="flex justify-between items-center"><dt className="text-muted-foreground">Account no.</dt>
                      <dd className="flex items-center gap-2 font-mono font-medium">{bank.account_number} <button onClick={() => copy(bank.account_number)}><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button></dd>
                    </div>

                  </dl>
                  <button onClick={markPaid} disabled={!!data.order.payment_submitted_at} className="mt-4 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                    {data.order.payment_submitted_at ? <><CheckCircle2 className="mr-1 inline h-4 w-4" /> Payment marked — awaiting confirmation</> : "I have paid"}
                  </button>
                </section>
              )}
              <section className="card-soft p-5">
                <h2 className="font-display text-lg font-bold">Order</h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.items.map((i) => (
                    <li key={i.id} className="flex justify-between"><span>{i.quantity}× {i.name_snapshot}</span><span>{formatNaira(i.price_snapshot * i.quantity)}</span></li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(data.order.subtotal_naira)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(data.order.delivery_fee_naira)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatNaira(data.order.total_naira)}</span></div>
                </div>
              </section>
              <section className="card-soft p-5 text-sm">
                <div className="font-medium">Delivering to</div>
                <div className="mt-1 text-muted-foreground">{data.order.delivery_address}</div>
                <div className="text-muted-foreground">{data.order.delivery_phone}</div>
                {data.order.rider_name && <div className="mt-3 border-t border-border pt-3">Rider: <span className="font-medium">{data.order.rider_name}</span> {data.order.rider_phone}</div>}
              </section>
              <section className="card-soft p-5 text-sm bg-secondary/30">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Need help?
                </div>
                <div className="mt-2 text-muted-foreground">
                  Contact our support team on WhatsApp or Call:
                </div>
                <div className="mt-1">
                  <a href="https://wa.me/2348141894696" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                    08141894696
                  </a>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

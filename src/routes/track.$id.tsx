import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { StatusTimeline } from "@/components/StatusTimeline";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { Copy, CheckCircle2, MessageCircle, PartyPopper, XCircle, Timer, Star } from "lucide-react";
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
  id: string; short_code: string; status: keyof typeof STATUS_LABELS;
  subtotal_naira: number; delivery_fee_naira: number; total_naira: number;
  delivery_address: string; delivery_phone: string;
  payment_submitted_at: string | null;
  rider_name: string | null; rider_phone: string | null;
  restaurant_id: string; restaurant_name: string; restaurant_phone: string | null;
  created_at: string;
}
interface TrackingPayload { order: TrackingOrder; items: TrackingItem[]; events: TrackingEvent[] }

const RATING_EMOJIS: { score: number; emoji: string; label: string; color: string }[] = [
  { score: 1, emoji: "😡", label: "Terrible", color: "text-red-600" },
  { score: 2, emoji: "☹️", label: "Bad",      color: "text-orange-500" },
  { score: 3, emoji: "😐", label: "Okay",     color: "text-yellow-500" },
  { score: 4, emoji: "🙂", label: "Good",     color: "text-lime-600" },
  { score: 5, emoji: "🥰", label: "Amazing!", color: "text-emerald-600" },
];

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function TrackDetail() {
  const { id } = Route.useParams();
  const { phone } = Route.useSearch();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["track-order", id, phone],
    enabled: !!phone,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
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
      fn: string, args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("mark_order_paid_guest", { _order_id: id, _phone: phone });
    if (error) toast.error(error.message);
    else { toast.success("Payment noted. Awaiting confirmation."); refetch(); }
  }

  async function markReceived() {
    if (!phone || !data) return;
    const { error } = await (supabase.rpc as unknown as (
      fn: string, args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("confirm_delivery_received", { _order_id: id, _phone: phone });
    if (error) toast.error(error.message);
    else { toast.success("Order confirmed received! Enjoy your meal 🎉"); refetch(); }
  }

  async function submitReview() {
    if (!data || rating === 0) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.rpc as unknown as (
        fn: string, args: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>)("submit_review", {
        _order_id: id,
        _phone: phone,
        _rating: rating,
        _review_text: reviewText.trim() || null,
      });
      if (error) toast.error(error.message);
      else { toast.success("Thanks for your review! ❤️"); setReviewSubmitted(true); }
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate delivery duration
  const deliveryDuration = (() => {
    if (!data?.order) return null;
    const receivedEvent = data.events?.find((e) => e.status === "received");
    if (!receivedEvent) return null;
    const placed = new Date(data.order.created_at).getTime();
    const received = new Date(receivedEvent.created_at).getTime();
    return received - placed;
  })();

  const activeRating = hoverRating || rating;
  const activeRatingInfo = RATING_EMOJIS.find((r) => r.score === activeRating);

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            {/* LEFT: Status */}
            <div className="md:col-span-3">
              <section className={`bg-white rounded-2xl border border-border/80 shadow-xs p-6 ${["rejected", "cancelled"].includes(data.order.status) ? "border-t-4 border-destructive" : ""}`}>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order #{data.order.short_code}</div>
                <div className={`mt-1.5 font-display text-2xl font-black ${["rejected", "cancelled"].includes(data.order.status) ? "text-destructive" : ""}`}>
                  {data.order.status === "rejected" ? (
                    <span className="flex items-center gap-2"><XCircle className="h-6 w-6 shrink-0" /> {STATUS_LABELS[data.order.status]}</span>
                  ) : STATUS_LABELS[data.order.status]}
                </div>
                <p className="mt-1 text-sm text-muted-foreground font-medium">{data.order.restaurant_name}</p>

                {data.order.status === "rejected" && (
                  <div className="mt-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-sm">
                    <div className="font-bold text-destructive flex items-center gap-1.5 mb-1">Reason for Rejection:</div>
                    <div className="text-foreground font-medium leading-relaxed">
                      "{(data.order as any).rejection_reason ?? "No reason provided"}"
                    </div>
                  </div>
                )}

                <div className="mt-6"><StatusTimeline current={data.order.status} events={data.events} /></div>
              </section>

              {/* ── DELIVERY RECEIVED: Duration + Rating ── */}
              {data.order.status === "received" && (
                <div className="mt-5 space-y-4">
                  {/* Duration Banner */}
                  {deliveryDuration !== null && (
                    <div className="bg-gradient-to-br from-primary/90 to-red-600 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="h-5 w-5 opacity-80" />
                        <span className="text-sm font-bold opacity-90">Total Delivery Time</span>
                      </div>
                      <div className="font-display text-4xl font-black tracking-tight">
                        {formatDuration(deliveryDuration)}
                      </div>
                      <div className="text-xs opacity-75 mt-1 font-medium">From order placement to delivery</div>
                    </div>
                  )}

                  {/* Rating Card */}
                  {!reviewSubmitted ? (
                    <div className="bg-white rounded-2xl border border-border/80 shadow-xs p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                        <h3 className="font-display text-lg font-extrabold text-foreground">How was your meal?</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-5">Rate your experience from {data.order.restaurant_name}</p>

                      {/* Emoji Rating Row */}
                      <div className="flex justify-center gap-2 mb-3">
                        {RATING_EMOJIS.map((r) => (
                          <button
                            key={r.score}
                            onClick={() => setRating(r.score)}
                            onMouseEnter={() => setHoverRating(r.score)}
                            onMouseLeave={() => setHoverRating(0)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
                              rating === r.score
                                ? "scale-125 bg-secondary"
                                : "hover:scale-110 hover:bg-secondary/60"
                            }`}
                          >
                            <span className="text-3xl leading-none">{r.emoji}</span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider ${rating === r.score ? r.color : "text-muted-foreground"}`}>
                              {r.score}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Active rating label */}
                      {activeRatingInfo && (
                        <div className={`text-center text-sm font-bold mb-4 ${activeRatingInfo.color}`}>
                          {activeRatingInfo.emoji} {activeRatingInfo.label}
                        </div>
                      )}

                      {/* Review text */}
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us more (optional)..."
                        rows={3}
                        className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/60"
                      />

                      <button
                        onClick={submitReview}
                        disabled={rating === 0 || submitting}
                        className="mt-3 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {submitting ? "Submitting…" : rating === 0 ? "Select a rating above" : `Submit ${activeRatingInfo?.emoji ?? ""} Review`}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-border/80 shadow-xs p-6 text-center">
                      <div className="text-4xl mb-2">🎉</div>
                      <div className="font-display text-lg font-extrabold text-foreground">Thank you!</div>
                      <p className="text-sm text-muted-foreground mt-1">Your review helps other customers find great meals.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Actions + Summary */}
            <div className="space-y-4 md:col-span-2">
              {/* Confirm Received */}
              {data.order.status === "delivered" && (
                <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5 border-l-4 border-emerald-500 bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="h-5 w-5 text-emerald-600" />
                    <h2 className="font-display text-lg font-bold text-emerald-700">Your order has arrived!</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The rider has marked your order as delivered. Please confirm once you've received your food.
                  </p>
                  <button
                    onClick={markReceived}
                    className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:brightness-105 transition cursor-pointer"
                  >
                    ✓ Confirm Order Received
                  </button>
                </section>
              )}

              {/* Received confirmed (short) */}
              {data.order.status === "received" && (
                <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5 border-l-4 border-primary bg-primary/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-base font-bold text-primary">Order received! Enjoy 🎉</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Thank you for ordering with MealBae!</p>
                </section>
              )}

              {/* Rejected reorder */}
              {data.order.status === "rejected" && (
                <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-6 border-l-4 border-primary bg-primary/5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍕</span>
                      <h2 className="font-display text-lg font-bold text-foreground">Still hungry?</h2>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Your order was rejected, but you can quickly reorder from the same restaurant or check other great options.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/r/$restaurantId"
                      params={{ restaurantId: data.order.restaurant_id }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:brightness-105 shadow-md shadow-primary/20 transition"
                    >
                      Reorder from {data.order.restaurant_name}
                    </Link>
                    <Link
                      to="/home"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                    >
                      Browse other restaurants
                    </Link>
                  </div>
                </section>
              )}

              {/* Payment */}
              {data.order.status === "pending_payment" && bank && (
                <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5">
                  <h2 className="font-display text-lg font-bold">Bank transfer</h2>
                  <p className="text-sm text-muted-foreground">Send {formatNaira(data.order.total_naira)} to:</p>
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
                  <button onClick={markPaid} disabled={!!data.order.payment_submitted_at} className="mt-4 w-full rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60 cursor-pointer">
                    {data.order.payment_submitted_at ? <><CheckCircle2 className="mr-1 inline h-4 w-4" /> Payment marked — awaiting confirmation</> : "I have paid"}
                  </button>
                </section>
              )}

              {/* Order Items */}
              <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5">
                <h2 className="font-display text-lg font-bold mb-2">Order</h2>
                <ul className="space-y-1.5 text-sm">
                  {data.items.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span className="text-muted-foreground">{i.quantity}× {i.name_snapshot}</span>
                      <span className="font-medium">{formatNaira(i.price_snapshot * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(data.order.subtotal_naira)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatNaira(data.order.delivery_fee_naira)}</span></div>
                  <div className="flex justify-between font-extrabold text-base pt-1"><span>Total</span><span>{formatNaira(data.order.total_naira)}</span></div>
                </div>
              </section>

              {/* Delivery Address */}
              <section className="bg-white rounded-2xl border border-border/80 shadow-xs p-5 text-sm">
                <div className="font-bold mb-1 text-foreground">Delivering to</div>
                <div className="text-muted-foreground">{data.order.delivery_address}</div>
                <a href={`tel:${data.order.delivery_phone}`} className="text-primary font-medium hover:underline">{data.order.delivery_phone}</a>
                {data.order.rider_name && (
                  <div className="mt-3 border-t border-border pt-3">
                    Rider: <span className="font-medium">{data.order.rider_name}</span>{" "}
                    <a href={`tel:${data.order.rider_phone}`} className="text-primary hover:underline">{data.order.rider_phone}</a>
                  </div>
                )}
              </section>

              {/* Support */}
              <section className="bg-secondary/30 rounded-2xl border border-border/60 p-5 text-sm">
                <div className="flex items-center gap-2 font-bold text-foreground mb-1">
                  <MessageCircle className="h-4 w-4 text-primary" /> Need help?
                </div>
                <div className="text-muted-foreground mb-1">Contact our support on WhatsApp or Call:</div>
                <a href="https://wa.me/2348141894696" target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">08141894696</a>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

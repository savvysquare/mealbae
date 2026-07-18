import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { AppShell } from "@/components/AppShell";
import { PaymentAccountCard } from "@/components/PaymentAccountCard";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-auth";
import { savePhone } from "@/lib/user-phone";
import { Phone, CheckCircle2, ArrowLeft, MapPin, Loader2, Sparkles } from "lucide-react";

type PlaceGroupResult = { group_id: string; group_code: string };

export const Route = createFileRoute("/checkout")({ component: Checkout });

const CONFIRM_PHONE = "08141894696";

async function estimateDeliveryFee(
  customerAddress: string,
  fallbackFee: number,
): Promise<{ fee: number; distanceKm: number | null; aiUsed: boolean }> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return { fee: fallbackFee, distanceKm: null, aiUsed: false };
    const prompt = `Estimate road distance in Osogbo, Nigeria to "${customerAddress}" from a central Osogbo restaurant. Respond JSON: {"distance_km": <number>}. Default 3 if vague.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      },
    );
    if (!res.ok) return { fee: fallbackFee, distanceKm: null, aiUsed: false };
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    const distKm = Math.max(0.5, Number(parsed.distance_km) || 3);
    const fee = Math.min(2500, Math.max(300, Math.round(500 + distKm * 100)));
    return { fee, distanceKm: distKm, aiUsed: true };
  } catch {
    return { fee: fallbackFee, distanceKm: null, aiUsed: false };
  }
}

function Checkout() {
  const { itemsByRestaurant, subtotal, clear } = useCart();
  const { user } = useSession();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"form" | "payment">("form");

  const BASE_FEE_PER_RESTAURANT = 500;
  const restaurantCount = itemsByRestaurant.length;
  const fallbackFee = BASE_FEE_PER_RESTAURANT * Math.max(1, restaurantCount);

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [estimatingFee, setEstimatingFee] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [feeAiUsed, setFeeAiUsed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = address.trim();
    if (trimmed.length < 6) {
      setDeliveryFee(fallbackFee);
      setDistanceKm(null);
      setFeeAiUsed(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setEstimatingFee(true);
      const result = await estimateDeliveryFee(trimmed + ", Osogbo, Osun State", fallbackFee);
      // Multi-restaurant: add a small surcharge per extra pickup
      const perExtra = 250 * Math.max(0, restaurantCount - 1);
      setDeliveryFee(result.fee + perExtra);
      setDistanceKm(result.distanceKm);
      setFeeAiUsed(result.aiUsed);
      setEstimatingFee(false);
    }, 800);
  }, [address, fallbackFee, restaurantCount]);

  const effectiveDeliveryFee = deliveryFee ?? fallbackFee;
  const total = subtotal + effectiveDeliveryFee;

  function proceedToPayment() {
    if (!address.trim() || !phone.trim()) {
      toast.error("Address and phone are required");
      return;
    }
    if (estimatingFee) {
      toast.error("Please wait while we calculate the delivery fee");
      return;
    }
    setStage("payment");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmPayment() {
    if (itemsByRestaurant.length === 0) return;
    setSubmitting(true);
    try {
      // Split the group delivery fee proportionally to each restaurant subtotal
      const restaurants = itemsByRestaurant.map((r, idx) => {
        const share =
          idx === itemsByRestaurant.length - 1
            ? effectiveDeliveryFee - itemsByRestaurant.slice(0, -1).reduce((s, x) => s + Math.round((x.subtotal / subtotal) * effectiveDeliveryFee), 0)
            : Math.round((r.subtotal / subtotal) * effectiveDeliveryFee);
        return {
          restaurant_id: r.restaurantId,
          subtotal_naira: r.subtotal,
          delivery_fee_naira: share,
          items: r.items.map((i) => ({
            meal_id: i.mealId,
            name_snapshot: i.name,
            price_snapshot: i.price,
            quantity: i.quantity,
          })),
        };
      });

      const { data: rpcData, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: PlaceGroupResult[] | PlaceGroupResult | null; error: { message: string } | null }>)(
        "place_order_group_guest",
        {
          _delivery_address: address,
          _delivery_phone: phone,
          _customer_name: name || null,
          _notes: notes || null,
          _subtotal_naira: subtotal,
          _delivery_fee_naira: effectiveDeliveryFee,
          _total_naira: total,
          _restaurants: restaurants,
        },
      );

      if (error) {
        toast.error(error?.message ?? "Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }

      const data = Array.isArray(rpcData) ? rpcData[0] ?? null : rpcData;
      if (!data) {
        toast.error("Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      savePhone(phone);
      toast.success("Order placed! Track your delivery below.");
      nav({ to: "/track/g/$code", params: { code: data.group_code }, search: { phone } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (itemsByRestaurant.length === 0) {
    return (
      <AppShell title="Checkout">
        <p className="text-muted-foreground">
          Your cart is empty. <Link to="/home" className="text-primary underline">Browse</Link>
        </p>
      </AppShell>
    );
  }

  if (stage === "payment") {
    return (
      <AppShell title="Payment">
        <div className="mx-auto max-w-xl">
          <button
            onClick={() => setStage("form")}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to details
          </button>

          <div className="card-soft p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-[11px] font-black text-foreground">1</span>
              <h2 className="font-display text-xl font-black tracking-tight">Send payment</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer the exact total below to this account. Your order is placed once you tap{" "}
              <span className="font-semibold text-foreground">I have paid</span>.
            </p>

            <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span>Amount to pay</span>
                <span>
                  {restaurantCount} restaurant{restaurantCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-black tracking-tight text-primary tabular-nums">
                {formatNaira(total)}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatNaira(subtotal)} subtotal · {formatNaira(effectiveDeliveryFee)} delivery
                {feeAiUsed && distanceKm && (
                  <span className="ml-2 text-emerald-600 font-semibold">(~{distanceKm.toFixed(1)} km)</span>
                )}
              </div>
            </div>

            <div className="mt-4"><PaymentAccountCard /></div>

            <div className="mt-6 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-[11px] font-black text-foreground">2</span>
              <h3 className="font-display text-lg font-black tracking-tight">Confirm payment</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              After the transfer succeeds on your bank app, tap the button below. We'll open your live order tracker.
            </p>

            <a
              href={`tel:${CONFIRM_PHONE}`}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-xs hover:bg-secondary transition-colors"
            >
              <Phone className="h-4 w-4 text-primary" />
              Trouble? Call {CONFIRM_PHONE}
            </a>

            <button
              onClick={confirmPayment}
              disabled={submitting}
              className="mt-3 group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl shadow-primary/30 ring-2 ring-primary-foreground/20 transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <CheckCircle2 className="relative h-5 w-5" />
              <span className="relative text-base font-black tracking-tight">
                {submitting ? "Placing order…" : "I have paid"}
              </span>
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Confirmation phone: <span className="font-semibold text-foreground">{CONFIRM_PHONE}</span>. We verify every transfer before dispatch.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Checkout">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Delivery details</h2>
          <div className="mt-3 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
              className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
              className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="relative">
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Delivery address (street, landmark, area in Osogbo)" rows={3}
                className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {address.trim().length >= 6 && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {estimatingFee ? (
                    <><Loader2 className="h-3 w-3 animate-spin text-primary" /><span className="text-muted-foreground">Calculating delivery fee…</span></>
                  ) : feeAiUsed && distanceKm ? (
                    <><Sparkles className="h-3 w-3 text-primary" /><span className="text-primary font-semibold">AI estimate: ~{distanceKm.toFixed(1)} km · {formatNaira(effectiveDeliveryFee)} delivery</span></>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Delivery fee: {formatNaira(effectiveDeliveryFee)}</span>
                  )}
                </div>
              )}
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional): extra pepper, no onions…" rows={2}
              className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          {restaurantCount > 1 && (
            <p className="mt-1 text-xs text-primary font-semibold">
              Ordering from {restaurantCount} restaurants — we'll dispatch each pickup for you.
            </p>
          )}
          <div className="mt-3 space-y-4">
            {itemsByRestaurant.map((r) => (
              <div key={r.restaurantId} className="border-t border-border/50 pt-3 first:border-t-0 first:pt-0">
                <div className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">{r.restaurantName}</div>
                <ul className="space-y-1.5 text-sm">
                  {r.items.map((i) => (
                    <li key={i.cartItemId} className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{i.quantity}× {i.name.split(" (")[0]}</span>
                        <span className="font-medium">{formatNaira(i.price * i.quantity)}</span>
                      </div>
                      {i.customLabel && <div className="text-[10px] text-muted-foreground pl-4 leading-relaxed">{i.customLabel}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">Delivery fee{feeAiUsed && <Sparkles className="h-3 w-3 text-primary" />}</span>
              <span className="flex items-center gap-1">{estimatingFee ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : formatNaira(effectiveDeliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatNaira(total)}</span></div>
          </div>
          <button onClick={proceedToPayment} disabled={estimatingFee}
            className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2">
            {estimatingFee ? (<><Loader2 className="h-4 w-4 animate-spin" />Calculating fee…</>) : "Place order"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Next step: bank transfer, then tap "I have paid".</p>
        </section>
      </div>
    </AppShell>
  );
}

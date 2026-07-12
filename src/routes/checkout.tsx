import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { AppShell } from "@/components/AppShell";
import { PaymentAccountCard } from "@/components/PaymentAccountCard";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-auth";
import { Phone, CheckCircle2, ArrowLeft } from "lucide-react";

type PlaceOrderResult = { id: string; short_code: string };

export const Route = createFileRoute("/checkout")({ component: Checkout });

const CONFIRM_PHONE = "08141894696";

function Checkout() {
  const { cart, subtotal, clear } = useCart();
  const { user } = useSession();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"form" | "payment">("form");

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", cart.restaurantId],
    enabled: !!cart.restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("id,name,delivery_fee_naira").eq("id", cart.restaurantId!).single();
      if (error) throw error;
      return data;
    },
  });

  const deliveryFee = restaurant?.delivery_fee_naira ?? 0;
  const total = subtotal + deliveryFee;

  function proceedToPayment() {
    if (!address.trim() || !phone.trim()) { toast.error("Address and phone are required"); return; }
    setStage("payment");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function normalizePhone(p: string) {
    const trimmed = p.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("0")) return "+234" + trimmed.slice(1);
    return "+234" + trimmed;
  }

  async function confirmPayment() {
    if (!cart.restaurantId) return;
    setSubmitting(true);
    try {
      const items = cart.items.map((i) => ({
        meal_id: i.mealId,
        name_snapshot: i.name,
        price_snapshot: i.price,
        quantity: i.quantity,
      }));

      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: PlaceOrderResult | null; error: { message: string } | null }>)(
        "place_order_guest",
        {
          _restaurant_id: cart.restaurantId,
          _delivery_address: address,
          _delivery_phone: phone,
          _customer_name: name || null,
          _notes: notes || null,
          _subtotal_naira: subtotal,
          _delivery_fee_naira: deliveryFee,
          _total_naira: total,
          _items: items,
        }
      );

      if (error || !data) {
        toast.error(error?.message ?? "Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      toast.success("Order placed! Track your delivery below.");
      // Redirect to the public tracking page using phone for verification
      nav({ to: "/track/$id", params: { id: data.id }, search: { phone } });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (!cart.restaurantId || cart.items.length === 0) {
    return (
      <AppShell title="Checkout">
        <p className="text-muted-foreground">Your cart is empty. <Link to="/home" className="text-primary underline">Browse</Link></p>
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
              Transfer the exact total below to this account. Your order is placed once you tap <span className="font-semibold text-foreground">I have paid</span>.
            </p>

            <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span>Amount to pay</span>
                <span>{cart.items.length} item{cart.items.length === 1 ? "" : "s"}</span>
              </div>
              <p className="mt-1 font-display text-3xl font-black tracking-tight text-primary tabular-nums">
                {formatNaira(total)}
              </p>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatNaira(subtotal)} subtotal · {formatNaira(deliveryFee)} delivery
              </div>
            </div>

            <div className="mt-4">
              <PaymentAccountCard />
            </div>

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
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address (street, landmark, area in Osogbo)" rows={3} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional): extra pepper, no onions…" rows={2} className="w-full rounded-xl border border-input bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </section>
        <section className="card-soft p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.cartItemId} className="flex flex-col gap-0.5 pb-2 last:pb-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{i.quantity}× {i.name.split(" (")[0]}</span>
                  <span className="font-medium">{formatNaira(i.price * i.quantity)}</span>
                </div>
                {i.customLabel && (
                  <div className="text-[10px] text-muted-foreground pl-4 leading-relaxed">{i.customLabel}</div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>{formatNaira(deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatNaira(total)}</span></div>
          </div>
          <button onClick={proceedToPayment} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground cursor-pointer">
            Place order
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Next step: bank transfer, then tap "I have paid".</p>
        </section>
      </div>
    </AppShell>
  );
}

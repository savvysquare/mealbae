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

export const Route = createFileRoute("/_authenticated/checkout")({ component: Checkout });

function Checkout() {
  const { cart, subtotal, clear } = useCart();
  const { user } = useSession();
  const nav = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function placeOrder() {
    if (!cart.restaurantId || !user) return;
    if (!address.trim() || !phone.trim()) { toast.error("Address and phone are required"); return; }
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      customer_id: user.id,
      restaurant_id: cart.restaurantId,
      subtotal_naira: subtotal,
      delivery_fee_naira: deliveryFee,
      total_naira: total,
      delivery_address: address,
      delivery_phone: phone,
      customer_name: name || null,
      notes: notes || null,
    }).select("id").single();
    if (error || !order) { setSubmitting(false); toast.error(error?.message ?? "Could not create order"); return; }
    const items = cart.items.map((i) => ({
      order_id: order.id, meal_id: i.mealId, name_snapshot: i.name, price_snapshot: i.price, quantity: i.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) { setSubmitting(false); toast.error(itemsErr.message); return; }
    clear();
    setSubmitting(false);
    nav({ to: "/orders/$id", params: { id: order.id } });
  }

  if (!cart.restaurantId || cart.items.length === 0) {
    return (
      <AppShell title="Checkout">
        <p className="text-muted-foreground">Your cart is empty. <Link to="/home" className="text-primary underline">Browse</Link></p>
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
              <li key={i.mealId} className="flex justify-between">
                <span>{i.quantity}× {i.name}</span>
                <span>{formatNaira(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>{formatNaira(deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatNaira(total)}</span></div>
          </div>
          <div className="mt-5">
            <PaymentAccountCard compact />
          </div>
          <button onClick={placeOrder} disabled={submitting} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
            {submitting ? "Placing order…" : "Place order & see payment details"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Payment is by bank transfer to the account above. Your order confirms after payment is verified.</p>
        </section>
      </div>
    </AppShell>
  );
}

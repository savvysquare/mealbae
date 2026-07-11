import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Search } from "lucide-react";

export const Route = createFileRoute("/track")({
  component: TrackPage,
  head: () => ({
    meta: [
      { title: "Track my Meal — MealBae" },
      { name: "description", content: "Track your MealBae order in real time using your order ID." },
    ],
  }),
});

function TrackPage() {
  const nav = useNavigate();
  const [orderId, setOrderId] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) return;
    nav({ to: "/orders/$id", params: { id } });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90">
            <Logo className="text-xl" />
          </Link>
          <Link
            to="/" hash="restaurants"
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-xs hover:brightness-105 transition-all"
          >
            Order Now
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-16 md:py-24">
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Track my Meal</h1>
        <p className="mt-3 text-muted-foreground">Enter the order ID from your confirmation to see live status.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Order ID</span>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 4f2c9b8a-..."
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-xs hover:brightness-105 transition-all"
          >
            <Search className="h-4 w-4" /> Track order
          </button>
        </form>
      </main>
    </div>
  );
}

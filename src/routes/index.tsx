import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { Clock, ArrowRight, Star, ChevronRight } from "lucide-react";

import heroDish from "@/assets/hero-dish.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

interface Restaurant {
  id: string;
  name: string;
  address: string;
  description: string | null;
  image_url: string | null;
  opens_at: string;
  closes_at: string;
  is_open_override: boolean | null;
  delivery_fee_naira: number;
}

function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

const CATEGORIES = [
  { name: "Swallow", emoji: "🍲" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Chicken", emoji: "🍗" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Drinks", emoji: "🥤" },
];

function Landing() {
  const { data: restaurants } = useRestaurants();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* DoorDash Style Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Logo className="text-xl" />
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link
              to="/track"
              className="rounded-full px-4 py-2 text-foreground hover:bg-secondary transition-colors"
            >
              Track my Meal
            </Link>
          </div>
        </div>
      </header>

      {/* DoorDash Style Hero Section */}
      <section className="bg-secondary/40 py-12 md:py-20 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7 flex flex-col justify-center text-left">
            <h1 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl text-foreground leading-[1.1]">
              Your favourite meal, <span className="text-primary text-nowrap">Before Anything Else.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              Order from the best local kitchens. Pay easily with bank transfers, track real-time delivery, and enjoy delicious meals.
            </p>

            {/* Bold two-tone CTA Button — consistent with website red palette */}
            <Link
              to="/home"
              className="mt-8 group relative inline-flex w-full max-w-md items-stretch overflow-hidden rounded-full shadow-2xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="relative flex flex-1 flex-col items-center justify-center bg-primary px-6 py-5 md:py-6 text-center">
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative text-2xl md:text-3xl font-black text-primary-foreground tracking-tight leading-none drop-shadow-sm">
                  Order your Meal
                </span>
                <span className="relative mt-1.5 text-[11px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#fff0ed]">
                  BEFORE ANYTHING ELSE
                </span>
              </div>
              <div className="relative flex aspect-square items-center justify-center bg-[var(--hero-cta-cap)] md:w-20 w-16 shrink-0">
                <ChevronRight className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground transition-transform duration-300 group-hover:translate-x-1" strokeWidth={3} />
              </div>
            </Link>

            {/* Circular Category Bubbles */}
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Popular Cuisines</p>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    to="/" hash="restaurants"
                    className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-all shadow-xs cursor-pointer"
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Side Dish */}
          <div className="md:col-span-5 relative flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-[420px]">
              {/* Background solid red disk */}
              <div className="absolute inset-0 m-4 rounded-full bg-primary/5" />
              <img
                src={heroDish}
                alt="Delicious Jollof Rice with Chicken"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.15)] animate-pulse-slow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurant Feed */}
      <section id="restaurants" className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8 flex-1">
        <div className="mb-8 flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold md:text-3xl text-foreground">
              Popular Kitchens in Osogbo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Local spots delivering warm and fast</p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            {restaurants?.length ?? 0} Restaurants open
          </span>
        </div>

        {/* Restaurant Card Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants?.map((r) => {
            const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
            // Simulate a rating since the table doesn't have it (standard DoorDash style)
            const rating = 4.5 + (r.name.charCodeAt(0) % 5) * 0.1;
            
            return (
              <Link
                key={r.id}
                to="/r/$restaurantId"
                params={{ restaurantId: r.id }}
                className="group flex flex-col overflow-hidden rounded-xl bg-white border border-border/80 transition-all duration-300 hover:shadow-md hover:border-border"
              >
                {/* Closed banner */}
                {!open && (
                  <div className="bg-warning/10 border-b border-warning/20 px-4 py-1.5 text-center text-xs font-bold text-warning-foreground">
                    Closed Now
                  </div>
                )}

                {/* Info Metadata */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {r.name}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        {rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {r.address}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> 25–35 Min
                    </span>
                    <span className="font-bold text-foreground">
                      {formatNaira(r.delivery_fee_naira)} delivery
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/" hash="restaurants"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 transition-all text-sm cursor-pointer"
          >
            Start Your Order <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo className="opacity-75 grayscale hover:grayscale-0 transition" />
          <div>MealBAE · Osogbo, Nigeria · Your meal, before anything else.</div>
        </div>
      </footer>
    </div>
  );
}

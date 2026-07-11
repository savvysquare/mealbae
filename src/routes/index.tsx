import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { HeaderActions } from "@/components/HeaderActions";
import { ChevronRight } from "lucide-react";

import heroDish from "@/assets/hero-dish.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

const CATEGORIES = [
  { name: "Swallow", emoji: "🍲" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Chicken", emoji: "🍗" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Drinks", emoji: "🥤" },
];

function Landing() {

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3.5 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90"><Logo /></Link>
          <HeaderActions />
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center bg-secondary/40 py-12 md:py-20 border-b border-border">
        <div className="w-full mx-auto max-w-7xl px-4 md:px-8 grid gap-8 md:grid-cols-12 items-center">
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
                    to="/home"
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

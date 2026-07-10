import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { Search, Clock, MapPin, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

interface Restaurant {
  id: string; name: string; address: string; description: string | null;
  image_url: string | null; opens_at: string; closes_at: string;
  is_open_override: boolean | null; delivery_fee_naira: number;
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

function Landing() {
  const { data: restaurants } = useRestaurants();
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo className="text-2xl" />
        <div className="flex items-center gap-2 text-sm">
          <Link to="/auth/staff" className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-secondary">Restaurant / Admin</Link>
          <Link to="/auth/customer" className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground">Sign in</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-14 md:pt-16 md:pb-24">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" /> Delivering across Osogbo
        </p>
        <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
          Your meal, <br /> <span className="text-primary italic">before anything else.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Order from Osogbo's best kitchens. Simple bank transfer payment, live tracking, delivered warm.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth/customer" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
            Start ordering <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#restaurants" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 font-medium">
            Browse restaurants
          </a>
        </div>
      </section>

      <section id="restaurants" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl font-bold">Osogbo favourites</h2>
          <span className="text-sm text-muted-foreground">{restaurants?.length ?? 0} restaurants</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants?.map((r) => {
            const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
            return (
              <Link key={r.id} to="/r/$restaurantId" params={{ restaurantId: r.id }} className="card-soft overflow-hidden transition hover:shadow-md">
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                  {r.image_url && <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.address}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${open ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {open ? "Open now" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.opens_at.slice(0,5)}–{r.closes_at.slice(0,5)}</span>
                    <span>· {formatNaira(r.delivery_fee_naira)} delivery</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        MealBAE · Osogbo, Nigeria
      </footer>
    </div>
  );
}

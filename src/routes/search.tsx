import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { Search as SearchIcon, Store, Utensils } from "lucide-react";
import { formatNaira, isRestaurantOpen } from "@/lib/format";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search — MealBae" },
      { name: "description", content: "Search restaurants and meals across Osogbo on MealBae." },
      { property: "og:title", content: "Search — MealBae" },
      { property: "og:description", content: "Search restaurants and meals across Osogbo on MealBae." },
    ],
  }),
});

function SearchPage() {
  const [q, setQ] = useState("");
  const term = q.trim();

  const { data: restaurants } = useQuery({
    queryKey: ["search-restaurants", term],
    enabled: term.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, description, address, opens_at, closes_at, is_open_override, delivery_fee_naira")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(15);
      if (error) throw error;
      return data;
    },
  });

  const { data: meals } = useQuery({
    queryKey: ["search-meals", term],
    enabled: term.length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("id, name, price_naira, restaurant_id, restaurants(name)")
        .ilike("name", `%${term}%`)
        .eq("is_available", true)
        .order("name")
        .limit(20);
      if (error) throw error;
      return data as unknown as { id: string; name: string; price_naira: number; restaurant_id: string; restaurants: { name: string } | null }[];
    },
  });

  const hasResults = useMemo(
    () => (restaurants && restaurants.length > 0) || (meals && meals.length > 0),
    [restaurants, meals],
  );

  return (
    <AppShell title="Search" right={<HeaderActions />}>
      <div className="mx-auto max-w-2xl pb-24">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search meals or restaurants"
            className="w-full rounded-full border border-border bg-white pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {term.length < 2 ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            <SearchIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            Try searching "jollof", "amala", or a restaurant name.
          </div>
        ) : !hasResults ? (
          <div className="mt-16 text-center text-sm text-muted-foreground">
            No matches for "<span className="font-semibold text-foreground">{term}</span>".
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {restaurants && restaurants.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Store className="h-3.5 w-3.5" /> Restaurants
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                  {restaurants.map((r) => {
                    const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
                    return (
                      <Link
                        key={r.id}
                        to="/r/$restaurantId"
                        params={{ restaurantId: r.id }}
                        className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-black">
                          {r.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-foreground">{r.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.address}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${open ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                          {open ? "Open" : "Closed"}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {meals && meals.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <Utensils className="h-3.5 w-3.5" /> Meals
                </h2>
                <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
                  {meals.map((m) => (
                    <Link
                      key={m.id}
                      to="/r/$restaurantId"
                      params={{ restaurantId: m.restaurant_id }}
                      className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-foreground">{m.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.restaurants?.name ?? ""}</div>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-primary">{formatNaira(m.price_naira)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

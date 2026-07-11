import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search, Clock, Store, Star, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/home")({ component: Home });

interface RestaurantRow {
  id: string;
  name: string;
  address: string;
  image_url: string | null;
  description: string | null;
  opens_at: string;
  closes_at: string;
  is_open_override: boolean | null;
  delivery_fee_naira: number;
}

const CATEGORIES = [
  { name: "Swallow", emoji: "🍲" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Chicken", emoji: "🍗" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Drinks", emoji: "🥤" },
];

// Keyword → category tagging. Order matters: specific first.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Swallow: ["amala", "eba", "semo", "semovita", "pounded yam", "poundo", "fufu", "wheat", "tuwo", "iyan", "starch", "garri"],
  Pizza: ["pizza"],
  Desserts: ["cake", "ice cream", "doughnut", "donut", "cupcake", "pudding", "chocolate", "dessert", "pastry", "muffin"],
  Drinks: ["coke", "coca", "fanta", "sprite", "pepsi", "juice", "malt", "smoothie", "zobo", "chapman", "water", "tea", "coffee", "yoghurt", "yogurt", "cocktail", "wine", "beer", "drink"],
  Chicken: ["chicken", "wings", "drumstick"],
};

// meal → tags
function tagMeal(name: string): Set<string> {
  const n = name.toLowerCase();
  const tags = new Set<string>();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => n.includes(k))) tags.add(cat);
  }
  // Fast Food is the catch-all for savory meals not already swallow/pizza/dessert/drink.
  if (!tags.has("Swallow") && !tags.has("Pizza") && !tags.has("Desserts") && !tags.has("Drinks")) {
    tags.add("Fast Food");
  }
  return tags;
}

function formatHour(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

function Home() {
  const { user } = useSession();

  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
  const [topRated, setTopRated] = useState(false);
  const [lowDelivery, setLowDelivery] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data as RestaurantRow[];
    },
  });

  // Fetch all available meals to build category tags per restaurant.
  const { data: mealsByRestaurant } = useQuery({
    queryKey: ["meals-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("restaurant_id, name, is_available")
        .eq("is_available", true);
      if (error) throw error;
      const map = new Map<string, Set<string>>();
      for (const m of data ?? []) {
        const tags = tagMeal(m.name as string);
        const cur = map.get(m.restaurant_id as string) ?? new Set<string>();
        tags.forEach((t) => cur.add(t));
        map.set(m.restaurant_id as string, cur);
      }
      return map;
    },
  });

  const { data: matchingByMeal } = useQuery({
    queryKey: ["meal-search", q],
    enabled: q.trim().length > 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("restaurant_id, name, is_available")
        .ilike("name", `%${q.trim()}%`)
        .eq("is_available", true);
      if (error) throw error;
      return new Set((data ?? []).map((m) => m.restaurant_id));
    },
  });

  const list = useMemo(() => {
    if (!restaurants) return [];
    const term = q.trim().toLowerCase();
    const filtered = restaurants.filter((r) => {
      const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
      if (openOnly && !open) return false;

      const rating = 4.5 + (r.name.charCodeAt(0) % 5) * 0.1;
      if (topRated && rating < 4.7) return false;

      if (lowDelivery && r.delivery_fee_naira > 500) return false;

      if (selectedCategory) {
        const tags = mealsByRestaurant?.get(r.id);
        if (!tags || !tags.has(selectedCategory)) return false;
      }

      if (term.length > 1) {
        const restaurantMatch =
          r.name.toLowerCase().includes(term) ||
          (r.description ?? "").toLowerCase().includes(term);
        const mealMatch = matchingByMeal?.has(r.id) ?? false;
        if (!restaurantMatch && !mealMatch) return false;
        if (!open) return false;
      }
      return true;
    });
    // Open first, then by name
    return filtered.sort((a, b) => {
      const ao = isRestaurantOpen(a.opens_at, a.closes_at, a.is_open_override) ? 0 : 1;
      const bo = isRestaurantOpen(b.opens_at, b.closes_at, b.is_open_override) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }, [restaurants, mealsByRestaurant, matchingByMeal, openOnly, q, topRated, lowDelivery, selectedCategory]);

  return (
    <AppShell right={<HeaderActions />}>
      {/* Search Header */}
      <div className="mb-8 grid gap-4 md:grid-cols-12 items-center">
        <div className="md:col-span-4">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Good day{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">What are you craving today?</p>
        </div>

        <div className="md:col-span-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a meal, restaurant (e.g. jollof, Amoke, burgers)"
              className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Category Icons Carousel — py padding so the active border/scale isn't clipped */}
      <div className="mb-8 border-b border-border pb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-4 py-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(active ? null : cat.name)}
                className={`flex flex-col items-center gap-2 shrink-0 rounded-2xl p-3 w-20 border transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/5 text-primary scale-105 font-bold shadow-sm"
                    : "border-border/60 bg-white text-foreground hover:border-border hover:bg-secondary/40"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-semibold text-center leading-none">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2 items-center text-sm">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mr-2">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>

        <button
          onClick={() => setOpenOnly((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            openOnly ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Open Now
        </button>

        <button
          onClick={() => setTopRated((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            topRated ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Top Rated (4.7+)
        </button>

        <button
          onClick={() => setLowDelivery((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            lowDelivery ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Under ₦500 Delivery
        </button>

        {(selectedCategory || !openOnly || topRated || lowDelivery || q) && (
          <button
            onClick={() => {
              setOpenOnly(true);
              setTopRated(false);
              setLowDelivery(false);
              setSelectedCategory(null);
              setQ("");
            }}
            className="text-xs font-bold text-primary hover:underline ml-2 cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Restaurant List */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
          <Store className="mx-auto mb-3.5 h-8 w-8 text-muted-foreground/30" />
          <p className="font-semibold text-foreground mb-1">No restaurants found matching your criteria</p>
          <p className="text-xs">Try resetting the filters or modifying your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
            const rating = 4.5 + (r.name.charCodeAt(0) % 5) * 0.1;
            const hours = `${formatHour(r.opens_at)} – ${formatHour(r.closes_at)}`;

            return (
              <Link
                key={r.id}
                to="/r/$restaurantId"
                params={{ restaurantId: r.id }}
                className={`group flex flex-col overflow-hidden rounded-xl bg-white border border-border/80 transition-all duration-300 hover:shadow-md hover:border-border ${!open ? "opacity-75" : ""}`}
              >
                {!open && (
                  <div className="bg-warning/10 border-b border-warning/20 px-4 py-1.5 text-center text-xs font-bold text-warning-foreground">
                    Closed · Opens {formatHour(r.opens_at)}
                  </div>
                )}

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
                    {r.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                    )}
                    <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{r.address}</div>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className={open ? "text-emerald-600" : "text-warning-foreground"}>
                        {open ? "Open now" : "Closed"}
                      </span>
                      <span className="text-muted-foreground/70">· {hours}</span>
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
      )}
    </AppShell>
  );
}

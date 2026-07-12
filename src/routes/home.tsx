import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search, Clock, Store, Star, BadgeCheck, MapPin, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

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
  { name: "Rice & Pasta", emoji: "🍚" },
  { name: "Swallow", emoji: "🍲" },
  { name: "Grills", emoji: "🍖" },
  { name: "Small Chops", emoji: "🍢" },
  { name: "Peppersoup", emoji: "🥣" },
  { name: "Pastries", emoji: "🍰" },
  { name: "Ice Cream", emoji: "🍨" },
  { name: "Pizza and Cake", emoji: "🍕" },
  { name: "Parfait", emoji: "🥤" },
  { name: "Alcohol", emoji: "🍺" },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Rice & Pasta": ["rice", "jollof", "fried rice", "pasta", "spaghetti", "macaroni", "noodles", "ofada", "basmati"],
  Swallow: ["amala", "eba", "semo", "pounded yam", "poundo", "fufu", "iyan", "wheat", "tuwo", "garri", "swallow"],
  Grills: ["suya", "grilled", "bbq", "asun", "catfish", "ram suya", "chicken suya", "beef suya", "grill"],
  "Small Chops": ["puff puff", "samosa", "spring roll", "small chops", "gizzard", "peppered gizzard"],
  Peppersoup: ["peppersoup", "pepper soup"],
  Pastries: ["meat pie", "sausage roll", "pie", "donut", "doughnut", "pastries", "muffin", "bread", "chin chin"],
  "Ice Cream": ["ice cream", "scoop", "gelato"],
  "Pizza and Cake": ["pizza", "cake", "cupcake", "chocolate"],
  Parfait: ["parfait", "yoghurt", "yogurt", "smoothie"],
  Alcohol: ["beer", "wine", "spirit", "alcohol", "chapman", "cocktail"],
};

function tagMeal(name: string): Set<string> {
  const n = name.toLowerCase();
  const tags = new Set<string>();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => n.includes(k))) tags.add(cat);
  }
  if (tags.size === 0) tags.add("Rice & Pasta"); // catch-all
  return tags;
}

function formatHour(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

// Deterministic prep time range from restaurant name hash
function prepRange(name: string): string {
  const h = name.charCodeAt(0) % 4;
  const ranges = ["15–25 min", "20–30 min", "25–35 min", "30–40 min"];
  return ranges[h];
}

function Home() {
  const { user } = useSession();
  const { count } = useCart();

  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data as RestaurantRow[];
    },
  });

  // Rating stats
  const { data: ratingStats } = useQuery({
    queryKey: ["rating-stats"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_rating_stats").select("*");
      if (error) return {} as Record<string, { avg_rating: number; review_count: number }>;
      const map: Record<string, { avg_rating: number; review_count: number }> = {};
      for (const r of data ?? []) {
        map[r.restaurant_id] = { avg_rating: Number(r.avg_rating), review_count: Number(r.review_count) };
      }
      return map;
    },
  });

  const { data: mealsByRestaurant } = useQuery({
    queryKey: ["meals-tags"],
    staleTime: 5 * 60 * 1000,
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
    return filtered.sort((a, b) => {
      const ao = isRestaurantOpen(a.opens_at, a.closes_at, a.is_open_override) ? 0 : 1;
      const bo = isRestaurantOpen(b.opens_at, b.closes_at, b.is_open_override) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }, [restaurants, mealsByRestaurant, matchingByMeal, openOnly, q, selectedCategory]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  return (
    <AppShell
      right={
        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            id="header-cart-btn"
            className="relative rounded-full bg-primary p-2.5 text-primary-foreground shadow-sm hover:brightness-105 transition cursor-pointer"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {count}
              </span>
            )}
          </Link>
        </div>
      }
    >
      {/* ── Greeting ── */}
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
          {firstName ? `Hey, ${firstName} 👋` : "Hey there 👋"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">What are you craving today?</p>
      </div>

      {/* ── Search Bar ── */}
      <div className="mb-6 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="home-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search meals, restaurants…"
          className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70 font-medium shadow-xs"
        />
      </div>

      {/* ── Category Scroll Strip ── */}
      <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(active ? null : cat.name)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 border transition-all cursor-pointer shrink-0 min-w-[76px] ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105"
                    : "border-border/60 bg-white text-foreground hover:border-border hover:bg-secondary/40"
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[10px] font-extrabold text-center leading-tight tracking-tight">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="mb-5 flex flex-wrap gap-2 items-center text-sm">
        <button
          id="filter-open-now"
          onClick={() => setOpenOnly((prev) => !prev)}
          className={`rounded-full px-4 py-1.5 text-xs font-bold border transition cursor-pointer ${
            openOnly
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Open Now
        </button>
        {(selectedCategory || openOnly || q) && (
          <button
            onClick={() => { setOpenOnly(false); setSelectedCategory(null); setQ(""); }}
            className="text-xs font-bold text-primary hover:underline ml-1 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Section Title ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          {selectedCategory ? `${selectedCategory}` : q ? `Results for "${q}"` : "All Restaurants"}
        </h2>
        <span className="text-xs text-muted-foreground font-medium">{list.length} restaurants</span>
      </div>

      {/* ── Restaurant Cards (Chowdeck style) ── */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm text-muted-foreground">
          <Store className="mx-auto mb-3.5 h-8 w-8 text-muted-foreground/30" />
          <p className="font-semibold text-foreground mb-1">No restaurants found</p>
          <p className="text-xs">Try resetting filters or a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
            const stats = ratingStats?.[r.id];
            const rating = stats?.avg_rating || (4.5 + (r.name.charCodeAt(0) % 5) * 0.1);
            const reviewCount = stats?.review_count || 0;
            const prep = prepRange(r.name);

            return (
              <Link
                key={r.id}
                to="/r/$restaurantId"
                params={{ restaurantId: r.id }}
                className={`group flex flex-col overflow-hidden rounded-2xl bg-white border border-border/80 transition-all duration-300 hover:shadow-md hover:border-border cursor-pointer ${!open ? "opacity-70" : ""}`}
              >
                {/* Food Image */}
                <div className="relative h-44 w-full overflow-hidden bg-secondary">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-secondary to-border/50">
                      🍽️
                    </div>
                  )}
                  {/* Open/Closed Badge */}
                  {!open && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white/90 backdrop-blur text-xs font-extrabold text-foreground px-3 py-1 rounded-full shadow">
                        Closed · Opens {formatHour(r.opens_at)}
                      </span>
                    </div>
                  )}
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
                    <span className="text-[10px] font-extrabold text-emerald-700">Verified</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {r.name}
                    </h3>
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-extrabold text-foreground">{rating.toFixed(1)}</span>
                      {reviewCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
                      )}
                    </div>
                  </div>

                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  {/* Delivery meta row */}
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 mt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-semibold">{prep}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[130px]">
                        {r.delivery_fee_naira === 0 ? (
                          <span className="text-emerald-600 font-bold">Free delivery</span>
                        ) : (
                          <span className="font-bold text-foreground">{formatNaira(r.delivery_fee_naira)}</span>
                        )}
                      </span>
                    </div>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search as SearchIcon, Store, Star, Clock, X, Pizza, Cake, Coffee } from "lucide-react";

export const Route = createFileRoute("/search")({ component: SearchPage });

const SEARCH_CATEGORIES = [
  { name: "Rice & Pasta", emoji: "🍚", color: "bg-amber-50 text-amber-700 border-amber-100" },
  { name: "Swallow", emoji: "🍲", color: "bg-orange-50 text-orange-700 border-orange-100" },
  { name: "Grills", emoji: "🍖", color: "bg-red-50 text-red-700 border-red-100" },
  { name: "Small Chops", emoji: "🍢", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
  { name: "Peppersoup", emoji: "🥣", color: "bg-rose-50 text-rose-700 border-rose-100" },
  { name: "Pastries", emoji: "🍰", color: "bg-pink-50 text-pink-700 border-pink-100" },
  { name: "Ice Cream", emoji: "🍨", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { name: "Pizza and Cake", emoji: "🍕", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { name: "Parfait", emoji: "🥤", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { name: "Alcohol", emoji: "🍺", color: "bg-blue-50 text-blue-700 border-blue-100" },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Rice & Pasta": ["rice", "jollof", "fried rice", "pasta", "spaghetti", "macaroni", "noodles"],
  Swallow: ["amala", "eba", "semo", "pounded yam", "poundo", "fufu", "iyan", "wheat", "tuwo", "garri"],
  Grills: ["suya", "grilled", "wings", "turkey", "fish", "bbq", "chicken", "meat", "asun"],
  "Small Chops": ["puff puff", "samosa", "spring roll", "small chops", "gizzard"],
  Peppersoup: ["peppersoup", "pepper soup"],
  Pastries: ["meat pie", "sausage roll", "pie", "donut", "pastries", "muffin", "bread"],
  "Ice Cream": ["ice cream", "scoop", "gelato"],
  "Pizza and Cake": ["pizza", "cake", "cupcake", "chocolate"],
  Parfait: ["parfait", "yoghurt", "yogurt", "smoothie"],
  Alcohol: ["beer", "wine", "spirit", "alcohol", "chapman", "cocktail", "drink"],
};

function tagMeal(name: string): Set<string> {
  const n = name.toLowerCase();
  const tags = new Set<string>();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => n.includes(k))) tags.add(cat);
  }
  return tags;
}

function formatHour(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants-search"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: meals } = useQuery({
    queryKey: ["meals-search-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("*, restaurants(name)");
      if (error) throw error;
      return data;
    },
  });

  const ratingStatsMap = useQuery({
    queryKey: ["rating-stats-search"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_rating_stats").select("*");
      if (error) return {};
      const map: Record<string, { avg_rating: number; review_count: number }> = {};
      for (const r of data ?? []) {
        map[r.restaurant_id] = { avg_rating: Number(r.avg_rating), review_count: Number(r.review_count) };
      }
      return map;
    },
  });

  const results = useMemo(() => {
    if (!restaurants || !meals) return { restaurants: [], meals: [] };

    const term = q.trim().toLowerCase();
    
    // Filter by Category
    if (selectedCat) {
      const filteredRestaurants = restaurants.filter((r) => {
        const rMeals = meals.filter((m) => m.restaurant_id === r.id);
        return rMeals.some((m) => tagMeal(m.name).has(selectedCat));
      });

      const filteredMeals = meals.filter((m) => tagMeal(m.name).has(selectedCat));

      return { restaurants: filteredRestaurants, meals: filteredMeals };
    }

    // Filter by Query
    if (term.length < 2) return { restaurants: [], meals: [] };

    const matchedRestaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.description ?? "").toLowerCase().includes(term)
    );

    const matchedMeals = meals.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.description ?? "").toLowerCase().includes(term)
    );

    return { restaurants: matchedRestaurants, meals: matchedMeals };
  }, [q, selectedCat, restaurants, meals]);

  const hasSearch = q.trim().length >= 2 || selectedCat !== null;

  return (
    <AppShell title="Search">
      <div className="mx-auto max-w-2xl pb-24">
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (selectedCat) setSelectedCat(null);
            }}
            placeholder="Search meals, restaurants, drinks..."
            className="w-full rounded-full border border-border bg-white pl-11 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70 font-medium"
          />
          {hasSearch && (
            <button
              onClick={() => {
                setQ("");
                setSelectedCat(null);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories grid (default view) */}
        {!hasSearch && (
          <div>
            <h2 className="font-display text-lg font-extrabold text-foreground mb-4">
              Browse Categories
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SEARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCat(cat.name)}
                  className={`flex items-center gap-3 rounded-2xl p-4 border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left ${cat.color}`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-extrabold tracking-tight leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearch && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-extrabold text-foreground">
                {selectedCat ? `Category: ${selectedCat}` : `Search results for "${q}"`}
              </h2>
              <button
                onClick={() => {
                  setQ("");
                  setSelectedCat(null);
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {/* Restaurants Match */}
            {results.restaurants.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Restaurants ({results.restaurants.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {results.restaurants.map((r) => {
                    const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
                    const stats = ratingStatsMap.data?.[r.id];
                    const rRating = stats?.avg_rating || (4.5 + (r.name.charCodeAt(0) % 5) * 0.1);
                    const rReviews = stats?.review_count || 0;

                    return (
                      <Link
                        key={r.id}
                        to="/r/$restaurantId"
                        params={{ restaurantId: r.id }}
                        className={`flex gap-3 p-3 bg-white border border-border/80 rounded-xl hover:shadow-xs transition duration-300 ${!open ? "opacity-75" : ""}`}
                      >
                        <div className="h-16 w-16 rounded-lg bg-secondary shrink-0 overflow-hidden relative">
                          {r.image_url ? (
                            <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground bg-secondary">
                              {r.name.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{r.name}</h4>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{r.address}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5 text-foreground font-semibold">
                              <Star className="h-3 w-3 fill-primary text-primary" /> {rRating.toFixed(1)} ({rReviews})
                            </span>
                            <span>•</span>
                            <span className={open ? "text-emerald-600 font-medium" : "text-warning-foreground font-medium"}>
                              {open ? "Open" : "Closed"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meals Match */}
            {results.meals.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Meals ({results.meals.length})
                </h3>
                <div className="space-y-3">
                  {results.meals.map((m) => (
                    <Link
                      key={m.id}
                      to="/r/$restaurantId"
                      params={{ restaurantId: m.restaurant_id }}
                      className="flex items-center justify-between p-4 bg-white border border-border/80 rounded-xl hover:border-primary/50 transition duration-300"
                    >
                      <div className="pr-4 min-w-0">
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {m.name}
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {m.description}
                          </p>
                        )}
                        <div className="text-xs text-primary font-medium mt-1">
                          from {m.restaurants?.name || "Restaurant"}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-foreground shrink-0">
                        {formatNaira(m.price_naira)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.restaurants.length === 0 && results.meals.length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-white text-muted-foreground text-sm">
                <Store className="mx-auto h-8 w-8 mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">No matches found</p>
                <p className="text-xs mt-0.5">Try searching with different terms or check categories.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

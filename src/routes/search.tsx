import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search as SearchIcon, Store, Star, Clock, X } from "lucide-react";

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

  // Filter restaurants/meals in memory
  const results = useMemo(() => {
    if (!restaurants) return { restaurants: [], meals: [] };

    const term = q.trim().toLowerCase();

    // 1. Filter by category click
    if (selectedCat) {
      const matchedMeals = meals?.filter((m) => {
        const tags = tagMeal(m.name);
        return tags.has(selectedCat) && m.is_available;
      }) ?? [];

      const rIds = new Set(matchedMeals.map((m) => m.restaurant_id));
      const matchedRestaurants = restaurants.filter((r) => rIds.has(r.id));

      return {
        restaurants: matchedRestaurants,
        meals: matchedMeals.slice(0, 30),
      };
    }

    // 2. Filter by search term
    if (term.length > 1) {
      const matchedRestaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.description ?? "").toLowerCase().includes(term)
      );

      const matchedMeals = meals?.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (m.description ?? "").toLowerCase().includes(term)
      ) ?? [];

      return {
        restaurants: matchedRestaurants,
        meals: matchedMeals.slice(0, 30),
      };
    }

    return { restaurants: [], meals: [] };
  }, [q, selectedCat, restaurants, meals]);

  const hasSearch = q.trim().length > 1 || selectedCat !== null;

  return (
    <AppShell title="Search" right={<HeaderActions />}>
      <div className="mx-auto max-w-xl pb-24">
        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (selectedCat) setSelectedCat(null);
            }}
            placeholder="Search for meals or restaurants..."
            className="w-full rounded-2xl border border-border bg-white pl-11 pr-10 py-3.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-secondary hover:bg-border text-muted-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Header/Clear */}
        {selectedCat && (
          <div className="flex items-center justify-between mb-4 bg-primary/5 border border-primary/20 rounded-xl p-3">
            <span className="text-sm font-bold text-foreground">
              Showing category: <span className="text-primary font-black">{selectedCat}</span>
            </span>
            <button
              onClick={() => setSelectedCat(null)}
              className="text-xs font-black text-primary hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Categories Grid (idle state) */}
        {!hasSearch && (
          <div>
            <h2 className="font-display text-base font-extrabold text-foreground mb-4">
              Browse Categories
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SEARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCat(cat.name)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${cat.color}`}
                >
                  <span className="text-2xl shrink-0">{cat.emoji}</span>
                  <span className="text-xs font-extrabold leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {hasSearch && (
          <div className="space-y-6">
            {/* Restaurants Section */}
            {results.restaurants.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                  Restaurants
                </h3>
                <div className="space-y-2">
                  {results.restaurants.map((r) => {
                    const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
                    return (
                      <Link
                        key={r.id}
                        to="/r/$restaurantId"
                        params={{ restaurantId: r.id }}
                        className="flex items-center justify-between p-4 bg-white border border-border/80 rounded-2xl hover:border-primary transition cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            {r.name}
                            {!open && (
                              <span className="text-[9px] font-extrabold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-md">
                                Closed
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5 max-w-[280px]">
                              {r.description}
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-primary shrink-0 pl-3">
                          View menu
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meals Section */}
            {results.meals.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
                  Meals
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {results.meals.map((m) => (
                    <Link
                      key={m.id}
                      to="/r/$restaurantId"
                      params={{ restaurantId: m.restaurant_id }}
                      className="flex flex-col justify-between p-4 bg-white border border-border/80 rounded-2xl hover:border-primary transition cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-sm text-foreground leading-tight">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          from {(m as any).restaurants?.name ?? "Restaurant"}
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>
                      <div className="font-display text-sm font-extrabold text-primary mt-3">
                        {formatNaira(m.price_naira)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results State */}
            {results.restaurants.length === 0 && results.meals.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-border rounded-2xl p-8">
                <Store className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                <div className="font-bold text-sm text-foreground">No matches found</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Try checking spelling or exploring other categories.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

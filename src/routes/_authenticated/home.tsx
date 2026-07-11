import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles, primaryRole } from "@/hooks/use-auth";
import { AppShell, SignOutButton } from "@/components/AppShell";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search, ShoppingBag, Clock, Store, Star, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/home")({ component: Home });

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

function Home() {
  const { user } = useSession();
  const { data: roles } = useRoles(user?.id);
  const role = primaryRole(roles);
  const nav = useNavigate();

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
    return restaurants.filter((r) => {
      const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
      if (openOnly && !open) return false;

      const rating = 4.5 + (r.name.charCodeAt(0) % 5) * 0.1;
      if (topRated && rating < 4.7) return false;

      if (lowDelivery && r.delivery_fee_naira > 500) return false;

      if (selectedCategory) {
        const term = selectedCategory.toLowerCase();
        // Categorize based on keywords in name or description
        const nameMatch = r.name.toLowerCase().includes(term);
        const descMatch = (r.description ?? "").toLowerCase().includes(term);
        if (!nameMatch && !descMatch) return false;
      }

      if (q.trim().length > 1) {
        if (!matchingByMeal) return false;
        if (!matchingByMeal.has(r.id)) return false;
        if (!open) return false; // when searching a meal, only show if open per spec
      }
      return true;
    });
  }, [restaurants, matchingByMeal, openOnly, q, topRated, lowDelivery, selectedCategory]);

  const { count } = useCart();

  return (
    <AppShell
      right={
        <div className="flex items-center gap-2">
          {role === "restaurant_staff" && (
            <Link
              to="/restaurant/orders"
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
            >
              Restaurant panel
            </Link>
          )}
          {role === "admin" && (
            <Link
              to="/admin/overview"
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
            >
              Admin panel
            </Link>
          )}
          <Link
            to="/orders"
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
          >
            My Orders
          </Link>
          <button
            onClick={() => nav({ to: "/cart" })}
            className="relative rounded-full bg-primary p-2.5 text-primary-foreground shadow-sm hover:brightness-105 transition cursor-pointer"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {count}
              </span>
            )}
          </button>
          <SignOutButton />
        </div>
      }
    >
      {/* Search Header */}
      <div className="mb-8 grid gap-4 md:grid-cols-12 items-center">
        <div className="md:col-span-4">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Good day{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">What are you craving today?</p>
        </div>
        
        {/* Modern Search bar */}
        <div className="md:col-span-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a meal (e.g. jollof, chicken, burgers)"
              className="w-full rounded-full border border-border bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Category Icons Carousel */}
      <div className="mb-8 border-b border-border pb-6 overflow-x-auto scrollbar-none">
        <div className="flex gap-4">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(active ? null : cat.name)}
                className={`flex flex-col items-center gap-2 shrink-0 rounded-2xl p-3 w-20 border transition-all cursor-pointer ${
                  active
                    ? "border-primary bg-primary/5 text-primary scale-105 font-bold"
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

      {/* Badges Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-2 items-center text-sm">
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mr-2">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </span>

        {/* Open Now Pill */}
        <button
          onClick={() => setOpenOnly((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            openOnly
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Open Now
        </button>

        {/* Top Rated Pill */}
        <button
          onClick={() => setTopRated((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            topRated
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Top Rated (4.7+)
        </button>

        {/* Low Delivery Pill */}
        <button
          onClick={() => setLowDelivery((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer ${
            lowDelivery
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white text-foreground border-border hover:bg-secondary"
          }`}
        >
          Under ₦500 Delivery
        </button>

        {/* Reset Filter Button */}
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

            return (
              <Link
                key={r.id}
                to="/r/$restaurantId"
                params={{ restaurantId: r.id }}
                className="group flex flex-col overflow-hidden rounded-xl bg-white border border-border/80 transition-all duration-300 hover:shadow-md hover:border-border"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-secondary relative">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground font-semibold">
                      {r.name}
                    </div>
                  )}
                  {!open && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-bold text-sm">
                      Closed
                    </div>
                  )}
                </div>

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
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
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
      )}
    </AppShell>
  );
}

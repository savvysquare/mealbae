import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { LazyImage } from "@/components/LazyImage";
import { MealCustomizer } from "@/components/MealCustomizer";
import { useCart } from "@/lib/cart";
import {
  ShoppingBag, Clock, Star, ChevronLeft, BadgeCheck,
  Plus, MessageSquare
} from "lucide-react";

export const Route = createFileRoute("/r/$restaurantId")({ component: RestaurantPage });

interface Restaurant {
  id: string; name: string; address: string; phone: string | null;
  image_url: string | null; description: string | null;
  opens_at: string; closes_at: string; is_open_override: boolean | null;
  delivery_fee_naira: number;
}
interface Category { id: string; name: string; sort_order: number }
interface Meal {
  id: string; category_id: string | null; name: string;
  description: string | null; price_naira: number;
  image_url: string | null; is_available: boolean;
}
interface Review {
  id: string; rating: number; review_text: string | null;
  customer_name: string; created_at: string;
}

/** Format HH:MM → h:MM AM/PM (safe: returns "" if t is falsy) */
function formatHour(t: string | null | undefined): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (isNaN(hh) || isNaN(mm)) return t;
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "AM" : "PM";
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}

const RATING_EMOJIS: Record<number, string> = { 1: "😡", 2: "☹️", 3: "😐", 4: "🙂", 5: "🥰" };

// Detect venue type from name/description — same as home.tsx
type VenueType = { icon: string; gradient: string; label: string };
function getVenueType(name: string, desc: string | null): VenueType {
  const n = (name + " " + (desc ?? "")).toLowerCase();
  if (["bar ", "lounge", " bar", "club", "pub", "sports bar"].some((k) => n.includes(k)))
    return { icon: "🍺", gradient: "from-violet-500 to-purple-700", label: "Bar & Lounge" };
  if (["suya", "mai suya", "suya spot"].some((k) => n.includes(k)))
    return { icon: "🔥", gradient: "from-orange-500 to-red-600", label: "Suya Spot" };
  if (["hotel", "inn", "lodge", "resort"].some((k) => n.includes(k)))
    return { icon: "🏨", gradient: "from-blue-500 to-indigo-700", label: "Hotel" };
  if (["mama", "buka", "canteen", "local", "chop house", "abula"].some((k) => n.includes(k)))
    return { icon: "🥘", gradient: "from-amber-500 to-yellow-600", label: "Buka / Local" };
  if (["fast food", "burger", "pizza", "republic", "kfc", "quick"].some((k) => n.includes(k)))
    return { icon: "🍔", gradient: "from-yellow-400 to-orange-500", label: "Fast Food" };
  if (["bakery", "pastry", "cake"].some((k) => n.includes(k)))
    return { icon: "🎂", gradient: "from-pink-400 to-rose-500", label: "Bakery" };
  if (["grill", "bbq", "chops", "roast", "asun"].some((k) => n.includes(k)))
    return { icon: "🍖", gradient: "from-red-500 to-orange-600", label: "Grill House" };
  return { icon: "🍛", gradient: "from-emerald-500 to-teal-600", label: "Restaurant" };
}

/** Strip soup/protein combo from meal name for display.
 *  "Amala & Ewedu" → "Amala", "Eba & Egusi" → "Eba", etc. */
function stripSoupFromName(name: string): string {
  // Split on & or + or "with" and return just the base part
  return name.split(/\s*[&+]\s*/)[0].replace(/\s+with\s+.*/i, "").trim();
}

function prepRange(name: string): string {
  const h = name.charCodeAt(0) % 4;
  return ["15–25 min", "20–30 min", "25–35 min", "30–40 min"][h];
}

function RestaurantPage() {
  const { restaurantId } = Route.useParams();
  const nav = useNavigate();
  const { count } = useCart();

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "reviews">("menu");

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", restaurantId], staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single();
      if (error) throw error;
      return data as Restaurant;
    },
  });
  const { data: cats } = useQuery({
    queryKey: ["categories", restaurantId], staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
  const { data: meals } = useQuery({
    queryKey: ["meals", restaurantId], staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name");
      if (error) throw error;
      return data as Meal[];
    },
  });
  const { data: ratingData } = useQuery({
    queryKey: ["rating-stats", restaurantId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("restaurant_rating_stats").select("*").eq("restaurant_id", restaurantId).maybeSingle();
      return data as { avg_rating: number; review_count: number } | null;
    },
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", restaurantId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("reviews").select("*").eq("restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(20);
      if (error) return [] as Review[];
      return (data ?? []) as Review[];
    },
  });

  const open = restaurant ? isRestaurantOpen(restaurant.opens_at, restaurant.closes_at, restaurant.is_open_override) : false;
  const avgRating = ratingData?.avg_rating ? Number(ratingData.avg_rating) : (restaurant ? 4.5 + (restaurant.name.charCodeAt(0) % 5) * 0.1 : 4.5);
  const reviewCount = ratingData?.review_count ?? 0;
  const catMap = new Map(cats?.map((c) => [c.id, c]) ?? []);

  const venue = restaurant ? getVenueType(restaurant.name, restaurant.description) : null;

  return (
    <>
      <AppShell
        right={
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
        }
      >
        {restaurant && venue && (
          <div className="w-full max-w-3xl mx-auto">
            {/* Back */}
            <Link to="/home" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary mb-4 transition">
              <ChevronLeft className="h-4 w-4" /> Restaurants
            </Link>

            {/* ── VENUE BANNER (matches home page cards) ── */}
            <div className={`relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden mb-5 bg-gradient-to-br ${venue.gradient}`}>
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
              {/* Main icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span style={{ fontSize: 72, lineHeight: 1, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))" }}>
                  {venue.icon}
                </span>
                <div className="px-4 py-1 rounded-full bg-white/25 backdrop-blur-sm">
                  <span className="text-xs font-extrabold text-white tracking-widest uppercase">{venue.label}</span>
                </div>
              </div>
              {/* Verified badge top-left */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-2.5 py-1 shadow">
                <BadgeCheck className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                <span className="text-xs font-extrabold text-emerald-700">Verified</span>
              </div>
              {/* Open/Closed pill top-right */}
              {!open && (
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full">
                  Closed · Opens {formatHour(restaurant.opens_at)}
                </div>
              )}
            </div>

            {/* Restaurant Header */}
            <div className="mb-5 pb-5 border-b border-border">
              <h1 className="font-display text-2xl font-extrabold text-foreground">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">{restaurant.description}</p>
              )}

              {/* Meta strip */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center bg-secondary/40 rounded-xl py-3 px-2">
                  <div className="text-xs text-muted-foreground font-medium">Delivery Fee</div>
                  <div className="font-display text-base font-extrabold text-foreground mt-1">
                    {restaurant.delivery_fee_naira === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : formatNaira(restaurant.delivery_fee_naira)}
                  </div>
                </div>
                <div className="flex flex-col items-center bg-secondary/40 rounded-xl py-3 px-2">
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> Prep Time
                  </div>
                  <div className="font-display text-base font-extrabold text-foreground mt-1">
                    {prepRange(restaurant.name)}
                  </div>
                </div>
                <div className="flex flex-col items-center bg-secondary/40 rounded-xl py-3 px-2">
                  <div className="text-xs text-muted-foreground font-medium flex items-center gap-0.5">
                    <Star className="h-3 w-3" /> Rating
                  </div>
                  <div className="font-display text-base font-extrabold text-foreground mt-1">
                    {avgRating.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">({reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                open
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-warning/10 text-warning-foreground border border-warning/20"
              }`}>
                <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-500 animate-pulse" : "bg-warning"}`} />
                {open
                  ? `Open · Until ${formatHour(restaurant.closes_at)}`
                  : `Closed · Opens ${formatHour(restaurant.opens_at)}`}
              </div>
            </div>

            {/* Menu / Reviews Tabs */}
            <div className="flex mb-5 border-b border-border">
              {(["menu", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-extrabold capitalize transition border-b-2 cursor-pointer ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "reviews" ? `Reviews (${reviewCount})` : "Menu"}
                </button>
              ))}
            </div>

            {/* ── MENU TAB ── */}
            {activeTab === "menu" && (
              <>
                {/* Sticky category nav — full width, no horizontal padding clipping */}
                {cats && cats.length > 0 && (
                  <div className="sticky top-[57px] z-20 -mx-4 px-4 bg-white/95 backdrop-blur border-b border-border py-2.5 mb-5 overflow-x-auto scrollbar-none">
                    <div className="flex gap-5 text-sm font-bold text-muted-foreground min-w-max">
                      {cats.map((cat) => (
                        <a
                          key={cat.id}
                          href={`#cat-${cat.id}`}
                          className="hover:text-primary transition-colors cursor-pointer whitespace-nowrap py-0.5 border-b-2 border-transparent hover:border-primary shrink-0"
                        >
                          {cat.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-10">
                  {cats?.map((cat) => {
                    const items = meals?.filter((m) => m.category_id === cat.id) ?? [];
                    if (items.length === 0) return null;
                    return (
                      <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
                        <h2 className="mb-4 font-display text-lg font-extrabold text-foreground">{cat.name}</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {items.map((m) => {
                            // Strip soup from meal name for display
                            const displayName = stripSoupFromName(m.name);
                            return (
                              <div
                                key={m.id}
                                className={`group flex justify-between p-4 bg-white border border-border/80 rounded-2xl hover:shadow-xs transition duration-300 ${!m.is_available ? "opacity-50" : "cursor-pointer"}`}
                                onClick={() => m.is_available && open && setSelectedMeal(m)}
                              >
                                <div className="flex-1 pr-4 flex flex-col justify-between min-w-0">
                                  <div>
                                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">
                                      {displayName}
                                    </div>
                                    {m.description && (
                                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {m.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="mt-3 font-display text-sm font-extrabold text-foreground">
                                    from {formatNaira(m.price_naira)}
                                  </div>
                                </div>

                                <div className="relative h-20 w-20 rounded-xl bg-secondary overflow-hidden shrink-0">
                                  {m.image_url ? (
                                    <LazyImage
                                      src={m.image_url} alt={displayName} width={160}
                                      className="h-20 w-20 rounded-xl"
                                      fallback={<div className="h-full w-full flex items-center justify-center text-2xl bg-secondary">🍽️</div>}
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-2xl bg-gradient-to-br from-secondary to-border/50">🍽️</div>
                                  )}
                                  {m.is_available && open && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedMeal(m); }}
                                      className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center cursor-pointer"
                                    >
                                      <Plus className="h-4 w-4 stroke-[3]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="flex items-center gap-6 p-5 bg-secondary/40 rounded-2xl border border-border/60">
                  <div className="text-center">
                    <div className="font-display text-4xl font-black text-foreground">{avgRating.toFixed(1)}</div>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-border fill-border"}`} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const cnt = reviews?.filter((r) => r.rating === s).length ?? 0;
                      const pct = reviewCount > 0 ? (cnt / reviewCount) * 100 : 0;
                      return (
                        <div key={s} className="flex items-center gap-2 mb-1">
                          <span className="text-xs w-3 text-right font-bold text-foreground">{s}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-4">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {reviews?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <MessageSquare className="mx-auto h-8 w-8 mb-3 text-muted-foreground/30" />
                    <p>No reviews yet. Be the first to rate!</p>
                  </div>
                )}

                {reviews?.map((rv) => (
                  <div key={rv.id} className="bg-white border border-border/80 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground">{rv.customer_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(rv.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xl">{RATING_EMOJIS[rv.rating]}</span>
                        <span className="font-extrabold text-sm text-foreground">{rv.rating}/5</span>
                      </div>
                    </div>
                    {rv.review_text && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{rv.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppShell>

      {/* ── Meal Customizer Drawer ── */}
      {selectedMeal && restaurant && (
        <MealCustomizer
          meal={selectedMeal}
          restaurant={{ id: restaurant.id, name: restaurant.name }}
          category={catMap.get(selectedMeal.category_id ?? "")}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </>
  );
}

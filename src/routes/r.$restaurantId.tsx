import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { LazyImage } from "@/components/LazyImage";
import { useCart } from "@/lib/cart";
import { Plus, ShoppingBag, Clock, MapPin, Star, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/r/$restaurantId")({ component: RestaurantPage });

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  image_url: string | null;
  description: string | null;
  opens_at: string;
  closes_at: string;
  is_open_override: boolean | null;
  delivery_fee_naira: number;
}
interface Category {
  id: string;
  name: string;
  sort_order: number;
}
interface Meal {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_naira: number;
  image_url: string | null;
  is_available: boolean;
}

function RestaurantPage() {
  const { restaurantId } = Route.useParams();
  const nav = useNavigate();
  const { add, count } = useCart();

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", restaurantId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single();
      if (error) throw error;
      return data as Restaurant;
    },
  });
  const { data: cats } = useQuery({
    queryKey: ["categories", restaurantId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
  const { data: meals } = useQuery({
    queryKey: ["meals", restaurantId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name");
      if (error) throw error;
      return data as Meal[];
    },
  });

  const open = restaurant ? isRestaurantOpen(restaurant.opens_at, restaurant.closes_at, restaurant.is_open_override) : false;
  const rating = restaurant ? 4.5 + (restaurant.name.charCodeAt(0) % 5) * 0.1 : 4.5;

  return (
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
      {restaurant && (
        <div className="w-full">
          {/* Back button */}
          <Link
            to="/home"
            className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary mb-4 transition"
          >
            <ChevronLeft className="h-4 w-4" /> Back to dashboard
          </Link>


          {/* Restaurant details header */}
          <div className="mb-6 pb-6 border-b border-border">
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
              {restaurant.name}
            </h1>
            
            {restaurant.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{restaurant.description}</p>
            )}

            {/* DoorDash details metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm font-medium">
              <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>{rating.toFixed(1)} Rating</span>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>25–35 Min</span>
              </div>

              <div className="text-muted-foreground">•</div>

              <div className="font-semibold text-foreground">
                {formatNaira(restaurant.delivery_fee_naira)} delivery fee
              </div>

              <div className="text-muted-foreground">•</div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[240px]">{restaurant.address}</span>
              </div>
            </div>

            {/* Closed warning banner */}
            {!open && (
              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning-foreground font-medium flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-warning animate-pulse shrink-0" />
                <span>This restaurant is closed. Operating hours are {restaurant.opens_at.slice(0, 5)} – {restaurant.closes_at.slice(0, 5)}.</span>
              </div>
            )}
          </div>

          {/* Sticky subcategories navigation */}
          <div className="sticky top-[53px] z-20 w-full bg-white/95 border-b border-border py-3 mb-6 overflow-x-auto scrollbar-none flex gap-6 text-sm font-bold text-muted-foreground">
            {cats?.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                className="hover:text-primary transition-colors cursor-pointer text-nowrap py-0.5 border-b-2 border-transparent hover:border-primary shrink-0"
              >
                {cat.name}
              </a>
            ))}
          </div>

          {/* Category sections containing 2-column menu items grid */}
          <div className="space-y-12">
            {cats?.map((cat) => {
              const items = meals?.filter((m) => m.category_id === cat.id) ?? [];
              if (items.length === 0) return null;

              return (
                <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
                  <h2 className="mb-4 font-display text-xl font-extrabold text-foreground border-b border-border/50 pb-2">
                    {cat.name}
                  </h2>
                  
                  {/* Grid layout matching DoorDash */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((m) => (
                      <div
                        key={m.id}
                        className={`group flex justify-between p-4 bg-white border border-border/80 rounded-xl hover:shadow-xs transition duration-300 relative ${
                          !m.is_available ? "opacity-55" : ""
                        }`}
                      >
                        {/* Left Side: Meal Info */}
                        <div className="flex-1 pr-4 flex flex-col justify-between">
                          <div>
                            <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                              {m.name}
                            </div>
                            {m.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {m.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-4 text-sm font-bold text-foreground">
                            {formatNaira(m.price_naira)}
                          </div>
                        </div>

                        {/* Right Side: Square Image & Floating Red Plus Action Button */}
                        <div className="relative h-24 w-24 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/50">
                          {m.image_url ? (
                            <LazyImage
                              src={m.image_url}
                              alt={m.name}
                              width={192}
                              className="h-24 w-24 rounded-lg"
                              fallback={
                                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-bold text-center p-1 bg-secondary/50">
                                  {m.name}
                                </div>
                              }
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground font-bold text-center p-1 bg-secondary/50">
                              {m.name}
                            </div>
                          )}

                          {/* Float red plus add button overlay */}
                          <button
                            disabled={!m.is_available || !open}
                            onClick={() =>
                              add(restaurant.id, restaurant.name, {
                                mealId: m.id,
                                name: m.name,
                                price: m.price_naira,
                                quantity: 1,
                                imageUrl: m.image_url,
                              })
                            }
                            className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                            aria-label="Add to cart"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}

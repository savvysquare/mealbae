import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/lib/cart";
import { Plus, ShoppingBag, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/r/$restaurantId")({ component: RestaurantPage });

interface Restaurant {
  id: string; name: string; address: string; phone: string | null;
  image_url: string | null; description: string | null; opens_at: string; closes_at: string;
  is_open_override: boolean | null; delivery_fee_naira: number;
}
interface Category { id: string; name: string; sort_order: number }
interface Meal {
  id: string; category_id: string | null; name: string; description: string | null;
  price_naira: number; image_url: string | null; is_available: boolean;
}

function RestaurantPage() {
  const { restaurantId } = Route.useParams();
  const nav = useNavigate();
  const { add, count } = useCart();

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", restaurantId).single();
      if (error) throw error;
      return data as Restaurant;
    },
  });
  const { data: cats } = useQuery({
    queryKey: ["categories", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurantId).order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
  const { data: meals } = useQuery({
    queryKey: ["meals", restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("meals").select("*").eq("restaurant_id", restaurantId).order("name");
      if (error) throw error;
      return data as Meal[];
    },
  });

  const open = restaurant ? isRestaurantOpen(restaurant.opens_at, restaurant.closes_at, restaurant.is_open_override) : false;

  return (
    <AppShell
      right={
        <button onClick={() => nav({ to: "/cart" })} className="relative rounded-full bg-primary p-2 text-primary-foreground">
          <ShoppingBag className="h-4 w-4" />
          {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background">{count}</span>}
        </button>
      }
    >
      {restaurant && (
        <>
          <div className="mb-6 overflow-hidden rounded-3xl">
            <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
              {restaurant.image_url && <img src={restaurant.image_url} alt={restaurant.name} className="h-full w-full object-cover" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${open ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                    {open ? "Open now" : "Closed"}
                  </span>
                  <span className="text-xs text-white/80"><Clock className="mr-1 inline h-3 w-3" /> {restaurant.opens_at.slice(0,5)}–{restaurant.closes_at.slice(0,5)}</span>
                </div>
                <h1 className="mt-1 font-display text-3xl font-bold">{restaurant.name}</h1>
                <div className="text-sm text-white/80"><MapPin className="mr-1 inline h-3 w-3" /> {restaurant.address}</div>
              </div>
            </div>
          </div>

          {!open && (
            <div className="mb-6 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm">
              This restaurant is currently closed. Come back between {restaurant.opens_at.slice(0,5)} and {restaurant.closes_at.slice(0,5)}.
            </div>
          )}

          <div className="space-y-8">
            {cats?.map((cat) => {
              const items = meals?.filter((m) => m.category_id === cat.id) ?? [];
              if (items.length === 0) return null;
              return (
                <section key={cat.id}>
                  <h2 className="mb-3 font-display text-xl font-bold">{cat.name}</h2>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((m) => (
                      <div key={m.id} className={`card-soft flex items-center gap-3 p-3 ${!m.is_available ? "opacity-50" : ""}`}>
                        {m.image_url && <img src={m.image_url} alt={m.name} className="h-16 w-16 rounded-xl object-cover" />}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{m.name}</div>
                          {m.description && <div className="text-xs text-muted-foreground line-clamp-2">{m.description}</div>}
                          <div className="mt-1 text-sm font-semibold text-primary">{formatNaira(m.price_naira)}</div>
                        </div>
                        <button
                          disabled={!m.is_available || !open}
                          onClick={() => add(restaurant.id, restaurant.name, {
                            mealId: m.id, name: m.name, price: m.price_naira, quantity: 1, imageUrl: m.image_url,
                          })}
                          className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}

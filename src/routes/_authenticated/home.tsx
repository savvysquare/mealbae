import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, useRoles, primaryRole, staffRestaurantId } from "@/hooks/use-auth";
import { AppShell, SignOutButton } from "@/components/AppShell";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Search, ShoppingBag, Clock, Store } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/home")({ component: Home });

interface RestaurantRow {
  id: string; name: string; address: string; image_url: string | null;
  description: string | null; opens_at: string; closes_at: string;
  is_open_override: boolean | null; delivery_fee_naira: number;
}

function Home() {
  const { user } = useSession();
  const { data: roles } = useRoles(user?.id);
  const role = primaryRole(roles);
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(true);

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
      if (q.trim().length > 1) {
        if (!matchingByMeal) return false;
        if (!matchingByMeal.has(r.id)) return false;
        if (!open) return false; // when searching a meal, only show if open per spec
      }
      return true;
    });
  }, [restaurants, matchingByMeal, openOnly, q]);

  const { count } = useCart();

  return (
    <AppShell
      right={
        <div className="flex items-center gap-2">
          {role === "restaurant_staff" && (
            <Link to="/restaurant/orders" className="rounded-full border border-border px-3 py-1.5 text-xs">Restaurant</Link>
          )}
          {role === "admin" && (
            <Link to="/admin/overview" className="rounded-full border border-border px-3 py-1.5 text-xs">Admin</Link>
          )}
          <Link to="/orders" className="rounded-full border border-border px-3 py-1.5 text-xs">Orders</Link>
          <button onClick={() => nav({ to: "/cart" })} className="relative rounded-full bg-primary p-2 text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] text-background">{count}</span>
            )}
          </button>
          <SignOutButton />
        </div>
      }
    >
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Good day{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</h1>
        <p className="text-muted-foreground">What are you craving in Osogbo today?</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search a meal (e.g. jollof, suya, amala)"
            className="w-full rounded-2xl border border-input bg-surface pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label className="inline-flex select-none items-center gap-2 rounded-2xl border border-input bg-surface px-4 py-3 text-sm">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
          Open now
        </label>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <Store className="mx-auto mb-3 h-6 w-6 text-muted-foreground/50" />
          No restaurants match. Try turning off "Open now" or a different meal.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
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
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {r.opens_at.slice(0,5)}–{r.closes_at.slice(0,5)} · {formatNaira(r.delivery_fee_naira)} delivery
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

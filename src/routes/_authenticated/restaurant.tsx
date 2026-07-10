import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SignOutButton } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/restaurant")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/staff" });
    const { data: roles } = await supabase.from("user_roles").select("role,restaurant_id").eq("user_id", data.user.id);
    const staff = roles?.find((r) => r.role === "restaurant_staff");
    if (!staff) throw redirect({ to: "/home" });
    return { restaurantId: staff.restaurant_id as string };
  },
  component: RestaurantLayout,
});

function RestaurantLayout() {
  return (
    <AppShell
      title="Restaurant"
      right={
        <div className="flex items-center gap-2">
          <Link to="/restaurant/orders" className="rounded-full border border-border px-3 py-1.5 text-xs" activeProps={{ className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" }}>Orders</Link>
          <Link to="/restaurant/menu" className="rounded-full border border-border px-3 py-1.5 text-xs" activeProps={{ className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" }}>Menu</Link>
          <Link to="/restaurant/history" className="rounded-full border border-border px-3 py-1.5 text-xs" activeProps={{ className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" }}>History</Link>
          <SignOutButton />
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

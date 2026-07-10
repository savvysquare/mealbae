import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, SignOutButton } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/staff" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/home" });
    return {};
  },
  component: AdminLayout,
});

function AdminLayout() {
  const nav = [
    ["/admin/overview", "Overview"],
    ["/admin/dispatch", "Dispatch"],
    ["/admin/payments", "Payments"],
    ["/admin/restaurants", "Restaurants"],
    ["/admin/meals", "Meals"],
  ] as const;
  return (
    <AppShell
      title="Admin"
      right={
        <div className="flex items-center gap-1">
          {nav.map(([to, label]) => (
            <Link key={to} to={to} className="rounded-full border border-border px-3 py-1.5 text-xs" activeProps={{ className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" }}>{label}</Link>
          ))}
          <SignOutButton />
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

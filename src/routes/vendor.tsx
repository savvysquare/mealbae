import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { getVendorLoginEmail } from "@/lib/vendor-admin.functions";
import { toast } from "sonner";

async function getVendorContext() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { isVendor: false as const, userId: null, restaurantId: null };
  const { data: roles } = await supabase.from("user_roles").select("role,restaurant_id").eq("user_id", data.user.id);
  const staff = roles?.find((r) => r.role === "restaurant_staff");
  return {
    isVendor: !!staff,
    userId: data.user.id,
    restaurantId: (staff?.restaurant_id as string | null) ?? null,
  };
}

export const Route = createFileRoute("/vendor")({
  ssr: false,
  beforeLoad: async ({ location }: { location: { pathname: string } }) => {
    const ctx = await getVendorContext();
    if (!ctx.isVendor && !["/vendor", "/vendor/"].includes(location.pathname)) {
      throw redirect({ to: "/vendor" });
    }
    return ctx;
  },
  component: VendorRoute,
});

function VendorRoute() {
  const { isVendor } = Route.useRouteContext();
  if (!isVendor) return <VendorLogin />;
  return <Outlet />;
}

function VendorLogin() {
  const [restaurantId, setRestaurantId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const { data: restaurants } = useQuery({
    queryKey: ["vendor-login-restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) {
      toast.error("Pick a restaurant");
      return;
    }
    setLoading(true);
    try {
      const { email } = await getVendorLoginEmail({ data: { restaurantId } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials")) {
          toast.error(
            "Login failed. Either no account has been set up for this restaurant, or the password is incorrect. Ask your admin to set your vendor password.",
            { duration: 6000 }
          );
        } else {
          toast.error(error.message, { duration: 6000 });
        }
        return;
      }
      toast.success("Signed in");
      // Hard redirect to avoid stale context
      if (typeof window !== "undefined") {
        window.location.href = "/vendor/orders";
      } else {
        nav({ to: "/vendor/orders" });
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8"><Logo /></div>
      <h1 className="font-display text-3xl font-bold">Vendor sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select your restaurant and enter the password given by your admin.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          required
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">— Pick your restaurant —</option>
          {restaurants?.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          disabled={loading}
          className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? "…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

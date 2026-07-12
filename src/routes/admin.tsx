import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { bootstrapAdmin } from "@/lib/vendor-admin.functions";
import { toast } from "sonner";

async function getAdminContext() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { isAdmin: false as const, userId: null };
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  const isAdmin = !!roles?.some((r) => r.role === "admin");
  return { isAdmin, userId: data.user.id };
}

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const ctx = await getAdminContext();
    // Block sub-routes when not admin — bounce back to /admin (login form).
    if (!ctx.isAdmin && !["/admin", "/admin/"].includes(location.pathname)) {
      throw redirect({ to: "/admin" });
    }
    return ctx;
  },
  component: AdminRoute,
});

function AdminRoute() {
  const { isAdmin } = Route.useRouteContext();
  if (!isAdmin) return <AdminLogin />;
  return <Outlet />;
}

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await bootstrapAdmin({ data: { password } });
      if (!res.ok) {
        toast.error("Incorrect password");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: res.email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in");
      // Hard redirect forces a full page load so beforeLoad re-evaluates the auth session
      if (typeof window !== "undefined") {
        window.location.href = "/admin/overview";
      } else {
        nav({ to: "/admin/overview" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8"><Logo /></div>
      <h1 className="font-display text-3xl font-bold">Admin sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to continue.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="password"
          required
          autoFocus
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

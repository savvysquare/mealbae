import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/staff")({ component: StaffAuth });

function StaffAuth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Account created. Ask an admin to assign your role.");
      nav({ to: "/home" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Signed in");
      nav({ to: "/home" });
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-xl"><Logo /></Link>
      <h1 className="font-display text-3xl font-bold">Restaurant & admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "signin" ? "Sign in with your work email." : "Create your staff account."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email" required autoFocus value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password" required minLength={6} value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button disabled={loading} className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm text-muted-foreground">
        {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
      <p className="mt-8 text-xs text-muted-foreground">
        Customer?{" "}
        <Link to="/auth/customer" className="text-primary underline">Use phone sign-in</Link>.
      </p>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/auth/customer")({ component: CustomerAuth });

function CustomerAuth() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function normalize(p: string) {
    const trimmed = p.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("0")) return "+234" + trimmed.slice(1);
    return "+234" + trimmed;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const p = normalize(phone);
    const digits = p.replace(/\D/g, "");
    const email = `${digits}@mealbae.local`;
    const password = `mb_${digits}_pw`;

    // Try sign-in first; if user doesn't exist, sign them up.
    let { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || null, phone: p, role: "customer" } },
      });
      if (signUpErr) {
        setLoading(false);
        toast.error(signUpErr.message);
        return;
      }
      // Ensure session exists (auto-confirm should be on in dev).
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) {
        setLoading(false);
        toast.error(retry.error.message);
        return;
      }
    }
    setLoading(false);
    toast.success("Signed in");
    nav({ to: "/home" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-xl"><Logo /></Link>
      <h1 className="font-display text-3xl font-bold">Continue with your phone</h1>
      <p className="mt-1 text-sm text-muted-foreground">Testing mode — no OTP required.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            inputMode="tel" required autoFocus value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="080 123 4567"
            className="w-full rounded-2xl border border-input bg-surface pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button disabled={loading} className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>

      <p className="mt-8 text-xs text-muted-foreground">
        Restaurant or admin?{" "}
        <Link to="/auth/staff" className="text-primary underline">Sign in here</Link>.
      </p>
    </div>
  );
}

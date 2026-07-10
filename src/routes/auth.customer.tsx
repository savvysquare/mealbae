import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Phone } from "lucide-react";

export const Route = createFileRoute("/auth/customer")({ component: CustomerAuth });

function CustomerAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function normalize(p: string) {
    const trimmed = p.replace(/\s+/g, "");
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("0")) return "+234" + trimmed.slice(1);
    return "+234" + trimmed;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const p = normalize(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: p });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code sent to " + p);
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const p = normalize(phone);
    const { error } = await supabase.auth.verifyOtp({ phone: p, token: otp, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
    nav({ to: "/home" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link to="/" className="mb-8 text-xl"><Logo /></Link>
      <h1 className="font-display text-3xl font-bold">Sign in with your phone</h1>
      <p className="mt-1 text-sm text-muted-foreground">We'll text you a one-time code.</p>

      {step === "phone" ? (
        <form onSubmit={sendOtp} className="mt-6 space-y-3">
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
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-6 space-y-3">
          <input
            inputMode="numeric" required autoFocus value={otp} maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button disabled={loading} className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-muted-foreground">
            Use a different number
          </button>
        </form>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Restaurant or admin?{" "}
        <Link to="/auth/staff" className="text-primary underline">Sign in here</Link>.
      </p>
    </div>
  );
}

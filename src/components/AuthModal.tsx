import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({ onClose, defaultTab = "signin" }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sign-in fields
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");

  // Sign-up fields
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPwd, setSuPwd] = useState("");
  const [suConfirm, setSuConfirm] = useState("");

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siEmail.trim() || !siPwd) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim().toLowerCase(),
      password: siPwd,
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        toast.error("Incorrect email or password. Please try again.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back! 🎉");
    onClose();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!suName.trim()) { toast.error("Please enter your full name"); return; }
    if (!suEmail.trim()) { toast.error("Please enter your email"); return; }
    if (suPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (suPwd !== suConfirm) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail.trim().toLowerCase(),
      password: suPwd,
      options: {
        data: { full_name: suName.trim() },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        toast.error("An account with this email already exists. Try signing in.");
        setTab("signin");
        setSiEmail(suEmail);
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Account created! Check your email to confirm your address, then sign in.", { duration: 6000 });
    // Switch to sign-in tab so user can log in after confirming
    setTab("signin");
    setSiEmail(suEmail);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Sheet — bottom on mobile, centered on larger screens */}
      <div className="relative mt-auto w-full md:m-auto md:max-w-md md:rounded-3xl bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div>
            <h2 className="font-display text-2xl font-black text-foreground">
              {tab === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tab === "signin"
                ? "Sign in to track orders & save details"
                : "Join MealBAE to order faster"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-6 mt-3 flex rounded-2xl bg-secondary/60 p-1 gap-1">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all cursor-pointer ${
                tab === t
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "signin" ? (
                <><LogIn className="h-3.5 w-3.5" /> Sign In</>
              ) : (
                <><UserPlus className="h-3.5 w-3.5" /> Sign Up</>
              )}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="overflow-y-auto px-6 pt-5 pb-6">
          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <AuthField
                icon={<Mail className="h-4 w-4" />}
                label="Email address"
                id="auth-signin-email"
              >
                <input
                  id="auth-signin-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={siEmail}
                  onChange={(e) => setSiEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                />
              </AuthField>

              <AuthField
                icon={<Lock className="h-4 w-4" />}
                label="Password"
                id="auth-signin-pwd"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  id="auth-signin-pwd"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={siPwd}
                  onChange={(e) => setSiPwd(e.target.value)}
                  placeholder="Your password"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                />
              </AuthField>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                ) : (
                  <><LogIn className="h-4 w-4" /> Sign In</>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <AuthField icon={<User className="h-4 w-4" />} label="Full name" id="auth-su-name">
                <input
                  id="auth-su-name"
                  type="text"
                  autoComplete="name"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                />
              </AuthField>

              <AuthField icon={<Mail className="h-4 w-4" />} label="Email address" id="auth-su-email">
                <input
                  id="auth-su-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                />
              </AuthField>

              <AuthField
                icon={<Lock className="h-4 w-4" />}
                label="Password"
                id="auth-su-pwd"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  id="auth-su-pwd"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={suPwd}
                  onChange={(e) => setSuPwd(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                  minLength={6}
                />
              </AuthField>

              <AuthField
                icon={<Lock className="h-4 w-4" />}
                label="Confirm password"
                id="auth-su-confirm"
                action={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              >
                <input
                  id="auth-su-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={suConfirm}
                  onChange={(e) => setSuConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:ring-2 transition ${
                    suConfirm && suPwd !== suConfirm
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-primary focus:ring-primary/20"
                  }`}
                  required
                />
                {suConfirm && suPwd !== suConfirm && (
                  <p className="mt-1 text-xs text-destructive font-semibold">Passwords do not match</p>
                )}
              </AuthField>

              <button
                type="submit"
                disabled={loading || (!!suConfirm && suPwd !== suConfirm)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                ) : (
                  <><UserPlus className="h-4 w-4" /> Create Account</>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>

              <p className="text-center text-[11px] text-muted-foreground px-2">
                By creating an account you agree to our terms of service. Guest checkout is always available — no account needed.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function AuthField({
  icon,
  label,
  id,
  action,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  id: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground"
        >
          {icon} {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  );
}

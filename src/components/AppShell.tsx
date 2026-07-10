import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function AppShell({ children, right, title }: { children: ReactNode; right?: ReactNode; title?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-3 py-3 md:px-6 md:py-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-30px_oklch(0_0_0/0.25)] md:rounded-[40px]">
        <header className="sticky top-3 z-30 flex items-center justify-between border-b border-border/60 bg-white/85 px-5 py-4 backdrop-blur md:px-10">
          <Link to="/" className="text-lg"><Logo /></Link>
          {title ? <div className="hidden text-sm font-medium text-muted-foreground sm:block">{title}</div> : null}
          <div className="flex items-center gap-2">
            {right}
          </div>
        </header>
        <main className="px-5 pb-16 pt-6 md:px-10 md:pb-24">{children}</main>
      </div>
    </div>
  );
}

export async function signOutAll() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

export function SignOutButton() {
  return (
    <button onClick={signOutAll} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary">
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}

import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function AppShell({ children, right, title }: { children: ReactNode; right?: ReactNode; title?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg"><Logo /></Link>
          {title ? <div className="text-sm font-medium text-muted-foreground">{title}</div> : null}
          <div className="flex items-center gap-2">
            {right}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6">{children}</main>
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

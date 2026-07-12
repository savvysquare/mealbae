import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function AppShell({ children, right, title }: { children: ReactNode; right?: ReactNode; title?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3.5 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:opacity-90">
              <Logo />
            </Link>
            {title ? (
              <div className="hidden text-sm font-semibold text-muted-foreground border-l border-border pl-4 sm:block">
                {title}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {right}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}

export async function signOutAll() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

export function SignOutButton() {
  return (
    <button
      onClick={signOutAll}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
    >
      <LogOut className="h-3.5 w-3.5" /> Sign out
    </button>
  );
}

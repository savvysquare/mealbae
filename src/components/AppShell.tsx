import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Home, Search, ListOrdered, MessageCircle, User } from "lucide-react";
import { useCart } from "@/lib/cart";

export function AppShell({
  children,
  right,
  title,
  hideBottomNav,
}: {
  children: ReactNode;
  right?: ReactNode;
  title?: ReactNode;
  hideBottomNav?: boolean;
}) {
  const { count } = useCart();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const tabs = [
    { to: "/home", label: "Home", Icon: Home, id: "tab-home" },
    { to: "/search", label: "Search", Icon: Search, id: "tab-search" },
    { to: "/orders", label: "Orders", Icon: ListOrdered, id: "tab-orders" },
    { to: "/support", label: "Support", Icon: MessageCircle, id: "tab-support" },
    { to: "/profile", label: "Profile", Icon: null, id: "tab-profile", isProfile: true },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-foreground flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-5">
            <Link to="/" className="hover:opacity-90 flex items-center">
              <Logo />
            </Link>
            {title ? (
              <div className="hidden sm:block text-sm font-semibold text-muted-foreground border-l border-border pl-4 truncate max-w-[180px]">
                {title}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10 pb-28">
        {children}
      </main>

      {/* ── Bottom Tab Bar ── */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto max-w-lg flex items-stretch h-[62px]">
            {tabs.map((tab) => {
              const isActive = pathname === tab.to || (tab.to !== "/home" && pathname.startsWith(tab.to));
              return (
                <Link
                  key={tab.id}
                  id={tab.id}
                  to={tab.to}
                  className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors cursor-pointer"
                  style={{ color: isActive ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {tab.id === "tab-orders" && count > 0 && (
                    <span className="absolute top-2 right-[calc(50%-10px)] translate-x-3 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-black text-white shadow">
                      {count}
                    </span>
                  )}
                  {tab.isProfile ? (
                    /* Chowdeck-style cartoon avatar */
                    <div
                      className={`relative h-7 w-7 rounded-full flex items-center justify-center text-lg font-black transition-transform ${isActive ? "scale-110" : ""}`}
                      style={{ background: isActive ? "var(--primary)" : "#f0f0f0" }}
                    >
                      <span className="text-sm">{isActive ? "🥰" : "😊"}</span>
                    </div>
                  ) : (
                    <tab.Icon
                      className={`h-[22px] w-[22px] transition-transform ${isActive ? "scale-110" : ""}`}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  )}
                  <span className={isActive ? "font-extrabold" : ""}>{tab.label}</span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
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

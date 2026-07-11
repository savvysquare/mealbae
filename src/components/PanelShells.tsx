import { AppShell } from "./AppShell";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";

async function signOutToAdmin() {
  await supabase.auth.signOut();
  window.location.href = "/admin";
}

async function signOutToVendor() {
  await supabase.auth.signOut();
  window.location.href = "/vendor";
}

const desktopLinkClass = "rounded-full border border-border px-3 py-1.5 text-xs whitespace-nowrap";
const desktopActiveClass = { className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground whitespace-nowrap" };
const mobileLinkClass = "flex w-full rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-secondary whitespace-nowrap";
const mobileActiveClass = { className: "flex w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground whitespace-nowrap" };

function HamburgerMenu({ children, signOut }: { children: ReactNode; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      {/* Desktop nav — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1">
        {children}
        <button
          onClick={signOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      {/* Mobile hamburger — visible only on small screens */}
      <div className="relative sm:hidden" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-surface hover:bg-secondary transition"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border bg-background shadow-lg p-2 flex flex-col gap-1">
            {children}
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      title="Admin"
      right={
        <HamburgerMenu signOut={signOutToAdmin}>
          {/* Desktop */}
          <Link to="/admin/overview" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Overview</Link>
          <Link to="/admin/dispatch" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Dispatch</Link>
          <Link to="/admin/payments" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Payments</Link>
          <Link to="/admin/restaurants" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Restaurants</Link>
          <Link to="/admin/meals" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Meals</Link>
          <Link to="/admin/vendors" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Vendors</Link>
          {/* Mobile */}
          <Link to="/admin/overview" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Overview</Link>
          <Link to="/admin/dispatch" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Dispatch</Link>
          <Link to="/admin/payments" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Payments</Link>
          <Link to="/admin/restaurants" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Restaurants</Link>
          <Link to="/admin/meals" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Meals</Link>
          <Link to="/admin/vendors" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Vendors</Link>
        </HamburgerMenu>
      }
    >
      {children}
    </AppShell>
  );
}

export function VendorShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      title="Vendor"
      right={
        <HamburgerMenu signOut={signOutToVendor}>
          {/* Desktop */}
          <Link to="/vendor/orders" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Orders</Link>
          <Link to="/vendor/menu" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>Menu</Link>
          <Link to="/vendor/history" className={`${desktopLinkClass} hidden sm:inline-flex`} activeProps={desktopActiveClass}>History</Link>
          {/* Mobile */}
          <Link to="/vendor/orders" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Orders</Link>
          <Link to="/vendor/menu" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>Menu</Link>
          <Link to="/vendor/history" className={`${mobileLinkClass} sm:hidden`} activeProps={mobileActiveClass}>History</Link>
        </HamburgerMenu>
      }
    >
      {children}
    </AppShell>
  );
}

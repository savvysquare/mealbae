import { AppShell } from "./AppShell";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";

async function signOutToAdmin() {
  await supabase.auth.signOut();
  window.location.href = "/admin";
}

async function signOutToVendor() {
  await supabase.auth.signOut();
  window.location.href = "/vendor";
}

const linkClass = "rounded-full border border-border px-3 py-1.5 text-xs";
const activeClass = { className: "rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground" };

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      title="Admin"
      right={
        <div className="flex items-center gap-1">
          <Link to="/admin/overview" className={linkClass} activeProps={activeClass}>Overview</Link>
          <Link to="/admin/dispatch" className={linkClass} activeProps={activeClass}>Dispatch</Link>
          <Link to="/admin/payments" className={linkClass} activeProps={activeClass}>Payments</Link>
          <Link to="/admin/restaurants" className={linkClass} activeProps={activeClass}>Restaurants</Link>
          <Link to="/admin/meals" className={linkClass} activeProps={activeClass}>Meals</Link>
          <Link to="/admin/vendors" className={linkClass} activeProps={activeClass}>Vendors</Link>
          <button
            onClick={signOutToAdmin}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
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
        <div className="flex items-center gap-2">
          <Link to="/vendor/orders" className={linkClass} activeProps={activeClass}>Orders</Link>
          <Link to="/vendor/menu" className={linkClass} activeProps={activeClass}>Menu</Link>
          <Link to="/vendor/history" className={linkClass} activeProps={activeClass}>History</Link>
          <button
            onClick={signOutToVendor}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}

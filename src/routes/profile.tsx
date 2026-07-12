import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, signOutAll } from "@/components/AppShell";
import { useSession } from "@/hooks/use-auth";
import {
  User,
  MapPin,
  Star,
  Truck,
  Store,
  ChevronRight,
  LogOut,
  Phone,
  Mail,
  Lock,
  ShoppingBag,
} from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useSession();
  const name = user?.user_metadata?.full_name || "Guest User";
  const email = user?.email || "";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const menuItems = [
    { icon: ShoppingBag, label: "Order History", to: "/orders", desc: "View all past orders" },
    { icon: MapPin, label: "Saved Addresses", to: null, desc: "Manage delivery locations" },
    { icon: Star, label: "My Reviews", to: null, desc: "Meals you have rated" },
  ];

  const businessItems = [
    { icon: Store, label: "Partner with MealBae", desc: "List your restaurant on our platform" },
    { icon: Truck, label: "Become a Rider", desc: "Deliver with MealBae and earn daily" },
  ];

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-lg pb-24">
        {/* ── Avatar Section ── */}
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <div className="relative h-20 w-20 rounded-full flex items-center justify-center text-3xl font-black shadow-lg ring-4 ring-white"
            style={{ background: "linear-gradient(135deg, #ff3008 0%, #ff7a2d 100%)" }}
          >
            {user ? (
              <span className="text-white font-black">{initials}</span>
            ) : (
              <span>😊</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">{name}</h1>
            {email && <p className="text-sm text-muted-foreground mt-0.5">{email}</p>}
          </div>
          {!user && (
            <div className="flex gap-3 mt-2">
              <Link
                to="/"
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 shadow-md shadow-primary/20 transition"
              >
                Sign In
              </Link>
              <Link
                to="/"
                className="rounded-full border border-border px-5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* ── Account Info ── */}
        {user && (
          <div className="mb-6 bg-white border border-border/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="text-sm font-bold text-foreground truncate">{email}</div>
              </div>
            </div>
            {user.phone && (
              <div className="p-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</div>
                  <div className="text-sm font-bold text-foreground">{user.phone}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Menu Items ── */}
        <div className="mb-6 bg-white border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account</span>
          </div>
          {menuItems.map((item, i) => (
            <div key={item.label}>
              {item.to ? (
                <Link
                  to={item.to}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3.5 opacity-60">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                </div>
              )}
              {i < menuItems.length - 1 && <div className="mx-4 border-b border-border/40" />}
            </div>
          ))}
        </div>

        {/* ── Business ── */}
        <div className="mb-6 bg-white border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 pt-3 pb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business</span>
          </div>
          {businessItems.map((item, i) => (
            <div key={item.label}>
              <a
                href="https://wa.me/2348141894696"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition cursor-pointer"
              >
                <div className="h-9 w-9 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </a>
              {i < businessItems.length - 1 && <div className="mx-4 border-b border-border/40" />}
            </div>
          ))}
        </div>

        {/* ── Sign Out ── */}
        {user && (
          <button
            onClick={signOutAll}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        )}

        {/* App version */}
        <p className="text-center text-[11px] text-muted-foreground mt-8">
          MealBae · Osogbo, Nigeria · v1.0.0
        </p>
      </div>
    </AppShell>
  );
}

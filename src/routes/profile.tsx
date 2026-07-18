import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, signOutAll } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { useSession } from "@/hooks/use-auth";
import { getSavedPhone, savePhone, clearSavedPhone } from "@/lib/user-phone";
import { AuthModal } from "@/components/AuthModal";
import {
  User as UserIcon,
  MapPin,
  Star,
  Truck,
  Store,
  ChevronRight,
  LogOut,
  Phone,
  Mail,
  Trash2,
  Check,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

const ADDR_KEY = "mealbae.address.v1";
const NAME_KEY = "mealbae.name.v1";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — MealBae" },
      { name: "description", content: "Manage your saved delivery details and profile on MealBae." },
      { property: "og:title", content: "Profile — MealBae" },
      { property: "og:description", content: "Manage your saved delivery details and profile on MealBae." },
    ],
  }),
});

function ProfilePage() {
  const { user } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [authModal, setAuthModal] = useState<"signin" | "signup" | null>(null);

  const email = user?.email || user?.phone || "";
  const profileName = user?.user_metadata?.full_name || name || "Guest User";
  const initials = profileName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setName(typeof window !== "undefined" ? window.localStorage.getItem(NAME_KEY) ?? "" : "");
    setPhone(getSavedPhone());
    setAddress(typeof window !== "undefined" ? window.localStorage.getItem(ADDR_KEY) ?? "" : "");
  }, []);

  function saveAll() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(NAME_KEY, name.trim());
    window.localStorage.setItem(ADDR_KEY, address.trim());
    if (phone.trim()) savePhone(phone.trim());
    toast.success("Saved");
  }

  function clearAll() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(NAME_KEY);
    window.localStorage.removeItem(ADDR_KEY);
    clearSavedPhone();
    setName("");
    setPhone("");
    setAddress("");
    toast.success("Cleared");
  }

  const menuItems = [
    { icon: ShoppingBag, label: "Order History", to: "/orders", desc: "View all past orders" },
    { icon: MapPin, label: "Saved Addresses", to: null, desc: "Manage delivery locations" },
    { icon: Star, label: "My Reviews", to: null, desc: "Meals you have rated" },
  ];

  const businessItems = [
    { icon: Store, label: "Partner with MealBae", desc: "List your restaurant on our platform" },
    { icon: Truck, label: "Become a Rider", desc: "Deliver with MealBae and earn daily" },
  ];

  return (<>
    <AppShell title="Profile" right={<HeaderActions />}>
      <div className="mx-auto max-w-xl pb-24">
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
            <h1 className="font-display text-2xl font-extrabold text-foreground">{profileName}</h1>
            {email && <p className="text-sm text-muted-foreground mt-0.5">{email}</p>}
          </div>
          {!user && (
            <div className="flex gap-3 mt-2">
              <button
                id="profile-signin-btn"
                onClick={() => setAuthModal("signin")}
                className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:brightness-105 shadow-md shadow-primary/20 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                id="profile-register-btn"
                onClick={() => setAuthModal("signup")}
                className="rounded-full border border-border px-5 py-2 text-xs font-bold text-foreground hover:bg-secondary transition cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* ── Account Info/Forms (LocalStorage fields for easy checkout) ── */}
        <div className="mb-6 bg-white border border-border/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserIcon className="h-4.5 w-4.5 text-primary" /> Delivery Details
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            We save these details on this device so your checkouts are lightning fast.
          </p>

          <div className="space-y-4">
            <Field icon={<UserIcon className="h-3.5 w-3.5" />} label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 123 4567"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <Field icon={<MapPin className="h-3.5 w-3.5" />} label="Default delivery address">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Street name, house number, landmark in Osogbo"
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <button
              onClick={saveAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition cursor-pointer"
            >
              <Check className="h-4 w-4" /> Save Details
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

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

    {/* Auth Modal */}
    {authModal && (
      <AuthModal
        defaultTab={authModal}
        onClose={() => setAuthModal(null)}
      />
    )}
  </>);
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeaderActions } from "@/components/HeaderActions";
import { getSavedPhone, savePhone, clearSavedPhone } from "@/lib/user-phone";
import { Phone, MapPin, User as UserIcon, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const ADDR_KEY = "mealbae.address.v1";
const NAME_KEY = "mealbae.name.v1";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — MealBae" },
      { name: "description", content: "Manage your saved delivery details on MealBae." },
      { property: "og:title", content: "Profile — MealBae" },
      { property: "og:description", content: "Manage your saved delivery details on MealBae." },
    ],
  }),
});

function ProfilePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

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

  return (
    <AppShell title="Profile" right={<HeaderActions />}>
      <div className="mx-auto max-w-xl pb-24">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Your details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We save these on this device so checkout is one tap.
          </p>
        </div>

        <div className="space-y-3">
          <Field icon={<UserIcon className="h-4 w-4" />} label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field icon={<Phone className="h-4 w-4" />} label="Phone">
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 123 4567"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field icon={<MapPin className="h-4 w-4" />} label="Default delivery address">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Street, landmark, area in Osogbo"
              className="w-full rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </Field>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
          <button
            onClick={saveAll}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-105 transition"
          >
            <Check className="h-4 w-4" /> Save
          </button>
          <button
            onClick={clearAll}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-3 text-sm font-bold text-muted-foreground hover:text-destructive hover:border-destructive transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, STATUS_LABELS } from "@/lib/format";
import { toast } from "sonner";
import { MapPin, Phone, CheckCircle2, Navigation, LogOut, Bell, BellOff, Volume2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/rider")({ component: RiderDashboard });

function RiderDashboard() {
  const qc = useQueryClient();
  const [riderName, setRiderName] = useState(() => localStorage.getItem("rider_name") ?? "");
  const [riderPhone, setRiderPhone] = useState(() => localStorage.getItem("rider_phone") ?? "");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!(localStorage.getItem("rider_name") && localStorage.getItem("rider_phone")));
  const [activeTab, setActiveTab] = useState<"pickups" | "deliveries">("pickups");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Sign in local state handlers
  const [inputName, setInputName] = useState("");
  const [inputPhone, setInputPhone] = useState("");

  // Play notification chime using Web Audio API
  function playNotificationSound() {
    if (!notificationsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First beep
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      // Second beep slightly offset
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 note
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.25);
      }, 150);

    } catch (e) {
      console.warn("Could not play notification sound:", e);
    }
  }

  // Fetch available pickups (ready_for_pickup with no rider assigned)
  const { data: availablePickups } = useQuery({
    queryKey: ["available-pickups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(*)")
        .in("status", ["preparing", "ready_for_pickup"])
        .is("rider_phone", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isLoggedIn,
    refetchInterval: 10000,
  });

  // Fetch my deliveries (active ones assigned to my phone number)
  const { data: myDeliveries } = useQuery({
    queryKey: ["my-deliveries", riderPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(*)")
        .eq("rider_phone", riderPhone)
        .neq("status", "delivered")
        .neq("status", "cancelled")
        .neq("status", "rejected")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isLoggedIn && !!riderPhone,
    refetchInterval: 10000,
  });

  // Realtime subscription for notifications on new available pickups
  useEffect(() => {
    if (!isLoggedIn) return;

    const channel = supabase
      .channel("rider-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          // If a new order is ready for pickup and has no rider
          if (
            payload.new &&
            ((payload.new as any).status === "preparing" || (payload.new as any).status === "ready_for_pickup") &&
            !(payload.new as any).rider_phone
          ) {
            playNotificationSound();
            toast.info(`🔔 New order available for pickup!`, {
              duration: 5000,
              position: "top-center",
            });
            qc.invalidateQueries({ queryKey: ["available-pickups"] });
          }
          // If order assigned to me has changed or been newly assigned
          if (
            payload.new &&
            (payload.new as any).rider_phone === riderPhone
          ) {
            const newOrder = payload.new as any;
            const oldOrder = payload.old as any;

            // Trigger alert on new assignment or status update
            if (payload.eventType === "INSERT") {
              playNotificationSound();
              toast.success(`📋 New order #${newOrder.short_code} assigned to you!`, {
                duration: 8000,
                position: "top-center",
              });
              setActiveTab("deliveries");
            } else if (payload.eventType === "UPDATE") {
              // If the rider_phone just changed to me (new assignment)
              if (!oldOrder || oldOrder.rider_phone !== riderPhone) {
                playNotificationSound();
                toast.success(`📋 New order #${newOrder.short_code} assigned to you!`, {
                  duration: 8000,
                  position: "top-center",
                });
                setActiveTab("deliveries");
              } else if (oldOrder && oldOrder.status !== newOrder.status) {
                // If the status of my current assignment changed (e.g. ready_for_pickup)
                playNotificationSound();
                toast.info(`🔔 Order #${newOrder.short_code} is now: ${STATUS_LABELS[newOrder.status] ?? newOrder.status}`, {
                  duration: 5000,
                  position: "top-center",
                });
              }
            }

            qc.invalidateQueries({ queryKey: ["my-deliveries", riderPhone] });
            qc.invalidateQueries({ queryKey: ["available-pickups"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, riderPhone, notificationsEnabled, qc]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputPhone.trim()) {
      toast.error("Name and Phone Number are required");
      return;
    }

    try {
      const { data, error } = await (supabase.rpc as any)("verify_rider_login", {
        _phone: inputPhone.trim(),
        _name: inputName.trim(),
      });

      if (error) {
        toast.error("Error verifying details: " + error.message);
        return;
      }

      const res = data as { success: boolean; message?: string; rider?: { name: string; phone: string } };

      if (!res.success) {
        toast.error(res.message || "Failed to verify details");
        return;
      }

      const rider = res.rider!;
      localStorage.setItem("rider_name", rider.name);
      localStorage.setItem("rider_phone", rider.phone);
      setRiderName(rider.name);
      setRiderPhone(rider.phone);
      setIsLoggedIn(true);
      toast.success(`Welcome, ${rider.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rider_name");
    localStorage.removeItem("rider_phone");
    setRiderName("");
    setRiderPhone("");
    setIsLoggedIn(false);
    toast.success("Signed out successfully");
  };

  const acceptPickup = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          rider_name: riderName,
          rider_phone: riderPhone
        })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Pickup accepted! Head to the restaurant.");
      qc.invalidateQueries({ queryKey: ["available-pickups"] });
      qc.invalidateQueries({ queryKey: ["my-deliveries", riderPhone] });
      setActiveTab("deliveries");
    } catch (e: any) {
      toast.error(e.message || "Failed to accept pickup");
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as any })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to: ${STATUS_LABELS[status]}`);
      qc.invalidateQueries({ queryKey: ["my-deliveries", riderPhone] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card-soft p-6">
          <h1 className="font-display text-2xl font-bold text-foreground text-center">Rider Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">Enter your details to view available pickups and active deliveries.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rider Name</label>
              <input
                type="text"
                required
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 whitespace-nowrap">
              Enter Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white py-3 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="text-xl" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Rider</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="p-2 rounded-full border border-border hover:bg-secondary transition"
              title={notificationsEnabled ? "Mute alerts" : "Unmute alerts"}
            >
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={playNotificationSound}
              className="p-2 rounded-full border border-border hover:bg-secondary transition sm:inline-flex hidden"
              title="Test notification sound"
            >
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Rider Dashboard</h1>
            <p className="text-sm text-muted-foreground">Logged in as <span className="font-semibold text-foreground">{riderName}</span> ({riderPhone})</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("pickups")}
            className={`flex-1 py-3 text-center border-b-2 font-semibold text-sm transition whitespace-nowrap ${
              activeTab === "pickups"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Available Pickups ({(availablePickups ?? []).length})
          </button>
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`flex-1 py-3 text-center border-b-2 font-semibold text-sm transition whitespace-nowrap ${
              activeTab === "deliveries"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            My Active Deliveries ({(myDeliveries ?? []).length})
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "pickups" ? (
          <div className="space-y-4">
            {(availablePickups ?? []).length === 0 ? (
              <div className="card-soft p-12 text-center text-muted-foreground">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">No available orders ready for pickup.</p>
                <p className="text-xs mt-1">Keep this tab open to receive audio chimes when orders become ready.</p>
              </div>
            ) : (
              (availablePickups ?? []).map((o) => (
                <div key={o.id} className="card-soft p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg text-primary">#{o.short_code}</div>
                      <div className="font-semibold mt-1">{o.restaurants?.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>Pickup: {o.restaurants?.address}</span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Navigation className="h-3.5 w-3.5 shrink-0" />
                        <span>Deliver to: {o.delivery_address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Delivery fee</div>
                      <div className="font-semibold text-lg text-success">{formatNaira(o.delivery_fee_naira)}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => acceptPickup(o.id)}
                      className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
                    >
                      Accept & Arrive at Restaurant
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(myDeliveries ?? []).length === 0 ? (
              <div className="card-soft p-12 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium">You don't have any active deliveries.</p>
                <p className="text-xs mt-1">Accept pickups from the first tab to begin.</p>
              </div>
            ) : (
              (myDeliveries ?? []).map((o) => (
                <div key={o.id} className="card-soft p-5 border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-primary">#{o.short_code}</span>
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </div>
                      <div className="font-semibold mt-2">{o.restaurants?.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>Pickup: {o.restaurants?.address}</span>
                      </div>
                      {o.restaurants?.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Restaurant: <a href={`tel:${o.restaurants.phone}`} className="underline text-foreground">{o.restaurants.phone}</a></span>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="font-semibold text-sm">Delivery Destination</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Navigation className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Address: {o.delivery_address}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>Customer: <a href={`tel:${o.delivery_phone}`} className="underline text-foreground font-semibold">{o.delivery_phone}</a></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Earnings</div>
                      <div className="font-bold text-lg text-success">{formatNaira(o.delivery_fee_naira)}</div>
                    </div>
                  </div>

                  {/* Rider Status Action workflow buttons */}
                  <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-2 justify-end">
                    {(o.status === "preparing" || o.status === "ready_for_pickup") && (
                      <button
                        onClick={() => updateStatus(o.id, "rider_arrived_at_restaurant")}
                        className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition whitespace-nowrap"
                      >
                        Mark Arrived at Restaurant
                      </button>
                    )}
                    {(o.status === "ready_for_pickup" || o.status === "rider_arrived_at_restaurant") && (
                      <button
                        onClick={() => updateStatus(o.id, "out_for_delivery")}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition whitespace-nowrap"
                      >
                        Mark Picked Up (Out for Delivery)
                      </button>
                    )}
                    {o.status === "out_for_delivery" && (
                      <button
                        onClick={() => updateStatus(o.id, "rider_arrived_at_delivery")}
                        className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80 transition whitespace-nowrap"
                      >
                        Mark Arrived at Delivery
                      </button>
                    )}
                    {o.status === "rider_arrived_at_delivery" && (
                      <button
                        onClick={() => updateStatus(o.id, "delivered")}
                        className="rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-success-foreground hover:opacity-90 transition whitespace-nowrap"
                      >
                        Mark Delivered (Complete)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

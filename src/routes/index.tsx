import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatNaira, isRestaurantOpen } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { Search, Clock, ArrowRight } from "lucide-react";
import heroDish from "@/assets/hero-dish.jpg";
import heroPasta from "@/assets/hero-pasta.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
});

interface Restaurant {
  id: string; name: string; address: string; description: string | null;
  image_url: string | null; opens_at: string; closes_at: string;
  is_open_override: boolean | null; delivery_fee_naira: number;
}

function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

function Landing() {
  const { data: restaurants } = useRestaurants();
  return (
    <div className="min-h-screen bg-[oklch(0.94_0.015_40)] px-3 py-3 md:px-6 md:py-6">
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_-30px_oklch(0_0_0/0.25)] md:rounded-[40px]">
        {/* Decorative background sketch pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, transparent 60px, currentColor 60px 61px, transparent 62px), radial-gradient(circle at 70% 60%, transparent 40px, currentColor 40px 41px, transparent 42px)",
            backgroundSize: "220px 220px",
          }}
        />

        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-12 md:py-8">
          <Logo className="text-xl md:text-2xl" />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#restaurants" className="hover:text-foreground">Restaurants</a>
            <a href="#restaurants" className="hover:text-foreground">Food</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/auth/staff" className="hidden rounded-full px-3 py-2 text-muted-foreground hover:bg-secondary sm:inline-block">
              Login
            </Link>
            <Link to="/auth/customer" className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:brightness-105">
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 grid gap-6 px-5 pb-10 pt-4 md:grid-cols-2 md:gap-4 md:px-12 md:pb-16 md:pt-8">
          <div className="flex flex-col justify-center">
            <h1 className="font-display text-[44px] font-black uppercase leading-[0.95] tracking-tight md:text-[86px]">
              <span className="text-primary">Delicious</span>
              <br />
              Delicacies
              <br />
              At Your
              <br />
              Fingertips
            </h1>

            <p className="mt-6 max-w-md text-base text-muted-foreground md:text-lg">
              Order from Osogbo's best kitchens. Simple bank transfer payment, live tracking, delivered warm.
            </p>

            {/* Search / address bar */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-7 flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-[oklch(0.97_0.01_70)] p-1.5 pl-5"
            >
              <input
                type="text"
                placeholder="Enter your delivery address"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Link
                to="/auth/customer"
                aria-label="Start ordering"
                className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:brightness-105"
              >
                <Search className="h-4 w-4" />
              </Link>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/40" />
              <span className="inline-flex h-2 w-6 rounded-full bg-primary" />
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/40" />
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative flex min-h-[320px] items-center justify-center md:min-h-[520px]">
            {/* Dark blob background */}
            <div
              aria-hidden
              className="absolute right-[-10%] top-1/2 h-[110%] w-[110%] -translate-y-1/2 rounded-[45%_55%_60%_40%/50%_45%_55%_50%] bg-[oklch(0.22_0.02_260)]"
            />
            {/* Orange outline echo */}
            <div
              aria-hidden
              className="absolute right-[-6%] top-1/2 h-[108%] w-[108%] -translate-y-1/2 rounded-[45%_55%_60%_40%/50%_45%_55%_50%] border-2 border-primary/70"
              style={{ transform: "translateY(-48%) rotate(-6deg)" }}
            />
            <img
              src={heroDish}
              alt="Nigerian jollof rice with grilled chicken"
              className="relative z-10 h-auto w-[92%] max-w-[560px] object-contain drop-shadow-2xl"
              width={1200}
              height={1200}
            />
            {/* Pasta bowl accent */}
            <img
              src={heroPasta}
              alt=""
              aria-hidden
              className="absolute -bottom-6 left-[6%] z-20 hidden h-40 w-40 rounded-full object-cover shadow-xl md:block"
            />
            {/* Orange triangle accent */}
            <div
              aria-hidden
              className="absolute -bottom-2 left-[18%] z-10 hidden h-24 w-32 md:block"
              style={{
                background: "var(--primary)",
                clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
                borderRadius: "12px",
              }}
            />
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section id="restaurants" className="mx-auto max-w-6xl px-2 pb-16 pt-16 md:pt-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Osogbo</p>
            <h2 className="mt-1 font-display text-3xl font-black uppercase md:text-5xl">Favourite kitchens</h2>
          </div>
          <span className="text-sm text-muted-foreground">{restaurants?.length ?? 0} spots</span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants?.map((r) => {
            const open = isRestaurantOpen(r.opens_at, r.closes_at, r.is_open_override);
            return (
              <Link
                key={r.id}
                to="/r/$restaurantId"
                params={{ restaurantId: r.id }}
                className="group overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_-20px_oklch(0_0_0/0.2)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_oklch(0_0_0/0.25)]"
              >
                <div className="aspect-[16/11] w-full overflow-hidden bg-muted">
                  {r.image_url && (
                    <img src={r.image_url} alt={r.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-display text-lg font-bold">{r.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.address}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${open ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.opens_at.slice(0,5)}–{r.closes_at.slice(0,5)}</span>
                    <span className="font-semibold text-foreground">{formatNaira(r.delivery_fee_naira)} delivery</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <Link to="/auth/customer" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
            Start ordering <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer id="contact" className="pb-6 pt-4 text-center text-xs text-muted-foreground">
        MealBAE · Osogbo, Nigeria · Your meal, before anything else.
      </footer>
    </div>
  );
}

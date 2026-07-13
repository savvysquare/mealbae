import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, ShoppingBag, LifeBuoy, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useCart } from "@/lib/cart";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const TABS: {
  to: "/home" | "/search" | "/orders" | "/support" | "/profile";
  label: string;
  Icon: IconType;
  match: (p: string) => boolean;
}[] = [
  { to: "/home", label: "Home", Icon: Home, match: (p) => p === "/home" || p.startsWith("/r/") },
  { to: "/search", label: "Search", Icon: Search, match: (p) => p.startsWith("/search") },
  { to: "/orders", label: "Orders", Icon: ShoppingBag, match: (p) => p === "/orders" || p.startsWith("/cart") || p.startsWith("/track") },
  { to: "/support", label: "Support", Icon: LifeBuoy, match: (p) => p.startsWith("/support") },
  { to: "/profile", label: "Profile", Icon: User, match: (p) => p.startsWith("/profile") },
];

const HIDE_PREFIXES = ["/admin", "/vendor", "/rider", "/checkout"];

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const { count } = useCart();

  if (pathname === "/") return null;
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname === p)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pt-1.5 pb-1">
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          const showBadge = to === "/orders" && count > 0;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <Icon
                    className={`h-5.5 w-5.5 ${active ? "stroke-[2.4]" : "stroke-2"}`}
                    aria-hidden
                  />
                  {showBadge && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground shadow">
                      {count}
                    </span>
                  )}
                </span>
                <span className={`text-[10.5px] leading-none tracking-tight ${active ? "font-bold" : "font-semibold"}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

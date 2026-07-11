import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

const HIDE_ON = ["/cart", "/checkout", "/auth"];

export function FloatingCartButton() {
  const { count, subtotal } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (count === 0) return null;
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:bottom-6">
      <Link
        to="/cart"
        className="pointer-events-auto group relative flex w-full max-w-md items-center justify-between gap-3 overflow-hidden rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-2xl shadow-primary/40 ring-2 ring-primary-foreground/20 transition-all hover:brightness-105 hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <div className="relative flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20">
            <ShoppingBag className="h-4.5 w-4.5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-warning text-[10px] font-black text-foreground shadow">
              {count}
            </span>
          </div>
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-black tracking-tight">Go to Cart</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] opacity-90">
              {formatNaira(subtotal)}
            </span>
          </div>
        </div>
        <ArrowRight className="relative h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

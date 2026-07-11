import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function HeaderActions() {
  const { count } = useCart();
  const nav = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/track"
        className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
      >
        Track order
      </Link>
      <button
        onClick={() => nav({ to: "/cart" })}
        className="relative rounded-full bg-primary p-2.5 text-primary-foreground shadow-sm hover:brightness-105 transition cursor-pointer"
        aria-label="Cart"
      >
        <ShoppingBag className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}

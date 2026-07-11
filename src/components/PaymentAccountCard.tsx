import { useState } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import { toast } from "sonner";

const ACCOUNT_NUMBER = "8141894696";
const ACCOUNT_NAME = "MealBAE";
const BANK = "OPAY";

export function PaymentAccountCard({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER);
      setCopied(true);
      toast.success("Account number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-warning/10 shadow-lg shadow-primary/10 ${
        compact ? "p-4" : "p-5 md:p-6"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-warning/20 blur-2xl" />

      <div className="relative flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Pay to this account
          </p>
          <p className="text-sm font-bold text-foreground">Bank transfer only</p>
        </div>
      </div>

      <div className="relative mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {BANK} · {ACCOUNT_NAME}
        </p>
        <p className="mt-1 font-display text-[28px] leading-none font-black tracking-tight text-foreground tabular-nums sm:text-4xl">
          {ACCOUNT_NUMBER}
        </p>
        <button
          type="button"
          onClick={copyNumber}
          aria-label="Copy account number"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-105 active:scale-95 cursor-pointer sm:w-auto"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy account number"}
        </button>
      </div>
    </div>
  );
}

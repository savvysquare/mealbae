export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-display ${className ?? ""}`}>
      <img
        src="/logo-icon.png"
        alt=""
        aria-hidden="true"
        className="h-7 w-auto"
      />
      <span className="text-lg font-extrabold tracking-tight text-foreground font-sans">
        Meal<span className="text-primary">BAE</span>
      </span>
    </div>
  );
}

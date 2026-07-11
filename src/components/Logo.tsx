export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 font-display ${className ?? ""}`}>
      <svg
        viewBox="0 0 460 256"
        fill="currentColor"
        className="h-5 w-auto text-primary"
        aria-hidden="true"
      >
        <path d="M439.467 0C324.267 0 200.533 55.467 151.467 78.933C64 121.6 0 204.8 0 256H305.067C341.333 204.8 411.733 134.4 460 76.8C460 76.8 459.467 34.133 439.467 0Z" />
      </svg>
      <span className="text-lg font-extrabold tracking-tight text-foreground font-sans">
        Meal<span className="text-primary">BAE</span>
      </span>
    </div>
  );
}

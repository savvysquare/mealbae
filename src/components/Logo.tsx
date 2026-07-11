export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-display ${className ?? ""}`}>
      {/* Delivery scooter icon — CSS filter converts dark gray → brand red #ff3008 */}
      <img
        src="/logo-icon.png"
        alt=""
        aria-hidden="true"
        className="h-7 w-auto"
        style={{
          filter:
            "brightness(0) saturate(100%) invert(22%) sepia(96%) saturate(5000%) hue-rotate(6deg) brightness(105%) contrast(105%)",
        }}
      />
      <span className="text-lg font-extrabold tracking-tight text-foreground font-sans">
        Meal<span className="text-primary">BAE</span>
      </span>
    </div>
  );
}

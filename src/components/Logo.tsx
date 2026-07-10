export function Logo({ className }: { className?: string }) {
  return (
    <span className={`font-display font-black tracking-tight ${className ?? ""}`}>
      Meal<span className="text-primary">BAE</span>
    </span>
  );
}

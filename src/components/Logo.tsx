export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className ?? ""}`}>
      <img
        src="/logo.png"
        alt="MealBAE"
        className="h-8 w-auto object-contain"
      />
    </div>
  );
}

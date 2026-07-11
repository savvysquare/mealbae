import { useState } from "react";
import { optimizeImageUrl } from "@/lib/format";

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  /** Pass true for images above the fold (hero / first viewport) */
  eager?: boolean;
  fallback?: React.ReactNode;
}

export function LazyImage({ src, alt, className = "", width = 300, eager = false, fallback }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimized = optimizeImageUrl(src, width);

  if (!optimized || error) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ isolation: "isolate" }}>
      {/* Skeleton shimmer shown until image is loaded */}
      {!loaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse" aria-hidden="true" />
      )}
      <img
        src={optimized}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

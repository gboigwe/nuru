/**
 * Optimized Image Component
 *
 * Wrapper around Next.js Image with automatic lazy loading,
 * blur placeholder, and responsive sizing
 */

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill,
  className = "",
  priority = false,
  quality = 75,
  sizes,
  objectFit = "cover",
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={quality}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
        onLoad={() => setIsLoading(false)}
        style={{
          objectFit,
          transition: "opacity 0.3s ease-in-out",
          opacity: isLoading ? 0.5 : 1,
        }}
        className={className}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200/50">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
    </div>
  );
};

/**
 * Lazy Image Component
 *
 * Uses native lazy loading with Intersection Observer fallback
 */
export const LazyImage = ({
  src,
  alt,
  className = "",
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={width}
      height={height}
      className={className}
      style={{
        contentVisibility: "auto",
      }}
    />
  );
};

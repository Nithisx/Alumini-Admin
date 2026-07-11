import React from "react";

/**
 * Skeleton primitives — standardized shimmer loaders that replace the ad-hoc
 * per-page loading markup. The shimmer (.skeleton-shimmer) is neutralized under
 * prefers-reduced-motion by the global media query in App.css.
 */

export function Skeleton({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-1/2" : i === 0 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/** A feed/post card skeleton (image + header + body). */
export function SkeletonCard({ media = true, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
      {media && <Skeleton className="h-56 w-full rounded-none" />}
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** A vertical stack of feed card skeletons. */
export function SkeletonFeed({ count = 3, media = true, className = "" }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} media={media} />
      ))}
    </div>
  );
}

/** A list-row skeleton (avatar + two lines), e.g. members / birthdays. */
export function SkeletonRow({ className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm ${className}`}
    >
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

export function SkeletonList({ count = 6, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

/** A responsive grid of square tile skeletons, e.g. albums. */
export function SkeletonGrid({ count = 6, cols = "grid-cols-2 sm:grid-cols-3", className = "" }) {
  return (
    <div className={`grid ${cols} gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
      ))}
    </div>
  );
}

export default Skeleton;

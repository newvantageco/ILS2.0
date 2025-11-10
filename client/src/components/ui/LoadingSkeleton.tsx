/**
 * Loading Skeleton Component
 *
 * Beautiful skeleton screens for loading states.
 * Provides smooth loading animations while content is being fetched.
 */

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string;
  height?: string;
  count?: number;
}

export default function LoadingSkeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  count = 1,
}: LoadingSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "text":
        return "h-4 rounded";
      case "circular":
        return "rounded-full aspect-square";
      case "rectangular":
        return "rounded-lg";
      case "card":
        return "rounded-xl h-32";
      default:
        return "rounded-lg";
    }
  };

  const skeleton = (
    <div
      className={`
        bg-gray-200
        animate-pulse
        ${getVariantStyles()}
        ${className}
      `}
      style={{
        width: width || (variant === "circular" ? height : "100%"),
        height: height || undefined,
      }}
    />
  );

  if (count === 1) {
    return skeleton;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{skeleton}</div>
      ))}
    </div>
  );
}

// Preset skeleton components for common layouts
export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="circular" height="48px" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" width="60%" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="text" count={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-200">
        <LoadingSkeleton variant="text" width="25%" />
        <LoadingSkeleton variant="text" width="25%" />
        <LoadingSkeleton variant="text" width="25%" />
        <LoadingSkeleton variant="text" width="25%" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 items-center py-3">
          <LoadingSkeleton variant="circular" height="40px" />
          <LoadingSkeleton variant="text" width="20%" />
          <LoadingSkeleton variant="text" width="30%" />
          <LoadingSkeleton variant="text" width="20%" />
          <LoadingSkeleton variant="text" width="15%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
              <LoadingSkeleton variant="text" width="60%" />
              <LoadingSkeleton variant="text" width="80%" height="32px" />
            </div>
            <LoadingSkeleton variant="circular" height="48px" />
          </div>
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="card p-4 flex items-center gap-4">
          <LoadingSkeleton variant="circular" height="56px" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="70%" />
            <LoadingSkeleton variant="text" width="50%" />
          </div>
          <LoadingSkeleton variant="rectangular" width="80px" height="32px" />
        </div>
      ))}
    </div>
  );
}

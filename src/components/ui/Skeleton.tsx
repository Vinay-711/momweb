import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Shimmer Skeleton Element
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
};

/**
 * Product Card Skeleton Loader
 * Mirrors the exact visual anatomy of ProductCard.tsx
 */
export const ProductCardSkeleton: React.FC<{ count?: number }> = () => {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs flex flex-col"
    >
      {/* Photo Container */}
      <div className="relative aspect-4/3 sm:aspect-square bg-stone-100 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Floating badge skeleton */}
        <div className="absolute top-2.5 left-2.5">
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
        {/* Lead time pill skeleton */}
        <div className="absolute bottom-2.5 left-2.5">
          <Skeleton className="w-16 h-4 rounded-full" />
        </div>
      </div>

      {/* Details Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Category tag */}
          <Skeleton className="w-24 h-3 rounded" />
          {/* Title lines */}
          <Skeleton className="w-4/5 h-4 rounded" />
          <Skeleton className="w-2/3 h-4 rounded" />
          {/* Subtext description */}
          <Skeleton className="w-full h-3 rounded mt-1" />
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <Skeleton className="w-16 h-5 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Product Grid Skeleton Loader
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading flower arrangements"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in"
    >
      <span className="sr-only">Loading flower arrangements...</span>
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Product Detail Page Skeleton Loader
 * Mirrors the exact visual anatomy of ProductDetailPage.tsx
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading arrangement details"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-fade-in"
    >
      <span className="sr-only">Loading floral details...</span>
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-32 h-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>

        {/* Right: Info & Ordering Form Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-3/4 h-8 sm:h-10 rounded" />
            <Skeleton className="w-1/3 h-5 rounded" />
          </div>

          {/* Price Box */}
          <div className="flex items-baseline gap-3">
            <Skeleton className="w-28 h-8 rounded" />
            <Skeleton className="w-20 h-5 rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="w-full h-4 rounded" />
            <Skeleton className="w-5/6 h-4 rounded" />
            <Skeleton className="w-4/6 h-4 rounded" />
          </div>

          {/* City / Lead Time Box */}
          <Skeleton className="w-full h-18 rounded-2xl" />

          {/* Variants */}
          <div className="space-y-2">
            <Skeleton className="w-36 h-3 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>

          {/* Date & Slot Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Skeleton className="w-full sm:w-36 h-12 rounded-2xl" />
            <Skeleton className="flex-1 h-12 rounded-2xl" />
          </div>
          <Skeleton className="w-full h-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Order Tracking Skeleton Loader
 */
export const OrderTrackingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Verifying order details"
      className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in"
    >
      <span className="sr-only">Verifying order details...</span>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-100">
        <div className="space-y-2">
          <Skeleton className="w-40 h-6 rounded-lg" />
          <Skeleton className="w-64 h-4 rounded" />
        </div>
        <Skeleton className="w-32 h-8 rounded-full" />
      </div>

      <div className="space-y-4">
        <Skeleton className="w-full h-16 rounded-2xl" />
        <Skeleton className="w-full h-24 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Row Skeletons for Admin Pages
 */
export const TableRowSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <tbody className="divide-y divide-stone-100">
      {[...Array(rows)].map((_, r) => (
        <tr key={r} className="animate-fade-in">
          {[...Array(columns)].map((_, c) => (
            <td key={c} className="p-4">
              <Skeleton
                className={`h-4 rounded ${
                  c === 0 ? 'w-24 sm:w-32' : c === 1 ? 'w-32 sm:w-48' : 'w-20'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

/**
 * Metric KPI Card Skeleton
 */
export const MetricCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-3"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="w-24 h-3.5 rounded" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <Skeleton className="w-32 h-7 rounded" />
          <Skeleton className="w-20 h-3 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Generic Card Skeleton
 */
export const CardSkeleton: React.FC<{ count?: number; height?: string }> = ({
  count = 3,
  height = 'h-36',
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`bg-white rounded-3xl border border-stone-200 p-5 space-y-4 shadow-xs ${height}`}
        >
          <div className="flex justify-between items-center">
            <Skeleton className="w-28 h-4 rounded" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
          <Skeleton className="w-3/4 h-3.5 rounded" />
          <Skeleton className="w-1/2 h-3.5 rounded" />
        </div>
      ))}
    </div>
  );
};

/**
 * Category Pill Skeleton
 */
export const CategoryPillSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 animate-fade-in">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col items-center space-y-2">
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
          <Skeleton className="w-14 h-3 rounded" />
        </div>
      ))}
    </div>
  );
};

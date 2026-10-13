import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageLoadingFallback: React.FC = () => {
  return (
    <div
      className="min-h-[70vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center items-center space-y-6 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      {/* Brand Luxury Shimmer Icon */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-stone-200 border-t-[#143D2B] animate-spin" />
        <div className="w-10 h-10 rounded-full bg-[#143D2B] flex items-center justify-center text-[#D4AF37] shadow-sm">
          <Sparkles className="w-5 h-5 animate-pulse" aria-hidden="true" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-serif text-sm font-bold text-stone-900 tracking-wider uppercase">
          Padma's Floral
        </p>
        <p className="text-xs text-stone-500">
          Gathering fresh morning blooms...
        </p>
      </div>

      {/* Subtle Shimmer Skeleton Previews */}
      <div className="w-full max-w-md space-y-3 pt-4" aria-hidden="true">
        <div className="skeleton-shimmer h-4 w-3/4 mx-auto rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/2 mx-auto rounded-full" />
      </div>

      <span className="sr-only">Loading fresh blooms and content...</span>
    </div>
  );
};

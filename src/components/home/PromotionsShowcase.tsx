import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronLeft,
  ChevronRight,
  Gift,
  Truck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Promotion } from '../../types';
import { promotionService } from '../../services/promotionService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

export const PromotionsShowcase: React.FC<{
  promotions?: Promotion[];
}> = ({ promotions: initialPromotions }) => {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!initialPromotions);

  useEffect(() => {
    if (!initialPromotions) {
      const load = async () => {
        try {
          const active = await promotionService.getActivePromotions();
          setPromotions(active);
        } catch (err) {
          console.warn('[PromotionsShowcase] Failed to load active promotions:', err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [initialPromotions]);

  // Autoplay carousel if multiple promotions exist
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  if (loading) {
    return (
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Current Promotions">
        <div className="h-44 sm:h-52 bg-stone-200/70 rounded-3xl animate-pulse" />
      </section>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const current = promotions[currentIndex];
  const badgeText = promotionService.getDiscountBadgeText(current);

  const formatValidUntil = (end?: string | null) => {
    if (!end) return 'Ongoing Showcase';
    try {
      const d = new Date(end);
      return `Valid until ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
    } catch {
      return null;
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Special Offers & Seasonal Promotions">
      <div className="relative overflow-hidden rounded-2xl bg-[#0B2419] text-white shadow-xl border border-[#D4AF37]/30">
        
        {/* Background Image with Ambient Emerald & Gold Gradients */}
        <div className="absolute inset-0 z-0">
          {current.banner_image ? (
            <img
              src={getOptimizedImageUrl(current.banner_image, 1000, 70)}
              alt={current.title}
              width="1000"
              height="300"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center opacity-30 transform scale-105 transition-all duration-1000 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#0B2419] via-[#143D2B] to-[#0B2419]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2419] via-[#0B2419]/90 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#0B2419]/60 to-[#0B2419]" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 max-w-2xl">
            
            {/* Top Eyebrow Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Special Promotion</span>
              </span>

              {badgeText ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
                  {current.discount_type === 'free_delivery' ? (
                    <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{badgeText}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-white/10 text-stone-200 px-3 py-1 rounded-full text-xs font-medium">
                  <span>Curated Collection</span>
                </span>
              )}

              {current.end_date && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-300/90 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-stone-300" aria-hidden="true" />
                  <span>{formatValidUntil(current.end_date)}</span>
                </span>
              )}
            </div>

            {/* Promotion Title */}
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {current.title}
            </h2>

            {/* Description */}
            {current.description && (
              <p className="text-sm sm:text-base text-stone-200/90 leading-relaxed font-light">
                {current.description}
              </p>
            )}

            {/* Coupon Code Hint (if coupon code is configured) */}
            {current.code && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-stone-300">Use Code:</span>
                <span className="font-mono text-xs font-bold text-[#D4AF37] bg-black/40 border border-[#D4AF37]/50 px-2.5 py-0.5 rounded-md tracking-wider">
                  {current.code}
                </span>
                {current.min_order_amount ? (
                  <span className="text-[11px] text-stone-300">
                    (Min order ₹{current.min_order_amount})
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* CTA Link & Carousel Navigation */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 flex-shrink-0">
            <Link
              to="/catalog"
              className="touch-target-44 w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c4a132] text-[#0B2419] px-6 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B2419]"
            >
              <span>Explore Offers</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            {/* Carousel Controls (if multiple active promotions) */}
            {promotions.length > 1 && (
              <div className="flex items-center gap-3 pt-2" role="region" aria-label="Promotion Carousel Navigation">
                <button
                  onClick={() => setCurrentIndex(prev => (prev - 1 + promotions.length) % promotions.length)}
                  className="touch-target-44 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                  aria-label="Previous promotion"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Dots indicator */}
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Promotion slide selectors">
                  {promotions.map((_, i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={currentIndex === i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                        currentIndex === i ? 'w-6 bg-[#D4AF37]' : 'w-2.5 bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Slide ${i + 1} of ${promotions.length}: ${promotions[i].title}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentIndex(prev => (prev + 1) % promotions.length)}
                  className="touch-target-44 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                  aria-label="Next promotion"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Expiry pill */}
        {current.end_date && (
          <div className="sm:hidden px-6 pb-4 text-[11px] text-stone-300 flex items-center gap-1.5 border-t border-white/10 pt-2 relative z-10">
            <Clock className="w-3.5 h-3.5 text-stone-300" aria-hidden="true" />
            <span>{formatValidUntil(current.end_date)}</span>
          </div>
        )}
      </div>
    </section>
  );
};

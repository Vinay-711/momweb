import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Navigation,
  ShoppingBag,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import * as whatsappService from '../../services/whatsappService';
import {
  BUSINESS_ADDRESS,
  BUSINESS_COORDINATES,
  BUSINESS_PHONE,
  BUSINESS_HOURS,
  GOOGLE_MAPS_DIRECTIONS_URL
} from '../../utils/seoConfig';

interface LocalQuickActionsProps {
  className?: string;
  variant?: 'banner' | 'compact' | 'card';
}

export const LocalQuickActions: React.FC<LocalQuickActionsProps> = ({
  className = '',
  variant = 'banner'
}) => {
  return (
    <section
      aria-label="Local Store Information and Quick Actions"
      className={`relative z-20 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 lg:p-7">
          {/* Top Info Bar: Address, Phone, Hours */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-stone-600">
              {/* Live Status & Hours */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Open 24/7
                </span>
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  <span>{BUSINESS_HOURS}</span>
                </div>
              </div>

              {/* Physical Workshop Location */}
              <div className="flex items-center gap-1.5 text-stone-700">
                <MapPin className="w-3.5 h-3.5 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
                <span>
                  Address: <strong>{BUSINESS_ADDRESS}</strong>{' '}
                  <span className="font-mono text-[11px] text-stone-500 hidden sm:inline">({BUSINESS_COORDINATES.dms})</span>
                </span>
              </div>

              {/* Direct Phone */}
              <div className="flex items-center gap-1.5 text-stone-700">
                <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                <span>
                  Call: <a href={`tel:${BUSINESS_PHONE}`} className="font-bold text-[#143D2B] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded px-1">{BUSINESS_PHONE}</a>
                </span>
              </div>
            </div>

            {/* Delivery zones notice */}
            <div className="inline-flex items-center gap-1.5 text-xs text-[#143D2B] bg-[#143D2B]/5 px-3 py-1 rounded-full font-medium self-start lg:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
              <span>Delivery across Ramanagara & Bengaluru</span>
            </div>
          </div>

          {/* Core 4 CTAs: Call Now, WhatsApp Us, Get Directions, Shop Flowers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5">
            {/* 1. Call Now */}
            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="touch-target-44 min-h-[48px] flex items-center justify-center gap-2 sm:gap-2.5 bg-[#143D2B] hover:bg-[#1b4e37] text-white px-3 sm:px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:ring-offset-2"
              aria-label={`Call Padma's Floral at ${BUSINESS_PHONE}`}
            >
              <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
              <span>Call Now</span>
            </a>

            {/* 2. WhatsApp Us */}
            <a
              href={whatsappService.getGreetingUrl(
                'Hello Padma\'s Floral, I would like to order flower decorations.'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 min-h-[48px] flex items-center justify-center gap-2 sm:gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 sm:px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
              aria-label="WhatsApp Padma's Floral florist"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>WhatsApp Us</span>
            </a>

            {/* 3. Get Directions */}
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 min-h-[48px] flex items-center justify-center gap-2 sm:gap-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 hover:text-stone-900 border border-stone-300 px-3 sm:px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2"
              aria-label="Get Directions to Padma's Floral in Ramanagara on Google Maps"
            >
              <Navigation className="w-4 h-4 text-[#EA4335] flex-shrink-0" aria-hidden="true" />
              <span>Get Directions</span>
            </a>

            {/* 4. Shop Flowers */}
            <Link
              to="/catalog"
              className="touch-target-44 min-h-[48px] flex items-center justify-center gap-2 sm:gap-2.5 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-3 sm:px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
              aria-label="Browse flower decoration collections"
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

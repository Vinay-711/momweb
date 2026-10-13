import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  ExternalLink,
  Clock,
  ShoppingBag,
  Copy,
  Check
} from 'lucide-react';
import { Instagram } from '../ui/InstagramIcon';
import * as whatsappService from '../../services/whatsappService';
import {
  BUSINESS_ADDRESS,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_HOURS,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL,
  GOOGLE_MAPS_SEARCH_URL,
  GOOGLE_MAPS_DIRECTIONS_URL
} from '../../utils/seoConfig';

export const GoogleBusinessSection: React.FC = () => {
  const [copiedType, setCopiedType] = useState<'address' | 'phone' | null>(null);

  const handleCopy = (text: string, type: 'address' | 'phone') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  return (
    <section
      id="google-business-profile"
      aria-label="Location and Business Information"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
    >
      <div className="bg-[#0E2F21] text-white rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden border border-emerald-900/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column: Heading, Information & Action CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-[#F3E5AB]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Padma's Floral • Ramanagara & Bengaluru</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Visit Our Ramanagara Workshop
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              Located in Ramanagara Town. We provide all types of flower decorations with delivery across Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.
            </p>

            {/* Quick trust metrics */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-200">
                <Clock className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Open: 24/7</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-200">
                <MapPin className="w-4 h-4 text-[#EA4335]" aria-hidden="true" />
                <span>Ramanagara Town</span>
              </div>

              <a
                href={BUSINESS_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#F3E5AB] hover:underline"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
                <span>@{BUSINESS_INSTAGRAM}</span>
              </a>
            </div>

            {/* Core Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {/* CTA 1: Get Directions */}
              <a
                href={GOOGLE_MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                aria-label="Get Directions to Padma's Floral on Google Maps"
              >
                <Navigation className="w-4 h-4 text-[#EA4335]" aria-hidden="true" />
                <span>Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
              </a>

              {/* CTA 2: WhatsApp Us */}
              <a
                href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                aria-label="WhatsApp Padma's Floral"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
              </a>

              {/* CTA 3: Call Now */}
              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                aria-label="Call Padma's Floral"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Call: {BUSINESS_PHONE}</span>
              </a>

              {/* CTA 4: Shop Flowers */}
              <Link
                to="/catalog"
                className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                aria-label="Browse flower decoration collections"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>Browse Products</span>
              </Link>

              {/* Supporting CTA: View on Google */}
              <a
                href={GOOGLE_MAPS_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
                aria-label="View Padma's Floral on Google Maps"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Right Column: Business Profile Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-stone-800 rounded-2xl p-6 sm:p-7 shadow-xl border border-stone-200/90 space-y-5">
              {/* Business Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Open 24/7
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 mt-1">
                    Padma's Floral
                  </h3>
                  <p className="text-xs text-stone-600 font-medium">All Types of Flower Decorations</p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#143D2B] text-[#D4AF37] flex items-center justify-center font-serif text-xl font-bold shadow-sm flex-shrink-0" aria-hidden="true">
                  P
                </div>
              </div>

              {/* Verified Details (Address, Hours, Phone, Instagram) with 1-Click Copy */}
              <div className="space-y-3.5 text-xs text-stone-700">
                {/* Physical Address */}
                <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#EA4335] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-bold text-stone-900">Address:</span>
                      <p className="text-stone-700 font-medium">{BUSINESS_ADDRESS}</p>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Delivery: Ramanagara and Bengaluru
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BUSINESS_ADDRESS, 'address')}
                    className="touch-target-44 p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B]"
                    title="Copy address"
                    aria-label="Copy workshop address"
                  >
                    {copiedType === 'address' ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Opening Hours */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <Clock className="w-4 h-4 text-[#FBBC05] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-stone-900">Opening Hours:</span>
                    <p className="text-stone-700 font-medium">{BUSINESS_HOURS}</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      ✓ Open 24/7 for flower decoration orders
                    </p>
                  </div>
                </div>

                {/* Direct Phone */}
                <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="font-bold text-stone-900">Phone:</span>
                      <p>
                        <a href={`tel:${BUSINESS_PHONE}`} className="text-[#143D2B] font-bold text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded px-1">
                          {BUSINESS_PHONE}
                        </a>
                      </p>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        WhatsApp: {BUSINESS_WHATSAPP}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BUSINESS_PHONE, 'phone')}
                    className="touch-target-44 p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B]"
                    title="Copy phone number"
                    aria-label="Copy phone number"
                  >
                    {copiedType === 'phone' ? (
                      <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" /> Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Instagram */}
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                  <Instagram className="w-4 h-4 text-[#E1306C] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold text-stone-900">Instagram:</span>
                    <p>
                      <a
                        href={BUSINESS_INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#143D2B] font-bold text-sm hover:underline"
                      >
                        @{BUSINESS_INSTAGRAM}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Action Strip inside Card */}
              <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2">
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target-44 inline-flex items-center justify-center gap-1.5 bg-[#4285F4] hover:bg-[#3367d6] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                >
                  <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={GOOGLE_MAPS_SEARCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target-44 inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>View on Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

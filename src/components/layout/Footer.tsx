import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, MapPin, Clock, Package, Navigation, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Instagram } from '../ui/InstagramIcon';
import * as whatsappService from '../../services/whatsappService';
import {
  BUSINESS_ADDRESS,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_HOURS,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL,
  GOOGLE_MAPS_DIRECTIONS_URL,
  GOOGLE_MAPS_SEARCH_URL
} from '../../utils/seoConfig';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B2419] text-stone-300 pt-16 pb-24 md:pb-16 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-800/80">
          {/* Brand & Story */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#143D2B] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                <span className="font-serif text-xl font-bold">P</span>
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight">
                  Padma's <span className="text-[#C84B5B] italic">Floral</span>
                </span>
                <p className="text-[10px] tracking-widest uppercase text-stone-400 font-semibold">
                  Flower Decorations
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              All types of flower decorations. Located in Ramanagara Town. Delivery across Ramanagara and Bengaluru. Prices depend on the seasons.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#D4AF37]">
              <Clock className="w-4 h-4" />
              <span>Available 24/7 for Orders & Inquiries</span>
            </div>
          </div>

          {/* Quick Categories */}
          <nav aria-label="Footer Floral Collections" className="space-y-3">
            <h4 className="font-serif text-white font-semibold text-base tracking-wide">
              Categories & Collections
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/catalog?category=flower" className="hover:text-white transition-colors">
                  Flower Decorations (flower)
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-white transition-colors">
                  Browse All Collections
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors">
                  Visual Lookbook & Photos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact & Custom Orders
                </Link>
              </li>
            </ul>
          </nav>

          {/* Delivery & Timings */}
          <div className="space-y-3">
            <h4 className="font-serif text-white font-semibold text-base tracking-wide">
              Locations & Hours
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C84B5B] flex-shrink-0 mt-1" />
                <div>
                  <span className="text-stone-200 font-medium">Location:</span>
                  <p>{BUSINESS_ADDRESS}, Ramanagara</p>
                  <a
                    href={GOOGLE_MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#4285F4] hover:underline mt-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Get Directions on Google Maps</span>
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-1" />
                <div>
                  <span className="text-stone-200 font-medium">Operating Hours:</span>
                  <p>{BUSINESS_HOURS}</p>
                </div>
              </li>
              <li className="text-xs text-emerald-400 pt-1">
                ✓ Delivery across Ramanagara and Bengaluru
              </li>
              <li className="text-xs text-stone-400">
                Prices depend on the seasons
              </li>
            </ul>
          </div>

          {/* Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="font-serif text-white font-semibold text-base tracking-wide">
              Contact & Orders
            </h4>
            <p className="text-xs text-stone-400">
              Need flower decorations? Reach out to Padma's Floral:
            </p>
            <div className="space-y-2 pt-1">
              {/* WhatsApp Us */}
              <a
                href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow transition-all"
                aria-label="WhatsApp Padma's Floral"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
              </a>

              {/* Call Now */}
              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="flex items-center gap-2.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-500/20 transition-all"
                aria-label="Call Padma's Floral"
              >
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>Call: {BUSINESS_PHONE}</span>
              </a>

              {/* Instagram */}
              <a
                href={BUSINESS_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#E1306C] hover:bg-[#c72760] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                aria-label="Follow Padma's Floral on Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram: @{BUSINESS_INSTAGRAM}</span>
              </a>

              {/* Shop Flowers */}
              <Link
                to="/catalog"
                className="flex items-center gap-2.5 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                aria-label="Shop our full flower catalog"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Products</span>
              </Link>
            </div>

            <div className="pt-2 flex flex-col gap-1.5">
              <Link
                to="/track"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                <Package className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Track Order (Enter Reference #)</span>
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Business Owner Admin Portal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Padma's Floral. All rights reserved. Ramanagara & Bengaluru.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-stone-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-stone-300 transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};


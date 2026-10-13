import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Phone, MessageCircle, Clock, Truck } from 'lucide-react';
import { Instagram } from '../components/ui/InstagramIcon';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import { LocalQuickActions } from '../components/local/LocalQuickActions';
import {
  buildTitle,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  BUSINESS_ADDRESS,
  BUSINESS_HOURS,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL
} from '../utils/seoConfig';

export const AboutPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('About Us – Padma\'s Floral in Ramanagara & Bengaluru'),
    description: "About Padma's Floral — All types of flower decorations. Located in Ramanagara Town. Serving Ramanagara and Bengaluru with 24/7 service.",
    canonicalPath: '/about',
  });

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
    { name: 'About', url: canonicalUrl('/about') },
  ]), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* SEO Structured Data */}
      <StructuredData data={breadcrumbSchema} />

      {/* Hero Banner */}
      <div className="bg-[#143D2B] text-white rounded-2xl border border-emerald-900/60 p-8 sm:p-14 relative overflow-hidden shadow-sm">
        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Padma's Floral</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
            About Padma's Floral
          </h1>
          <p className="text-base sm:text-lg text-stone-200 font-light leading-relaxed">
            All types of flower decorations. Located in Ramanagara Town. Serving Ramanagara and Bengaluru with 24/7 service.
          </p>
        </div>
      </div>

      {/* Main Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6 text-stone-700 leading-relaxed text-sm sm:text-base">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B]">
            All Types of Flower Decorations
          </h2>
          <p>
            Welcome to <strong>Padma's Floral</strong>, situated in Ramanagara Town. We provide all types of flower decorations for events, ceremonies, weddings, pujas, and celebrations.
          </p>
          <p>
            We offer delivery services covering <strong>Ramanagara and Bengaluru</strong>. Our operations run <strong>24/7</strong> to accommodate your requirements at any time.
          </p>
          <p>
            Our flower prices depend on the seasons, ensuring accurate and up-to-date pricing for every customer order.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="inline-flex items-center gap-1.5 text-[#143D2B] hover:underline"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>Call: {BUSINESS_PHONE}</span>
            </a>
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
            </a>
            <a
              href={BUSINESS_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#E1306C] hover:underline"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram: @{BUSINESS_INSTAGRAM}</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="aspect-3/4 rounded-2xl overflow-hidden shadow-xs border border-stone-200">
            <img
              src="/images/products/jasmine-garland.jpg"
              alt="Fresh Mallige jasmine garland by Padma's Floral"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-3/4 rounded-2xl overflow-hidden shadow-xs border border-stone-200 mt-6">
            <img
              src="/images/products/flower-decorations.jpg"
              alt="Traditional flower decorations by Padma's Floral"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Business Details Overview */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-stone-200/90 shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
            Business Details
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B] mt-1">
            Service & Delivery Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2 p-5 rounded-xl bg-stone-50/80 border border-stone-200/90">
            <Clock className="w-6 h-6 text-[#D4AF37]" aria-hidden="true" />
            <h3 className="font-serif font-bold text-base text-stone-900">Opening Hours</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-semibold text-emerald-700">
              {BUSINESS_HOURS}
            </p>
            <p className="text-[11px] text-stone-500">
              Available around the clock for orders.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-xl bg-stone-50/80 border border-stone-200/90">
            <MapPin className="w-6 h-6 text-[#C84B5B]" aria-hidden="true" />
            <h3 className="font-serif font-bold text-base text-stone-900">Address</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-semibold">
              {BUSINESS_ADDRESS}, Ramanagara
            </p>
            <p className="text-[11px] text-stone-500">
              City: Ramanagara
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-xl bg-stone-50/80 border border-stone-200/90">
            <Truck className="w-6 h-6 text-[#143D2B]" aria-hidden="true" />
            <h3 className="font-serif font-bold text-base text-stone-900">Delivery Areas</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-semibold">
              Ramanagara and Bengaluru
            </p>
            <p className="text-[11px] text-stone-500">
              Prices depend on the seasons.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-xl bg-stone-50/80 border border-stone-200/90">
            <Sparkles className="w-6 h-6 text-[#D4AF37]" aria-hidden="true" />
            <h3 className="font-serif font-bold text-base text-stone-900">Products</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-semibold">
              All types of flower decorations
            </p>
            <p className="text-[11px] text-stone-500">
              Category: flower
            </p>
          </div>
        </div>
      </div>

      {/* Local Store Quick Actions & Discoverability */}
      <LocalQuickActions />

      {/* CTA Box */}
      <div className="bg-[#143D2B] text-white rounded-2xl border border-emerald-900/60 p-8 sm:p-12 text-center space-y-6 shadow-sm">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold">
          Order Flower Decorations
        </h2>
        <p className="text-sm text-stone-200 max-w-lg mx-auto">
          Contact us 24/7 on WhatsApp or Phone to place your order. Delivery across Ramanagara and Bengaluru.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/catalog"
            className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#bfa035] text-[#0B2419] px-7 py-3 rounded-xl font-bold text-xs shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            Browse Products
          </Link>
          <a
            href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-7 py-3 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
          </a>
        </div>
      </div>
    </div>
  );
};


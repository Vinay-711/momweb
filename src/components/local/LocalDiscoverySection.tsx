import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  Phone,
  MessageCircle,
  Navigation,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Heart,
  Truck,
  Flower2,
  ChevronRight,
  ShieldCheck,
  Star,
  ExternalLink
} from 'lucide-react';
import * as whatsappService from '../../services/whatsappService';
import {
  BUSINESS_ADDRESS,
  BUSINESS_PHONE,
  BUSINESS_HOURS,
  GOOGLE_MAPS_DIRECTIONS_URL,
  GOOGLE_MAPS_SEARCH_URL
} from '../../utils/seoConfig';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

type CityTab = 'Ramanagara' | 'Bengaluru';

interface LocalServiceItem {
  id: string;
  queryLabel: string; // The natural search term
  title: string;
  description: string;
  highlights: string[];
  ctaText: string;
  ctaLink: string;
  iconName: 'flower' | 'truck' | 'heart' | 'sparkles';
  imageUrl: string;
}

export const LocalDiscoverySection: React.FC = () => {
  const [activeCity, setActiveCity] = useState<CityTab>('Ramanagara');

  // Services naturally mapped to the required local search terms without keyword stuffing
  const localServices: Record<CityTab, LocalServiceItem[]> = {
    Ramanagara: [
      {
        id: 'shop',
        queryLabel: 'flower shop in Ramanagara',
        title: "Padma's Floral in Ramanagara",
        description:
          "Located at Ramanagara Town, Padma's Floral provides all types of flower decorations. Open 24/7. Prices depend on the seasons.",
        highlights: [
          'Address: Ramanagara Town',
          'Open 24/7',
          'Prices depend on the seasons'
        ],
        ctaText: 'View Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'flower',
        imageUrl:
          '/images/products/flower-decorations.jpg'
      },
      {
        id: 'fresh-flowers',
        queryLabel: 'fresh flowers in Ramanagara',
        title: 'Fresh Flower Decorations in Ramanagara',
        description:
          "All types of flower decorations available in Ramanagara. Delivery areas include Ramanagara and Bengaluru.",
        highlights: [
          'All types of flower decorations',
          'Delivery in Ramanagara & Bengaluru',
          'Open 24/7'
        ],
        ctaText: 'Explore Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'sparkles',
        imageUrl:
          '/images/products/jasmine-garland.jpg'
      },
      {
        id: 'bouquet-delivery',
        queryLabel: 'bouquet delivery in Ramanagara',
        title: 'Flower Arrangements in Ramanagara',
        description:
          "Flower decorations and arrangements crafted at Ramanagara Town. Prices depend on the seasons.",
        highlights: [
          'Open 24/7',
          'Seasonal pricing',
          'Delivery in Ramanagara and Bengaluru'
        ],
        ctaText: 'Browse Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'heart',
        imageUrl:
          '/images/products/red-roses-bouquet.jpg'
      },
      {
        id: 'flower-delivery',
        queryLabel: 'flower delivery in Ramanagara',
        title: 'Flower Delivery in Ramanagara',
        description:
          "Prompt flower decoration delivery across Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.",
        highlights: [
          'Open 24/7 for all orders',
          'Delivery across Ramanagara & Bengaluru',
          'All types of flower decorations'
        ],
        ctaText: 'Browse Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'truck',
        imageUrl:
          '/images/products/lily-orchid-vase.jpg'
      },
      {
        id: 'wedding-flowers',
        queryLabel: 'wedding flowers in Ramanagara',
        title: 'Wedding Flower Decorations in Ramanagara',
        description:
          "All types of flower decorations for weddings, events, stages, car decor, and celebrations. Serving Ramanagara and Bengaluru.",
        highlights: [
          'All types of flower decorations',
          'Delivery in Ramanagara and Bengaluru',
          'Prices depend on the seasons'
        ],
        ctaText: 'View Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'heart',
        imageUrl:
          '/images/products/wedding-varmala.jpg'
      },
      {
        id: 'garlands',
        queryLabel: 'garlands in Ramanagara',
        title: 'Flower Decorations & Garlands in Ramanagara',
        description:
          "All types of flower decorations and garlands handcrafted in Ramanagara Town. Open 24/7.",
        highlights: [
          'Located in Ramanagara Town',
          'Delivery in Ramanagara and Bengaluru',
          'Seasonal pricing'
        ],
        ctaText: 'Shop Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'flower',
        imageUrl:
          '/images/products/jasmine-garland.jpg'
      },
      {
        id: 'pooja-flowers',
        queryLabel: 'pooja flowers in Ramanagara',
        title: 'Pooja Flower Decorations in Ramanagara',
        description:
          "All types of flower decorations for pujas and religious ceremonies in Ramanagara and Bengaluru.",
        highlights: [
          'Open 24/7',
          'Delivery in Ramanagara and Bengaluru',
          'Seasonal pricing'
        ],
        ctaText: 'Order Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'sparkles',
        imageUrl:
          '/images/products/marigold-puja-string.jpg'
      }
    ],
    Bengaluru: [
      {
        id: 'shop',
        queryLabel: 'flower shop in Bengaluru',
        title: "Padma's Floral Serving Bengaluru",
        description:
          "Padma's Floral delivers all types of flower decorations across Bengaluru from Ramanagara Town. Open 24/7.",
        highlights: [
          'Delivery across Bengaluru and Ramanagara',
          'Open 24/7',
          'Prices depend on the seasons'
        ],
        ctaText: 'Shop Flowers for Bengaluru',
        ctaLink: '/catalog?category=flower',
        iconName: 'flower',
        imageUrl:
          '/images/products/flower-decorations.jpg'
      },
      {
        id: 'fresh-flowers',
        queryLabel: 'fresh flowers in Bengaluru',
        title: 'Flower Decorations Delivered to Bengaluru',
        description:
          "All types of flower decorations delivered across Bengaluru. Prices depend on the seasons. Open 24/7.",
        highlights: [
          'Delivery in Bengaluru & Ramanagara',
          'Open 24/7',
          'All types of flower decorations'
        ],
        ctaText: 'Shop Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'sparkles',
        imageUrl:
          '/images/products/jasmine-garland.jpg'
      },
      {
        id: 'bouquet-delivery',
        queryLabel: 'bouquet delivery in Bengaluru',
        title: 'Flower Arrangements Delivered to Bengaluru',
        description:
          "All types of flower decorations delivered directly to Bengaluru. Open 24/7. Inquire via WhatsApp or call.",
        highlights: [
          'Delivery across Bengaluru and Ramanagara',
          'Open 24/7 for inquiries and orders',
          'Prices depend on the seasons'
        ],
        ctaText: 'Browse Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'heart',
        imageUrl:
          '/images/products/red-roses-bouquet.jpg'
      },
      {
        id: 'flower-delivery',
        queryLabel: 'flower delivery in Bengaluru',
        title: 'Flower Delivery in Bengaluru',
        description:
          "All types of flower decorations. Delivery in Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.",
        highlights: [
          'Delivery across Bengaluru and Ramanagara',
          'Open 24/7 for all orders',
          'Seasonal pricing'
        ],
        ctaText: 'Browse Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'truck',
        imageUrl:
          '/images/products/lily-orchid-vase.jpg'
      },
      {
        id: 'wedding-flowers',
        queryLabel: 'wedding flowers in Bengaluru',
        title: 'Wedding Flower Decorations in Bengaluru',
        description:
          "All types of flower decorations for weddings, stages, mantapas, and events in Bengaluru. Open 24/7.",
        highlights: [
          'All types of flower decorations',
          'Delivery across Bengaluru and Ramanagara',
          'Prices depend on the seasons'
        ],
        ctaText: 'Explore Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'heart',
        imageUrl:
          '/images/products/wedding-varmala.jpg'
      },
      {
        id: 'garlands',
        queryLabel: 'garlands in Bengaluru',
        title: 'Flower Decorations & Garlands in Bengaluru',
        description:
          "All types of flower decorations and garlands delivered to Bengaluru from Ramanagara Town. Open 24/7.",
        highlights: [
          'Delivery across Bengaluru and Ramanagara',
          'Open 24/7 for inquiries and orders',
          'Prices depend on the seasons'
        ],
        ctaText: 'Order Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'flower',
        imageUrl:
          '/images/products/jasmine-garland.jpg'
      },
      {
        id: 'pooja-flowers',
        queryLabel: 'pooja flowers in Bengaluru',
        title: 'Pooja Flower Decorations in Bengaluru',
        description:
          "All types of flower decorations for pujas and celebrations delivered in Bengaluru. Open 24/7.",
        highlights: [
          'All types of flower decorations',
          'Delivery across Bengaluru and Ramanagara',
          'Seasonal pricing'
        ],
        ctaText: 'Book Flower Decorations',
        ctaLink: '/catalog?category=flower',
        iconName: 'sparkles',
        imageUrl:
          '/images/products/marigold-puja-string.jpg'
      }
    ]
  };

  const currentServices = localServices[activeCity];

  return (
    <section
      id="local-discovery"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10"
      aria-label="Local Flower Business Discovery and Services"
    >
      {/* 1. Header & City Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-stone-200">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Local Flower Business Discovery</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#143D2B] leading-tight">
            Flower Decorations in {activeCity}
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-light">
            All types of flower decorations. Delivered promptly across Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.
          </p>
        </div>

        {/* City Switcher Pill Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-stone-200/80 rounded-full self-start lg:self-end shadow-inner" role="tablist" aria-label="Select delivery city">
          <button
            type="button"
            role="tab"
            aria-selected={activeCity === 'Ramanagara'}
            onClick={() => setActiveCity('Ramanagara')}
            className={`touch-target-44 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] ${
              activeCity === 'Ramanagara'
                ? 'bg-[#143D2B] text-[#F3E5AB] shadow-md scale-102'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            🌸 Ramanagara (Workshop & Local)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeCity === 'Bengaluru'}
            onClick={() => setActiveCity('Bengaluru')}
            className={`touch-target-44 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] ${
              activeCity === 'Bengaluru'
                ? 'bg-[#143D2B] text-[#F3E5AB] shadow-md scale-102'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            🚚 Bengaluru (Delivery)
          </button>
        </div>
      </div>

      {/* 2. EASILY DISCOVERABLE STORE INFORMATION & 4 CORE CTAS BAR */}
      <div className="bg-[#0E2F21] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-900/60 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs pb-5 border-b border-white/15">
          {/* Address */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#C84B5B] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
              <MapPin className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">Address</p>
              <p className="font-semibold text-white text-sm mt-0.5">{BUSINESS_ADDRESS}</p>
              <p className="text-stone-300 text-[11px] mt-0.5">
                Delivery: Ramanagara and Bengaluru
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">Opening Hours</span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  Open 24/7
                </span>
              </div>
              <p className="font-semibold text-white text-sm mt-0.5">{BUSINESS_HOURS}</p>
              <p className="text-stone-300 text-[11px] mt-0.5">
                Open around the clock
              </p>
            </div>
          </div>

          {/* Direct Phone */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">Direct Florist Helpline</p>
              <p className="font-semibold text-white text-sm mt-0.5">
                <a href={`tel:${BUSINESS_PHONE}`} className="hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded px-1">
                  {BUSINESS_PHONE}
                </a>
              </p>
              <p className="text-stone-300 text-[11px] mt-0.5">
                WhatsApp: 7676117596
              </p>
            </div>
          </div>
        </div>

        {/* 4 CORE LOCAL BUSINESS CTAs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* CTA 1: Call Now */}
          <a
            href="tel:9740030159"
            className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm border border-emerald-500/30 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            aria-label="Call Padma's Floral immediately"
          >
            <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
            <span>Call Now</span>
          </a>

          {/* CTA 2: WhatsApp Us */}
          <a
            href={whatsappService.getGreetingUrl(
              `Namaskara! I am inquiring about fresh flowers and delivery in ${activeCity}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            aria-label="Chat with Padma's Floral on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>WhatsApp Us</span>
          </a>

          {/* CTA 3: Get Directions */}
          <a
            href={GOOGLE_MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            aria-label="Get Google Maps Directions to Padma's Floral"
          >
            <Navigation className="w-4 h-4 text-[#EA4335] flex-shrink-0" aria-hidden="true" />
            <span>Get Directions</span>
          </a>

          {/* CTA 4: Shop Flowers */}
          <Link
            to="/catalog"
            className="touch-target-44 min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-4 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
            aria-label="Shop our full fresh flower catalog"
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>

      {/* 3. LOCAL SERVICES GRID (Naturally covering the 7 local searches for activeCity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentServices.map((service, index) => (
          <article
            key={service.id}
            className={`bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
              index === 0 ? 'lg:col-span-2' : ''
            }`}
          >
            {/* Visual Header */}
            <div className={`relative overflow-hidden ${index === 0 ? 'h-52 sm:h-60' : 'h-44'}`}>
              <img
                src={getOptimizedImageUrl(service.imageUrl, 500)}
                alt={`${service.title} - ${activeCity}`}
                width="500"
                height={index === 0 ? 240 : 176}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="bg-[#143D2B]/90 backdrop-blur-xs text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-sm">
                  {service.queryLabel}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-tight">
                  {service.title}
                </h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                {service.description}
              </p>

              <ul className="space-y-2 border-t border-stone-100 pt-3">
                {service.highlights.map((item, hIdx) => (
                  <li
                    key={hIdx}
                    className="flex items-start gap-2 text-xs text-stone-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <Link
                  to={service.ctaLink}
                  className="touch-target-44 inline-flex items-center gap-1.5 text-xs font-bold text-[#143D2B] hover:text-[#C84B5B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-lg p-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{service.ctaText}</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>

                <a
                  href={whatsappService.getGreetingUrl(
                    `Namaskara! I am inquiring about ${service.queryLabel} from Padma's Floral.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target-44 text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 border border-emerald-200/60"
                  aria-label={`Inquire about ${service.queryLabel} on WhatsApp`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>WhatsApp Florist</span>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* 4. LOCAL CUSTOMER ADVICE & FAQ GRID */}
      <div className="bg-[#143D2B]/5 rounded-2xl p-6 sm:p-10 border border-[#143D2B]/15 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
            Business Details & FAQ
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#143D2B]">
            Information for {activeCity} Orders
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-stone-900">
              What products and services do you offer in {activeCity}?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              We provide all types of flower decorations. Delivery is available across Ramanagara and Bengaluru. Open 24/7.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-stone-900">
              How does your pricing work?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Our prices depend on the seasons. Please contact us on WhatsApp (7676117596) or call (9740030159) for seasonal pricing and availability.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-stone-900">
              What are your operating hours and address?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              We are located at Ramanagara Town, Ramanagara, and are open 24/7.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
            <h4 className="font-serif font-bold text-sm text-stone-900">
              Where do you deliver?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              We deliver across Ramanagara and Bengaluru with 24/7 service.
            </p>
          </div>
        </div>

        {/* 5. BOTTOM LOCAL ACTION BANNER (ALL 4 CTAS) */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`tel:${BUSINESS_PHONE}`}
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1b4e37] text-white px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:ring-offset-2"
          >
            <Phone className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>Call Now: {BUSINESS_PHONE}</span>
          </a>

          <a
            href={whatsappService.getGreetingUrl(
              `Hello Padma's Floral, I would like to order flower decorations in ${activeCity}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>WhatsApp Us</span>
          </a>

          <a
            href={GOOGLE_MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 px-6 py-3.5 rounded-xl text-xs font-bold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2"
          >
            <Navigation className="w-4 h-4 text-[#EA4335]" aria-hidden="true" />
            <span>Get Directions</span>
          </a>

          <Link
            to="/catalog"
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c29f2f] text-[#0B2419] px-6 py-3.5 rounded-xl text-xs font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

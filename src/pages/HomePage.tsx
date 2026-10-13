import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  ArrowRight,
  Sparkles,
  Truck,
  ShieldCheck,
  Clock,
  MapPin,
  HeartHandshake,
  AlertCircle,
  RefreshCw,
  Phone
} from 'lucide-react';
import { Instagram } from '../components/ui/InstagramIcon';
import { productService } from '../services/productService';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ui/ProductCard';
import { CategoryPillSkeleton, ProductGridSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { INITIAL_GALLERY } from '../data/seedData';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import { LocalQuickActions } from '../components/local/LocalQuickActions';
import { LocalDiscoverySection } from '../components/local/LocalDiscoverySection';
import { GoogleBusinessSection } from '../components/local/GoogleBusinessSection';
import { PromotionsShowcase } from '../components/home/PromotionsShowcase';
import {
  buildTitle,
  buildLocalBusinessJsonLd,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  BUSINESS_PHONE,
  BUSINESS_WHATSAPP,
  BUSINESS_INSTAGRAM,
  BUSINESS_INSTAGRAM_URL,
} from '../utils/seoConfig';
import {
  getOptimizedImageUrl,
  getResponsiveImageSrcSet,
  HERO_IMAGE_SIZES,
} from '../utils/imageUtils';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SEO Meta Tags
  usePageMeta({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/',
    ogImage: DEFAULT_OG_IMAGE,
  });

  // Structured Data
  const localBusinessSchema = useMemo(() => buildLocalBusinessJsonLd({
    name: "Padma's Floral",
    phone: BUSINESS_PHONE,
    city: 'Ramanagara',
    description: DEFAULT_DESCRIPTION,
  }), []);

  const breadcrumbSchema = useMemo(() => buildBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl('/') },
  ]), []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        productService.getCategories(),
        productService.getProducts({ limit: 12 }),
      ]);
      setCategories(cats);
      setAllProducts(prods);
      setFeaturedProducts(prods.filter(p => p.is_featured));
    } catch (err: any) {
      console.error('[HomePage] Failed to load data from Supabase:', err);
      setError(err.message || 'Unable to connect to live flower catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* SEO Structured Data */}
      <StructuredData data={localBusinessSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* 1. HERO SECTION */}
      <section
        className="relative overflow-hidden bg-[#0E2F21] text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#143D2B]"
        style={{ backgroundColor: '#0E2F21' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-[#D4AF37]/30 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#F3E5AB]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Padma's Floral • Ramanagara & Bengaluru</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-[1.18] text-white">
              All Types of Flower Decorations in{' '}
              <span className="italic font-normal text-[#D4AF37]">Ramanagara & Bengaluru</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-200/90 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              All types of flower decorations. Serving Ramanagara and Bengaluru with 24/7 service. Located in Ramanagara Town. Prices depend on the seasons.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 w-full">
              <Link
                to="/catalog"
                className="touch-target-44 w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c4a132] text-[#0B2419] px-7 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <span>Browse Floral Collections</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target-44 w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Instant WhatsApp Order</span>
              </a>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-white/15 max-w-lg mx-auto lg:mx-0 text-stone-300">
              <div className="text-center lg:text-left">
                <p className="font-serif font-bold text-white text-lg sm:text-2xl">24/7</p>
                <p className="text-[11px] sm:text-xs text-stone-300">Open Always</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif font-bold text-white text-lg sm:text-2xl">Decorations</p>
                <p className="text-[11px] sm:text-xs text-stone-300">All Types</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-serif font-bold text-white text-lg sm:text-2xl">Delivery</p>
                <p className="text-[11px] sm:text-xs text-stone-300">Ramanagara & Bengaluru</p>
              </div>
            </div>
          </div>

          {/* Right Visual Collage */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative mx-auto max-w-md">
              <div className="aspect-4/5 rounded-2xl overflow-hidden shadow-xl border border-white/15 relative">
                <img
                  src={getOptimizedImageUrl('/images/products/flower-decorations.jpg', 800, 80)}
                  srcSet={getResponsiveImageSrcSet('/images/products/flower-decorations.jpg', [400, 600, 800, 1000])}
                  sizes={HERO_IMAGE_SIZES}
                  alt="Padma's Floral - All types of flower decorations"
                  width="800"
                  height="1000"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 text-white">
                  <span className="text-[10px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">Padma's Floral</span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold">All Types of Flower Decorations</h3>
                  <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5 sm:mt-1">Ramanagara Town • Seasonal Pricing</p>
                </div>
              </div>

              {/* Business Info badge - contained on mobile, floating on tablet/desktop */}
              <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-6 sm:-left-6 bg-white text-stone-900 p-4 rounded-2xl shadow-lg border border-stone-200/90 max-w-full sm:max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[#143D2B] uppercase tracking-wider">Open 24/7 • Ramanagara Town</span>
                </div>
                <p className="text-xs text-stone-700 font-medium">
                  All types of flower decorations • Seasonal pricing
                </p>
                <a
                  href={BUSINESS_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C84B5B] hover:underline mt-1.5"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>@{BUSINESS_INSTAGRAM} on Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK LOCAL STORE ACTION STRIP */}
      <LocalQuickActions className="-mt-8 sm:-mt-12" />

      {/* ACTIVE PROMOTIONS & MARKETING OFFERS SHOWCASE */}
      <PromotionsShowcase />

      {/* ERROR BANNER WITH RETRY */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorState
            error={error}
            onRetry={fetchData}
            retryLabel="Retry Connection"
          />
        </div>
      )}

      {/* 2. CATEGORIES BROWSER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
              Handpicked Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B] mt-1">
              Explore by Floral Category
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-sm font-semibold text-[#143D2B] hover:text-[#C84B5B] flex items-center gap-1 mt-2 sm:mt-0 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <CategoryPillSkeleton count={6} />
        ) : categories.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-stone-200 p-6">
            <p className="text-xs text-stone-500">No categories found in the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/catalog?category=${cat.slug}`}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-stone-200/80 hover:border-[#143D2B]/40 hover:shadow-lg transition-all"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 border-2 border-stone-100 group-hover:border-[#D4AF37] transition-all">
                  <img
                    src={getOptimizedImageUrl(cat.image_url, 160, 75)}
                    alt={cat.name}
                    width="96"
                    height="96"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-serif text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-[#143D2B] line-clamp-2">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3. FEATURED / BESTSELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
              Customer Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B] mt-1">
              Curated Bestsellers & Specials
            </h2>
          </div>
          <Link
            to="/catalog"
            className="text-sm font-semibold text-[#143D2B] hover:text-[#C84B5B] flex items-center gap-1 mt-2 sm:mt-0"
          >
            <span>See Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-500">No featured products currently highlighted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. WHY PADMA'S FLORAL - TRUST SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#143D2B] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-lg border border-[#1e5a3f]">
          <div className="max-w-3xl relative z-10">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
              Ramanagara & Bengaluru
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold mt-2 leading-tight">
              Why Customers Choose Padma's Floral
            </h2>
            <p className="text-sm sm:text-base text-stone-200 mt-3 font-light leading-relaxed">
              Located in Ramanagara Town, we provide all types of flower decorations with dedicated service across Ramanagara and Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 relative z-10">
            <div className="bg-white/[0.08] p-5 rounded-xl border border-white/10">
              <Sparkles className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="font-serif font-bold text-base text-white">All Flower Decorations</h3>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                Specializing in all types of flower decorations for events, celebrations, weddings, and pujas.
              </p>
            </div>

            <div className="bg-white/[0.08] p-5 rounded-xl border border-white/10">
              <Clock className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="font-serif font-bold text-base text-white">Open 24/7</h3>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                Available around the clock for flower decorations and timely orders in Ramanagara Town.
              </p>
            </div>

            <div className="bg-white/[0.08] p-5 rounded-xl border border-white/10">
              <Truck className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="font-serif font-bold text-base text-white">Delivery Areas</h3>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                Delivery across Ramanagara and Bengaluru with seasonal pricing.
              </p>
            </div>

            <div className="bg-white/[0.08] p-5 rounded-xl border border-white/10">
              <MessageCircle className="w-8 h-8 text-[#D4AF37] mb-3" />
              <h3 className="font-serif font-bold text-base text-white">Direct Assistance</h3>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                Call {BUSINESS_PHONE} or WhatsApp {BUSINESS_WHATSAPP} for questions and instant booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL FLOWER BUSINESS DISCOVERY (RAMANAGARA & BENGALURU) */}
      <LocalDiscoverySection />

      {/* 5. LOOKBOOK GALLERY TEASER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
              Visual Lookbook
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B] mt-1">
              Moments We've Adorned
            </h2>
          </div>
          <Link
            to="/gallery"
            className="text-sm font-semibold text-[#143D2B] hover:text-[#C84B5B] flex items-center gap-1"
          >
            <span>View All Photos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {INITIAL_GALLERY.map((item, idx) => (
            <div
              key={item.id}
              className={`relative rounded-2xl overflow-hidden group aspect-square shadow-sm ${
                idx === 0 ? 'col-span-2 row-span-2 aspect-auto' : ''
              }`}
            >
              <img
                src={getOptimizedImageUrl(item.image_url, idx === 0 ? 600 : 360, 75)}
                alt={item.title}
                width={idx === 0 ? 600 : 360}
                height={idx === 0 ? 600 : 360}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]">{item.category}</span>
                <p className="font-serif text-sm font-bold">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GOOGLE BUSINESS PROFILE CALL TO ACTION & MAPS */}
      <GoogleBusinessSection />

      {/* 6. FAST WHATSAPP / CALL INVITATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-[#143D2B] text-white rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-[#1e5a3f]">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-[#F3E5AB] tracking-widest uppercase">
              Need Flower Decorations?
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Speak Directly with Padma's Floral
            </h3>
            <p className="text-sm text-stone-200 max-w-xl">
              All types of flower decorations. Delivery in Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
            </a>

            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="bg-white hover:bg-stone-100 text-[#143D2B] px-6 py-3.5 rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <Phone className="w-4 h-4 text-[#143D2B]" />
              <span>Call: {BUSINESS_PHONE}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

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
  Phone,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Flower2
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

// Clean FNP-Style Category Story Circles
const CATEGORY_STORY_CIRCLES = [
  {
    name: 'All Decor',
    subtitle: 'All Types',
    image: '/images/products/flower-decorations.jpg',
    categorySlug: 'flower',
    occasion: 'All',
  },
  {
    name: 'Garlands & Puja',
    subtitle: 'ಮಲ್ಲಿಗೆ ಮಾಲೆ',
    image: '/images/products/jasmine-garland.jpg',
    categorySlug: 'garlands-puja',
    occasion: 'Puja',
  },
  {
    name: 'Red Roses',
    subtitle: 'ಗುಲಾಬಿ',
    image: '/images/products/red-roses-bouquet.jpg',
    categorySlug: 'bouquets',
    occasion: 'Bouquets',
  },
  {
    name: 'Puja Strings',
    subtitle: 'ಸೇವಂತಿಗೆ',
    image: '/images/products/marigold-puja-string.jpg',
    categorySlug: 'garlands-puja',
    occasion: 'Puja',
  },
  {
    name: 'Wedding Varmala',
    subtitle: 'ಕಲ್ಯಾಣ ಮಾಲೆ',
    image: '/images/products/wedding-varmala.jpg',
    categorySlug: 'wedding-varmala',
    occasion: 'Wedding',
  },
  {
    name: 'Lilies & Orchids',
    subtitle: 'Exotic Blooms',
    image: '/images/products/lily-orchid-vase.jpg',
    categorySlug: 'bouquets',
    occasion: 'Bouquets',
  },
  {
    name: 'Mixed Bunches',
    subtitle: 'Carnations',
    image: '/images/products/carnation-rose-bunch.jpg',
    categorySlug: 'bouquets',
    occasion: 'Bouquets',
  },
  {
    name: 'Car Decoration',
    subtitle: 'ಕಾರು ಡೆಕೋರೇಶನ್',
    image: '/images/products/wedding-car-decor.jpg',
    categorySlug: 'event-car-decor',
    occasion: 'Decoration',
  },
];

// Clean Occasion Tabs for Fast Client-Side Filtering
const OCCASION_TABS = [
  { id: 'All', label: 'All Collections' },
  { id: 'Puja', label: 'Puja & Traditional (ಪೂಜೆ)' },
  { id: 'Wedding', label: 'Weddings & Varmala (ಮದುವೆ)' },
  { id: 'Bouquets', label: 'Bouquets & Gifting' },
  { id: 'Decoration', label: 'Car & Stage Decor' },
];

// FNP-Style Clean FAQs
const FAQS = [
  {
    question: "How do I place an order for flower decorations?",
    answer: "You can easily order directly through our website by clicking 'Order Now', or chat with our florist on WhatsApp at 7676117596. We will share live blossom photos, discuss your ceremony requirements, and confirm your delivery slot."
  },
  {
    question: "Do you deliver to both Ramanagara and Bengaluru?",
    answer: "Yes, we provide full delivery coverage across Ramanagara Town, nearby localities, and throughout Bengaluru. Express 2-hour delivery is available for urgent flower requirements."
  },
  {
    question: "Are you really open 24/7 for flower orders?",
    answer: "Yes! Padma's Floral is open 24 hours a day, 7 days a week. Whether you need fresh jasmine garlands for a 5:00 AM temple puja or late-night wedding hall flower decoration, our team is always on call."
  },
  {
    question: "Why do flower prices depend on the seasons?",
    answer: "Fresh flowers are sourced daily from local Karnataka flower farms and markets. Pricing varies based on seasonal harvest and festival demand (such as Varamahalakshmi, Dasara, and wedding muhurtham dates). We always provide transparent, fair market prices."
  },
  {
    question: "Can I customize bridal varmalas, garlands, or car decorations?",
    answer: "Yes, customization is our specialty! You can choose specific flower varieties (jasmine, Dutch roses, orchids, chrysanthemums), color combinations, lengths, and design styles to match your wedding attire and venue theme."
  },
  {
    question: "How quickly can you arrange car decoration or event flowers?",
    answer: "For wedding cars and urgent event decoration, we can set up on-site within 2 to 4 hours in Ramanagara and Bengaluru. Contact us on WhatsApp with your date, vehicle, and location."
  }
];

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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
        productService.getProducts({ limit: 16 }),
      ]);
      setCategories(cats);
      setAllProducts(prods);
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

  // Filtered products based on selected occasion
  const filteredProducts = useMemo(() => {
    if (selectedOccasion === 'All') return allProducts;
    if (selectedOccasion === 'Bouquets') {
      return allProducts.filter(p => p.category_id === 'cat-bouquets' || p.category_name?.toLowerCase().includes('bouquet') || p.tags.some(t => t.toLowerCase().includes('bouquet') || t.toLowerCase().includes('roses') || t.toLowerCase().includes('carnation')));
    }
    if (selectedOccasion === 'Puja') {
      return allProducts.filter(p => p.occasions?.includes('Puja') || p.category_id === 'cat-garlands' || p.name.includes('Garland') || p.name.includes('Puja') || p.name.includes('ಮಾಲೆ'));
    }
    if (selectedOccasion === 'Wedding') {
      return allProducts.filter(p => p.occasions?.includes('Wedding') || p.category_id === 'cat-wedding' || p.name.includes('Varmala') || p.name.includes('Wedding'));
    }
    if (selectedOccasion === 'Decoration') {
      return allProducts.filter(p => p.category_id === 'cat-decor' || p.category_id === 'cat-flower' || p.name.toLowerCase().includes('decoration') || p.name.toLowerCase().includes('decor'));
    }
    return allProducts;
  }, [allProducts, selectedOccasion]);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="space-y-12 sm:space-y-16 bg-[#FAF9F6]">
      {/* SEO Structured Data */}
      <StructuredData data={localBusinessSchema} />
      <StructuredData data={breadcrumbSchema} />

      {/* 1. FNP-STYLE CIRCULAR CATEGORY STORY BAR */}
      <section className="bg-white border-b border-stone-200/80 py-4 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#143D2B] flex items-center gap-1.5">
              <Flower2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Explore by Category</span>
            </span>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-[#143D2B] hover:text-[#C84B5B] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horizontal Scroll Story Circles */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
            {CATEGORY_STORY_CIRCLES.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedOccasion(cat.occasion);
                  const el = document.getElementById('curated-catalog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex flex-col items-center flex-shrink-0 text-center cursor-pointer focus:outline-none"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 border-2 border-stone-200 group-hover:border-[#143D2B] group-focus:border-[#143D2B] transition-all bg-white shadow-xs overflow-hidden">
                  <img
                    src={getOptimizedImageUrl(cat.image, 160, 80)}
                    alt={cat.name}
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="mt-2 text-xs font-bold text-stone-800 group-hover:text-[#143D2B] whitespace-nowrap">
                  {cat.name}
                </span>
                <span className="text-[10px] text-stone-500 font-medium whitespace-nowrap">
                  {cat.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. AIRY, CLEAN HERO SECTION (FNP STYLE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 lg:p-12">
          
          {/* Left Column: Clean Copy & CTAs */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold text-[#143D2B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ramanagara Town • Delivery in Ramanagara & Bengaluru</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-[1.18]">
              All Types of Flower Decorations & Fresh Blooms
            </h1>

            <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Handcrafted fresh daily by <strong>Padma's Floral</strong>. We provide all types of flower decorations for weddings, pujas, temple functions, and celebrations. Open 24/7 with seasonal market pricing.
            </p>

            {/* FNP Clean Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 text-xs text-stone-700">
              <span className="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg font-medium">
                <Zap className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                <span>2-Hour Express Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Farm Fresh Harvest</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg font-medium">
                <Clock className="w-3.5 h-3.5 text-[#143D2B]" />
                <span>Open 24/7 Always</span>
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-3 w-full">
              <Link
                to="/catalog"
                className="w-full sm:w-auto bg-[#143D2B] hover:bg-[#1a4e37] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                <span>Browse Floral Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to order flower decorations.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order (7676117596)</span>
              </a>

              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-h-[44px]"
              >
                <Phone className="w-4 h-4 text-[#143D2B]" />
                <span>Call Florist</span>
              </a>
            </div>
          </div>

          {/* Right Column: Clean Floral Photography Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-stone-50 rounded-2xl p-2 border border-stone-200 shadow-sm">
              <div className="aspect-4/3 sm:aspect-square rounded-xl overflow-hidden relative">
                <img
                  src={getOptimizedImageUrl('/images/products/flower-decorations.jpg', 800, 85)}
                  srcSet={getResponsiveImageSrcSet('/images/products/flower-decorations.jpg', [400, 600, 800])}
                  sizes={HERO_IMAGE_SIZES}
                  alt="Padma's Floral - All types of flower decorations"
                  width="800"
                  height="800"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    Authentic Work
                  </span>
                  <p className="font-serif text-base sm:text-lg font-bold">
                    All Types of Flower Decorations
                  </p>
                  <p className="text-xs text-stone-200">
                    Ramanagara Town • Seasonal Market Pricing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FNP 4-POINT TRUST GUARANTEE BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#143D2B] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                100% Fresh Farm Harvest
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Handpicked daily from Ramanagara and local Karnataka growers.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                2-Hour Express Delivery
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Prompt delivery coverage across Ramanagara & Bengaluru.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#143D2B] flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-[#143D2B]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                Open 24/7 Always
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Available round-the-clock for morning pujas & late celebrations.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#25D366] flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900">
                Direct WhatsApp Booking
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Chat directly at {BUSINESS_WHATSAPP} without middleman markup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK LOCAL STORE ACTION STRIP */}
      <LocalQuickActions />

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

      {/* 4. CURATED PRODUCTS & OCCASION FILTER TABS */}
      <section id="curated-catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-[#143D2B] uppercase tracking-wider">
              Curated Fresh Floral Store
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Fresh Flower Decorations & Bestsellers
            </h2>
          </div>

          {/* Occasion Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {OCCASION_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedOccasion(tab.id)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedOccasion === tab.id
                    ? 'bg-[#143D2B] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-500">No flower items found for this selection.</p>
            <button
              onClick={() => setSelectedOccasion('All')}
              className="text-xs font-bold text-[#143D2B] underline"
            >
              Show all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#143D2B] border border-stone-300 font-bold text-sm px-6 py-3 rounded-xl shadow-2xs transition-all"
          >
            <span>Explore All Flower Products in Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. CUSTOM EVENT & WEDDING DECORATION SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-[#143D2B] uppercase tracking-wider">
              On-Site Decoration Services
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Custom Flower Decorations for Every Occasion
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              We specialize in custom stage backdrops, wedding cars, reception entrance arches, and temple puja decoration across Ramanagara and Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Wedding Varmala & Bridal */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between">
              <div>
                <div className="aspect-16/10 rounded-xl overflow-hidden mb-4">
                  <img
                    src={getOptimizedImageUrl('/images/products/wedding-varmala.jpg', 500, 80)}
                    alt="Royal Wedding Varmala"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Royal Wedding Varmala (ಕಲ್ಯಾಣ ಮಾಲೆ)
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Blush roses, fragrant tuberose beads, baby's breath, and pearl accents handcrafted for bride and groom.
                </p>
              </div>
              <a
                href={whatsappService.getCustomQuoteUrl('Wedding Varmala & Bridal Florals')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 bg-[#143D2B] hover:bg-[#1a4e37] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Custom Varmala Quote</span>
              </a>
            </div>

            {/* 2. Wedding Car Floral Decor */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between">
              <div>
                <div className="aspect-16/10 rounded-xl overflow-hidden mb-4">
                  <img
                    src={getOptimizedImageUrl('/images/products/wedding-car-decor.jpg', 500, 80)}
                    alt="Royal Wedding Car Decoration"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Wedding Car Floral Decoration
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Front bonnet floral arches, side mirror bunches, door handles, and satin ribbon accents on-site.
                </p>
              </div>
              <a
                href={whatsappService.getCustomQuoteUrl('Wedding Car Floral Decoration')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 bg-[#143D2B] hover:bg-[#1a4e37] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Book Car Decoration</span>
              </a>
            </div>

            {/* 3. Temple & Puja Floral Strings */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/90 flex flex-col justify-between">
              <div>
                <div className="aspect-16/10 rounded-xl overflow-hidden mb-4">
                  <img
                    src={getOptimizedImageUrl('/images/products/marigold-puja-string.jpg', 500, 80)}
                    alt="Temple and Puja Floral Strings"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Temple & Home Puja Garlands
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Mysore Jasmine (ಮಲ್ಲಿಗೆ), golden Sevanthige, and saffron marigold strings tied fresh each morning.
                </p>
              </div>
              <a
                href={whatsappService.getCustomQuoteUrl('Temple & Puja Garlands')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 bg-[#143D2B] hover:bg-[#1a4e37] text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Order Puja Garlands</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REAL LOOKBOOK GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-[#143D2B] uppercase tracking-wider">
              Visual Lookbook
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Moments We've Adorned
            </h2>
          </div>
          <Link
            to="/gallery"
            className="text-xs font-semibold text-[#143D2B] hover:text-[#C84B5B] flex items-center gap-1"
          >
            <span>View Full Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {INITIAL_GALLERY.map((item, idx) => (
            <div
              key={item.id}
              className={`relative rounded-2xl overflow-hidden group aspect-square shadow-2xs border border-stone-200/80 ${
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
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37]">{item.category}</span>
                <p className="font-serif text-xs sm:text-sm font-bold">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FNP-STYLE CLEAN FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-[#143D2B] uppercase tracking-wider">
              Frequently Asked Questions
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Everything You Need to Know
            </h2>
            <p className="text-xs text-stone-500 mt-1.5">
              Clear answers about flower ordering, express delivery, and seasonal pricing.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-stone-200 rounded-xl overflow-hidden transition-all bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-serif font-bold text-sm sm:text-base text-stone-900 hover:text-[#143D2B] transition-colors focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#143D2B] flex-shrink-0 ml-3" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0 ml-3" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 mt-1">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick contact prompt */}
          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-stone-900">Have a custom question or specific date?</p>
              <p className="text-xs text-stone-500">Our florist is available 24/7 on WhatsApp.</p>
            </div>
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I have a question about flower decoration.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* LOCAL FLOWER BUSINESS DISCOVERY (RAMANAGARA & BENGALURU) */}
      <LocalDiscoverySection />

      {/* GOOGLE BUSINESS PROFILE CALL TO ACTION & MAPS */}
      <GoogleBusinessSection />

      {/* 8. CLEAN BOTTOM WHATSAPP / CALL INVITATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-[#143D2B] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-[#1e5a3f]">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
              Need Flower Decorations?
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              Speak Directly with Padma's Floral
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 max-w-xl">
              All types of flower decorations. Delivery across Ramanagara and Bengaluru. Open 24/7. Prices depend on the seasons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href={whatsappService.getGreetingUrl('Hello Padma\'s Floral, I would like to inquire about flower decorations.')}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp: {BUSINESS_WHATSAPP}</span>
            </a>

            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="bg-white hover:bg-stone-100 text-[#143D2B] px-6 py-3.5 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-colors min-h-[44px]"
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

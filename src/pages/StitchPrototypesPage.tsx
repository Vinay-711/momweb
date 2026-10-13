import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Smartphone,
  Monitor,
  ExternalLink,
  Layers,
  Palette,
  CheckCircle2,
  Eye,
  ArrowRight,
  Database,
  Search,
  Filter
} from 'lucide-react';

interface ScreenItem {
  index: number;
  title: string;
  slug: string;
  deviceType: 'MOBILE' | 'DESKTOP';
  width: string;
  height: string;
  htmlFile: string;
  screenshotFile: string;
  category: 'Storefront' | 'Checkout & Cart' | 'Admin Portal';
  reactRoute: string;
  description: string;
}

const SCREENS: ScreenItem[] = [
  {
    index: 1,
    title: "Admin Category Management",
    slug: "admin-category-management",
    deviceType: "MOBILE",
    width: "780",
    height: "5632",
    htmlFile: "/stitch-export/screens/01_admin-category-management.html",
    screenshotFile: "/stitch-export/screens/01_admin-category-management.png",
    category: "Admin Portal",
    reactRoute: "/admin/products",
    description: "Hierarchical category organizer with display order and active state controls."
  },
  {
    index: 2,
    title: "Mobile Homepage",
    slug: "mobile-homepage",
    deviceType: "MOBILE",
    width: "780",
    height: "7928",
    htmlFile: "/stitch-export/screens/02_mobile-homepage.html",
    screenshotFile: "/stitch-export/screens/02_mobile-homepage.png",
    category: "Storefront",
    reactRoute: "/",
    description: "Mobile-first botanical storefront with Ramanagara delivery badge & quick actions."
  },
  {
    index: 3,
    title: "Order Confirmation",
    slug: "order-confirmation",
    deviceType: "MOBILE",
    width: "780",
    height: "5498",
    htmlFile: "/stitch-export/screens/03_order-confirmation.html",
    screenshotFile: "/stitch-export/screens/03_order-confirmation.png",
    category: "Checkout & Cart",
    reactRoute: "/order-confirmation/PF-2609-8821",
    description: "Post-purchase receipt with delivery slot timeline and WhatsApp live support."
  },
  {
    index: 4,
    title: "Admin Portal Login",
    slug: "admin-portal-login",
    deviceType: "MOBILE",
    width: "780",
    height: "2202",
    htmlFile: "/stitch-export/screens/04_admin-portal-login.html",
    screenshotFile: "/stitch-export/screens/04_admin-portal-login.png",
    category: "Admin Portal",
    reactRoute: "/admin/login",
    description: "Secure Supabase authentication portal for Padma's Floral business owner."
  },
  {
    index: 5,
    title: "Admin Add Product",
    slug: "admin-add-product",
    deviceType: "MOBILE",
    width: "780",
    height: "6556",
    htmlFile: "/stitch-export/screens/05_admin-add-product.html",
    screenshotFile: "/stitch-export/screens/05_admin-add-product.png",
    category: "Admin Portal",
    reactRoute: "/admin/products",
    description: "Artisanal product creator with variant pricing, flower tags, and city selectors."
  },
  {
    index: 6,
    title: "Admin Orders",
    slug: "admin-orders",
    deviceType: "MOBILE",
    width: "780",
    height: "3522",
    htmlFile: "/stitch-export/screens/06_admin-orders.html",
    screenshotFile: "/stitch-export/screens/06_admin-orders.png",
    category: "Admin Portal",
    reactRoute: "/admin/orders",
    description: "Live order processing queue with status toggles (Pending, Preparing, Delivered)."
  },
  {
    index: 7,
    title: "Product Details",
    slug: "product-details",
    deviceType: "MOBILE",
    width: "780",
    height: "9758",
    htmlFile: "/stitch-export/screens/07_product-details.html",
    screenshotFile: "/stitch-export/screens/07_product-details.png",
    category: "Storefront",
    reactRoute: "/product/royal-jasmine-rose-petal-garland",
    description: "Editorial product page with lead times, variant selection, and card message input."
  },
  {
    index: 8,
    title: "Admin Settings",
    slug: "admin-settings",
    deviceType: "MOBILE",
    width: "780",
    height: "9774",
    htmlFile: "/stitch-export/screens/08_admin-settings.html",
    screenshotFile: "/stitch-export/screens/08_admin-settings.png",
    category: "Admin Portal",
    reactRoute: "/admin/settings",
    description: "Delivery fee configuration (Ramanagara ₹49, BLR ₹149) and WhatsApp numbers."
  },
  {
    index: 9,
    title: "Admin Dashboard",
    slug: "admin-dashboard",
    deviceType: "DESKTOP",
    width: "2560",
    height: "4558",
    htmlFile: "/stitch-export/screens/09_admin-dashboard.html",
    screenshotFile: "/stitch-export/screens/09_admin-dashboard.png",
    category: "Admin Portal",
    reactRoute: "/admin",
    description: "Desktop command center with revenue analytics, order velocity, and alerts."
  },
  {
    index: 10,
    title: "Shopping Cart",
    slug: "shopping-cart",
    deviceType: "MOBILE",
    width: "780",
    height: "3572",
    htmlFile: "/stitch-export/screens/10_shopping-cart.html",
    screenshotFile: "/stitch-export/screens/10_shopping-cart.png",
    category: "Checkout & Cart",
    reactRoute: "/cart",
    description: "Cart drawer with free delivery progress bar, item modifiers, and delivery estimates."
  },
  {
    index: 11,
    title: "Complete Homepage",
    slug: "complete-homepage",
    deviceType: "MOBILE",
    width: "780",
    height: "24608",
    htmlFile: "/stitch-export/screens/11_complete-homepage.html",
    screenshotFile: "/stitch-export/screens/11_complete-homepage.png",
    category: "Storefront",
    reactRoute: "/",
    description: "Full editorial experience featuring artisanal garlands, story, and customer reviews."
  },
  {
    index: 12,
    title: "Admin Products Management",
    slug: "admin-products-management",
    deviceType: "MOBILE",
    width: "780",
    height: "4370",
    htmlFile: "/stitch-export/screens/12_admin-products-management.html",
    screenshotFile: "/stitch-export/screens/12_admin-products-management.png",
    category: "Admin Portal",
    reactRoute: "/admin/products",
    description: "Complete product catalog table with live inventory toggles and search."
  },
  {
    index: 13,
    title: "Mobile Checkout",
    slug: "mobile-checkout",
    deviceType: "MOBILE",
    width: "854",
    height: "7578",
    htmlFile: "/stitch-export/screens/13_mobile-checkout.html",
    screenshotFile: "/stitch-export/screens/13_mobile-checkout.png",
    category: "Checkout & Cart",
    reactRoute: "/checkout",
    description: "Streamlined 1-page checkout with slot pickers, UPI QR, COD, and WhatsApp ordering."
  },
  {
    index: 14,
    title: "Shop Fresh Flowers",
    slug: "shop-fresh-flowers",
    deviceType: "MOBILE",
    width: "780",
    height: "9328",
    htmlFile: "/stitch-export/screens/14_shop-fresh-flowers.html",
    screenshotFile: "/stitch-export/screens/14_shop-fresh-flowers.png",
    category: "Storefront",
    reactRoute: "/catalog",
    description: "Floral collection grid with instant filter tags and responsive card layouts."
  },
  {
    index: 15,
    title: "Catalog & Filters",
    slug: "catalog-filters",
    deviceType: "MOBILE",
    width: "780",
    height: "4698",
    htmlFile: "/stitch-export/screens/15_catalog-filters.html",
    screenshotFile: "/stitch-export/screens/15_catalog-filters.png",
    category: "Storefront",
    reactRoute: "/catalog",
    description: "Faceted drawer with occasion pills, price sliders, and city availability toggles."
  },
  {
    index: 16,
    title: "Admin Inventory Management",
    slug: "admin-inventory-management",
    deviceType: "MOBILE",
    width: "780",
    height: "5538",
    htmlFile: "/stitch-export/screens/16_admin-inventory-management.html",
    screenshotFile: "/stitch-export/screens/16_admin-inventory-management.png",
    category: "Admin Portal",
    reactRoute: "/admin/products",
    description: "Quick daily inventory count sheet with instant in-stock/out-of-stock toggles."
  },
  {
    index: 17,
    title: "Admin Customer Management",
    slug: "admin-customer-management",
    deviceType: "MOBILE",
    width: "780",
    height: "4446",
    htmlFile: "/stitch-export/screens/17_admin-customer-management.html",
    screenshotFile: "/stitch-export/screens/17_admin-customer-management.png",
    category: "Admin Portal",
    reactRoute: "/admin/orders",
    description: "Directory of Ramanagara & Bengaluru patrons with lifetime spend & order counts."
  }
];

export const StitchPrototypesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDevice, setSelectedDevice] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIframeUrl, setActiveIframeUrl] = useState<string | null>(null);
  const previewTriggerRef = React.useRef<HTMLElement | null>(null);

  // Close modal on Escape key and restore focus
  React.useEffect(() => {
    if (!activeIframeUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIframeUrl(null);
        previewTriggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIframeUrl]);

  const filteredScreens = SCREENS.filter(screen => {
    const matchesCat = selectedCategory === 'All' || screen.category === selectedCategory;
    const matchesDev = selectedDevice === 'All' || screen.deviceType === selectedDevice;
    const matchesSearch =
      screen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screen.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDev && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#143D2B] via-[#1E5A3F] to-[#0B2419] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#F3E5AB] border border-[#D4AF37]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>Stitch Project Export: Padma's Floral (2605852677261256314)</span>
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Design Prototypes & Live Supabase Architecture
          </h1>
          
          <p className="text-stone-200 text-sm sm:text-base font-light leading-relaxed">
            All 17 high-fidelity mobile and desktop screens generated in Stitch are fully exported into this repository. Each screen corresponds to a live React route wired to the <span className="font-semibold text-[#F3E5AB]">Supabase PostgreSQL</span> backend with zero-crash fallbacks.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/30 px-3.5 py-1.5 rounded-xl text-xs font-medium text-emerald-200">
              <Database className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Supabase Connected: <code className="text-white font-mono">qklgjmpjucqgufsvuqhl</code></span>
            </div>
            <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-400/30 px-3.5 py-1.5 rounded-xl text-xs font-medium text-amber-200">
              <Palette className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Design System: Botanical Heritage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <label htmlFor="stitch-screen-search" className="sr-only">Search prototype screens</label>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="stitch-screen-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search screens (e.g. checkout, login)..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#143D2B] focus-visible:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto" role="group" aria-label="Filter screens by category">
          {['All', 'Storefront', 'Checkout & Cart', 'Admin Portal'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                selectedCategory === cat
                  ? 'bg-[#143D2B] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
          
          <div className="h-4 w-px bg-stone-300 mx-1 hidden sm:block" />

          {['All', 'MOBILE', 'DESKTOP'].map(dev => (
            <button
              key={dev}
              onClick={() => setSelectedDevice(dev)}
              aria-pressed={selectedDevice === dev}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                selectedDevice === dev
                  ? 'bg-[#D4AF37] text-[#0B2419]'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {dev}
            </button>
          ))}
        </div>
      </div>

      {/* Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScreens.map(screen => (
          <div
            key={screen.slug}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            {/* Screenshot Thumbnail Preview */}
            <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden border-b border-stone-100 group">
              <img
                src={screen.screenshotFile}
                alt={screen.title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <button
                  onClick={(e) => {
                    previewTriggerRef.current = e.currentTarget;
                    setActiveIframeUrl(screen.htmlFile);
                  }}
                  aria-label={`Preview ${screen.title} in-app`}
                  className="bg-white text-stone-900 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Preview In-App</span>
                </button>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-[#143D2B]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  #{screen.index}
                </span>
                <span className="bg-white/90 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {screen.category}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span className="bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                  {screen.deviceType === 'MOBILE' ? (
                    <Smartphone className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
                  ) : (
                    <Monitor className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
                  )}
                  <span>{screen.deviceType}</span>
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {screen.title}
                </h3>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {screen.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <a
                    href={screen.htmlFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                    aria-label={`View Stitch HTML for ${screen.title}`}
                  >
                    <span>Stitch HTML</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                  </a>

                  <Link
                    to={screen.reactRoute}
                    className="flex-1 bg-[#143D2B] hover:bg-[#1E5A3F] text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                    aria-label={`Open live React route for ${screen.title}`}
                  >
                    <span>Live Route</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for In-App Iframe Preview */}
      {activeIframeUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="stitch-preview-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-stone-900 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-700">
            {/* Modal Header */}
            <div className="p-4 bg-stone-800 flex items-center justify-between border-b border-stone-700">
              <div id="stitch-preview-modal-title" className="flex items-center gap-2 text-white text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Interactive Stitch Prototype Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={activeIframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-stone-300 hover:text-white flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:outline-none rounded"
                  aria-label="Open prototype in new browser tab"
                >
                  <span>Open in Tab</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                <button
                  onClick={() => {
                    setActiveIframeUrl(null);
                    previewTriggerRef.current?.focus();
                  }}
                  className="text-stone-300 hover:text-white font-bold text-sm bg-stone-700 hover:bg-stone-600 px-3 py-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  aria-label="Close prototype preview dialog"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Iframe Viewport */}
            <div className="flex-1 bg-stone-950 p-2 sm:p-4 flex justify-center items-center overflow-auto">
              <div className="w-full max-w-[420px] h-full bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-stone-700">
                <iframe
                  src={activeIframeUrl}
                  title="Stitch Screen Prototype"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StitchPrototypesPage;

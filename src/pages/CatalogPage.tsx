import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Sparkles,
  PackageCheck,
  ArrowUpDown,
  Flower2,
  Phone,
  MessageCircle,
  Navigation,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productService } from '../services/productService';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ui/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { useCart } from '../context/CartContext';
import { useDebounce } from '../hooks/useDebounce';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import {
  buildTitle,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  truncateDescription,
  BUSINESS_ADDRESS,
  BUSINESS_HOURS,
  BUSINESS_PHONE,
  GOOGLE_MAPS_DIRECTIONS_URL
} from '../utils/seoConfig';

type SortOption = 'featured' | 'newest' | 'price_asc' | 'price_desc';

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: 5000 },
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
  { label: '₹2,000 & Above', min: 2000, max: 5000 },
];

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity } = useCart();

  // All catalog data loaded once for ultra-fast instant client-side filtering
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local Search Input (immediate for typing responsiveness)
  const [searchInput, setSearchInput] = useState<string>(
    searchParams.get('search') || ''
  );
  // Debounced search term (300ms) used for actual filtering and URL sync
  const debouncedSearch = useDebounce(searchInput, 300);

  // Filter States initialized from URL
  const selectedCategory = searchParams.get('category') || 'all';
  const sortBy = (searchParams.get('sort') as SortOption) || 'featured';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 5000;
  const inStockOnly = searchParams.get('inStock') === 'true';
  const currentPage = Math.max(1, Number(searchParams.get('page') || 1));
  const PRODUCTS_PER_PAGE = 12;

  // Mobile Filter Drawer state & Focus ref
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);

  // Close mobile filter on Escape key & restore focus
  useEffect(() => {
    if (!isMobileFilterOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileFilterOpen(false);
        mobileFilterTriggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFilterOpen]);

  // Dynamic SEO based on active category
  const activeCategory = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find(c => c.slug === selectedCategory) || null;
  }, [selectedCategory, categories]);

  const seoTitle = useMemo(() => {
    if (activeCategory) return buildTitle(`${activeCategory.name} – All Types of Flower Decorations`);
    return buildTitle('All Types of Flower Decorations');
  }, [activeCategory]);

  const seoDescription = useMemo(() => {
    if (activeCategory?.description) {
      return truncateDescription(activeCategory.description);
    }
    return 'All types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7.';
  }, [activeCategory]);

  const seoCanonical = useMemo(() => {
    if (activeCategory) return `/catalog?category=${activeCategory.slug}`;
    return '/catalog';
  }, [activeCategory]);

  usePageMeta({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: seoCanonical,
    keywords: 'flowers, garlands, bouquets, puja, wedding, jasmine, Ramanagara, Bengaluru',
  });

  const breadcrumbSchema = useMemo(() => {
    const items = [
      { name: 'Home', url: canonicalUrl('/') },
      { name: 'Shop', url: canonicalUrl('/catalog') },
    ];
    if (activeCategory) {
      items.push({ name: activeCategory.name, url: canonicalUrl(seoCanonical) });
    }
    return buildBreadcrumbJsonLd(items);
  }, [activeCategory, seoCanonical]);

  // Keep searchInput in sync if URL search param changes externally (e.g. Navbar search navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchInput) {
      setSearchInput(urlSearch);
    }
  }, [searchParams]);

  // Sync debounced search to URL searchParams
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const currentUrlSearch = searchParams.get('search') || '';
    const trimmedDebounced = debouncedSearch.trim();

    if (trimmedDebounced !== currentUrlSearch) {
      const newParams = new URLSearchParams(searchParams);
      if (trimmedDebounced) {
        newParams.set('search', trimmedDebounced);
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearch]);

  // Load raw product catalog and categories
  const loadCatalogData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        productService.getCategories(),
        productService.getProducts(),
      ]);
      setCategories(cats);

      // Attach category name and slug to products for smart multi-field matching
      const catMap = new Map(cats.map(c => [c.id, c]));
      const enriched = prods.map(p => {
        const cat = p.category_id ? catMap.get(p.category_id) : undefined;
        return {
          ...p,
          category_name: p.category_name || cat?.name || '',
          category_slug: (cat?.slug || '').toLowerCase(),
        } as Product & { category_slug?: string };
      });

      setAllProducts(enriched);
    } catch (err: any) {
      console.error('[CatalogPage] Failed to fetch catalog:', err);
      setError(err.message || 'Unable to connect to live flower catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  // Close mobile filter sheet on Escape key
  useEffect(() => {
    if (!isMobileFilterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFilterOpen]);

  // Update URL helper
  const updateFilterParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    // Reset page to 1 whenever any filter other than page changes
    if (!('page' in updates)) {
      newParams.delete('page');
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Filter & Sort Engine: Memoized for instant 60fps mobile response
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Search Query: Matches product name, category, description, and tags
    const cleanSearch = debouncedSearch.trim().toLowerCase();
    if (cleanSearch) {
      const searchTerms = cleanSearch.split(/\s+/).filter(Boolean);
      result = result.filter(p => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category_name || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pTags = (p.tags || []).join(' ').toLowerCase();
        const pOccasions = (p.occasions || []).join(' ').toLowerCase();

        const combinedText = `${pName} ${pCat} ${pDesc} ${pTags} ${pOccasions}`;

        // Require all search terms to be found within the product's combined text
        return searchTerms.every(term => combinedText.includes(term));
      });
    }

    // 2. Category Filter (by slug or id)
    if (selectedCategory !== 'all') {
      result = result.filter(p => {
        const catSlug = (p as any).category_slug;
        const matchedCat = categories.find(c => c.slug === selectedCategory);
        return (
          catSlug === selectedCategory ||
          (matchedCat && p.category_id === matchedCat.id)
        );
      });
    }

    // 3. Price Range Filter (using effective sale_price or price)
    result = result.filter(p => {
      const effectivePrice = p.sale_price ?? p.price;
      return effectivePrice >= minPrice && effectivePrice <= maxPrice;
    });

    // 4. Availability Filter (In Stock Only)
    if (inStockOnly) {
      result = result.filter(p => p.is_available && p.stock_quantity > 0);
    }

    // 5. Sorting
    result.sort((a, b) => {
      const priceA = a.sale_price ?? a.price;
      const priceB = b.sale_price ?? b.price;

      switch (sortBy) {
        case 'price_asc':
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'newest': {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        }
        case 'featured':
        default: {
          // Featured blooms first, then stock availability, then newest
          if (a.is_featured !== b.is_featured) {
            return a.is_featured ? -1 : 1;
          }
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        }
      }
    });

    return result;
  }, [allProducts, categories, debouncedSearch, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (effectivePage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, effectivePage]);

  const handlePageChange = (newPage: number) => {
    updateFilterParams({ page: newPage > 1 ? String(newPage) : null });
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // Active Filter Calculation for Chips
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    if (debouncedSearch.trim()) {
      chips.push({
        id: 'search',
        label: `Search: "${debouncedSearch.trim()}"`,
        onRemove: () => {
          setSearchInput('');
          updateFilterParams({ search: null });
        },
      });
    }

    if (selectedCategory !== 'all') {
      const catObj = categories.find(c => c.slug === selectedCategory);
      chips.push({
        id: 'category',
        label: `Category: ${catObj ? catObj.name : selectedCategory}`,
        onRemove: () => updateFilterParams({ category: null }),
      });
    }

    if (minPrice > 0 || maxPrice < 5000) {
      chips.push({
        id: 'price',
        label: minPrice > 0 && maxPrice < 5000
          ? `Price: ₹${minPrice} - ₹${maxPrice}`
          : minPrice > 0
          ? `Price: Above ₹${minPrice}`
          : `Price: Under ₹${maxPrice}`,
        onRemove: () => updateFilterParams({ minPrice: null, maxPrice: null }),
      });
    }

    if (inStockOnly) {
      chips.push({
        id: 'inStock',
        label: 'In Stock Only',
        onRemove: () => updateFilterParams({ inStock: null }),
      });
    }

    if (sortBy !== 'featured') {
      const sortLabels: Record<SortOption, string> = {
        featured: 'Featured',
        newest: 'Newest Arrivals',
        price_asc: 'Price: Low to High',
        price_desc: 'Price: High to Low',
      };
      chips.push({
        id: 'sort',
        label: `Sort: ${sortLabels[sortBy]}`,
        onRemove: () => updateFilterParams({ sort: null }),
      });
    }

    return chips;
  }, [debouncedSearch, selectedCategory, minPrice, maxPrice, inStockOnly, sortBy, categories]);

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
    setIsMobileFilterOpen(false);
  };

  // Determine current active price preset (if any)
  const activePreset = PRICE_PRESETS.find(
    p => p.min === minPrice && p.max === maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* SEO Structured Data */}
      <StructuredData data={breadcrumbSchema} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#143D2B] via-[#1a4a35] to-[#143D2B] text-white rounded-2xl border border-emerald-900/60 p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#F3E5AB] bg-white/10 px-3 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>All Types of Flower Decorations • Ramanagara & Bengaluru</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold">
              All Types of Flower Decorations
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 font-light max-w-lg leading-relaxed">
              Serving Ramanagara and Bengaluru. Prices depend on the seasons. Open 24/7.
            </p>

            {/* Quick Store Details Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-stone-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{BUSINESS_ADDRESS}</span>
              </div>
              <span className="text-stone-500">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{BUSINESS_HOURS}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-start lg:self-center">
            <a
              href={`tel:${BUSINESS_PHONE.replace(/\s+/g, '')}`}
              className="touch-target-44 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px]"
              aria-label={`Call Florist at ${BUSINESS_PHONE}`}
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Call Now</span>
            </a>

            <a
              href={whatsappService.getGreetingUrl('Namaskara! I am browsing your catalog and would like to inquire about flowers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[44px]"
              aria-label="WhatsApp Florist"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>

            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[44px]"
              aria-label="Get Directions"
            >
              <Navigation className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Search & Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Debounced Search Input */}
          <div className="relative flex-1">
            <label htmlFor="catalog-search-input" className="sr-only">
              Search flowers by name, category, or occasion
            </label>
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="catalog-search-input"
              type="text"
              aria-label="Search flower decorations, wedding stages, garlands..."
              placeholder="Search flower decorations, wedding stages, garlands..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-stone-900 placeholder:text-stone-500 focus:bg-white focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B] transition-colors min-h-[44px]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateFilterParams({ search: null });
                }}
                className="touch-target-44 absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-2"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Controls: Sort Dropdown & Mobile Filter Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end w-full sm:w-auto">
            {/* Mobile Filter Sheet Button */}
            <button
              ref={mobileFilterTriggerRef}
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-expanded={isMobileFilterOpen}
              aria-controls="mobile-filter-drawer"
              aria-label={activeChips.length > 0 ? `Open filters sheet (${activeChips.length} active)` : 'Open filters sheet'}
              className="lg:hidden touch-target-44 flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
              <span>Filters</span>
              {activeChips.length > 0 && (
                <span className="bg-[#143D2B] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeChips.length}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="catalog-sort-select" className="text-stone-600 font-medium hidden sm:inline flex-shrink-0">
                Sort by:
              </label>
              <div className="relative">
                <select
                  id="catalog-sort-select"
                  aria-label="Sort products by"
                  value={sortBy}
                  onChange={e => updateFilterParams({ sort: e.target.value })}
                  className="touch-target-44 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 pr-7 font-semibold text-stone-800 text-xs focus:outline-none focus:border-[#143D2B] focus-visible:ring-2 focus-visible:ring-[#143D2B] cursor-pointer appearance-none min-h-[44px]"
                >
                  <option value="featured">Featured & Bestsellers</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* Active-Filter Chips Row */}
        {activeChips.length > 0 && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-1.5 sm:gap-2 animate-fade-in">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider mr-1">
              Active:
            </span>

            {activeChips.map(chip => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 bg-[#143D2B]/8 text-[#143D2B] border border-[#143D2B]/20 text-xs font-semibold pl-3 pr-1 py-1 rounded-lg transition-all min-h-[36px]"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="touch-target-44 w-7 h-7 hover:bg-[#143D2B]/15 rounded-md flex items-center justify-center text-[#143D2B] transition-colors focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="touch-target-44 text-xs text-[#C84B5B] hover:text-red-700 font-bold hover:underline px-2 py-1 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Catalog Grid & Desktop Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside aria-label="Catalog filters" className="hidden lg:block lg:col-span-3 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6 sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
              <span>Filters</span>
            </h2>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-[#C84B5B] hover:underline font-bold focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Category
            </h3>
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => updateFilterParams({ category: null })}
                className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition-colors flex items-center justify-between focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                  selectedCategory === 'all'
                    ? 'bg-[#143D2B] text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>All Collections</span>
                <span className={`text-[10px] ${selectedCategory === 'all' ? 'text-emerald-200' : 'text-stone-500'}`}>
                  {allProducts.length}
                </span>
              </button>

              {categories.map(cat => {
                const count = allProducts.filter(
                  p => p.category_id === cat.id || (p as any).category_slug === cat.slug
                ).length;
                const isSelected = selectedCategory === cat.slug;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateFilterParams({ category: cat.slug })}
                    className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition-colors flex items-center justify-between focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                      isSelected
                        ? 'bg-[#143D2B] text-white font-bold shadow-xs'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className={`text-[10px] flex-shrink-0 ${isSelected ? 'text-emerald-200' : 'text-stone-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                Price Range
              </h3>
              {(minPrice > 0 || maxPrice < 5000) && (
                <button
                  type="button"
                  onClick={() => updateFilterParams({ minPrice: null, maxPrice: null })}
                  className="text-[10px] text-[#C84B5B] hover:underline focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset, idx) => {
                const isPresetActive = activePreset?.label === preset.label;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      updateFilterParams({
                        minPrice: preset.min > 0 ? String(preset.min) : null,
                        maxPrice: preset.max < 5000 ? String(preset.max) : null,
                      })
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                      isPresetActive
                        ? 'bg-[#143D2B] text-white font-bold'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Min / Max Inputs */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label htmlFor="catalog-min-price" className="text-[10px] text-stone-600 font-semibold block mb-0.5">Min (₹)</label>
                <input
                  id="catalog-min-price"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={minPrice || ''}
                  onChange={e =>
                    updateFilterParams({
                      minPrice: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:bg-white focus:border-[#143D2B] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>
              <div>
                <label htmlFor="catalog-max-price" className="text-[10px] text-stone-600 font-semibold block mb-0.5">Max (₹)</label>
                <input
                  id="catalog-max-price"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="5000"
                  value={maxPrice === 5000 ? '' : maxPrice}
                  onChange={e =>
                    updateFilterParams({
                      maxPrice: e.target.value ? e.target.value : null,
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:bg-white focus:border-[#143D2B] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Availability Filter */}
          <div className="pt-4 border-t border-stone-100">
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-stone-800">In Stock Only</p>
                  <p className="text-[10px] text-stone-600">Exclude sold out blooms</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e =>
                  updateFilterParams({ inStock: e.target.checked ? 'true' : null })
                }
                className="w-4 h-4 text-[#143D2B] rounded border-stone-300 focus:ring-[#143D2B] cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* Mobile Filter Slide-Over Drawer */}
        {isMobileFilterOpen && (
          <div
            id="mobile-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filter-heading"
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end animate-fade-in"
          >
            <div className="w-full max-w-xs bg-white h-full p-5 space-y-5 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
                    <h2 id="mobile-filter-heading" className="font-serif font-bold text-base text-stone-900">Filters</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileFilterOpen(false);
                      mobileFilterTriggerRef.current?.focus();
                    }}
                    className="touch-target-44 p-2 text-stone-500 hover:text-stone-800 focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none rounded-lg"
                    aria-label="Close filters sheet"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-stone-600 uppercase">Category</h3>
                  <div className="space-y-1 text-xs max-h-44 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => updateFilterParams({ category: null })}
                      className={`w-full text-left p-2.5 rounded-lg font-medium min-h-[40px] flex items-center ${
                        selectedCategory === 'all'
                          ? 'bg-[#143D2B] text-white font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      All Collections ({allProducts.length})
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateFilterParams({ category: c.slug })}
                        className={`w-full text-left p-2.5 rounded-lg font-medium min-h-[40px] flex items-center ${
                          selectedCategory === c.slug
                            ? 'bg-[#143D2B] text-white font-bold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2 pt-3 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-600 uppercase">Price Range</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          updateFilterParams({
                            minPrice: preset.min > 0 ? String(preset.min) : null,
                            maxPrice: preset.max < 5000 ? String(preset.max) : null,
                          })
                        }
                        className={`text-[11px] px-3 py-2 rounded-lg font-medium min-h-[36px] flex items-center ${
                          activePreset?.label === preset.label
                            ? 'bg-[#143D2B] text-white font-bold'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="pt-3 border-t border-stone-100">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-stone-50 min-h-[44px]">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-xs font-bold text-stone-800">In Stock Only</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e =>
                        updateFilterParams({ inStock: e.target.checked ? 'true' : null })
                      }
                      className="w-5 h-5 text-[#143D2B] rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 border-t border-stone-200 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="touch-target-44 w-full bg-[#143D2B] text-white py-3 rounded-xl font-bold text-xs shadow-sm min-h-[44px] flex items-center justify-center"
                >
                  Show {filteredProducts.length} Results
                </button>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="touch-target-44 w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl font-semibold text-xs min-h-[44px] flex items-center justify-center"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid Main View (semantic section, not nested main) */}
        <section aria-label="Floral Products Collection" className="lg:col-span-9 space-y-6">
          {/* Results Count & Quick City Status */}
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium px-1" role="status" aria-live="polite">
            <span>
              Showing <strong className="text-stone-900">{filteredProducts.length === 0 ? 0 : (effectivePage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(effectivePage * PRODUCTS_PER_PAGE, filteredProducts.length)}</strong> of{' '}
              {filteredProducts.length} floral arrangements{totalPages > 1 && ` (Page ${effectivePage} of ${totalPages})`}
            </span>
            <span className="text-emerald-700 font-semibold hidden sm:inline">
              ✓ Ready for same-day delivery in {selectedCity}
            </span>
          </div>

          {/* Error, Loading, and Zero Results States */}
          {error ? (
            <ErrorState
              error={error}
              onRetry={loadCatalogData}
              retryLabel="Retry Connection"
              className="my-8"
            />
          ) : loading ? (
            /* Elegant Skeleton Loading Grid */
            <div className="py-2">
              <ProductGridSkeleton count={6} />
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Polished Zero Search/Filter Results State */
            <EmptyState
              icon={Flower2}
              title="No flowers found."
              description={
                searchInput
                  ? `We couldn't find any flower decorations matching "${searchInput}". Try checking your spelling or explore our popular decoration styles below.`
                  : "We couldn't find any floral items matching your current filter combination."
              }
              suggestions={['Flower decorations', 'Wedding decorations', 'Puja flower decorations', 'Stage decorations', 'Garlands']}
              onSelectSuggestion={(s) => {
                setSearchInput(s);
              }}
              primaryAction={{
                label: 'Clear Filters',
                onClick: handleClearAllFilters,
              }}
              secondaryAction={{
                label: 'Custom Request on WhatsApp',
                href: whatsappService.getChatUrl(
                  `Namaskara Padma! I am looking for flowers matching "${searchInput || selectedCategory}", can you customize an arrangement for me?`
                ),
              }}
              className="my-6"
            />
          ) : (
            /* Products Grid with Pagination */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
                {paginatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Accessible Pagination Navigation */}
              {totalPages > 1 && (
                <nav
                  aria-label="Floral catalog pages"
                  className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="text-xs text-stone-600 font-medium">
                    Page <strong className="text-stone-900">{effectivePage}</strong> of{' '}
                    <strong className="text-stone-900">{totalPages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(effectivePage - 1)}
                      disabled={effectivePage <= 1}
                      className="touch-target-44 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none min-h-[44px]"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        const isCurrent = pageNum === effectivePage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            className={`touch-target-44 w-11 h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                              isCurrent
                                ? 'bg-[#143D2B] text-white shadow-xs'
                                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(effectivePage + 1)}
                      disabled={effectivePage >= totalPages}
                      className="touch-target-44 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none min-h-[44px]"
                      aria-label="Go to next page"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* Local Store & Custom Inquiries Strip */}
      <div className="bg-stone-100 rounded-3xl p-6 sm:p-8 border border-stone-200/90 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C84B5B]">
            <MapPin className="w-3.5 h-3.5" />
            <span>Local Florist Workshop • Ramanagara & Bengaluru Delivery</span>
          </div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
            Looking for something custom or express delivery?
          </h3>
          <p className="text-xs text-stone-600 max-w-xl font-light">
            We craft customized temple garlands, wedding varmalas, and birthday bouquets daily at our Ramanagara workshop ({BUSINESS_HOURS}).
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto justify-center">
          <a
            href={`tel:${BUSINESS_PHONE.replace(/\s+/g, '')}`}
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-5 py-3 rounded-xl text-xs font-bold shadow-xs transition-all min-h-[44px]"
            aria-label={`Call Florist Padma at ${BUSINESS_PHONE}`}
          >
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Call Now: {BUSINESS_PHONE}</span>
          </a>

          <a
            href={whatsappService.getGreetingUrl('Namaskara! I would like to inquire about flowers and delivery.')}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl text-xs font-bold shadow-xs transition-all min-h-[44px]"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Us</span>
          </a>

          <a
            href={GOOGLE_MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 px-5 py-3 rounded-xl text-xs font-bold shadow-xs transition-all min-h-[44px]"
            aria-label="Get Directions to workshop"
          >
            <Navigation className="w-3.5 h-3.5 text-[#EA4335]" />
            <span>Get Directions</span>
          </a>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  MessageCircle,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { productService } from '../services/productService';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ui/ProductCard';
import * as whatsappService from '../services/whatsappService';
import { usePageMeta } from '../hooks/usePageMeta';
import { StructuredData } from '../components/seo/StructuredData';
import {
  buildTitle,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  truncateDescription,
  DEFAULT_OG_IMAGE,
} from '../utils/seoConfig';
import {
  getOptimizedImageUrl,
  getResponsiveImageSrcSet,
  DETAIL_MAIN_IMAGE_SIZES,
} from '../utils/imageUtils';
import { OpeningHoursModal } from '../components/ui/OpeningHoursModal';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, selectedCity, setSelectedCity, operatingStatus } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [cardMessage, setCardMessage] = useState('');
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [deliverySlot, setDeliverySlot] = useState('Morning (8:00 AM - 12:00 PM)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  // Dynamic SEO Meta Tags — update when product loads
  const seoTitle = useMemo(() => {
    if (!product) return buildTitle('Loading Product...');
    return buildTitle(`${product.name} – Fresh Flowers`);
  }, [product]);

  const seoDescription = useMemo(() => {
    if (!product) return 'View floral arrangement details at Padma\'s Floral.';
    return truncateDescription(
      product.description || `${product.name} — fresh, handcrafted floral arrangement. Order online for delivery in Ramanagara & Bengaluru.`
    );
  }, [product]);

  const seoImage = useMemo(() => {
    return product?.image_url || product?.images?.[0] || DEFAULT_OG_IMAGE;
  }, [product]);

  const seoCanonical = useMemo(() => {
    return slug ? `/product/${slug}` : '/catalog';
  }, [slug]);

  usePageMeta({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: seoCanonical,
    ogImage: seoImage,
    ogType: 'product',
  });

  // Product JSON-LD Schema
  const productSchema = useMemo(() => {
    if (!product) return null;
    return buildProductJsonLd({
      name: product.name,
      description: product.description || product.name,
      image: seoImage,
      price: product.price,
      salePrice: product.sale_price,
      availability: product.is_available,
      url: canonicalUrl(seoCanonical),
      sku: product.id,
      category: product.category_name,
    });
  }, [product, seoImage, seoCanonical]);

  // BreadcrumbList Schema
  const breadcrumbSchema = useMemo(() => {
    const items = [
      { name: 'Home', url: canonicalUrl('/') },
      { name: 'Shop', url: canonicalUrl('/catalog') },
    ];
    if (product?.category_name) {
      items.push({ name: product.category_name, url: canonicalUrl('/catalog') });
    }
    if (product) {
      items.push({ name: product.name, url: canonicalUrl(seoCanonical) });
    }
    return buildBreadcrumbJsonLd(items);
  }, [product, seoCanonical]);

  const loadProduct = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const found = await productService.getProductBySlug(slug);
      if (found) {
        setProduct(found);
        setSelectedImage(found.images[0] || '');
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0]);
        } else {
          setSelectedVariant(undefined);
        }

        // Fetch related products with small query limit
        const related = await productService.getProducts({
          limit: 6,
          categoryId: found.category_id || undefined,
        });
        setRelatedProducts(related.filter(p => p.id !== found.id).slice(0, 4));
      } else {
        setProduct(null);
      }
    } catch (err: any) {
      console.error('[ProductDetailPage] Failed to load product from Supabase:', err);
      setError(err.message || 'Unable to retrieve floral arrangement details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          error={error}
          onRetry={loadProduct}
          retryLabel="Retry Connection"
          secondaryAction={{
            label: 'Return to Catalog',
            to: '/catalog',
          }}
          variant="fullPage"
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-fade-in">
        <EmptyState
          title="Flower Arrangement Not Found"
          description="The floral bouquet or garland you are looking for might have sold out or moved."
          primaryAction={{
            label: 'Browse Catalog',
            to: '/catalog',
          }}
          secondaryAction={{
            label: 'Inquire on WhatsApp',
            href: whatsappService.getGreetingUrl('Hello Padma, I am looking for a specific flower arrangement.'),
          }}
        />
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ?? product.sale_price ?? product.price;
  const originalPrice = selectedVariant ? null : product.sale_price ? product.price : null;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant, cardMessage);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3500);
  };

  const handleWhatsAppOrder = () => {
    const productUrl = window.location.href;
    const url = whatsappService.getDetailedProductOrderUrl({
      productName: product.name,
      variantName: selectedVariant?.name,
      quantity,
      totalPrice: currentPrice * quantity,
      city: selectedCity,
      deliveryDate,
      deliverySlot,
      cardMessage: cardMessage || undefined,
      productUrl,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 pb-28 md:pb-12">
      {/* SEO Structured Data */}
      {productSchema && <StructuredData data={productSchema} />}
      <StructuredData data={breadcrumbSchema} />

      {/* Toast Alert with Screen-Reader Live Region */}
      {addedToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 right-4 z-50 bg-[#143D2B] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
          <div>
            <p className="font-bold text-xs">Added to your Floral Basket!</p>
            <p className="text-[11px] text-stone-200">Tap Cart to view order & delivery details.</p>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-600 font-medium">
        <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
        <Link to="/catalog" className="hover:text-stone-900 transition-colors">Catalog</Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
        <span aria-current="page" className="text-stone-900 font-bold truncate">{product.name}</span>
      </nav>

      {/* Product Main Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md relative">
            <img
              src={getOptimizedImageUrl(selectedImage || product.images[0], 700)}
              srcSet={getResponsiveImageSrcSet(selectedImage || product.images[0], [360, 540, 720, 900])}
              sizes={DETAIL_MAIN_IMAGE_SIZES}
              alt={`Featured view of ${product.name}`}
              width="600"
              height="600"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
            {product.is_featured && (
              <span className="absolute top-4 left-4 bg-[#143D2B] text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Boutique Specialty
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2" role="group" aria-label="Product image gallery thumbnails">
              {product.images.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Switch to image view ${idx + 1} of ${product.name}`}
                  aria-pressed={selectedImage === img}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-[#143D2B] ring-2 ring-[#143D2B]/20 scale-105'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img, 120, 70)}
                    alt={`Thumbnail view ${idx + 1} of ${product.name}`}
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Buy Box & Customization */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider block">
              {product.category_name || "Padma's Boutique Floral"}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {product.name}
            </h1>

            {/* Availability Status Badge - Text labels in addition to color (WCAG 1.4.1) */}
            <div className="pt-1">
              {product.is_available && (product.stock_quantity === undefined || product.stock_quantity > 0) ? (
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>
                    {product.stock_quantity && product.stock_quantity <= 5
                      ? `Availability: Low Stock (${product.stock_quantity} remaining)`
                      : 'Availability: In Stock • Open 24/7'}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-stone-900 border border-stone-700 text-stone-100 text-xs font-semibold px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                  <span>Availability: Currently Unavailable</span>
                </div>
              )}
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-2">
              {currentPrice > 0 ? (
                <>
                  <span className="font-serif text-3xl font-bold text-[#143D2B]">
                    ₹{currentPrice}
                  </span>
                  {originalPrice && (
                    <span className="text-base text-stone-400 line-through">
                      ₹{originalPrice}
                    </span>
                  )}
                  <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                    Inclusive of all taxes
                  </span>
                </>
              ) : (
                <div className="space-y-0.5">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B]">
                    Seasonal Pricing
                  </span>
                  <p className="text-xs text-stone-600 font-medium">
                    Prices depend on the seasons • Open 24/7 for inquiries
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* City Delivery Checker */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
              <label htmlFor="pdp-delivery-city" className="flex items-center gap-1.5 cursor-pointer">
                <MapPin className="w-4 h-4 text-[#C84B5B]" aria-hidden="true" />
                <span>Delivery City:</span>
              </label>
              <select
                id="pdp-delivery-city"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value as any)}
                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#143D2B]"
                aria-label="Delivery City"
              >
                <option value="Ramanagara">Ramanagara (Local Delivery)</option>
                <option value="Bengaluru">Bengaluru (Express Delivery)</option>
              </select>
            </div>
            <p className="text-[11px] text-stone-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
              <span>
                Delivery available across Ramanagara and Bengaluru • Open 24/7
              </span>
            </p>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Select Arrangement Size / Length:
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
                {product.variants.map((v, i) => (
                  <button
                    type="button"
                    key={i}
                    role="radio"
                    aria-checked={selectedVariant?.name === v.name}
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedVariant?.name === v.name
                        ? 'border-[#143D2B] bg-[#143D2B]/5 text-[#143D2B] ring-1 ring-[#143D2B]'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{v.name}</span>
                      <span>₹{v.price}</span>
                    </div>
                    {v.description && (
                      <p className="text-[10px] text-stone-600 mt-0.5">{v.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Delivery Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pdp-delivery-date" className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                <span>Delivery Date</span>
              </label>
              <input
                id="pdp-delivery-date"
                type="date"
                value={deliveryDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="pdp-delivery-slot" className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                <span>Preferred Slot</span>
              </label>
              <select
                id="pdp-delivery-slot"
                value={deliverySlot}
                onChange={e => setDeliverySlot(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
              >
                <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>

          {/* Complimentary Card Message */}
          <div>
            <label htmlFor="pdp-card-message" className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
              Complimentary Florist Note / Message Card (Optional)
            </label>
            <textarea
              id="pdp-card-message"
              rows={2}
              maxLength={200}
              placeholder="e.g. Happy 25th Anniversary Amma & Appa! With lots of love..."
              value={cardMessage}
              onChange={e => setCardMessage(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
            />
            <span className="text-[10px] text-stone-500 text-right block">
              {cardMessage.length}/200 characters
            </span>
          </div>

          {/* Closed Explanation Banner if Store is Closed */}
          {!operatingStatus.isOpen && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm text-amber-950">
                    {operatingStatus.explanation}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {operatingStatus.todayHoursDisplay ? `Today's Hours: ${operatingStatus.todayHoursDisplay} (${operatingStatus.timezone}). ` : ''}
                    {operatingStatus.nextOpenDisplay}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/70 text-xs">
                <span className="text-[11px] text-amber-800 font-medium">
                  You are welcome to browse all flower collections and details anytime.
                </span>
                <button
                  type="button"
                  onClick={() => setIsHoursModalOpen(true)}
                  className="font-bold text-[#143D2B] hover:text-[#1e5a3f] underline text-xs ml-2 cursor-pointer flex-shrink-0"
                >
                  Check Opening Hours
                </button>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Quantity Counter with 44px tap targets */}
              <div className="flex items-center justify-between sm:justify-center border border-stone-300 rounded-2xl bg-white px-3 py-1 sm:py-0">
                <span className="text-xs text-stone-600 font-medium sm:hidden">Quantity:</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="touch-target-44 w-11 h-11 text-base font-bold text-stone-600 hover:text-stone-900"
                    aria-label={`Decrease quantity of ${product.name}`}
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold text-stone-800 font-mono" aria-live="polite" aria-atomic="true">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="touch-target-44 w-11 h-11 text-base font-bold text-stone-600 hover:text-stone-900"
                    aria-label={`Increase quantity of ${product.name}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add To Cart / Order Now Button */}
              {!product.is_available || (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="touch-target-44 flex-1 bg-stone-200 text-stone-600 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                  aria-label={`${product.name} is currently unavailable`}
                >
                  <AlertCircle className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                  <span>Currently unavailable</span>
                </button>
              ) : !operatingStatus.isOpen ? (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  onClick={() => setIsHoursModalOpen(true)}
                  className="touch-target-44 flex-1 bg-stone-100 border border-stone-300 text-stone-500 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                  aria-label={`${product.name} cannot be ordered right now. We're currently closed. Please check our opening hours.`}
                >
                  <Clock className="w-5 h-5 text-stone-400 flex-shrink-0" aria-hidden="true" />
                  <span>Currently Closed</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="touch-target-44 flex-1 bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px]"
                  aria-label={`Order ${product.name} now for ₹${currentPrice * quantity}`}
                >
                  <ShoppingBag className="w-5 h-5 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
                  <span>Order Now (₹{currentPrice * quantity})</span>
                </button>
              )}
            </div>

            {/* Direct WhatsApp Ordering */}
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              className="touch-target-44 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px]"
              aria-label={`Order ${product.name} directly on WhatsApp`}
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Order on WhatsApp ({whatsappService.getDisplayPhone()})</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-200 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#143D2B] flex-shrink-0" />
              <span>100% Farm Fresh</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <span>Hand-Tied by Padma</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar for Quick Ordering */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2.5 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] text-stone-600 uppercase font-semibold">Total Price</p>
          <p className="font-serif font-bold text-base text-[#143D2B]">₹{currentPrice * quantity}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleWhatsAppOrder}
            className="touch-target-44 w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
            aria-label={`Order ${product.name} on WhatsApp`}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
          </button>
          {!product.is_available || (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? (
            <button
              disabled
              aria-disabled="true"
              className="touch-target-44 px-5 h-11 rounded-xl bg-stone-200 text-stone-600 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed"
              aria-label={`${product.name} is currently out of stock`}
            >
              <AlertCircle className="w-4 h-4 text-stone-500" aria-hidden="true" />
              <span>Sold Out</span>
            </button>
          ) : !operatingStatus.isOpen ? (
            <button
              disabled
              aria-disabled="true"
              onClick={() => setIsHoursModalOpen(true)}
              className="touch-target-44 px-4 h-11 rounded-xl bg-stone-100 border border-stone-300 text-stone-500 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed"
              aria-label="We're currently closed. Please check our opening hours."
            >
              <Clock className="w-4 h-4 text-stone-400" aria-hidden="true" />
              <span>Currently Closed</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="touch-target-44 px-5 h-11 rounded-xl bg-[#143D2B] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
              aria-label={`Order ${product.name} now`}
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
              <span>Order Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Description & Flower Care Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Arrangement Details & Heritage
          </h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <h4 className="font-serif text-base font-bold text-stone-900 mb-2">
            Care Instructions for Longevity
          </h4>
          <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
            <li>For Traditional Garlands (Jasmine & Marigold): Spray lightly with cool water and keep refrigerated in a closed box until the puja ceremony.</li>
            <li>For Cut Flower Bouquets: Trim stems diagonally at a 45-degree angle before placing in fresh clean water.</li>
            <li>Keep away from direct heat, sunlight, and air conditioning drafts to prolong bloom freshness.</li>
          </ul>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
                Complementary Selections
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#143D2B]">
                You May Also Like
              </h2>
            </div>
            <Link to="/catalog" className="text-xs font-semibold text-[#143D2B] hover:underline">
              View All Flowers
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

      {/* Operating Hours & Schedule Modal */}
      <OpeningHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        status={operatingStatus}
      />
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import * as whatsappService from '../../services/whatsappService';
import {
  getOptimizedImageUrl,
  getResponsiveImageSrcSet,
  PRODUCT_CARD_SIZES,
} from '../../utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const { addToCart, operatingStatus } = useCart();

  const isInStock = product.is_available && (product.stock_quantity === undefined || product.stock_quantity > 0);
  const isLowStock = isInStock && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) return;
    addToCart(product, 1, product.variants ? product.variants[0] : undefined);
  };

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const price = product.sale_price ?? product.price;
    const url = whatsappService.getProductInquiryUrl(product.name, productUrl, price);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentPrice = product.sale_price ?? product.price;
  const originalPrice = product.sale_price ? product.price : (currentPrice > 0 ? Math.round(currentPrice * 1.2) : null);
  const discountPercent = originalPrice && currentPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const primaryImage = product.images[0] || product.image_url;

  return (
    <article className="group relative bg-white rounded-2xl border border-stone-200 hover:border-emerald-800/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-stone-50">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full"
          aria-label={`View details for ${product.name}`}
        >
          <img
            src={getOptimizedImageUrl(primaryImage, 500)}
            srcSet={getResponsiveImageSrcSet(primaryImage, [300, 500, 700])}
            sizes={PRODUCT_CARD_SIZES}
            alt={`Handcrafted ${product.name}`}
            width="500"
            height="500"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* FNP-Style Clean Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isInStock ? (
            <span className="bg-white/95 backdrop-blur-sm text-[#143D2B] border border-emerald-900/15 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
              <Zap className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" aria-hidden="true" />
              <span>{isLowStock ? `Only ${product.stock_quantity} Left` : '⚡ 2-Hr Express'}</span>
            </span>
          ) : (
            <span className="bg-stone-900/90 text-stone-100 text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
              <AlertCircle className="w-3 h-3 text-red-400" aria-hidden="true" />
              <span>Unavailable</span>
            </span>
          )}

          {discountPercent > 0 && currentPrice > 0 && (
            <span className="bg-[#C84B5B] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs self-start">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Clean WhatsApp Quick Action Button on Top Right */}
        <button
          type="button"
          onClick={handleWhatsAppOrder}
          title={`Inquire about ${product.name} on WhatsApp`}
          className="touch-target-44 absolute top-2.5 right-2.5 w-9 h-9 rounded-xl bg-white/95 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-stone-200 hover:border-[#25D366] flex items-center justify-center shadow-xs transition-all duration-200 z-10"
          aria-label={`Inquire about ${product.name} on WhatsApp`}
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Bottom Tag: Freshness Guarantee */}
        <div className="absolute bottom-2 left-2 bg-stone-900/75 backdrop-blur-xs text-stone-200 text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
          <span>100% Fresh Daily</span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Eyebrow */}
          {product.category_name && (
            <p className="text-[10px] sm:text-[11px] font-bold text-[#143D2B] uppercase tracking-wider mb-1">
              {product.category_name}
            </p>
          )}

          {/* Product Name */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 line-clamp-1 group-hover:text-[#143D2B] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Description line */}
          <p className="text-xs text-stone-500 mt-1 line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-stone-100 space-y-2.5">
          {/* Price Block & Earliest Delivery Indicator */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {currentPrice > 0 ? (
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-stone-900 font-sans">₹{currentPrice}</span>
                  {originalPrice && (
                    <span className="text-xs text-stone-400 line-through">₹{originalPrice}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-bold text-[#143D2B] block">
                  Seasonal Pricing
                </span>
              )}
            </div>

            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>Today in Ramanagara & BLR</span>
            </span>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-2">
            {!isInStock ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full flex items-center justify-center gap-1 bg-stone-100 text-stone-500 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-not-allowed"
                aria-label={`${product.name} is currently unavailable`}
              >
                <span>Currently unavailable</span>
              </button>
            ) : !operatingStatus.isOpen ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="We're currently closed. Please check our opening hours."
                className="w-full flex items-center justify-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-500 py-2.5 px-3 rounded-xl text-xs font-semibold cursor-not-allowed"
                aria-label={`${product.name} cannot be ordered right now. We're currently closed.`}
              >
                <Clock className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                <span>Currently Closed</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#143D2B] hover:bg-[#1a4e37] text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all"
                  aria-label={`Order ${product.name} now`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                  <span>Order Now</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-[#143D2B] border border-emerald-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
                  aria-label={`Inquire about ${product.name} on WhatsApp`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" aria-hidden="true" />
                  <span>Inquire</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';



import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const originalPrice = product.sale_price ? product.price : null;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const primaryImage = product.images[0] || product.image_url;

  return (
    <article className="group relative bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-300 flex flex-col justify-between">
      {/* Product Image Container */}
      <div className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-stone-100">
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full"
          aria-label={`View details for ${product.name}`}
        >
          <img
            src={getOptimizedImageUrl(primaryImage, 400)}
            srcSet={getResponsiveImageSrcSet(primaryImage, [280, 400, 600])}
            sizes={PRODUCT_CARD_SIZES}
            alt={`Handcrafted ${product.name}`}
            width="400"
            height="400"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isInStock ? (
            <span className="bg-[#143D2B]/90 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
              <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
              <span>{isLowStock ? `Low Stock (${product.stock_quantity})` : 'In Stock'}</span>
            </span>
          ) : (
            <span className="bg-stone-900/90 text-stone-100 border border-stone-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
              <AlertCircle className="w-3 h-3 text-red-400" aria-hidden="true" />
              <span>Currently unavailable</span>
            </span>
          )}

          {product.is_featured && (
            <span className="bg-stone-900/85 text-[#F3E5AB] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" /> Featured
            </span>
          )}

          {discountPercent > 0 && (
            <span className="bg-[#C84B5B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Delivery area info badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-stone-200 text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
          <Clock className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
          <span>Open 24/7</span>
        </div>

        {/* WhatsApp Fast Inquiry Button */}
        <button
          type="button"
          onClick={handleWhatsAppOrder}
          title={`Inquire about ${product.name} on WhatsApp`}
          className="touch-target-44 absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all z-10"
          aria-label={`Inquire about ${product.name} on WhatsApp`}
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Eyebrow */}
          {product.category_name && (
            <p className="text-[10px] sm:text-[11px] font-bold text-[#C84B5B] uppercase tracking-wider mb-1">
              {product.category_name}
            </p>
          )}

          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 line-clamp-2 group-hover:text-[#143D2B] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3.5 mt-3.5 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {currentPrice > 0 ? (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-[#143D2B]">₹{currentPrice}</span>
                  {originalPrice && (
                    <span className="text-xs text-stone-400 line-through">₹{originalPrice}</span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 font-medium truncate">
                  Ramanagara & BLR
                </p>
              </>
            ) : (
              <>
                <span className="text-xs sm:text-sm font-bold text-[#143D2B] block">
                  Seasonal Pricing
                </span>
                <p className="text-[10px] text-stone-500 font-medium truncate">
                  Depends on seasons
                </p>
              </>
            )}
          </div>

          {!isInStock ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="touch-target-44 flex items-center gap-1 bg-stone-100 text-stone-500 px-3 py-2 rounded-xl text-xs font-semibold cursor-not-allowed flex-shrink-0"
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
              className="touch-target-44 flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-500 px-3 py-2 rounded-xl text-xs font-semibold cursor-not-allowed flex-shrink-0"
              aria-label={`${product.name} cannot be ordered right now. We're currently closed. Please check our opening hours.`}
            >
              <Clock className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
              <span>Currently Closed</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="touch-target-44 flex items-center gap-1.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex-shrink-0"
              aria-label={`Order ${product.name} now`}
            >
              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Order Now</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';


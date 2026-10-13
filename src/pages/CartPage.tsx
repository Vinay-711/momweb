import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
  MapPin,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { INITIAL_BUSINESS_SETTINGS } from '../data/seedData';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildTitle } from '../utils/seoConfig';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export const CartPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Your Cart'),
    description: 'Review your selected floral arrangements before checkout.',
    robots: 'noindex, nofollow',
  });

  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    totalAmount,
    selectedCity,
    setSelectedCity,
  } = useCart();

  const navigate = useNavigate();

  const freeDeliveryThreshold = INITIAL_BUSINESS_SETTINGS.free_delivery_threshold;
  const differenceToFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleWhatsAppOrder = () => {
    const url = orderService.generateWhatsAppOrderUrl(
      {
        delivery_city: selectedCity,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
      },
      cart
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto text-[#143D2B]">
          <ShoppingBag className="w-10 h-10 text-stone-500" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Your flower basket is waiting.</h1>
        <p className="text-stone-600 max-w-md mx-auto text-sm leading-relaxed">
          Discover all types of flower decorations for weddings, pujas, functions, and celebrations across Ramanagara and Bengaluru.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 bg-[#143D2B] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-sm hover:bg-[#1e5a3f] transition-colors"
        >
          <span>Browse Fresh Flowers</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Your Floral Basket
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Carefully packaged and prepared fresh on your delivery day
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-red-700 hover:text-red-800 hover:underline font-semibold"
          aria-label="Clear all items from floral basket"
        >
          Clear Basket
        </button>
      </div>

      {/* Free Delivery Bar */}
      <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          {differenceToFree > 0 ? (
            <span className="text-stone-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Add ₹{differenceToFree} more for <strong className="text-[#143D2B]">FREE Delivery</strong> to {selectedCity}!
            </span>
          ) : (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Congratulations! You unlocked FREE Delivery to {selectedCity}!
            </span>
          )}
          <span className="text-stone-600">{progressPercent}%</span>
        </div>
        <div
          className="w-full bg-stone-200 h-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Free delivery progress to ${selectedCity}`}
        >
          <div
            className="bg-[#143D2B] h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map(item => {
            const unitPrice =
              item.selected_variant?.price ?? item.product.sale_price ?? item.product.price;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={getOptimizedImageUrl(item.product.images[0] || item.product.image_url, 120, 70)}
                    alt={item.product.name}
                    width="80"
                    height="80"
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-stone-900">
                        {item.product.name}
                      </h3>
                      {(!item.product.is_available || (item.product.stock_quantity !== undefined && item.product.stock_quantity <= 0)) && (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          Currently unavailable
                        </span>
                      )}
                    </div>
                    {item.selected_variant && (
                      <p className="text-xs text-stone-600 mt-0.5">
                        Size/Variant: <span className="font-semibold text-stone-700">{item.selected_variant.name}</span>
                      </p>
                    )}
                    {item.custom_message && (
                      <p className="text-[11px] text-stone-600 italic mt-1 line-clamp-1">
                        Note: "{item.custom_message}"
                      </p>
                    )}
                    <p className="text-sm font-bold text-[#143D2B] mt-1 sm:hidden">
                      {unitPrice > 0 ? `₹${unitPrice}` : 'Seasonal Pricing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <span className="hidden sm:block text-sm font-bold text-stone-600">
                    {unitPrice > 0 ? `₹${unitPrice}` : 'Seasonal Pricing'}
                  </span>

                  {/* Quantity Stepper with 44px tap targets */}
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50" role="group" aria-label={`Quantity controls for ${item.product.name}`}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="touch-target-44 px-3 py-1.5 text-stone-700 hover:bg-stone-200 rounded-l-xl transition-colors"
                      aria-label={`Decrease quantity of ${item.product.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-stone-800 font-mono" aria-live="polite" aria-atomic="true">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="touch-target-44 px-3 py-1.5 text-stone-700 hover:bg-stone-200 rounded-r-xl transition-colors"
                      aria-label={`Increase quantity of ${item.product.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-base font-bold text-[#143D2B] min-w-[60px] sm:min-w-[70px] text-right">
                    {unitPrice > 0 ? `₹${unitPrice * item.quantity}` : 'Seasonal Pricing'}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="touch-target-44 p-2 text-stone-500 hover:text-red-700 transition-colors"
                    aria-label={`Remove ${item.product.name} from basket`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              to="/catalog"
              className="touch-target-44 inline-flex items-center gap-1.5 text-xs font-semibold text-[#143D2B] hover:underline min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Add More Flowers</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Box - Sticky only on lg */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-6 lg:sticky lg:top-28">
          <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100">
            Order Summary
          </h2>

          {/* Delivery City Selector */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <label htmlFor="cart-page-city-select" className="flex items-center gap-1 cursor-pointer">
                <MapPin className="w-3.5 h-3.5 text-[#C84B5B]" aria-hidden="true" /> Destination:
              </label>
              <select
                id="cart-page-city-select"
                aria-label="Delivery Destination City"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value as any)}
                className="bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#143D2B] min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
              >
                <option value="Ramanagara">Ramanagara</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>
            <p className="text-[11px] text-stone-600">
              {selectedCity === 'Ramanagara'
                ? 'Local delivery rate: ₹49 (Free over ₹1499)'
                : 'Bengaluru metro rate: ₹149 (Free over ₹1499)'}
            </p>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-stone-700">
              <span>Items Subtotal</span>
              <span className="font-semibold text-stone-900">
                {subtotal > 0 ? `₹${subtotal}` : 'Seasonal Pricing'}
              </span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Delivery Fee ({selectedCity})</span>
              <span>{deliveryFee === 0 ? <strong className="text-emerald-700 font-bold">FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
              <span>Estimated Total</span>
              <span className="text-lg sm:text-xl text-[#143D2B]">
                {totalAmount > 0 ? `₹${totalAmount}` : 'Seasonal Pricing'}
              </span>
            </div>
          </div>

          {subtotal === 0 && (
            <p className="text-[11px] text-stone-600 bg-stone-50 border border-stone-200 p-3 rounded-xl leading-relaxed">
              Flower decoration prices depend on the seasons and event setup requirements. Your inquiry will be confirmed directly by Padma's Floral.
            </p>
          )}

          {/* Checkout Triggers */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/checkout')}
              className="touch-target-44 w-full bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="touch-target-44 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span>Direct WhatsApp Order</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-stone-600">
            Orders are confirmed directly by Padma's Floral via SMS & WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};

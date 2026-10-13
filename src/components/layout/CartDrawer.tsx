import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, MessageCircle, ArrowRight, MapPin, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import * as whatsappService from '../../services/whatsappService';
import { getOptimizedImageUrl } from '../../utils/imageUtils';
import { OpeningHoursModal } from '../ui/OpeningHoursModal';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryFee,
    totalAmount,
    selectedCity,
    setSelectedCity,
    operatingStatus,
  } = useCart();

  const [isHoursModalOpen, setIsHoursModalOpen] = React.useState(false);

  const navigate = useNavigate();
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  // Focus management, focus restoration & Escape key handling
  React.useEffect(() => {
    if (!isCartOpen) return;

    // Save previously focused element to return focus when drawer closes
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Focus close button on open
    const timeout = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        return;
      }

      // Basic focus trap within drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
      const target =
        previousActiveElementRef.current ||
        document.getElementById('navbar-cart-trigger') ||
        document.getElementById('mobile-nav-cart-trigger');
      setTimeout(() => {
        target?.focus();
      }, 0);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleWhatsAppCheckout = () => {
    const url = whatsappService.getOrderChatUrl(
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-heading"
          className="w-screen max-w-md bg-stone-50 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#143D2B] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
              <h2 id="cart-drawer-heading" className="font-serif text-lg sm:text-xl font-bold tracking-wide">
                Your Floral Basket
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={() => setIsCartOpen(false)}
              className="touch-target-44 p-2 rounded-full text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close floral basket drawer"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Delivery Location Quick Switcher */}
          <div className="bg-[#1e5a3f] px-3 sm:px-4 py-2 text-xs text-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
              <label htmlFor="cart-drawer-city-select" className="truncate font-medium text-stone-200">
                Deliver to:
              </label>
              <select
                id="cart-drawer-city-select"
                aria-label="Select delivery destination city"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value as any)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37] min-h-[36px]"
              >
                <option value="Ramanagara" className="text-stone-900">Ramanagara (₹49)</option>
                <option value="Bengaluru" className="text-stone-900">Bengaluru (₹149)</option>
              </select>
            </div>
            {subtotal >= 1499 && (
              <span className="text-[#F3E5AB] font-semibold flex items-center gap-1 flex-shrink-0 text-[11px]">
                <Sparkles className="w-3 h-3" aria-hidden="true" /> Free Delivery!
              </span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4 px-4 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[#143D2B]" aria-hidden="true">
                  <ShoppingBag className="w-8 h-8 text-stone-500" />
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Your flower basket is waiting.</h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Explore all types of flower decorations. Delivery in Ramanagara and Bengaluru. Prices depend on the seasons.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/catalog');
                  }}
                  aria-label="Explore flowers in catalog"
                  className="mt-2 inline-flex items-center gap-2 bg-[#143D2B] text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-xs hover:bg-[#1e5a3f] transition-colors min-h-[44px]"
                >
                  <span>Explore Flowers</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              cart.map(item => {
                const unitPrice =
                  item.selected_variant?.price ?? item.product.sale_price ?? item.product.price;
                const isItemUnavailable = !item.product.is_available || (item.product.stock_quantity !== undefined && item.product.stock_quantity <= 0);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs"
                  >
                    <img
                      src={getOptimizedImageUrl(item.product.images[0] || item.product.image_url, 120, 70)}
                      alt={item.product.name}
                      width="80"
                      height="80"
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="touch-target-44 p-2 -mr-1.5 -mt-1 text-stone-400 hover:text-red-600 transition-colors"
                            aria-label={`Remove ${item.product.name} from basket`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                        {item.selected_variant && (
                          <p className="text-[10px] text-stone-600 font-medium truncate">
                            {item.selected_variant.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-bold text-[#143D2B]">
                            {unitPrice > 0 ? `₹${unitPrice}` : 'Seasonal Pricing'}
                          </p>
                          {isItemUnavailable && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                              Currently unavailable
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        {/* Quantity Counter with 44px tap targets */}
                        <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50" role="group" aria-label={`Quantity controls for ${item.product.name}`}>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="touch-target-44 px-3 py-1.5 text-stone-700 hover:bg-stone-200 rounded-l-xl transition-colors"
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <span
                            aria-live="polite"
                            aria-label={`Current quantity ${item.quantity}`}
                            className="px-2.5 text-xs font-bold text-stone-800 font-mono"
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="touch-target-44 px-3 py-1.5 text-stone-700 hover:bg-stone-200 rounded-r-xl transition-colors"
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="text-xs sm:text-sm font-bold text-stone-900" aria-label={`Subtotal: ${unitPrice > 0 ? `₹${unitPrice * item.quantity}` : 'Seasonal Pricing'}`}>
                          {unitPrice > 0 ? `₹${unitPrice * item.quantity}` : 'Seasonal Pricing'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-stone-200 space-y-3 pb-safe">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    {subtotal > 0 ? `₹${subtotal}` : 'Seasonal Pricing'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    Delivery to {selectedCity}
                    {deliveryFee === 0 && (
                      <span className="text-emerald-700 text-xs font-bold">(Free)</span>
                    )}
                  </span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                  <span>Total Amount</span>
                  <span className="text-[#143D2B] text-base sm:text-lg font-bold">
                    {totalAmount > 0 ? `₹${totalAmount}` : 'Seasonal Pricing'}
                  </span>
                </div>
              </div>

              {/* Closed Notice Banner if Store is Closed */}
              {!operatingStatus.isOpen && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{operatingStatus.explanation}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {operatingStatus.todayHoursDisplay ? `Today: ${operatingStatus.todayHoursDisplay}. ` : ''}
                    {operatingStatus.nextOpenDisplay}. Your flower basket remains safely saved.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsHoursModalOpen(true)}
                    className="font-bold text-[#143D2B] underline hover:text-[#1e5a3f] text-[11px] block pt-0.5 cursor-pointer"
                  >
                    Check Opening Hours
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {!operatingStatus.isOpen ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    onClick={() => setIsHoursModalOpen(true)}
                    className="w-full bg-stone-100 border border-stone-300 text-stone-500 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                    aria-label="Currently Closed. We're currently closed. Please check our opening hours."
                  >
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span>Currently Closed</span>
                  </button>
                ) : (
                  <button
                    onClick={handleProceedCheckout}
                    className="w-full bg-[#143D2B] hover:bg-[#1e5a3f] text-white py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                  >
                    <span>Order Now • Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Direct WhatsApp Order (Fastest)</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-stone-500">
                Flower decoration delivery across Ramanagara & Bengaluru. Open 24/7.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Operating Hours Modal */}
      <OpeningHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        status={operatingStatus}
      />
    </div>
  );
};

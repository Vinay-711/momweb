import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  CreditCard,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  WifiOff,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { orderService } from '../services/orderService';
import * as whatsappService from '../services/whatsappService';
import { DeliveryCity, PaymentMethod } from '../types';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildTitle } from '../utils/seoConfig';
import { sanitizeErrorMessage } from '../utils/errorUtils';
import { OpeningHoursModal } from '../components/ui/OpeningHoursModal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { OfflineState } from '../components/ui/OfflineState';

export const CheckoutPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Checkout'),
    description: 'Complete your flower order for delivery in Ramanagara & Bengaluru.',
    robots: 'noindex, nofollow',
  });

  const {
    cart,
    subtotal,
    deliveryFee,
    totalAmount,
    clearCart,
    selectedCity,
    setSelectedCity,
    operatingStatus,
  } = useCart();
  const { isOnline, checkConnection } = useNetworkStatus();
  const navigate = useNavigate();

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isRecipientDifferent, setIsRecipientDifferent] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState(selectedCity === 'Ramanagara' ? '562159' : '560001');
  const [landmark, setLandmark] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [deliverySlot, setDeliverySlot] = useState('Morning (8:00 AM - 12:00 PM)');
  const [cardMessage, setCardMessage] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 animate-fade-in">
        <EmptyState
          icon={ShoppingBag}
          title="Your flower basket is waiting."
          description="Please add your preferred fresh flower arrangements, garlands, or bouquets before proceeding to checkout."
          primaryAction={{
            label: 'Browse Fresh Flowers',
            to: '/catalog',
          }}
        />
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Validate required customer contact
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name as the sender.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for delivery updates.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // 2. Validate recipient details if different
    if (isRecipientDifferent) {
      if (!recipientName.trim()) {
        setErrorMsg('Please enter the recipient\'s full name.');
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
      const cleanRecPhone = recipientPhone.replace(/\D/g, '');
      if (cleanRecPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number for the recipient.');
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
    }

    // 3. Validate delivery address and pincode
    if (!recipientAddress.trim()) {
      setErrorMsg('Please enter the complete delivery street address, building, or house number.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (!deliveryPincode.trim() || deliveryPincode.trim().length < 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (!deliveryDate) {
      setErrorMsg('Please select a preferred delivery date.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // 0. Check online connectivity
    if (!isOnline) {
      setErrorMsg('You are currently offline. Placing an order requires an active internet connection. Please reconnect.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // Operating hours check
    if (!operatingStatus.isOpen) {
      setErrorMsg(operatingStatus.explanation || "We're currently closed. Please check our opening hours.");
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // 4. Validate cart items
    if (cart.length === 0) {
      setErrorMsg('Your basket is empty. Please select floral items before ordering.');
      return;
    }

    for (const item of cart) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMsg(`Invalid quantity for ${item.product.name}. Please select 1 or more.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const order = await orderService.createOrder(
        {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || undefined,
          recipient_name: isRecipientDifferent ? recipientName.trim() : customerName.trim(),
          recipient_phone: isRecipientDifferent ? recipientPhone.trim() : customerPhone.trim(),
          recipient_address: recipientAddress.trim(),
          delivery_city: selectedCity,
          delivery_pincode: deliveryPincode.trim(),
          landmark: landmark.trim() || undefined,
          delivery_date: deliveryDate,
          delivery_time_slot: deliverySlot,
          card_message: cardMessage.trim() || undefined,
          order_notes: orderNotes.trim() || undefined,
          payment_method: paymentMethod,
        },
        cart
      );

      // If user chose WhatsApp checkout, trigger the formatted WhatsApp message as well
      if (paymentMethod === 'whatsapp') {
        const whatsappUrl = whatsappService.getOrderChatUrl(order, cart);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      // Cache order in sessionStorage for instant guest confirmation display
      try {
        sessionStorage.setItem('last_created_order', JSON.stringify(order));
      } catch (e) {
        // ignore
      }

      // Clear the customer's cart now that order is saved in the database
      clearCart();

      // Navigate to order confirmation
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      console.error('[CheckoutPage] Order submission failed:', err);
      setErrorMsg(sanitizeErrorMessage(err, 'Failed to place order. Please check availability or contact us on WhatsApp.'));
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-stone-900">
            Checkout & Delivery Details
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Hand-tied with fresh blooms from Ramanagara and safely hand-delivered
          </p>
        </div>
        <Link
          to="/cart"
          className="touch-target-44 self-start sm:self-auto inline-flex items-center gap-1.5 text-xs text-[#143D2B] font-semibold hover:underline bg-stone-50 sm:bg-transparent px-3 py-2 sm:px-0 sm:py-0 rounded-xl border sm:border-0 border-stone-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Basket</span>
        </Link>
      </div>

      {/* Mobile Top Order Summary Accordion */}
      <div className="block lg:hidden bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
          aria-expanded={isMobileSummaryOpen}
          aria-controls="mobile-checkout-summary"
          className="touch-target-44 w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-stone-900 min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
            <span>Basket Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#143D2B] text-sm sm:text-base">
              {subtotal === 0 ? 'Seasonal Pricing' : `₹${totalAmount}`}
            </span>
            {isMobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-stone-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500" aria-hidden="true" />
            )}
          </div>
        </button>

        {isMobileSummaryOpen && (
          <div id="mobile-checkout-summary" className="p-4 border-t border-stone-200 bg-stone-50/50 space-y-3">
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {cart.map(item => {
                const price = item.selected_variant?.price ?? item.product.sale_price ?? item.product.price;
                return (
                  <div key={item.id} className="flex gap-2.5 text-xs items-center">
                    <img
                      src={getOptimizedImageUrl(item.product.images[0] || item.product.image_url, 100, 70)}
                      alt={item.product.name}
                      width="48"
                      height="48"
                      loading="lazy"
                      decoding="async"
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-800 truncate">{item.product.name}</p>
                      <p className="text-stone-500 text-[11px]">
                        {item.selected_variant ? item.selected_variant.name : 'Standard'} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 whitespace-nowrap">
                      {price === 0 ? 'Seasonal' : `₹${price * item.quantity}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2.5 border-t border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{subtotal === 0 ? 'Seasonal Pricing' : `₹${subtotal}`}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery ({selectedCity})</span>
                <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total Due</span>
                <span className="text-[#143D2B] text-sm">
                  {subtotal === 0 ? 'Seasonal Pricing' : `₹${totalAmount}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isOnline && (
        <OfflineState
          variant="banner"
          title="You are currently offline"
          description="Placing your order requires an active internet connection to verify fresh flower availability. Please reconnect."
          className="mb-2"
        />
      )}

      {errorMsg && (
        <div id="checkout-error-banner" className="mb-2">
          <ErrorState
            title="Something went wrong. Please try again."
            error={errorMsg}
            variant="banner"
          />
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Form Fields Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. SENDER / CUSTOMER CONTACT */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#143D2B] text-white text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">1</span>
              <span>Your Contact Information (Sender)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-customer-name" className="text-xs font-semibold text-stone-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="checkout-customer-phone" className="text-xs font-semibold text-stone-700 block mb-1">
                  Phone Number (For Updates) <span className="text-red-500">*</span>
                </label>
                <input
                  id="checkout-customer-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. 9845012345"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="checkout-customer-email" className="text-xs font-semibold text-stone-700 block mb-1">
                  Email Address (Optional for invoice receipt)
                </label>
                <input
                  id="checkout-customer-email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. ramesh@example.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* 2. RECIPIENT & DELIVERY ADDRESS */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#143D2B] text-white text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">2</span>
                <span>Delivery Address & Recipient</span>
              </h2>

              <label htmlFor="checkout-recipient-diff" className="touch-target-44 flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer select-none bg-stone-50 sm:bg-transparent px-3 py-2 sm:px-0 sm:py-0 rounded-xl border sm:border-0 border-stone-200">
                <input
                  id="checkout-recipient-diff"
                  type="checkbox"
                  checked={isRecipientDifferent}
                  onChange={e => setIsRecipientDifferent(e.target.checked)}
                  className="w-4 h-4 rounded text-[#143D2B] focus:ring-[#143D2B]"
                />
                <span>Gifting someone else?</span>
              </label>
            </div>

            {isRecipientDifferent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <label htmlFor="checkout-recipient-name" className="text-xs font-semibold text-stone-700 block mb-1">
                    Recipient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkout-recipient-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Recipient's Name"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-recipient-phone" className="text-xs font-semibold text-stone-700 block mb-1">
                    Recipient Mobile Number
                  </label>
                  <input
                    id="checkout-recipient-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Recipient's Phone"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label htmlFor="checkout-city" className="text-xs font-semibold text-stone-700 block mb-1">
                  Destination City <span className="text-red-500">*</span>
                </label>
                <select
                  id="checkout-city"
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value as DeliveryCity)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-3 text-xs sm:text-sm font-bold text-[#143D2B] focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                >
                  <option value="Ramanagara">Ramanagara (₹49 Local Delivery)</option>
                  <option value="Bengaluru">Bengaluru (₹149 Express Delivery)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="checkout-pincode" className="text-xs font-semibold text-stone-700 block mb-1">
                  Postal Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  id="checkout-pincode"
                  type="text"
                  required
                  autoComplete="postal-code"
                  placeholder={selectedCity === 'Ramanagara' ? 'e.g. 562159' : 'e.g. 560001'}
                  value={deliveryPincode}
                  onChange={e => setDeliveryPincode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="checkout-address" className="text-xs font-semibold text-stone-700 block mb-1">
                  Complete Street Address / House / Flat No. <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  required
                  autoComplete="street-address"
                  placeholder="House No, Apartment / Building name, Cross Road, Area..."
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#143D2B]"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="checkout-landmark" className="text-xs font-semibold text-stone-700 block mb-1">
                  Notable Landmark (Optional)
                </label>
                <input
                  id="checkout-landmark"
                  type="text"
                  placeholder="Near temple, hospital, school, or main bus stand..."
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* 3. SCHEDULE DATE & TIME */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#143D2B] text-white text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">3</span>
              <span>Delivery Date & Slot</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-delivery-date" className="text-xs font-semibold text-stone-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                  <span>Choose Delivery Date</span>
                </label>
                <input
                  id="checkout-delivery-date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="checkout-delivery-slot" className="text-xs font-semibold text-stone-700 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                  <span>Preferred Time Slot</span>
                </label>
                <select
                  id="checkout-delivery-slot"
                  value={deliverySlot}
                  onChange={e => setDeliverySlot(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-semibold text-stone-800 focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
                >
                  <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                  <option value="Afternoon (12:00 PM - 4:00 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
                  <option value="Evening (4:00 PM - 8:00 PM)">Evening (4:00 PM - 8:00 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. GIFT NOTE & SPECIAL FLORIST INSTRUCTIONS */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#143D2B] text-white text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">4</span>
              <span>Gift Message & Notes</span>
            </h2>

            <div>
              <label htmlFor="checkout-card-message" className="text-xs font-semibold text-stone-700 block mb-1">
                Complimentary Card Message
              </label>
              <textarea
                id="checkout-card-message"
                rows={2}
                maxLength={250}
                placeholder="Write a heartfelt greeting for the recipient..."
                value={cardMessage}
                onChange={e => setCardMessage(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>

            <div>
              <label htmlFor="checkout-order-notes" className="text-xs font-semibold text-stone-700 block mb-1">
                Special Delivery / Florist Instructions
              </label>
              <input
                id="checkout-order-notes"
                type="text"
                placeholder="e.g. Leave with neighbor if gate locked, call before ringing bell..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm focus:ring-2 focus:ring-[#143D2B] min-h-[44px]"
              />
            </div>
          </div>

          {/* 5. PAYMENT METHOD */}
          <fieldset className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
            <legend className="font-serif font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#143D2B] text-white text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">5</span>
              <span>Choose Payment Method</span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex sm:flex-col justify-between items-center sm:items-stretch gap-3 min-h-[52px] select-none ${
                  paymentMethod === 'upi'
                    ? 'border-[#143D2B] bg-[#143D2B]/5 ring-1 ring-[#143D2B]'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-0 sm:justify-between">
                  <CreditCard className="w-5 h-5 text-[#143D2B] flex-shrink-0" aria-hidden="true" />
                  <div className="sm:hidden">
                    <p className="text-xs font-bold text-stone-900">UPI / GPay / PhonePe</p>
                    <p className="text-[10px] text-stone-600">Pay online via QR/UPI</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-stone-900">UPI / GPay / PhonePe</p>
                  <p className="text-[10px] text-stone-600 mt-0.5">Pay online via QR/UPI</p>
                </div>
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="w-4 h-4 text-[#143D2B] flex-shrink-0"
                />
              </label>

              <label
                className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex sm:flex-col justify-between items-center sm:items-stretch gap-3 min-h-[52px] select-none ${
                  paymentMethod === 'cod'
                    ? 'border-[#143D2B] bg-[#143D2B]/5 ring-1 ring-[#143D2B]'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-0 sm:justify-between">
                  <Truck className="w-5 h-5 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
                  <div className="sm:hidden">
                    <p className="text-xs font-bold text-stone-900">Cash on Delivery</p>
                    <p className="text-[10px] text-stone-600">Pay when flowers arrive</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-stone-900">Cash on Delivery</p>
                  <p className="text-[10px] text-stone-600 mt-0.5">Pay when flowers arrive</p>
                </div>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="w-4 h-4 text-[#143D2B] flex-shrink-0"
                />
              </label>

              <label
                className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex sm:flex-col justify-between items-center sm:items-stretch gap-3 min-h-[52px] select-none ${
                  paymentMethod === 'whatsapp'
                    ? 'border-[#25D366] bg-[#25D366]/10 ring-1 ring-[#25D366]'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-0 sm:justify-between">
                  <MessageCircle className="w-5 h-5 text-[#25D366] flex-shrink-0" aria-hidden="true" />
                  <div className="sm:hidden">
                    <p className="text-xs font-bold text-stone-900">WhatsApp Checkout</p>
                    <p className="text-[10px] text-stone-600">Finalize via WhatsApp chat</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-stone-900">WhatsApp Checkout</p>
                  <p className="text-[10px] text-stone-600 mt-0.5">Finalize via WhatsApp chat</p>
                </div>
                <input
                  type="radio"
                  name="payment"
                  value="whatsapp"
                  checked={paymentMethod === 'whatsapp'}
                  onChange={() => setPaymentMethod('whatsapp')}
                  className="w-4 h-4 text-[#25D366] flex-shrink-0"
                />
              </label>
            </div>
          </fieldset>
        </div>

        {/* Order Summary Sidebar (Desktop sticky & Mobile final submit card) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-6 lg:sticky lg:top-28 w-full">
          <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 pb-3 border-b border-stone-100 hidden lg:block">
            Order Review
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 hidden lg:block">
            {cart.map(item => {
              const price = item.selected_variant?.price ?? item.product.sale_price ?? item.product.price;
              return (
                <div key={item.id} className="flex gap-3 text-xs">
                  <img
                    src={getOptimizedImageUrl(item.product.images[0] || item.product.image_url, 100, 70)}
                    alt={item.product.name}
                    width="48"
                    height="48"
                    loading="lazy"
                    decoding="async"
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 line-clamp-1">{item.product.name}</p>
                    <p className="text-stone-500 text-[11px]">
                      {item.selected_variant ? item.selected_variant.name : 'Standard'} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-stone-900 whitespace-nowrap">
                    {price === 0 ? 'Seasonal' : `₹${price * item.quantity}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 text-xs pt-1 sm:pt-3 border-t lg:border-stone-100 border-transparent">
            <div className="flex justify-between text-stone-600">
              <span>Items Subtotal</span>
              <span>{subtotal === 0 ? 'Seasonal Pricing' : `₹${subtotal}`}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery ({selectedCity})</span>
              <span>{deliveryFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Final Total</span>
              <span className="text-right">
                <span className="text-base sm:text-lg text-[#143D2B] block">
                  {subtotal === 0 ? 'Seasonal Pricing' : `₹${totalAmount}`}
                </span>
                {subtotal === 0 && deliveryFee > 0 && (
                  <span className="text-[11px] font-normal text-stone-500 block">+ ₹{deliveryFee} delivery</span>
                )}
              </span>
            </div>
          </div>

          {subtotal === 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-[11px] text-emerald-950 leading-relaxed space-y-1">
              <p className="font-semibold text-[#143D2B]">Seasonal Pricing Notice</p>
              <p className="text-stone-600">Fresh flower decoration prices depend on flower market arrivals. Padma confirms the final quote directly after you place the order.</p>
            </div>
          )}

          {!isOnline ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2.5 text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-xs">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span>Internet Connection Required</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Your basket is safely saved on your device. Please reconnect to Wi-Fi or mobile data to place your flower order.
              </p>
              <button
                type="button"
                onClick={checkConnection}
                className="touch-target-44 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Retry Connection
              </button>
            </div>
          ) : !operatingStatus.isOpen ? (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{operatingStatus.explanation}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {operatingStatus.todayHoursDisplay ? `Today: ${operatingStatus.todayHoursDisplay} (${operatingStatus.timezone}). ` : ''}
                  {operatingStatus.nextOpenDisplay}. Your order details are safely saved.
                </p>
                <button
                  type="button"
                  onClick={() => setIsHoursModalOpen(true)}
                  className="touch-target-44 w-full py-2.5 px-4 bg-[#143D2B] hover:bg-[#1e5a3f] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  View Store Hours Schedule
                </button>
              </div>

              <button
                type="button"
                disabled
                aria-disabled="true"
                onClick={() => setIsHoursModalOpen(true)}
                className="touch-target-44 w-full bg-stone-100 border border-stone-300 text-stone-500 py-3.5 rounded-xl font-bold text-sm sm:text-base cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                aria-label="Currently Closed. We're currently closed. Please check our opening hours."
              >
                <Clock className="w-4 h-4 text-stone-400" />
                <span>Currently Closed</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="touch-target-44 w-full bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-75 text-white py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
            >
              {isSubmitting ? (
                <span>Confirming Your Order...</span>
              ) : (
                <>
                  <span>Place Flower Order {totalAmount > 0 && subtotal > 0 ? `• ₹${totalAmount}` : '• Seasonal Pricing'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          )}

          <div className="pt-2 text-[11px] text-stone-600 space-y-1.5 text-center">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
              <span>Direct Florist Verification by Padma</span>
            </p>
            <p>Questions? Call us at 9740030159</p>
          </div>
        </div>
      </form>

      {/* Operating Hours Modal */}
      <OpeningHoursModal
        isOpen={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        status={operatingStatus}
      />
    </div>
  );
};

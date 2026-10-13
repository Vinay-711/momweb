import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Truck,
  Sparkles,
  ArrowRight,
  Phone,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  Flower2,
  X,
  WifiOff
} from 'lucide-react';
import { orderService } from '../services/orderService';
import * as whatsappService from '../services/whatsappService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Order, OrderStatus } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildTitle } from '../utils/seoConfig';
import { sanitizeErrorMessage } from '../utils/errorUtils';
import { OrderTrackingSkeleton } from '../components/ui/Skeleton';

export const OrderTrackingPage: React.FC = () => {
  usePageMeta({
    title: buildTitle('Track Your Order'),
    description: "Track the status of your flower delivery from Padma's Floral.",
    robots: 'noindex, nofollow',
  });

  const { isOnline, checkConnection } = useNetworkStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrder = searchParams.get('order') || '';
  const initialPhone = searchParams.get('phone') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [phoneQuery, setPhoneQuery] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Perform verified lookup
  const fetchOrder = async (orderNum: string, phoneNum: string) => {
    const trimmedOrder = orderNum.trim().toUpperCase();
    const cleanPhone = phoneNum.replace(/\D/g, '');

    if (!trimmedOrder) {
      setErrorMsg('Please enter your Order Reference Number.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter your 10-digit mobile number for order verification.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const found = await orderService.trackOrder(trimmedOrder, cleanPhone);
      setOrder(found);

      if (!found) {
        setErrorMsg(
          `No order found matching "${trimmedOrder}" and the provided mobile number. Please verify both details to protect order privacy.`
        );
      }
    } catch (err: any) {
      console.error('[OrderTrackingPage] Error verifying order:', err);
      setErrorMsg(sanitizeErrorMessage(err, 'Unable to retrieve order details. Please verify your connection.'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Pre-load if order param is present in URL query
  useEffect(() => {
    if (initialOrder.trim() && initialPhone.trim().replace(/\D/g, '').length >= 10) {
      fetchOrder(initialOrder, initialPhone);
    }
  }, [initialOrder, initialPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setSearched(true);
      setErrorMsg('You are currently offline. Live delivery tracking requires an active internet connection. Please reconnect.');
      return;
    }

    const trimmedOrder = orderQuery.trim().toUpperCase();
    const cleanPhone = phoneQuery.replace(/\D/g, '');

    if (trimmedOrder && cleanPhone.length >= 10) {
      // Keep order reference in URL query for shareability, but strictly exclude customer phone number to protect PII
      setSearchParams({ order: trimmedOrder });
      fetchOrder(trimmedOrder, cleanPhone);
    } else if (!trimmedOrder) {
      setErrorMsg('Please enter your order reference number (e.g. FL-2026-0001).');
    } else {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
    }
  };

  const handleCopy = () => {
    if (order?.order_number && navigator.clipboard) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Status mapping for badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Order Confirmed</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-full font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Preparing Fresh Blooms</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-bold">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 bg-[#143D2B] text-emerald-200 text-xs px-3.5 py-1.5 rounded-full font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-xs px-3 py-1.5 rounded-full font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Order Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 text-xs px-3 py-1.5 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Order Received</span>
          </span>
        );
    }
  };

  // Timeline Step calculation: 0 = Received, 1 = Confirmed, 2 = Preparing, 3 = Out for Delivery, 4 = Delivered
  const getTimelineStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'out_for_delivery':
        return 3;
      case 'delivered':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = order ? getTimelineStepIndex(order.order_status) : 0;

  // 5 Required Stages
  const timelineStages = [
    {
      id: 'received',
      name: 'Order Received',
      shortName: 'Received',
      icon: Clock,
      description: 'Your order details have been received at our atelier.',
    },
    {
      id: 'confirmed',
      name: 'Confirmed',
      shortName: 'Confirmed',
      icon: CheckCircle2,
      description: 'Order confirmed and fresh flowers queued for harvest.',
    },
    {
      id: 'preparing',
      name: 'Preparing',
      shortName: 'Preparing',
      icon: Flower2,
      description: 'Hand-tied and artisanally arranged by Padma.',
    },
    {
      id: 'out_for_delivery',
      name: 'Out for Delivery',
      shortName: 'On the Way',
      icon: Truck,
      description: 'Handed over to our courier for direct delivery.',
    },
    {
      id: 'delivered',
      name: 'Delivered',
      shortName: 'Delivered',
      icon: Package,
      description: 'Delivered fresh to the recipient.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
      {/* Mobile-Friendly Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-[#143D2B] bg-[#143D2B]/8 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Secure Order Tracking</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Track Your Floral Order
        </h1>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Enter your Order Reference Number and registered phone number to view live preparation and delivery status.
        </p>
      </div>

      {/* Verification Search Card */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-stone-200/90 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Field 1: Order Reference Number */}
            <div className="space-y-1 text-left">
              <label htmlFor="order-number-input" className="block text-xs font-bold text-stone-700">
                Order Number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="order-number-input"
                  type="text"
                  placeholder="FL-2026-0001"
                  value={orderQuery}
                  onChange={e => setOrderQuery(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-10 pr-8 text-sm font-mono font-bold uppercase tracking-wider text-stone-900 focus:bg-white focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B] transition-all min-h-[44px]"
                />
                {orderQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderQuery('')}
                    aria-label="Clear order number"
                    className="touch-target-44 absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-2"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Field 2: Mobile Number for Verification */}
            <div className="space-y-1 text-left">
              <label htmlFor="phone-number-input" className="block text-xs font-bold text-stone-700">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1 text-stone-500 pointer-events-none text-xs font-semibold">
                  <Phone className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                  <span>+91</span>
                </div>
                <input
                  id="phone-number-input"
                  type="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  value={phoneQuery}
                  onChange={e => setPhoneQuery(e.target.value)}
                  maxLength={14}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 pl-16 pr-8 text-sm font-semibold text-stone-900 focus:bg-white focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B] transition-all min-h-[44px]"
                />
                {phoneQuery && (
                  <button
                    type="button"
                    onClick={() => setPhoneQuery('')}
                    aria-label="Clear phone number"
                    className="touch-target-44 absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-2"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-stone-500 text-left flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span>Matching phone number required to protect customer privacy.</span>
            </p>

            {!isOnline ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>Internet required</span>
                </span>
                <button
                  type="button"
                  onClick={checkConnection}
                  className="touch-target-44 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || !orderQuery.trim() || phoneQuery.replace(/\D/g, '').length < 10}
                className="touch-target-44 w-full sm:w-auto bg-[#143D2B] hover:bg-[#1e5a3f] disabled:opacity-40 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <OrderTrackingSkeleton />
      )}

      {/* Error / Privacy Protection Alert */}
      {!loading && searched && errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-5 bg-amber-50 border border-amber-200/90 rounded-3xl flex items-start gap-3.5 text-xs text-amber-950 text-left animate-fade-in shadow-2xs"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1.5 flex-1">
            <p className="font-bold text-sm">Order Not Found or Verification Notice</p>
            <p className="text-amber-900 leading-relaxed">{errorMsg}</p>
            <p className="text-[11px] text-amber-800 pt-1">
              Need assistance?{' '}
              <a
                href={whatsappService.getOrderInquiryUrl(orderQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-[#143D2B] hover:text-stone-900"
              >
                Inquire directly with Florist Padma on WhatsApp
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Matching Order Display */}
      {order && (
        <div
          role="region"
          aria-label={`Order tracking details for ${order.order_number}`}
          className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden text-left space-y-6 animate-fade-in"
        >
          {/* Order Header */}
          <div className="p-5 sm:p-7 bg-stone-50/80 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-600 font-medium">Order Number:</span>
                <span className="font-mono text-sm sm:text-base md:text-lg font-bold text-[#143D2B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 select-all">
                  {order.order_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copied ? "Order number copied" : "Copy order number to clipboard"}
                  className="touch-target-44 p-2 text-stone-400 hover:text-stone-700 rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                  title="Copy Order Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>

              <p className="text-xs text-stone-600">
                Customer: <strong className="text-stone-800">{order.customer_name}</strong> • Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div role="status" aria-label={`Current order status: ${order.order_status}`}>
                {getStatusBadge(order.order_status)}
              </div>
              <a
                href={whatsappService.getOrderInquiryUrl(order.order_number, order.customer_name)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get WhatsApp Help for this order"
                className="touch-target-44 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 min-h-[38px]"
              >
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">WhatsApp Help</span>
                <span className="sm:hidden">Help</span>
              </a>
            </div>
          </div>

          {/* Cancelled Banner if applicable */}
          {order.order_status === 'cancelled' && (
            <div
              role="alert"
              className="mx-5 sm:mx-7 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                <span>This order was cancelled. Please message us if you need refund or reschedule assistance.</span>
              </div>
              <a
                href={whatsappService.getOrderInquiryUrl(order.order_number, order.customer_name)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline text-red-900 ml-2"
              >
                Chat on WhatsApp
              </a>
            </div>
          )}

          {/* 5-Stage Timeline */}
          <div className="px-5 sm:px-7 py-2">
            <h2 className="font-serif font-bold text-sm text-stone-900 mb-4">
              Order Timeline
            </h2>

            {/* Desktop Horizontal Timeline (sm and up) */}
            <div className="hidden sm:block">
              <ol className="relative flex items-center justify-between list-none p-0 m-0" aria-label="Order preparation progress">
                {/* Connecting Background Line */}
                <div className="absolute top-5 left-6 right-6 h-0.5 bg-stone-200 z-0" aria-hidden="true" />
                {/* Active Progress Line */}
                {currentStepIdx >= 0 && (
                  <div
                    className="absolute top-5 left-6 h-0.5 bg-[#143D2B] z-0 transition-all duration-500"
                    aria-hidden="true"
                    style={{
                      width: `${(currentStepIdx / (timelineStages.length - 1)) * 100}%`,
                    }}
                  />
                )}

                {timelineStages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const isCompleted = currentStepIdx >= 0 && idx < currentStepIdx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <li key={stage.id} className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[120px]">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-[#143D2B] text-white shadow-sm'
                            : isCurrent
                            ? 'bg-[#D4AF37] text-white ring-4 ring-[#D4AF37]/25 shadow-md scale-105'
                            : 'bg-white border-2 border-stone-300 text-stone-400'
                        }`}
                        aria-hidden="true"
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isCompleted || isCurrent ? 'text-stone-900' : 'text-stone-600'
                          }`}
                        >
                          {stage.name}
                          <span className="sr-only">
                            {isCompleted ? ' - Completed' : isCurrent ? ' - Current Stage' : ' - Pending'}
                          </span>
                        </p>
                        {isCurrent && (
                          <span className="inline-block text-[10px] font-bold text-[#8A6318] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Mobile-First Vertical Timeline (< sm) */}
            <ol className="sm:hidden space-y-4 list-none p-0 m-0" aria-label="Order preparation progress">
              {timelineStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = currentStepIdx >= 0 && idx < currentStepIdx;
                const isCurrent = currentStepIdx === idx;
                const isLast = idx === timelineStages.length - 1;

                return (
                  <li key={stage.id} className="flex items-start gap-3 relative">
                    {/* Connecting Vertical Line */}
                    {!isLast && (
                      <div
                        className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                          isCompleted ? 'bg-[#143D2B]' : 'bg-stone-200'
                        }`}
                        style={{ height: 'calc(100% + 4px)' }}
                        aria-hidden="true"
                      />
                    )}

                    {/* Stage Circle */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isCompleted
                          ? 'bg-[#143D2B] text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#D4AF37] text-white ring-3 ring-[#D4AF37]/25 animate-pulse'
                          : 'bg-stone-100 border border-stone-200 text-stone-400'
                      }`}
                      aria-hidden="true"
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 pt-0.5 pb-2">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${
                            isCompleted || isCurrent ? 'text-stone-900' : 'text-stone-600'
                          }`}
                        >
                          {stage.name}
                          <span className="sr-only">
                            {isCompleted ? ' - Completed' : isCurrent ? ' - Current Stage' : ' - Pending'}
                          </span>
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-[#8A6318] uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                            Current Status
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Delivery & Items Details Cards */}
          <div className="p-5 sm:p-7 pt-0 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100">
            {/* Delivery Schedule & Address */}
            <div className="space-y-4 pt-5">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C84B5B]" aria-hidden="true" />
                <span>Delivery Details</span>
              </h3>

              <div className="bg-stone-50/90 border border-stone-200/80 rounded-2xl p-4 text-xs space-y-2.5 text-stone-700">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-stone-600 block text-[11px]">Scheduled Delivery Date</span>
                    <strong className="text-stone-900 text-xs">
                      {order.delivery_date || 'Standard Delivery'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-stone-200/70">
                  <Clock className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-stone-600 block text-[11px]">Time Slot</span>
                    <strong className="text-stone-900 text-xs">
                      {order.delivery_time_slot || 'Standard Dispatch'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-stone-200/70">
                  <MapPin className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-stone-600 block text-[11px]">Recipient & Address</span>
                    <p className="font-bold text-stone-900">{order.recipient_name}</p>
                    <p className="text-stone-700 mt-0.5">{order.delivery_address || order.recipient_address}</p>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      {order.delivery_city} {order.delivery_pincode ? `- ${order.delivery_pincode}` : ''}
                    </p>
                  </div>
                </div>

                {order.card_message && (
                  <div className="pt-2 border-t border-stone-200/70">
                    <span className="font-semibold text-stone-600 block text-[11px]">Greeting Card Note</span>
                    <p className="italic text-stone-800 mt-0.5 bg-white p-2 rounded-lg border border-stone-200/60">
                      "{order.card_message}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Floral Items & Total Summary */}
            <div className="space-y-4 pt-5">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
                <span>Floral Items Ordered</span>
              </h3>

              <div className="bg-stone-50/90 border border-stone-200/80 rounded-2xl p-4 text-xs space-y-3">
                <div className="divide-y divide-stone-200/60">
                  {order.items?.map((item, idx) => (
                    <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-stone-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200/60">
                            <Flower2 className="w-5 h-5" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate text-xs">{item.product_name}</p>
                          <p className="text-[11px] text-stone-600">
                            {item.selected_variant ? `${item.selected_variant} • ` : ''}Qty: {item.quantity} × ₹{item.unit_price}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 text-xs flex-shrink-0">
                        ₹{item.total_price || item.subtotal}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t border-stone-200 space-y-1.5 text-stone-700">
                  <div className="flex justify-between text-[11px]">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Delivery Fee</span>
                    <span>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total Amount</span>
                    <span className="text-[#143D2B] text-base">₹{order.total_amount || order.total}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-600 pt-0.5">
                    <span>Payment Method</span>
                    <span className="uppercase font-semibold text-stone-700">{order.payment_method}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Direct Support Banner */}
          <div className="p-4 sm:p-5 bg-[#143D2B]/5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-stone-700">
              Need to reschedule or have special delivery instructions for Padma?
            </p>
            <a
              href={whatsappService.getOrderInquiryUrl(order.order_number, order.customer_name)}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 w-full sm:w-auto min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
            >
              <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Chat with Florist Padma</span>
            </a>
          </div>
        </div>
      )}

      {/* Customer Trust Footer Note */}
      <div className="text-center pt-4">
        <Link
          to="/catalog"
          className="text-xs font-semibold text-[#143D2B] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143D2B] rounded-sm p-1"
        >
          <span>Explore Fresh Blooms Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

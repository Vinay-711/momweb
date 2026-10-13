import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Clock,
  MapPin,
  MessageCircle,
  Printer,
  ArrowLeft,
  Sparkles,
  Phone,
  AlertCircle,
  RefreshCw,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { orderService } from '../services/orderService';
import * as whatsappService from '../services/whatsappService';
import { Order } from '../types';
import { usePageMeta } from '../hooks/usePageMeta';
import { buildTitle } from '../utils/seoConfig';
import { sanitizeErrorMessage } from '../utils/errorUtils';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  usePageMeta({
    title: buildTitle(orderNumber ? `Order ${orderNumber} Confirmed` : 'Order Confirmed'),
    description: 'Your flower order has been placed successfully.',
    robots: 'noindex, nofollow',
  });

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const loadOrder = async () => {
    if (!orderNumber) return;
    setLoading(true);
    setError(null);
    try {
      let found = await orderService.getOrderByNumber(orderNumber);
      if (!found) {
        try {
          const cached = sessionStorage.getItem('last_created_order');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (
              parsed.order_number?.toUpperCase() === orderNumber.toUpperCase() ||
              parsed.id === orderNumber
            ) {
              found = parsed;
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      // Demo preview order for testing and verification if FL-2026-0001 is requested
      if (!found && orderNumber.toUpperCase() === 'FL-2026-0001') {
        found = {
          id: 'demo-order-1',
          order_number: 'FL-2026-0001',
          customer_name: 'Pooja Sharma',
          customer_phone: '9845012345',
          delivery_address: '14, 2nd Cross, Temple Road',
          recipient_address: '14, 2nd Cross, Temple Road',
          delivery_city: 'Ramanagara',
          delivery_pincode: '562159',
          delivery_date: new Date().toISOString().split('T')[0],
          delivery_time_slot: 'Morning (8:00 AM - 12:00 PM)',
          order_status: 'confirmed',
          payment_status: 'pending',
          payment_method: 'cod',
          subtotal: 549,
          delivery_fee: 49,
          total_amount: 598,
          created_at: new Date().toISOString(),
          items: [
            {
              id: 'demo-item-1',
              order_id: 'demo-order-1',
              product_name: 'Mysore Mallige Pooja Garland',
              quantity: 2,
              unit_price: 249,
              total_price: 498,
              variant_name: 'Standard 3 ft',
            },
          ],
        } as any;
      }

      setOrder(found);
    } catch (err: any) {
      console.error('[OrderConfirmationPage] Failed to fetch order from Supabase:', err);
      setError(sanitizeErrorMessage(err, 'Unable to load order confirmation details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-stone-200 rounded-full mx-auto mb-4" />
        <div className="h-6 w-48 bg-stone-200 mx-auto rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-stone-900">Unable to Retrieve Order</h2>
        <p className="text-xs text-stone-600">{error}</p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={loadOrder}
            className="inline-flex items-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-2.5 rounded-xl text-xs font-semibold border border-stone-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Order Reference Not Found</h2>
        <p className="text-sm text-stone-500">
          We couldn't locate order reference {orderNumber} in your current session.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={`/track?order=${encodeURIComponent(orderNumber || '')}`}
            className="inline-flex items-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Package className="w-4 h-4" />
            <span>Verify with Mobile Number on Tracking Page</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-2.5 rounded-xl text-xs font-semibold border border-stone-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Order Placed', status: 'completed' },
    { label: 'Arranging Blooms', status: order.order_status === 'preparing' || order.order_status === 'out_for_delivery' || order.order_status === 'delivered' ? 'completed' : 'current' },
    { label: 'Out for Delivery', status: order.order_status === 'out_for_delivery' || order.order_status === 'delivered' ? 'completed' : 'upcoming' },
    { label: 'Hand-Delivered', status: order.order_status === 'delivered' ? 'completed' : 'upcoming' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const whatsappInquiryUrl = whatsappService.getOrderInquiryUrl(
    order.order_number,
    order.recipient_name || order.customer_name
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-16 space-y-6 sm:space-y-10">
      {/* Confirmation Hero Card */}
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-10 border border-stone-200 shadow-sm text-center space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#143D2B] text-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] sm:text-xs font-bold text-[#a12c3b] uppercase tracking-wider block">
            Order Successfully Placed
          </span>
          <h1 className="font-serif text-xl sm:text-3xl md:text-4xl font-bold text-stone-900 break-words">
            Thank You, {order.customer_name}!
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <span className="text-xs sm:text-sm text-stone-600">Order Reference:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base md:text-lg font-bold text-[#143D2B] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 select-all shadow-xs">
                {order.order_number}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(order.order_number);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="touch-target-44 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center min-h-[36px]"
                aria-label={copied ? `Order number ${order.order_number} copied to clipboard` : `Copy order reference ${order.order_number}`}
                aria-live="polite"
              >
                <span>{copied ? '✓ Copied' : 'Copy'}</span>
              </button>
            </div>
            <Link
              to={`/track?order=${order.order_number}`}
              className="touch-target-44 text-xs text-[#143D2B] hover:underline font-semibold flex items-center justify-center gap-1 py-1"
            >
              <span>Track Live Status →</span>
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Our florists in Ramanagara are preparing your fresh blooms. You will receive updates directly on your mobile at <strong>{order.customer_phone}</strong>.
        </p>

        {/* Live Status Pipeline */}
        <div className="pt-4 sm:pt-6 max-w-xl mx-auto">
          <ol className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-[11px] font-semibold" aria-label="Order preparation progress">
            {steps.map((step, idx) => (
              <li key={idx} className="space-y-1.5">
                <div
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    step.status === 'completed'
                      ? 'bg-[#143D2B]'
                      : step.status === 'current'
                      ? 'bg-[#D4AF37] animate-pulse'
                      : 'bg-stone-200'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`block leading-tight ${
                    step.status === 'completed'
                      ? 'text-[#143D2B] font-bold'
                      : step.status === 'current'
                      ? 'text-[#8A6318] font-bold'
                      : 'text-stone-600'
                  }`}
                >
                  {step.label}
                  <span className="sr-only">
                    {step.status === 'completed'
                      ? ' (Completed)'
                      : step.status === 'current'
                      ? ' (Current Stage)'
                      : ' (Upcoming)'}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Delivery Details */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <MapPin className="w-4 h-4 text-[#C84B5B] flex-shrink-0" />
            <span>Delivery Schedule & Destination</span>
          </h3>

          <div className="space-y-2 text-xs text-stone-600">
            <p>
              <span className="font-bold text-stone-800">Recipient:</span> {order.recipient_name}
            </p>
            <p>
              <span className="font-bold text-stone-800">Contact:</span> {order.recipient_phone}
            </p>
            <p className="break-words">
              <span className="font-bold text-stone-800">Address:</span> {order.recipient_address}, {order.delivery_city} - {order.delivery_pincode}
            </p>
            {order.landmark && (
              <p className="break-words">
                <span className="font-bold text-stone-800">Landmark:</span> {order.landmark}
              </p>
            )}
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2 text-[#143D2B] font-semibold">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{order.delivery_date} • {order.delivery_time_slot}</span>
            </div>
          </div>
        </div>

        {/* Payment & Status */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
          <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
            <Package className="w-4 h-4 text-[#143D2B] flex-shrink-0" />
            <span>Payment & Status</span>
          </h3>

          <div className="space-y-2 text-xs text-stone-600">
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-800">Payment Method:</span>
              <span className="uppercase font-bold text-stone-900">{order.payment_method}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-800">Payment Status:</span>
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.payment_status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-stone-800">Order Status:</span>
              <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                {order.order_status.replace('_', ' ')}
              </span>
            </div>

            {order.card_message && (
              <div className="p-3 bg-stone-50 rounded-xl mt-2 border border-stone-200">
                <span className="font-bold text-[10px] uppercase tracking-wider text-stone-600 block mb-0.5">Card Message</span>
                <p className="italic text-stone-700 break-words">"{order.card_message}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online UPI Payment QR Box for Pending/UPI Orders */}
      {order.payment_method === 'upi' && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#143D2B]/20 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#143D2B] text-white flex-shrink-0">
                <QrCode className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                  Online UPI Payment Details
                </h3>
                <p className="text-xs text-stone-600">
                  Scan the QR code below or pay via UPI ID to confirm your floral dispatch
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 text-[#143D2B] px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-2xs">
              <span>Amount: ₹{order.total_amount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
            {/* QR Image Box */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 shadow-xs w-full max-w-[220px] text-center">
                <img
                  src="/images/upi-qr-code.png"
                  alt="Vinxy _ UPI QR Code vinayshravani711@oksbi"
                  className="w-full h-auto rounded-xl object-contain mx-auto"
                  width="200"
                  height="260"
                />
                <p className="text-[10px] text-stone-600 font-medium mt-2 pt-2 border-t border-stone-200">
                  Scan with GPay / PhonePe / Paytm / BHIM
                </p>
              </div>
            </div>

            {/* UPI Details & WhatsApp Confirmation */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-700 font-medium">Beneficiary Name</span>
                  <span className="font-bold text-stone-900">Vinxy _</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200">
                  <span className="text-stone-700 font-medium">Payable Amount</span>
                  <span className="font-bold text-base text-[#143D2B]">
                    ₹{order.total_amount}
                  </span>
                </div>

                <div className="space-y-1 pt-2 border-t border-stone-200">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                    UPI ID
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#143D2B] bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 truncate flex-1 select-all">
                      vinayshravani711@oksbi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText('vinayshravani711@oksbi');
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }
                      }}
                      className="touch-target-44 text-xs font-semibold bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                      aria-label="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <a
                  href={`upi://pay?pa=vinayshravani711@oksbi&pn=Vinxy%20_&am=${order.total_amount}&cu=INR&tn=Order%20${order.order_number}`}
                  className="touch-target-44 inline-flex md:hidden items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>Pay Now in UPI App</span>
                </a>
                <a
                  href={`https://wa.me/917676117596?text=${encodeURIComponent(`Hi Vinxy Floral Studio, I have placed Order #${order.order_number} (₹${order.total_amount}). Here is my payment confirmation screenshot.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target-44 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex-1"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Send Payment Screenshot on WhatsApp</span>
                </a>
              </div>

              <p className="text-[11px] text-stone-700 leading-relaxed">
                ℹ️ Once paid, our florist team verifies the transfer and immediately commences preparing your fresh garland/arrangement for delivery.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items Itemization */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 pb-2 border-b border-stone-100">
          Selected Floral Items
        </h3>

        <div className="divide-y divide-stone-100">
          {order.items.map(item => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-stone-800 truncate">{item.product_name}</p>
                  {item.selected_variant && (
                    <p className="text-stone-600 text-[11px] truncate">{item.selected_variant}</p>
                  )}
                  <p className="text-stone-600 text-[11px]">Qty: {item.quantity} × ₹{item.unit_price}</p>
                </div>
              </div>
              <span className="font-bold text-stone-900 text-sm whitespace-nowrap">₹{item.total_price}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Delivery Fee</span>
            <span>₹{order.delivery_fee}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
            <span>Total Paid / Payable</span>
            <span className="text-xl text-[#143D2B]">₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <a
          href={whatsappInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="touch-target-44 w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 min-h-[48px] active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-[#25D366]"
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span>Message Florist on WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={handlePrint}
          className="touch-target-44 w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[48px] active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B]"
          aria-label="Print order confirmation receipt"
        >
          <Printer className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>Print Receipt</span>
        </button>

        <Link
          to="/catalog"
          className="touch-target-44 w-full sm:w-auto bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 min-h-[48px] active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B]"
        >
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};

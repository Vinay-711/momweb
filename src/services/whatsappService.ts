/**
 * whatsappService.ts — Centralized WhatsApp Click-to-Chat Integration
 *
 * All WhatsApp deep-links across the storefront and admin are generated here.
 * The phone number is read from the configured business_settings.whatsapp field.
 *
 * Architecture note: This module currently implements a "click-to-chat" flow
 * (wa.me deep links). It is designed so that a future WhatsApp Business API
 * integration can be added by implementing the WhatsAppChannel interface below
 * without changing any component call sites.
 *
 * IMPORTANT: This service NEVER claims a message was delivered. All methods
 * generate URLs that open a WhatsApp compose window — the user must tap Send.
 */

import { Order, OrderItem, CartItem, BusinessSettings } from '../types';

// ---------------------------------------------------------------------------
// Future-Ready Architecture — WhatsApp Channel Abstraction
// ---------------------------------------------------------------------------

/** Result returned by all WhatsApp actions. */
export interface WhatsAppResult {
  /** The wa.me deep link URL the user should be directed to. */
  url: string;
  /**
   * Whether the message was actually delivered via an API.
   * For click-to-chat this is always `false` — delivery depends on the user
   * tapping Send in the WhatsApp compose window.
   */
  delivered: false;
  /** The channel type used. */
  channel: 'click_to_chat';
}

/**
 * Interface for future WhatsApp Business API integration.
 * When an official WABA integration is added, implement this interface
 * and swap the active channel in `getActiveChannel()`.
 */
export interface WhatsAppChannel {
  type: 'click_to_chat' | 'business_api';
  buildOrderConfirmationUrl(order: Partial<Order>, items: (CartItem | OrderItem)[]): WhatsAppResult;
  buildProductInquiryUrl(productName: string, productUrl: string, price: number): WhatsAppResult;
  buildGeneralChatUrl(message?: string): WhatsAppResult;
}

// ---------------------------------------------------------------------------
// Configurable Phone Number
// ---------------------------------------------------------------------------

/** Default WhatsApp number (Indian country code prefixed). */
const DEFAULT_WHATSAPP = '7676117596';
const DEFAULT_BUSINESS_NAME = "Padma's Floral";

/** Cached business settings — updated whenever settings are fetched. */
let _cachedWhatsApp: string = DEFAULT_WHATSAPP;
let _cachedBusinessName: string = DEFAULT_BUSINESS_NAME;

/**
 * Call this whenever business_settings are loaded/updated to keep the
 * WhatsApp number in sync with the admin-configured value.
 */
export function syncWhatsAppSettings(settings: Partial<BusinessSettings>): void {
  if (settings.whatsapp && settings.whatsapp.trim()) {
    _cachedWhatsApp = settings.whatsapp.trim().replace(/\D/g, '');
  }
  if (settings.business_name || settings.store_name) {
    _cachedBusinessName = (settings.store_name || settings.business_name || DEFAULT_BUSINESS_NAME).trim();
  }
}

/** Returns the Indian-prefixed WhatsApp number (e.g. "917676117596"). */
function getFormattedPhone(): string {
  const digits = _cachedWhatsApp.replace(/\D/g, '');
  // Already has country code
  if (digits.startsWith('91') && digits.length >= 12) return digits;
  // 10-digit Indian mobile
  return `91${digits}`;
}

/** Returns the display-friendly number (e.g. "+91 7676117596"). */
export function getDisplayPhone(): string {
  const digits = _cachedWhatsApp.replace(/\D/g, '');
  const national = digits.startsWith('91') && digits.length >= 12 ? digits.slice(2) : digits;
  return `+91 ${national}`;
}

/** Returns the raw national number (e.g. "7676117596"). */
export function getNationalPhone(): string {
  const digits = _cachedWhatsApp.replace(/\D/g, '');
  return digits.startsWith('91') && digits.length >= 12 ? digits.slice(2) : digits;
}

// ---------------------------------------------------------------------------
// Core URL Builder
// ---------------------------------------------------------------------------

/**
 * Builds a wa.me click-to-chat URL with the configured business number.
 * @param message - Pre-filled message text (will be URI-encoded).
 */
export function getChatUrl(message?: string): string {
  const phone = getFormattedPhone();
  if (message) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${phone}`;
}

// ---------------------------------------------------------------------------
// Message Template Builders
// ---------------------------------------------------------------------------

/**
 * Generates a rich, complete WhatsApp order summary message.
 * Includes: business name, order number, customer, items, quantities,
 * total, delivery date, time, and address.
 */
export function buildOrderMessage(
  order: Partial<Order>,
  items: (CartItem | OrderItem)[]
): string {
  const businessName = _cachedBusinessName;

  let msg = `🌸 *${businessName} — Order Summary*\n\n`;

  if (order.order_number) {
    msg += `*Order #:* ${order.order_number}\n`;
  }

  msg += `*Customer:* ${order.customer_name || 'Valued Customer'}\n`;
  if (order.customer_phone) {
    msg += `*Phone:* ${order.customer_phone}\n`;
  }

  // Items list
  msg += `\n📦 *Items Ordered:*\n`;
  items.forEach((item, i) => {
    if ('product' in item) {
      const variant = item.selected_variant ? ` (${item.selected_variant.name})` : '';
      const price = (item.selected_variant?.price ?? item.product.price) * item.quantity;
      msg += `${i + 1}. ${item.product.name}${variant} × ${item.quantity} = ₹${price}\n`;
    } else {
      const variant = item.selected_variant ? ` (${item.selected_variant})` : '';
      msg += `${i + 1}. ${item.product_name}${variant} × ${item.quantity} = ₹${item.subtotal || item.total_price}\n`;
    }
  });

  // Financial summary
  const subtotal = order.subtotal;
  const deliveryFee = order.delivery_fee;
  const total = order.total || order.total_amount;

  if (subtotal !== undefined) {
    msg += `\n💰 *Subtotal:* ₹${subtotal}`;
  }
  if (deliveryFee !== undefined) {
    msg += `\n🚚 *Delivery Fee:* ${deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}`;
  }
  if (total !== undefined) {
    msg += `\n✅ *Total:* ₹${total}`;
  }

  // Delivery details
  const address = order.delivery_address || order.recipient_address;
  if (address) {
    let fullAddr = address;
    if (order.delivery_city) fullAddr += `, ${order.delivery_city}`;
    if (order.delivery_pincode) fullAddr += ` - ${order.delivery_pincode}`;
    msg += `\n\n📍 *Delivery Address:* ${fullAddr}`;
  }
  if (order.delivery_date) {
    msg += `\n📅 *Delivery Date:* ${order.delivery_date}`;
  }
  if (order.delivery_time_slot) {
    msg += `\n🕐 *Time Slot:* ${order.delivery_time_slot}`;
  }

  // Card message
  if (order.notes || order.card_message) {
    msg += `\n\n💌 *Card Note:* "${order.notes || order.card_message}"`;
  }

  msg += `\n\nPlease confirm availability and delivery schedule. Thank you! 🙏`;

  return msg;
}

/**
 * Returns a click-to-chat URL with the full order summary message.
 */
export function getOrderChatUrl(
  order: Partial<Order>,
  items: (CartItem | OrderItem)[]
): string {
  return getChatUrl(buildOrderMessage(order, items));
}

/**
 * Returns a click-to-chat URL for a product inquiry.
 */
export function getProductInquiryUrl(
  productName: string,
  productUrl: string,
  price: number
): string {
  const msg = `Namaskara ${_cachedBusinessName}! 🌸\nI would like to order/inquire about:\n\n*${productName}*\nPrice: ₹${price}\nLink: ${productUrl}\n\nIs this available for delivery in Ramanagara / Bengaluru?`;
  return getChatUrl(msg);
}

/**
 * Returns a click-to-chat URL for a detailed product order (from Product Detail page).
 */
export function getDetailedProductOrderUrl(opts: {
  productName: string;
  variantName?: string;
  quantity: number;
  totalPrice: number;
  city: string;
  deliveryDate: string;
  deliverySlot: string;
  cardMessage?: string;
  productUrl: string;
}): string {
  let msg = `Namaskara ${_cachedBusinessName}! 🌸\n\nI would like to order:\n*${opts.productName}${opts.variantName ? ` (${opts.variantName})` : ''}*\nQuantity: ${opts.quantity}\nPrice: ₹${opts.totalPrice}\n\n📍 Delivery City: ${opts.city}\n📅 Delivery Date: ${opts.deliveryDate} (${opts.deliverySlot})`;
  if (opts.cardMessage) {
    msg += `\n💌 Card Note: "${opts.cardMessage}"`;
  }
  msg += `\n\nPlease confirm availability and payment details. Link: ${opts.productUrl}`;
  return getChatUrl(msg);
}

/**
 * Returns a click-to-chat URL for a general greeting.
 */
export function getGreetingUrl(extraText?: string): string {
  const msg = extraText
    ? `Namaskara ${_cachedBusinessName}! ${extraText}`
    : `Namaskara ${_cachedBusinessName}! I would like to order flowers.`;
  return getChatUrl(msg);
}

/**
 * Returns a click-to-chat URL for order tracking inquiry.
 */
export function getOrderInquiryUrl(orderNumber: string, customerName?: string): string {
  const msg = customerName
    ? `Namaskara ${_cachedBusinessName}! I have a question regarding my order ${orderNumber} for ${customerName}.`
    : `Namaskara ${_cachedBusinessName}! I am inquiring about order reference: ${orderNumber}`;
  return getChatUrl(msg);
}

/**
 * Returns a click-to-chat URL for admin to send order status update to customer.
 */
export function getAdminOrderUpdateUrl(order: Partial<Order>, siteOrigin: string): string {
  const customerPhone = (order.customer_phone || '').replace(/\D/g, '');
  const phone = customerPhone.startsWith('91') ? customerPhone : `91${customerPhone}`;
  const msg = `Namaskara ${order.customer_name}! Updating you regarding your ${_cachedBusinessName} order ${order.order_number}: Current Status is *${(order.order_status || 'pending').replace(/_/g, ' ').toUpperCase()}*. Scheduled for delivery on ${order.delivery_date} in ${order.delivery_city}. Track live status: ${siteOrigin}/track?order=${order.order_number}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Returns a click-to-chat URL for admin modal order update.
 */
export function getAdminOrderModalUrl(order: Partial<Order>, siteOrigin: string): string {
  const customerPhone = (order.customer_phone || '').replace(/\D/g, '');
  const phone = customerPhone.startsWith('91') ? customerPhone : `91${customerPhone}`;
  const msg = `Namaskara ${order.customer_name}! This is ${_cachedBusinessName} updating you on order ${order.order_number}. Track live status: ${siteOrigin}/track?order=${order.order_number}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

/**
 * Returns a click-to-chat URL for contact form inquiries.
 */
export function getContactInquiryUrl(name: string, phone: string, city: string, message: string): string {
  const msg = `Namaskara ${_cachedBusinessName}! 🌸\n\n*Name:* ${name}\n*Phone:* ${phone}\n*City:* ${city}\n\n*Message:* ${message}`;
  return getChatUrl(msg);
}

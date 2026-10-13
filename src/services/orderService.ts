import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Order,
  OrderStatus,
  BusinessSettings,
  CartItem,
  OrderItem,
  DeliveryZone,
  Customer
} from '../types';
import * as whatsappService from './whatsappService';
import {
  createOrder,
  getOrder,
  trackOrder,
  getOrders,
  getOrdersPaginated,
  updateOrderStatus,
  setActiveOrderPrefix,
  getActiveOrderPrefix,
  setActiveOperatingSettings,
  getActiveOperatingSettings,
  OrderQueryFilters,
  PaginatedOrdersResponse,
} from './dataAccess';

export const orderService = {
  // 1. Core Order Operations backed by live Supabase PostgreSQL
  async getOrders(filters?: OrderQueryFilters): Promise<Order[]> {
    return getOrders(filters);
  },

  async getOrdersPaginated(filters?: OrderQueryFilters): Promise<PaginatedOrdersResponse> {
    return getOrdersPaginated(filters);
  },

  async getOrderById(id: string): Promise<Order | null> {
    return getOrder(id);
  },

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return getOrder(orderNumber);
  },

  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    return trackOrder(orderNumber, phone);
  },

  async getOrder(idOrNumber: string): Promise<Order | null> {
    return getOrder(idOrNumber);
  },

  async createOrder(orderData: Partial<Order>, items: (CartItem | OrderItem)[]): Promise<Order> {
    return createOrder(orderData, items);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
    try {
      await updateOrderStatus(id, status);
      return true;
    } catch (err) {
      console.error('[orderService] updateOrderStatus failed:', err);
      return false;
    }
  },

  // 2. Delivery Zones
  async getDeliveryZones(): Promise<DeliveryZone[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('is_active', true)
          .order('delivery_fee', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as DeliveryZone[];
        }
      } catch (err) {
        console.warn('Supabase getDeliveryZones failed:', err);
      }
    }

    return [
      { id: 'zone-1', name: 'Ramanagara Town & Surroundings', pincode: '562159', delivery_fee: 49, is_active: true },
      { id: 'zone-2', name: 'Channapatna Silk City Zone', pincode: '562160', delivery_fee: 79, is_active: true },
      { id: 'zone-3', name: 'Bidadi Industrial & Town Area', pincode: '562109', delivery_fee: 89, is_active: true },
      { id: 'zone-4', name: 'Kengeri & RR Nagar (South Bengaluru)', pincode: '560060', delivery_fee: 149, is_active: true },
      { id: 'zone-5', name: 'Jayanagar & JP Nagar (South Bengaluru)', pincode: '560011', delivery_fee: 149, is_active: true },
      { id: 'zone-6', name: 'Koramangala & HSR (Central Bengaluru)', pincode: '560034', delivery_fee: 169, is_active: true },
      { id: 'zone-7', name: 'Indiranagar & MG Road (East Bengaluru)', pincode: '560038', delivery_fee: 179, is_active: true },
      { id: 'zone-8', name: 'Whitefield & Bellandur Tech Hub', pincode: '560066', delivery_fee: 199, is_active: true },
    ];
  },

  // 3. Business Settings
  async getBusinessSettings(): Promise<BusinessSettings> {
    const activePrefix = getActiveOrderPrefix();

    // Check localStorage cache first for client persistence
    let localCache: Partial<BusinessSettings> = {};
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('padma_floral_settings_cache');
        if (stored) {
          localCache = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    }

    const inMemoryCache: any = getActiveOperatingSettings() || {};

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .single();

        if (!error && data) {
          if (data.order_number_prefix) {
            setActiveOrderPrefix(data.order_number_prefix);
          }
          // Sync WhatsApp number with centralized service
          whatsappService.syncWhatsAppSettings(data as Partial<BusinessSettings>);
          const merged: BusinessSettings = {
            ...data,
            store_name: data.store_name || data.business_name || "Padma's Floral",
            address: 'Ramanagara Town',
            city: 'Ramanagara',
            phone: '9740030159',
            whatsapp: '7676117596',
            instagram_url: data.instagram_url || 'https://www.instagram.com/__vinxy_/',
            ramanagara_delivery_fee: data.ramanagara_delivery_fee ?? data.delivery_fee ?? 49,
            bengaluru_delivery_fee: data.bengaluru_delivery_fee ?? 149,
            min_lead_time_hours: data.min_lead_time_hours ?? 2,
            is_store_open: inMemoryCache.is_store_open ?? data.is_store_open ?? data.delivery_enabled ?? true,
            order_number_prefix: data.order_number_prefix || inMemoryCache.order_number_prefix || activePrefix || 'FL',
            opening_time: inMemoryCache.opening_time || data.opening_time || localCache.opening_time || '00:00',
            closing_time: inMemoryCache.closing_time || data.closing_time || localCache.closing_time || '23:59',
            timezone: inMemoryCache.timezone || data.timezone || localCache.timezone || 'Asia/Kolkata',
            operating_schedule: inMemoryCache.operating_schedule || data.operating_schedule || localCache.operating_schedule,
            closed_notice: inMemoryCache.closed_notice || data.closed_notice || localCache.closed_notice || "We're currently closed. Please check our opening hours.",
          };
          return merged;
        }
      } catch (err) {
        console.warn('Supabase getBusinessSettings failed:', err);
      }
    }

    return {
      id: 'default-settings',
      business_name: "Padma's Floral",
      store_name: "Padma's Floral",
      phone: '9740030159',
      whatsapp: '7676117596',
      instagram_url: 'https://www.instagram.com/__vinxy_/',
      email: 'padmasfloral@gmail.com',
      address: 'Ramanagara Town',
      city: 'Ramanagara',
      pincode: '562159',
      delivery_enabled: true,
      delivery_fee: 49,
      ramanagara_delivery_fee: 49,
      bengaluru_delivery_fee: 149,
      free_delivery_threshold: 1499,
      minimum_order_amount: 199,
      min_lead_time_hours: 2,
      announcement_banner: '🌸 All types of flower decorations • Delivery in Ramanagara and Bengaluru • Prices depend on the seasons • Open 24/7',
      is_store_open: inMemoryCache.is_store_open ?? localCache.is_store_open ?? true,
      order_number_prefix: inMemoryCache.order_number_prefix || activePrefix || 'FL',
      opening_time: inMemoryCache.opening_time || localCache.opening_time || '00:00',
      closing_time: inMemoryCache.closing_time || localCache.closing_time || '23:59',
      timezone: inMemoryCache.timezone || localCache.timezone || 'Asia/Kolkata',
      operating_schedule: inMemoryCache.operating_schedule || localCache.operating_schedule,
      closed_notice: inMemoryCache.closed_notice || localCache.closed_notice || "We're currently closed. Please check our opening hours.",
    };
  },

  async updateBusinessSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    if (settings.order_number_prefix) {
      setActiveOrderPrefix(settings.order_number_prefix);
    }
    // Sync WhatsApp number with centralized service
    whatsappService.syncWhatsAppSettings(settings);
    const current = await this.getBusinessSettings();
    const updated: BusinessSettings = { ...current, ...settings };

    // Persist to in-memory active settings for instant sync across server and client functions
    setActiveOperatingSettings(updated);

    // Persist to local cache for instant resilience
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('padma_floral_settings_cache', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    // Base database payload matching verified columns in public.business_settings
    const baseDbPayload: Record<string, any> = {
      store_name: updated.store_name || updated.business_name || "Padma's Floral",
      phone: updated.phone || '9740030159',
      whatsapp: updated.whatsapp || '7676117596',
      address: updated.address || 'Ramanagara, Karnataka',
      ramanagara_delivery_fee: updated.ramanagara_delivery_fee ?? updated.delivery_fee ?? 49,
      bengaluru_delivery_fee: updated.bengaluru_delivery_fee ?? 149,
      free_delivery_threshold: updated.free_delivery_threshold ?? 1499,
      min_lead_time_hours: updated.min_lead_time_hours ?? 2,
      announcement_banner: updated.announcement_banner,
      is_store_open: updated.is_store_open ?? true,
    };

    const extendedPayload: Record<string, any> = {
      ...baseDbPayload,
      ...(updated.order_number_prefix ? { order_number_prefix: (updated.order_number_prefix || 'FL').trim().toUpperCase() } : {}),
      ...(updated.opening_time ? { opening_time: updated.opening_time } : {}),
      ...(updated.closing_time ? { closing_time: updated.closing_time } : {}),
      ...(updated.timezone ? { timezone: updated.timezone } : {}),
      ...(updated.operating_schedule ? { operating_schedule: updated.operating_schedule } : {}),
      ...(updated.closed_notice ? { closed_notice: updated.closed_notice } : {}),
    };

    if (isSupabaseConfigured() && supabase) {
      if (current.id && !current.id.startsWith('default-')) {
        const { error } = await supabase.from('business_settings').update(extendedPayload).eq('id', current.id).select();
        if (error) {
          // If extended columns are not present in DB schema cache, fall back to base guaranteed columns
          const { error: fbErr } = await supabase.from('business_settings').update(baseDbPayload).eq('id', current.id).select();
          if (fbErr) {
            console.warn('Supabase business_settings update warning:', fbErr.message);
          }
        }
      } else {
        const { error } = await supabase.from('business_settings').upsert([extendedPayload]);
        if (error) {
          const { error: fbErr } = await supabase.from('business_settings').upsert([baseDbPayload]);
          if (fbErr) {
            console.warn('Supabase business_settings upsert warning:', fbErr.message);
          }
        }
      }
    }

    return updated;
  },

  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Customer[];
      }
    }
    return [];
  },

  // 4. WhatsApp Deep-Link Generators (delegated to centralized whatsappService)
  generateWhatsAppOrderUrl(
    order: Partial<Order>,
    items: (CartItem | OrderItem)[]
  ): string {
    return whatsappService.getOrderChatUrl(order, items);
  },

  generateProductInquiryWhatsAppUrl(productName: string, productUrl: string, price: number): string {
    return whatsappService.getProductInquiryUrl(productName, productUrl, price);
  }
};

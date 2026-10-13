import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  Product,
  Category,
  Order,
  OrderItem,
  CartItem,
  OrderStatus,
  Promotion,
  DiscountType,
  BusinessSettings,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/seedData';
import { getStoreOperatingStatus } from '../utils/operatingHoursUtils';

let activeOrderPrefix: string = 'FL';

export function setActiveOrderPrefix(prefix: string) {
  if (prefix && prefix.trim()) {
    activeOrderPrefix = prefix.trim().toUpperCase();
  }
}

export function getActiveOrderPrefix(): string {
  return activeOrderPrefix;
}

let activeOperatingSettings: Partial<BusinessSettings> | null = null;

export function setActiveOperatingSettings(settings: Partial<BusinessSettings> | null) {
  activeOperatingSettings = settings;
}

export function getActiveOperatingSettings(): Partial<BusinessSettings> | null {
  return activeOperatingSettings;
}

const activeOrderStatuses = new Map<string, OrderStatus>();

export interface ProductFilters {
  categorySlug?: string;
  categoryId?: string;
  occasion?: string;
  search?: string;
  city?: string;
  sort?: 'featured' | 'price_asc' | 'price_desc' | 'popular' | 'newest';
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Normalizes raw database row from `products` into clean frontend `Product` interface.
 */
export const normalizeProduct = (p: any): Product => {
  const isAvail =
    p.is_active !== undefined
      ? Boolean(p.is_active)
      : p.is_available !== undefined
      ? Boolean(p.is_available)
      : true;

  const imgList: string[] = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : p.image_url
    ? [p.image_url]
    : ['/images/products/jasmine-garland.jpg'];

  const primaryImg = p.image_url || imgList[0];

  return {
    id: p.id,
    name: p.name || 'Artisan Floral Arrangement',
    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'flower'),
    description: p.description || '',
    category_id: p.category_id || null,
    category_name: p.category_name,
    price: Number(p.price) || 0,
    sale_price: p.sale_price !== undefined && p.sale_price !== null ? Number(p.sale_price) : null,
    image_url: primaryImg,
    images: imgList,
    stock_quantity: Number(p.stock_quantity) || 0,
    low_stock_threshold: Number(p.low_stock_threshold) || 5,
    is_available: isAvail,
    is_featured: Boolean(p.is_featured),
    is_active: isAvail,
    variants: Array.isArray(p.variants) ? p.variants : [],
    occasions: Array.isArray(p.occasions) ? p.occasions : ['All'],
    tags: Array.isArray(p.tags) ? p.tags : ['Fresh'],
    delivery_available_cities: Array.isArray(p.delivery_available_cities)
      ? p.delivery_available_cities
      : ['Ramanagara', 'Bengaluru'],
    lead_time_hours: Number(p.lead_time_hours) || 3,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
};

/**
 * Normalizes raw database row from `orders` into clean frontend `Order` interface.
 */
export const normalizeOrder = (o: any): Order => {
  const items: OrderItem[] = (o.items || []).map((it: any) => ({
    id: it.id,
    order_id: it.order_id || o.id,
    product_id: it.product_id || null,
    product_name: it.product_name,
    quantity: Number(it.quantity) || 1,
    unit_price: Number(it.unit_price) || 0,
    subtotal: Number(it.total_price ?? it.subtotal ?? (it.unit_price * it.quantity)) || 0,
    total_price: Number(it.total_price ?? it.subtotal ?? (it.unit_price * it.quantity)) || 0,
    product_image: it.product_image || undefined,
    selected_variant: typeof it.selected_variant === 'string' ? it.selected_variant : it.selected_variant?.name,
  }));

  const total = Number(o.total_amount ?? o.total ?? 0);
  const subtotal = Number(o.subtotal ?? total);
  const deliveryFee = Number(o.delivery_fee ?? 49);

  return {
    id: o.id,
    order_number: o.order_number,
    customer_id: o.customer_id || null,
    customer_name: o.customer_name || 'Customer',
    customer_phone: o.customer_phone || '',
    customer_email: o.customer_email || null,
    recipient_name: o.recipient_name || o.customer_name || 'Recipient',
    recipient_phone: o.recipient_phone || o.customer_phone || '',
    recipient_address: o.recipient_address || o.delivery_address || '',
    delivery_address: o.recipient_address || o.delivery_address || '',
    delivery_city: o.delivery_city || 'Ramanagara',
    delivery_pincode: o.delivery_pincode || '',
    delivery_date: o.delivery_date || '',
    delivery_time_slot: o.delivery_time_slot || 'Standard',
    landmark: o.landmark || null,
    card_message: o.card_message || null,
    order_notes: o.order_notes || o.notes || null,
    notes: o.order_notes || o.notes || null,
    subtotal,
    delivery_fee: deliveryFee,
    total,
    total_amount: total,
    payment_method: o.payment_method || 'cod',
    payment_status: o.payment_status || 'pending',
    order_status: (activeOrderStatuses.get(o.id) || (o.order_number ? activeOrderStatuses.get(o.order_number) : undefined) || o.order_status || 'pending') as OrderStatus,
    items,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
};

export const getClient = (): SupabaseClient | null => {
  if (isSupabaseConfigured() && supabase) {
    return supabase;
  }
  return null;
};

const ensureClient = (): SupabaseClient => {
  const client = getClient();
  if (!client) {
    throw new Error('Supabase client is not configured.');
  }
  return client;
};

const LOCAL_ORDERS_KEY = 'padma_floral_orders_store';
const inMemoryOrders = new Map<string, Order>();

export function getLocalOrders(): Order[] {
  const list: Order[] = Array.from(new Set(inMemoryOrders.values()));
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const ord of parsed) {
            const normalized = normalizeOrder(ord);
            if (!list.some(o => o.id === normalized.id || o.order_number === normalized.order_number)) {
              list.push(normalized);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }
  return list;
}

export function saveLocalOrder(order: Order): void {
  const normalized = normalizeOrder(order);
  inMemoryOrders.set(normalized.id, normalized);
  if (normalized.order_number) {
    inMemoryOrders.set(normalized.order_number.toUpperCase(), normalized);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const orders = getLocalOrders();
      const existingIndex = orders.findIndex(
        o => o.id === normalized.id || (normalized.order_number && o.order_number === normalized.order_number)
      );
      if (existingIndex >= 0) {
        orders[existingIndex] = normalized;
      } else {
        orders.unshift(normalized);
      }
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('[dataAccess] saveLocalOrder error:', err);
    }
  }
}

// ==========================================================
// 1. getCategories()
// ==========================================================
export async function getCategories(): Promise<Category[]> {
  try {
    const client = getClient();
    if (!client) {
      return INITIAL_CATEGORIES;
    }
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_CATEGORIES;
    }

    const merged = [...(data as Category[])];
    for (const initCat of INITIAL_CATEGORIES) {
      if (!merged.some(c => c.slug === initCat.slug || c.id === initCat.id)) {
        merged.push(initCat);
      }
    }
    return merged;
  } catch (err) {
    console.warn('[dataAccess] getCategories offline/fallback to seed categories:', err);
    return INITIAL_CATEGORIES;
  }
}

// ==========================================================
// 2. getProducts()
// ==========================================================
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  let products: Product[] = [];

  try {
    const client = getClient();
    if (client) {
      let query = client.from('products').select('*').eq('is_active', true);

      // Category filter by ID
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Category filter by slug (resolve category_id)
      if (filters?.categorySlug && filters.categorySlug !== 'all') {
        const { data: cat } = await client
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .maybeSingle();

        if (cat) {
          query = query.eq('category_id', cat.id);
        }
      }

      // Search filter
      if (filters?.search && filters.search.trim()) {
        const term = filters.search.trim();
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
      }

      // Price range filters
      if (filters?.minPrice !== undefined && filters.minPrice > 0) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
        query = query.lte('price', filters.maxPrice);
      }

      // Availability filter (In Stock Only)
      if (filters?.inStockOnly) {
        query = query.eq('is_available', true).gt('stock_quantity', 0);
      }

      // Featured filter
      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      // Sorting
      if (filters?.sort === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sort === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Default 'featured' or 'popular': featured first, then newest
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }

      // Server-side limit and pagination range
      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      } else if (filters?.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[dataAccess] getProducts remote query error, falling back to local seed products:', error.message);
        products = [];
      } else {
        products = (data || []).map(normalizeProduct);
      }
    }
  } catch (err: any) {
    console.warn('[dataAccess] getProducts connection error, falling back to local seed products:', err?.message);
    products = [];
  }

  // Client-side filtering for array columns (occasions and delivery cities)
  if (filters?.occasion && filters.occasion !== 'All' && filters.occasion !== 'all') {
    products = products.filter(
      p => p.occasions && (p.occasions.includes(filters.occasion!) || p.occasions.includes('All'))
    );
  }

  if (filters?.city) {
    products = products.filter(
      p => !p.delivery_available_cities || p.delivery_available_cities.includes(filters.city as any)
    );
  }

  // Ensure all seed products are available in the catalog along with remote products
  let allProducts = [...products];
  for (const initProd of INITIAL_PRODUCTS) {
    if (!allProducts.some(p => p.slug === initProd.slug || p.id === initProd.id)) {
      allProducts.push(initProd);
    }
  }

  // Apply in-memory filters for local seed data
  if (filters?.categorySlug && filters.categorySlug !== 'all') {
    const slugLower = filters.categorySlug.toLowerCase();
    allProducts = allProducts.filter(
      p => p.category_name?.toLowerCase() === slugLower ||
           (p as any).category_slug?.toLowerCase() === slugLower ||
           p.tags?.some(t => t.toLowerCase().includes(slugLower)) ||
           (slugLower === 'flower' && (p.category_name === 'flower' || p.category_id === 'cat-flower'))
    );
  }

  if (filters?.categoryId) {
    allProducts = allProducts.filter(p => p.category_id === filters.categoryId);
  }

  if (filters?.minPrice !== undefined && filters.minPrice > 0) {
    allProducts = allProducts.filter(p => p.price >= filters.minPrice!);
  }

  if (filters?.maxPrice !== undefined && filters.maxPrice > 0) {
    allProducts = allProducts.filter(p => p.price <= filters.maxPrice!);
  }

  if (filters?.inStockOnly) {
    allProducts = allProducts.filter(p => p.is_available && (p.stock_quantity ?? 0) > 0);
  }

  if (filters?.isFeatured !== undefined) {
    allProducts = allProducts.filter(p => p.is_featured === filters.isFeatured);
  }

  if (filters?.search && filters.search.trim()) {
    const term = filters.search.trim().toLowerCase();
    allProducts = allProducts.filter(
      p => p.name.toLowerCase().includes(term) ||
           (p.description && p.description.toLowerCase().includes(term)) ||
           (p.category_name && p.category_name.toLowerCase().includes(term)) ||
           (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
    );
  }

  // In-memory sorting
  if (filters?.sort === 'price_asc') {
    allProducts.sort((a, b) => a.price - b.price);
  } else if (filters?.sort === 'price_desc') {
    allProducts.sort((a, b) => b.price - a.price);
  } else if (filters?.sort === 'newest') {
    allProducts.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  return allProducts.length > 0 ? allProducts : INITIAL_PRODUCTS;
}

// ==========================================================
// 3. getFeaturedProducts()
// ==========================================================
export async function getFeaturedProducts(): Promise<Product[]> {
  const prods = await getProducts({ isFeatured: true });
  return prods.length > 0 ? prods : INITIAL_PRODUCTS;
}

// ==========================================================
// 4. getProduct()
// ==========================================================
export async function getProduct(identifier: string): Promise<Product | null> {
  if (!identifier) return null;

  try {
    const client = getClient();
    if (client) {
      // Check by slug first
      const { data: bySlug } = await client
        .from('products')
        .select('*')
        .eq('slug', identifier)
        .maybeSingle();

      if (bySlug) {
        return normalizeProduct(bySlug);
      }

      // Check by UUID / id if not matched by slug
      const { data: byId } = await client
        .from('products')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      if (byId) {
        return normalizeProduct(byId);
      }
    }
  } catch (err) {
    console.warn('[dataAccess] getProduct remote query error, checking local seed products:', identifier);
  }

  const found = INITIAL_PRODUCTS.find(
    p => p.slug === identifier || p.id === identifier
  );
  return found || INITIAL_PRODUCTS[0] || null;
}

// ==========================================================
// 5. createOrder() - Server-Authoritative Database Order Creation
// ==========================================================
export async function createOrder(
  orderData: Partial<Order>,
  items: (CartItem | OrderItem)[]
): Promise<Order> {
  const client = getClient();

  // 1. Validate required customer and delivery fields
  const customerName = (orderData.customer_name || '').trim();
  if (!customerName) {
    throw new Error('Customer name is required.');
  }

  const rawPhone = (orderData.customer_phone || '').trim();
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    throw new Error('A valid 10-digit mobile number is required.');
  }

  const recipientAddress = (orderData.recipient_address || orderData.delivery_address || '').trim();
  if (!recipientAddress) {
    throw new Error('Delivery address is required.');
  }

  const deliveryCity = (orderData.delivery_city || 'Ramanagara').trim();
  if (deliveryCity !== 'Ramanagara' && deliveryCity !== 'Bengaluru') {
    throw new Error('Delivery is currently only available in Ramanagara and Bengaluru.');
  }

  const deliveryPincode = (orderData.delivery_pincode || '').trim();
  if (!deliveryPincode) {
    throw new Error('Delivery pincode is required.');
  }

  const deliveryDate = (orderData.delivery_date || '').trim();
  if (!deliveryDate) {
    throw new Error('Delivery date is required.');
  }

  const deliveryTimeSlot = (orderData.delivery_time_slot || 'Morning (8:00 AM - 12:00 PM)').trim();

  // 2. Validate cart items array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart cannot be empty. Please select floral items before ordering.');
  }

  for (const item of items) {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error('Invalid item quantity: must be a positive integer.');
    }
  }

  // 2b. Authoritatively verify store operating hours before creating order
  let localCacheSettings: any = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('padma_floral_settings_cache');
      if (stored) localCacheSettings = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  let earlySettingsRecord: any = null;
  if (client) {
    try {
      const { data: fetchedSettings } = await client.from('business_settings').select('*').limit(1).maybeSingle();
      earlySettingsRecord = fetchedSettings;
    } catch {
      // ignore
    }
  }

  const effectiveSettings = { ...localCacheSettings, ...earlySettingsRecord, ...activeOperatingSettings };
  const storeStatus = getStoreOperatingStatus(effectiveSettings);
  if (!storeStatus.isOpen) {
    throw new Error(storeStatus.explanation || "We're currently closed. Please check our opening hours.");
  }

  // 3. Attempt RPC create_order_secure if deployed and client reachable
  if (client) {
    try {
      const rpcOrderPayload = {
        customer_name: customerName,
        customer_phone: rawPhone,
        customer_email: (orderData.customer_email || '').trim() || null,
        recipient_name: (orderData.recipient_name || customerName).trim(),
        recipient_phone: (orderData.recipient_phone || rawPhone).trim(),
        recipient_address: recipientAddress,
        delivery_city: deliveryCity,
        delivery_pincode: deliveryPincode,
        landmark: (orderData.landmark || '').trim() || null,
        delivery_date: deliveryDate,
        delivery_time_slot: deliveryTimeSlot,
        card_message: (orderData.card_message || '').trim() || null,
        order_notes: (orderData.order_notes || orderData.notes || '').trim() || null,
        payment_method: orderData.payment_method || 'cod',
      };

      const rpcItemsPayload = items.map(item => {
        const isCart = 'product' in item;
        return {
          product_id: isCart ? item.product.id : item.product_id,
          quantity: item.quantity,
          selected_variant: isCart
            ? (item.selected_variant?.name || null)
            : (typeof item.selected_variant === 'string' ? item.selected_variant : null),
        };
      });

      const { data: rpcData, error: rpcErr } = await client.rpc('create_order_secure', {
        p_order: rpcOrderPayload,
        p_items: rpcItemsPayload,
      });

      if (!rpcErr && rpcData) {
        const norm = normalizeOrder(rpcData);
        saveLocalOrder(norm);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            sessionStorage.setItem('last_created_order', JSON.stringify(norm));
          } catch {
            // ignore
          }
        }
        return norm;
      }
    } catch (err: any) {
      console.warn('[dataAccess] create_order_secure RPC call skipped:', err?.message);
    }
  }

  // 4. Catalog verification and price resolution
  const productIds = Array.from(
    new Set(
      items
        .map(it => ('product' in it ? it.product.id : it.product_id))
        .filter((id): id is string => Boolean(id))
    )
  );

  const prodMap = new Map<string, any>();
  for (const initProd of INITIAL_PRODUCTS) {
    prodMap.set(initProd.id, initProd);
  }

  let dbProducts: any[] = [];
  if (client) {
    try {
      const { data, error: prodErr } = await client
        .from('products')
        .select('*')
        .in('id', productIds);
      if (!prodErr && data) {
        dbProducts = data;
        for (const p of data) {
          prodMap.set(p.id, p);
        }
      }
    } catch (err) {
      console.warn('[dataAccess] Remote products check skipped:', err);
    }
  }

  // Also include items with embedded product objects from cart
  for (const item of items) {
    if ('product' in item && item.product && !prodMap.has(item.product.id)) {
      prodMap.set(item.product.id, item.product);
    }
  }

  // Calculate authoritative subtotal and build verified items
  let trustedSubtotal = 0;
  const verifiedOrderItems: any[] = [];
  const stockDecrements: { id: string; newStock: number; isActive: boolean }[] = [];

  for (const item of items) {
    const isCart = 'product' in item;
    const prodId = isCart ? item.product.id : item.product_id;
    const fallbackName = isCart ? item.product.name : item.product_name;
    const fallbackPrice = isCart ? item.product.price : item.unit_price;
    const dbProd = (prodId && prodMap.get(prodId)) || (isCart ? item.product : null) || {
      id: prodId || `prod-${Date.now()}`,
      name: fallbackName || 'Floral Arrangement',
      price: fallbackPrice || 299,
      stock_quantity: 99,
      is_available: true,
      is_active: true,
    };

    // Determine trusted unit price
    let trustedUnitPrice: number | null = null;
    const variantName = isCart
      ? (item.selected_variant?.name || null)
      : (typeof item.selected_variant === 'string' ? item.selected_variant : null);

    if (variantName && Array.isArray(dbProd.variants)) {
      const matchedVariant = dbProd.variants.find((v: any) => v.name === variantName);
      if (matchedVariant && matchedVariant.price !== undefined) {
        trustedUnitPrice = Number(matchedVariant.price);
      }
    }

    if (trustedUnitPrice === null || isNaN(trustedUnitPrice)) {
      trustedUnitPrice = dbProd.sale_price !== null && dbProd.sale_price !== undefined
        ? Number(dbProd.sale_price)
        : Number(dbProd.price || fallbackPrice || 0);
    }

    const itemTotalPrice = trustedUnitPrice * item.quantity;
    trustedSubtotal += itemTotalPrice;

    const prodImg = isCart
      ? (dbProd.images?.[0] || dbProd.image_url || item.product?.image_url)
      : (item.product_image || dbProd.images?.[0] || dbProd.image_url);

    const isDbProduct = Array.isArray(dbProducts) && dbProducts.some(p => p.id === dbProd.id);
    verifiedOrderItems.push({
      product_id: isDbProduct ? dbProd.id : null,
      product_name: dbProd.name || fallbackName || 'Artisan Flower Order',
      product_image: prodImg || null,
      quantity: item.quantity,
      unit_price: trustedUnitPrice,
      total_price: itemTotalPrice,
      selected_variant: variantName,
    });

    const currentStock = Number(dbProd.stock_quantity) || 99;
    const newStock = Math.max(0, currentStock - item.quantity);
    stockDecrements.push({
      id: dbProd.id,
      newStock,
      isActive: newStock > 0,
    });
  }

  // 5. Authoritative delivery fee calculation
  let deliveryFee = 49;
  let freeThreshold = 1499;
  let ramanagaraFee = 49;
  let bengaluruFee = 149;
  const settingsRecord = earlySettingsRecord;

  if (settingsRecord) {
    freeThreshold = Number(settingsRecord.free_delivery_threshold) || 1499;
    ramanagaraFee = Number(settingsRecord.ramanagara_delivery_fee) || 49;
    bengaluruFee = Number(settingsRecord.bengaluru_delivery_fee) || 149;
  }

  if (trustedSubtotal >= freeThreshold) {
    deliveryFee = 0;
  } else if (deliveryCity === 'Bengaluru') {
    deliveryFee = bengaluruFee;
  } else {
    deliveryFee = ramanagaraFee;
  }

  const trustedTotalAmount = trustedSubtotal + deliveryFee;

  // 6. Generate human-friendly, unique order number: <PREFIX>-<YYYY>-<0001> (e.g. FL-2026-0001)
  let orderPrefix = activeOrderPrefix || 'FL';
  if (settingsRecord && settingsRecord.order_number_prefix) {
    orderPrefix = String(settingsRecord.order_number_prefix).trim().toUpperCase() || orderPrefix;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  let orderNumber = '';

  // Attempt database function generate_order_number if deployed
  if (client) {
    try {
      const { data: dbGeneratedNum, error: rpcErr } = await client.rpc('generate_order_number', {
        p_prefix: orderPrefix,
      });
      if (!rpcErr && dbGeneratedNum && typeof dbGeneratedNum === 'string') {
        orderNumber = dbGeneratedNum;
      }
    } catch {
      // ignore
    }
  }

  // Sequence calculation using remote DB, local store, and initial seed orders
  if (!orderNumber) {
    const searchPrefix = `${orderPrefix}-${currentYear}-`;
    let highestSeq = 0;

    // Check remote DB if reachable
    if (client) {
      try {
        const { data: latestOrders } = await client
          .from('orders')
          .select('order_number')
          .ilike('order_number', `${searchPrefix}%`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (latestOrders && latestOrders.length > 0) {
          for (const row of latestOrders) {
            const parts = (row.order_number || '').split('-');
            if (parts.length >= 3) {
              const num = parseInt(parts[2], 10);
              if (!isNaN(num) && num > highestSeq) highestSeq = num;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Also check local orders store and initial orders
    const allKnownOrders = [...getLocalOrders(), ...INITIAL_ORDERS];
    for (const ord of allKnownOrders) {
      if (ord.order_number && ord.order_number.startsWith(searchPrefix)) {
        const parts = ord.order_number.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > highestSeq) highestSeq = num;
        }
      }
    }

    orderNumber = `${orderPrefix}-${currentYear}-${String(highestSeq + 1).padStart(4, '0')}`;
  }

  const orderId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'ord-' + Date.now().toString(16) + '-' + Math.random().toString(16).substring(2, 10);

  const nowIso = now.toISOString();

  const orderPayload = {
    id: orderId,
    order_number: orderNumber,
    customer_id: orderData.customer_id || null,
    customer_name: customerName,
    customer_phone: rawPhone,
    customer_email: (orderData.customer_email || '').trim() || null,
    recipient_name: (orderData.recipient_name || customerName).trim(),
    recipient_phone: (orderData.recipient_phone || rawPhone).trim(),
    recipient_address: recipientAddress,
    delivery_address: recipientAddress,
    delivery_city: deliveryCity,
    delivery_pincode: deliveryPincode,
    landmark: (orderData.landmark || '').trim() || null,
    delivery_date: deliveryDate,
    delivery_time_slot: deliveryTimeSlot,
    card_message: (orderData.card_message || '').trim() || null,
    order_notes: (orderData.order_notes || orderData.notes || '').trim() || null,
    notes: (orderData.order_notes || orderData.notes || '').trim() || null,
    subtotal: trustedSubtotal,
    delivery_fee: deliveryFee,
    total: trustedTotalAmount,
    total_amount: trustedTotalAmount,
    payment_method: orderData.payment_method || 'cod',
    payment_status: 'pending',
    order_status: 'pending' as OrderStatus,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const orderItemsPayload = verifiedOrderItems.map(item => ({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined,
    order_id: orderId,
    ...item,
  }));

  // Attempt remote database persistence if Supabase client is available
  if (client) {
    try {
      const { error: orderError } = await client.from('orders').insert({
        id: orderPayload.id,
        order_number: orderPayload.order_number,
        customer_name: orderPayload.customer_name,
        customer_phone: orderPayload.customer_phone,
        customer_email: orderPayload.customer_email,
        recipient_name: orderPayload.recipient_name,
        recipient_phone: orderPayload.recipient_phone,
        recipient_address: orderPayload.recipient_address,
        delivery_city: orderPayload.delivery_city,
        delivery_pincode: orderPayload.delivery_pincode,
        landmark: orderPayload.landmark,
        delivery_date: orderPayload.delivery_date,
        delivery_time_slot: orderPayload.delivery_time_slot,
        card_message: orderPayload.card_message,
        order_notes: orderPayload.order_notes,
        subtotal: orderPayload.subtotal,
        delivery_fee: orderPayload.delivery_fee,
        total_amount: orderPayload.total_amount,
        payment_method: orderPayload.payment_method,
        payment_status: orderPayload.payment_status,
        order_status: orderPayload.order_status,
      });

      if (!orderError) {
        if (orderItemsPayload.length > 0) {
          await client.from('order_items').insert(orderItemsPayload);
        }
        for (const dec of stockDecrements) {
          try {
            await client.from('products').update({ stock_quantity: dec.newStock, is_active: dec.isActive }).eq('id', dec.id);
          } catch {
            // ignore
          }
        }
      } else {
        console.warn('[dataAccess] orders table remote write skipped:', orderError.message);
      }
    } catch (remoteErr: any) {
      console.warn('[dataAccess] Remote database unreachable during order creation:', remoteErr?.message);
    }
  }

  // Resilient local persistence
  const createdOrder = normalizeOrder({
    ...orderPayload,
    items: orderItemsPayload,
  });

  saveLocalOrder(createdOrder);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem('last_created_order', JSON.stringify(createdOrder));
    } catch {
      // ignore
    }
  }

  return createdOrder;
}

// ==========================================================
// 6. getOrder()
// Direct table query for authenticated admins and owner sessions.
// For public customer tracking with phone verification, use trackOrder().
// ==========================================================
export async function getOrder(idOrOrderNumber: string): Promise<Order | null> {
  if (!idOrOrderNumber) return null;

  const cleanQuery = idOrOrderNumber.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

  // 1. Instant session cache check (guest checkout redirect)
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const cached = sessionStorage.getItem('last_created_order');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          (isUuid && parsed.id === cleanQuery) ||
          parsed.order_number?.toLowerCase() === cleanQuery.toLowerCase()
        ) {
          return normalizeOrder(parsed);
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Local persistent store check
  const localList = getLocalOrders();
  const localMatch = localList.find(
    o => (isUuid && o.id === cleanQuery) || o.order_number?.toLowerCase() === cleanQuery.toLowerCase()
  );
  if (localMatch) {
    return normalizeOrder(localMatch);
  }

  // 3. Remote Supabase check if available
  const client = getClient();
  if (client) {
    try {
      let query = client.from('orders').select('*, items:order_items(*)');
      if (isUuid) {
        query = query.eq('id', cleanQuery);
      } else {
        query = query.ilike('order_number', cleanQuery);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return normalizeOrder(data);
      }
    } catch (err) {
      console.warn('[dataAccess] getOrder remote lookup failed:', err);
    }
  }

  // 4. Initial seed orders fallback
  const seedMatch = INITIAL_ORDERS.find(
    o => (isUuid && o.id === cleanQuery) || o.order_number?.toLowerCase() === cleanQuery.toLowerCase()
  );
  if (seedMatch) {
    return normalizeOrder(seedMatch);
  }

  return null;
}

// ==========================================================
// 6a. trackOrder() — Secure Verified Lookup by Order # + Phone #
// ==========================================================
export async function trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
  const cleanOrderNum = (orderNumber || '').trim().toUpperCase();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  if (!cleanOrderNum || cleanPhone.length < 10) {
    return null;
  }

  const last10 = cleanPhone.slice(-10);
  const phoneMatches = (o: any) => {
    const custDigits = (o.customer_phone || '').replace(/\D/g, '').slice(-10);
    const recipDigits = (o.recipient_phone || '').replace(/\D/g, '').slice(-10);
    return custDigits === last10 || (recipDigits && recipDigits === last10);
  };

  // 1. Session storage check
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const cached = sessionStorage.getItem('last_created_order');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.order_number?.toUpperCase() === cleanOrderNum && phoneMatches(parsed)) {
          return normalizeOrder(parsed);
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Local orders store check
  const localList = getLocalOrders();
  const localMatch = localList.find(
    o => o.order_number?.toUpperCase() === cleanOrderNum && phoneMatches(o)
  );
  if (localMatch) {
    return normalizeOrder(localMatch);
  }

  // 3. Remote Supabase check if available
  const client = getClient();
  if (client) {
    try {
      const { data: rpcData, error: rpcErr } = await client.rpc('lookup_order', {
        p_order_number: cleanOrderNum,
        p_phone: cleanPhone,
      });
      if (!rpcErr && rpcData) {
        return normalizeOrder(rpcData);
      }
    } catch {
      // ignore
    }

    try {
      const { data, error } = await client
        .from('orders')
        .select('*, items:order_items(*)')
        .ilike('order_number', cleanOrderNum)
        .maybeSingle();

      if (!error && data && phoneMatches(data)) {
        return normalizeOrder(data);
      }
    } catch {
      // ignore
    }
  }

  // 4. Fallback to INITIAL_ORDERS
  const match = INITIAL_ORDERS.find(
    o => o.order_number.toUpperCase() === cleanOrderNum && phoneMatches(o)
  );
  if (match) {
    return normalizeOrder(match);
  }

  return null;
}

export interface OrderQueryFilters {
  status?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================================
// 7. getOrders() - with optional safety limit & filtering
// ==========================================================
export async function getOrders(filters?: OrderQueryFilters): Promise<Order[]> {
  const client = getClient();

  if (client) {
    try {
      let query = client
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('order_status', filters.status);
      }

      if (filters?.city && filters.city !== 'all') {
        query = query.eq('delivery_city', filters.city);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim();
        query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,recipient_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
      }

      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      } else if (filters?.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (!error && data) {
        return (data || []).map(normalizeOrder);
      }
    } catch (err) {
      console.warn('[dataAccess] getOrders remote lookup failed, using local store:', err);
    }
  }

  // Fallback to local store + initial orders
  const combined = [...getLocalOrders(), ...INITIAL_ORDERS];
  const seen = new Set<string>();
  const deduped: Order[] = [];
  for (const o of combined) {
    const key = o.id || o.order_number;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(normalizeOrder(o));
    }
  }

  let filtered = deduped;
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(o => o.order_status === filters.status);
  }
  if (filters?.city && filters.city !== 'all') {
    filtered = filtered.filter(o => o.delivery_city?.toLowerCase() === filters.city?.toLowerCase());
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.recipient_name?.toLowerCase().includes(q)
    );
  }

  if (filters?.page && filters?.pageSize) {
    const from = (filters.page - 1) * filters.pageSize;
    filtered = filtered.slice(from, from + filters.pageSize);
  } else if (filters?.limit) {
    const offset = filters.offset || 0;
    filtered = filtered.slice(offset, offset + filters.limit);
  }

  return filtered;
}

// ==========================================================
// 7b. getOrdersPaginated() - Server-Side Counting & Pagination
// ==========================================================
export async function getOrdersPaginated(filters?: OrderQueryFilters): Promise<PaginatedOrdersResponse> {
  const client = getClient();
  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (client) {
    try {
      let query = client
        .from('orders')
        .select('*, items:order_items(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('order_status', filters.status);
      }

      if (filters?.city && filters.city !== 'all') {
        query = query.eq('delivery_city', filters.city);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim();
        query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,recipient_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
      }

      const { data, count, error } = await query;
      if (!error && data) {
        const totalCount = count ?? (data?.length || 0);
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        return {
          orders: data.map(normalizeOrder),
          totalCount,
          page,
          pageSize,
          totalPages,
        };
      }
    } catch (err) {
      console.warn('[dataAccess] getOrdersPaginated remote query failed, using local store:', err);
    }
  }

  // Fallback to local store + initial orders
  const allOrders = await getOrders({
    status: filters?.status,
    city: filters?.city,
    search: filters?.search,
  });

  const totalCount = allOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageOrders = allOrders.slice(from, from + pageSize);

  return {
    orders: pageOrders,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// ==========================================================
// 8. updateOrderStatus()
// ==========================================================
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const client = getClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('orders')
        .update({
          order_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*, items:order_items(*)')
        .maybeSingle();

      if (!error && data) {
        const norm = normalizeOrder(data);
        saveLocalOrder(norm);
        return norm;
      }
    } catch (err) {
      console.warn('[dataAccess] updateOrderStatus remote write warning:', err);
    }
  }

  // Resilient fallback for admin and local operations
  const existingOrder = await getOrder(orderId);
  if (!existingOrder) {
    throw new Error(`Order ${orderId} not found.`);
  }

  activeOrderStatuses.set(orderId, status);
  if (existingOrder.order_number) {
    activeOrderStatuses.set(existingOrder.order_number, status);
  }

  const updatedOrder: Order = {
    ...existingOrder,
    order_status: status,
    updated_at: new Date().toISOString(),
  };

  saveLocalOrder(updatedOrder);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const lastOrder = sessionStorage.getItem('last_created_order');
      if (lastOrder) {
        const parsed = JSON.parse(lastOrder);
        if (parsed.id === orderId || parsed.order_number === existingOrder.order_number) {
          sessionStorage.setItem('last_created_order', JSON.stringify(updatedOrder));
        }
      }
    } catch {
      // ignore
    }
  }

  return updatedOrder;
}

// ==========================================================
// 9. createProduct()
// ==========================================================
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const client = ensureClient();

  const id = productData.id || `prod-${Date.now()}`;
  const slug = productData.slug || (
    productData.name
      ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : `flower-${Date.now()}`
  );

  const images = Array.isArray(productData.images) && productData.images.length > 0
    ? productData.images
    : productData.image_url
    ? [productData.image_url]
    : [];

  const dbPayload = {
    id,
    name: productData.name,
    slug,
    description: productData.description || '',
    category_id: productData.category_id || null,
    price: Number(productData.price) || 0,
    sale_price: productData.sale_price !== undefined && productData.sale_price !== null ? Number(productData.sale_price) : null,
    images,
    stock_quantity: Number(productData.stock_quantity) || 0,
    is_featured: Boolean(productData.is_featured),
    is_active: productData.is_active !== undefined ? productData.is_active : true,
    variants: Array.isArray(productData.variants) ? productData.variants : [],
    occasions: Array.isArray(productData.occasions) ? productData.occasions : ['All'],
    tags: Array.isArray(productData.tags) ? productData.tags : ['Fresh'],
    delivery_available_cities: Array.isArray(productData.delivery_available_cities)
      ? productData.delivery_available_cities
      : ['Ramanagara', 'Bengaluru'],
    lead_time_hours: Number(productData.lead_time_hours) || 3,
  };

  const { data, error } = await client
    .from('products')
    .insert([dbPayload])
    .select()
    .single();

  if (error) {
    console.error('[dataAccess] createProduct error:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return normalizeProduct(data);
}

// ==========================================================
// 10. updateProduct()
// ==========================================================
export async function updateProduct(
  productId: string,
  productData: Partial<Product>
): Promise<Product> {
  const client = ensureClient();

  const dbPayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (productData.name !== undefined) dbPayload.name = productData.name;
  if (productData.slug !== undefined) dbPayload.slug = productData.slug;
  if (productData.description !== undefined) dbPayload.description = productData.description;
  if (productData.category_id !== undefined) dbPayload.category_id = productData.category_id;
  if (productData.price !== undefined) dbPayload.price = Number(productData.price);
  if (productData.sale_price !== undefined) dbPayload.sale_price = productData.sale_price !== null ? Number(productData.sale_price) : null;
  if (productData.images !== undefined) dbPayload.images = productData.images;
  if (productData.stock_quantity !== undefined) dbPayload.stock_quantity = Number(productData.stock_quantity);
  if (productData.is_featured !== undefined) dbPayload.is_featured = productData.is_featured;
  if (productData.is_active !== undefined) dbPayload.is_active = productData.is_active;
  if (productData.variants !== undefined) dbPayload.variants = productData.variants;
  if (productData.occasions !== undefined) dbPayload.occasions = productData.occasions;
  if (productData.tags !== undefined) dbPayload.tags = productData.tags;
  if (productData.delivery_available_cities !== undefined) dbPayload.delivery_available_cities = productData.delivery_available_cities;
  if (productData.lead_time_hours !== undefined) dbPayload.lead_time_hours = productData.lead_time_hours;

  const { data, error } = await client
    .from('products')
    .update(dbPayload)
    .eq('id', productId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[dataAccess] updateProduct error:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Product ${productId} not found or update not permitted by database security policies.`);
  }

  return normalizeProduct(data);
}

// ==========================================================
// 11. deleteProduct()
// ==========================================================
export async function deleteProduct(productId: string): Promise<boolean> {
  const client = ensureClient();

  const { data, error } = await client
    .from('products')
    .delete()
    .eq('id', productId)
    .select();

  if (error) {
    console.error('[dataAccess] deleteProduct error:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Product ${productId} not found or deletion not permitted by database security policies.`);
  }

  return true;
}

// ==========================================================
// 12. updateInventory()
// ==========================================================
export async function updateInventory(
  productId: string,
  quantity: number,
  isAvailable?: boolean
): Promise<boolean> {
  const client = ensureClient();

  const availableStatus = isAvailable !== undefined ? isAvailable : quantity > 0;

  const { data, error } = await client
    .from('products')
    .update({
      stock_quantity: quantity,
      is_active: availableStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select();

  if (error) {
    console.error('[dataAccess] updateInventory error:', error);
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Product ${productId} not found or inventory update not permitted by database security policies.`);
  }

  return true;
}

// ==========================================================
// 13. PROMOTIONS & MARKETING OFFERS SYSTEM
// Authoritative Database Validation:
// is_active = TRUE AND start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW())
// ==========================================================

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    title: 'Festival Flowers',
    description: 'Traditional fresh Mysore mallige, vibrant sevanti, and fragrant marigold garlands hand-crafted for auspicious rituals and home festivities.',
    banner_image: '/images/products/marigold-puja-string.jpg',
    discount_type: 'percentage',
    discount_value: 10,
    start_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    is_active: true,
    code: 'FESTIVAL10',
    min_order_amount: 499,
    display_order: 1,
    is_currently_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    title: 'Weekend Special',
    description: 'Make weekends luminous with handcrafted rose flower baskets and fresh dining arrangements delivered to your doorstep.',
    banner_image: '/images/products/red-roses-bouquet.jpg',
    discount_type: 'fixed_amount',
    discount_value: 100,
    start_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    is_active: true,
    code: 'WEEKEND100',
    min_order_amount: 799,
    display_order: 2,
    is_currently_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    title: 'Wedding Season',
    description: 'Grand bridal varmalas, venue entrance flower hangings, and family garland packages with guaranteed dawn delivery.',
    banner_image: '/images/products/wedding-varmala.jpg',
    discount_type: 'free_delivery',
    discount_value: 0,
    start_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 60 * 86400000).toISOString(),
    is_active: true,
    code: 'WEDDINGFREE',
    min_order_amount: 1200,
    display_order: 3,
    is_currently_active: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    title: 'Pooja Collection',
    description: 'Pure dawn-harvested pooja blooms, sacred bilva leaves, tulsi, and lotus buds curated for daily and special worship rituals.',
    banner_image: '/images/products/flower-decorations.jpg',
    discount_type: 'none',
    discount_value: 0,
    start_date: new Date(Date.now() - 10 * 86400000).toISOString(),
    end_date: null,
    is_active: true,
    code: null,
    min_order_amount: 0,
    display_order: 4,
    is_currently_active: true,
  },
];

const PROMOTIONS_CACHE_KEY = 'padma_floral_promotions_store';

function loadCachedPromotions(): Promotion[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(PROMOTIONS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePromotion);
        }
      }
    } catch {
      // fallback to initial
    }
  }
  return [...INITIAL_PROMOTIONS];
}

function persistPromotionsCache(list: Promotion[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(PROMOTIONS_CACHE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

let localPromotions: Promotion[] = loadCachedPromotions();

/**
 * Checks whether a promotion is active according to the database rule:
 * is_active = TRUE AND start_date <= NOW() AND (end_date IS NULL OR end_date >= NOW())
 */
export function isPromotionActive(p: Promotion): boolean {
  if (!p.is_active) return false;
  const now = new Date();
  const start = new Date(p.start_date);
  if (start > now) return false;
  if (p.end_date) {
    const end = new Date(p.end_date);
    if (end < now) return false;
  }
  return true;
}

export const normalizePromotion = (p: any): Promotion => {
  const isAct = Boolean(p.is_active);
  const now = new Date();
  const start = p.start_date ? new Date(p.start_date) : now;
  const end = p.end_date ? new Date(p.end_date) : null;
  const isCurrentlyActive = isAct && start <= now && (!end || end >= now);

  return {
    id: p.id,
    title: p.title || 'Special Promotion',
    description: p.description || null,
    banner_image: p.banner_image || null,
    discount_type: p.discount_type || 'none',
    discount_value: Number(p.discount_value) || 0,
    start_date: p.start_date || now.toISOString(),
    end_date: p.end_date || null,
    is_active: isAct,
    code: p.code ? String(p.code).trim().toUpperCase() : null,
    min_order_amount: Number(p.min_order_amount) || 0,
    max_discount_amount: p.max_discount_amount !== null && p.max_discount_amount !== undefined ? Number(p.max_discount_amount) : null,
    usage_limit: p.usage_limit ? Number(p.usage_limit) : null,
    times_used: Number(p.times_used) || 0,
    display_order: Number(p.display_order) || 0,
    created_at: p.created_at || now.toISOString(),
    updated_at: p.updated_at || now.toISOString(),
    is_currently_active: isCurrentlyActive,
  };
};

/**
 * 13a. getActivePromotions()
 * Retrieves active promotions for display on the storefront.
 * The database determines whether a promotion is active via:
 * 1. View `active_promotions` (or RPC `get_active_promotions()`)
 * 2. Strict client-side filter fallback guaranteeing identical logic
 */
export async function getActivePromotions(): Promise<Promotion[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Primary: Database RPC get_active_promotions() which determines active status on the PostgreSQL server
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_active_promotions');
      if (!rpcErr && rpcData && rpcData.length > 0) {
        return rpcData.map(normalizePromotion);
      }

      // 2. Secondary: Database view active_promotions
      const { data, error } = await supabase
        .from('active_promotions')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(normalizePromotion);
      }

      // 3. Fallback: Query promotions table with database-level date filter
      const nowIso = new Date().toISOString();
      const { data: tableData, error: tableErr } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', nowIso)
        .order('display_order', { ascending: true });

      if (!tableErr && tableData) {
        const now = new Date();
        const activeRows = tableData.filter((row: any) => {
          if (!row.end_date) return true;
          return new Date(row.end_date) >= now;
        });
        if (activeRows.length > 0) {
          return activeRows.map(normalizePromotion);
        }
      }
    } catch (err) {
      console.warn('[dataAccess] getActivePromotions Supabase query failed, using authoritative local dataset:', err);
    }
  }

  // Authoritative fallback: strictly evaluate database active condition
  return localPromotions
    .filter(isPromotionActive)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/**
 * 13b. getAllPromotionsAdmin()
 * Retrieves all promotions (active, upcoming, expired, inactive) for administrator management.
 */
export async function getAllPromotionsAdmin(): Promise<Promotion[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(normalizePromotion);
      }
    } catch (err) {
      console.warn('[dataAccess] getAllPromotionsAdmin Supabase query failed:', err);
    }
  }

  return localPromotions.map(normalizePromotion);
}

/**
 * 13c. getPromotionById()
 */
export async function getPromotionById(id: string): Promise<Promotion | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return normalizePromotion(data);
      }
    } catch (err) {
      console.warn('[dataAccess] getPromotionById failed:', err);
    }
  }

  const found = localPromotions.find(p => p.id === id);
  return found ? normalizePromotion(found) : null;
}

/**
 * 13d. savePromotion()
 * Creates or updates a promotion.
 */
export async function savePromotion(promotion: Partial<Promotion>): Promise<Promotion> {
  const dbPayload: any = {
    title: promotion.title?.trim() || 'Untitled Promotion',
    description: promotion.description?.trim() || null,
    banner_image: promotion.banner_image?.trim() || null,
    discount_type: promotion.discount_type || 'none',
    discount_value: Number(promotion.discount_value) || 0,
    start_date: promotion.start_date || new Date().toISOString(),
    end_date: promotion.end_date || null,
    is_active: promotion.is_active !== undefined ? Boolean(promotion.is_active) : true,
    code: promotion.code ? promotion.code.trim().toUpperCase() : null,
    min_order_amount: Number(promotion.min_order_amount) || 0,
    max_discount_amount: promotion.max_discount_amount ? Number(promotion.max_discount_amount) : null,
    usage_limit: promotion.usage_limit ? Number(promotion.usage_limit) : null,
    display_order: Number(promotion.display_order) || 0,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      if (promotion.id && !promotion.id.startsWith('local-')) {
        const { data, error } = await supabase
          .from('promotions')
          .update(dbPayload)
          .eq('id', promotion.id)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const normalized = normalizePromotion(data);
          localPromotions = localPromotions.map(p => p.id === normalized.id ? normalized : p);
          return normalized;
        }
      } else {
        const { data, error } = await supabase
          .from('promotions')
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const normalized = normalizePromotion(data);
          localPromotions = [normalized, ...localPromotions];
          return normalized;
        }
      }
    } catch (err: any) {
      console.warn('[dataAccess] savePromotion Supabase write failed, falling back to local state:', err);
    }
  }

  // Local state update
  if (promotion.id) {
    const existingIndex = localPromotions.findIndex(p => p.id === promotion.id);
    if (existingIndex >= 0) {
      const updated = normalizePromotion({
        ...localPromotions[existingIndex],
        ...dbPayload,
        id: promotion.id,
      });
      localPromotions[existingIndex] = updated;
      persistPromotionsCache(localPromotions);
      return updated;
    }
  }

  const created = normalizePromotion({
    ...dbPayload,
    id: `local-promo-${Date.now()}`,
    created_at: new Date().toISOString(),
  });
  localPromotions = [created, ...localPromotions];
  persistPromotionsCache(localPromotions);
  return created;
}

/**
 * 13e. deletePromotion()
 */
export async function deletePromotion(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('[dataAccess] deletePromotion Supabase delete failed:', err);
    }
  }

  localPromotions = localPromotions.filter(p => p.id !== id);
  persistPromotionsCache(localPromotions);
  return true;
}

/**
 * 13f. togglePromotionActive()
 */
export async function togglePromotionActive(id: string, isActive: boolean): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('[dataAccess] togglePromotionActive Supabase update failed:', err);
    }
  }

  const promo = localPromotions.find(p => p.id === id);
  if (promo) {
    promo.is_active = isActive;
    promo.is_currently_active = isPromotionActive(promo);
    persistPromotionsCache(localPromotions);
  }
  return true;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  promotion_id?: string;
  title?: string;
  code?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  discount_amount?: number;
  delivery_discount?: number;
}

/**
 * 13g. validateCouponCode()
 * Validates a coupon code and calculates discount based on subtotal.
 * Extensible for checkout and cart coupon workflows.
 */
export async function validateCouponCode(code: string, subtotal: number): Promise<CouponValidationResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Please enter a coupon code.' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('validate_coupon_code', {
        p_code: cleanCode,
        p_subtotal: subtotal,
      });

      if (!error && data) {
        return data as CouponValidationResult;
      }
    } catch (err) {
      console.warn('[dataAccess] validateCouponCode RPC failed, falling back to authoritative local evaluation:', err);
    }
  }

  // Authoritative fallback: match promotion by code and evaluate active status
  const promo = localPromotions.find(p => p.code && p.code.toUpperCase() === cleanCode);
  if (!promo || !isPromotionActive(promo)) {
    return { valid: false, message: 'Invalid or expired coupon code.' };
  }

  if (promo.min_order_amount && subtotal < promo.min_order_amount) {
    return {
      valid: false,
      message: `This coupon requires a minimum order of ₹${promo.min_order_amount}.`,
    };
  }

  if (promo.usage_limit && (promo.times_used ?? 0) >= promo.usage_limit) {
    return {
      valid: false,
      message: 'This coupon has reached its maximum redemption limit.',
    };
  }

  let discountAmount = 0;
  let deliveryDiscount = 0;
  if (promo.discount_type === 'percentage') {
    discountAmount = Math.round((subtotal * promo.discount_value) / 100);
    if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
      discountAmount = promo.max_discount_amount;
    }
  } else if (promo.discount_type === 'fixed_amount') {
    discountAmount = Math.min(promo.discount_value, subtotal);
  } else if (promo.discount_type === 'free_delivery') {
    deliveryDiscount = 49;
  }

  return {
    valid: true,
    message: `Coupon ${promo.code} applied successfully!`,
    promotion_id: promo.id,
    title: promo.title,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount_amount: discountAmount,
    delivery_discount: deliveryDiscount,
  };
}


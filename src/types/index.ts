export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface ProductVariant {
  name: string;
  price: number;
  description?: string;
}

export interface Product {
  id: string; // UUID
  name: string;
  slug: string;
  description: string;
  category_id?: string; // UUID
  category_name?: string;
  price: number;
  sale_price?: number | null;
  image_url?: string;
  images: string[];
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  is_active: boolean;
  variants: ProductVariant[];
  occasions: string[];
  tags: string[];
  delivery_available_cities: ('Ramanagara' | 'Bengaluru' | string)[];
  lead_time_hours: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  email?: string | null;
  default_address?: string;
  default_city?: string;
  default_pincode?: string;
  total_orders?: number;
  total_spent?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string; // unique item id in cart (combination of product id + variant)
  product: Product;
  quantity: number;
  selected_variant?: ProductVariant;
  custom_message?: string;
}

export interface OrderItem {
  id: string; // UUID
  order_id?: string; // UUID
  product_id?: string | null; // UUID
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total_price: number;
  product_image?: string;
  selected_variant?: string;
}

export type DeliveryCity = 'Ramanagara' | 'Bengaluru';

export type PaymentMethod = 'upi' | 'cod' | 'whatsapp';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string; // UUID
  order_number: string;
  customer_id?: string | null; // UUID
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  delivery_address: string;
  delivery_city: DeliveryCity | string;
  delivery_pincode: string;
  delivery_date: string;
  delivery_time_slot: string;
  notes?: string | null;
  landmark?: string | null;
  card_message?: string | null;
  order_notes?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at?: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayOperatingSchedule {
  day: DayOfWeek;
  label: string;      // e.g. "Monday"
  isOpen: boolean;
  openTime: string;   // e.g. "06:00"
  closeTime: string;  // e.g. "21:00"
}

export interface BusinessSettings {
  id: string; // UUID
  business_name: string;
  store_name: string;
  phone: string;
  whatsapp: string;
  email?: string | null;
  address: string;
  city: string;
  pincode: string;
  instagram_url?: string | null;
  facebook_url?: string | null;
  delivery_enabled: boolean;
  delivery_fee: number;
  ramanagara_delivery_fee: number;
  bengaluru_delivery_fee: number;
  free_delivery_threshold: number;
  minimum_order_amount: number;
  min_lead_time_hours: number;
  announcement_banner: string;
  is_store_open: boolean;
  order_number_prefix?: string;
  
  // Timezone-Aware Operating Hours & Day-Specific Availability
  opening_time?: string; // Default: "06:00"
  closing_time?: string; // Default: "21:00"
  timezone?: string; // Default: "Asia/Kolkata"
  operating_schedule?: DayOperatingSchedule[];
  closed_notice?: string; // Default: "We're currently closed. Please check our opening hours."

  updated_at?: string;
}

export interface DeliveryZone {
  id: string; // UUID
  name: string;
  pincode: string;
  delivery_fee: number;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  city: 'Ramanagara' | 'Bengaluru';
  rating: number;
  review_text: string;
  occasion: string;
  date: string;
  is_published: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description?: string;
}

export type DiscountType = 'none' | 'percentage' | 'fixed_amount' | 'free_delivery';

export interface Promotion {
  id: string; // UUID
  title: string;
  description?: string | null;
  banner_image?: string | null;
  discount_type: DiscountType;
  discount_value: number; // e.g. 10 (10%), 100 (₹100), or 0 for none / free delivery
  start_date: string; // ISO 8601 string
  end_date?: string | null; // ISO 8601 string or null for ongoing
  is_active: boolean;
  
  // Future-proof Coupon Code & Targeting Extensibility
  code?: string | null;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  times_used?: number;
  display_order?: number;
  
  created_at?: string;
  updated_at?: string;
  
  // Computed / metadata
  is_currently_active?: boolean;
}


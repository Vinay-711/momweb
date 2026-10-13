import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, ProductVariant, CartItem, DeliveryCity, BusinessSettings } from '../types';
import { INITIAL_BUSINESS_SETTINGS } from '../data/seedData';
import { orderService } from '../services/orderService';
import { getStoreOperatingStatus, StoreOperatingStatus } from '../utils/operatingHoursUtils';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, custom_message?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  selectedCity: DeliveryCity;
  setSelectedCity: (city: DeliveryCity) => void;
  deliveryFee: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  businessSettings: BusinessSettings;
  operatingStatus: StoreOperatingStatus;
  refreshSettings: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'padma_floral_cart';
const CITY_STORAGE_KEY = 'padma_floral_city';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedCity, setSelectedCityState] = useState<DeliveryCity>(() => {
    try {
      const stored = localStorage.getItem(CITY_STORAGE_KEY);
      return stored === 'Bengaluru' ? 'Bengaluru' : 'Ramanagara';
    } catch {
      return 'Ramanagara';
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_BUSINESS_SETTINGS);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  const refreshSettings = useCallback(async () => {
    try {
      const data = await orderService.getBusinessSettings();
      if (data) setSettings(data);
    } catch (err) {
      console.warn('Failed to refresh business settings in CartContext:', err);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Keep operating hours status up to date by updating time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const operatingStatus = useMemo(
    () => getStoreOperatingStatus(settings, currentTime),
    [settings, currentTime]
  );

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to store cart', e);
    }
  }, [cart]);

  const setSelectedCity = useCallback((city: DeliveryCity) => {
    setSelectedCityState(city);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, city);
    } catch (e) {
      console.error('Failed to store city preference', e);
    }
  }, []);

  const addToCart = useCallback((
    product: Product,
    quantity = 1,
    variant?: ProductVariant,
    custom_message?: string
  ) => {
    setCart(prev => {
      const variantKey = variant ? variant.name : 'standard';
      const itemId = `${product.id}-${variantKey}`;
      const existing = prev.find(item => item.id === itemId);

      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity, custom_message: custom_message || item.custom_message }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: itemId,
            product,
            quantity,
            selected_variant: variant,
            custom_message,
          },
        ];
      }
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== cartItemId));
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const unitPrice = item.selected_variant?.price ?? item.product.sale_price ?? item.product.price;
        return sum + unitPrice * item.quantity;
      }, 0),
    [cart]
  );

  const baseDeliveryFee =
    selectedCity === 'Bengaluru'
      ? (settings.bengaluru_delivery_fee ?? INITIAL_BUSINESS_SETTINGS.bengaluru_delivery_fee)
      : (settings.ramanagara_delivery_fee ?? INITIAL_BUSINESS_SETTINGS.ramanagara_delivery_fee);

  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const threshold = settings.free_delivery_threshold ?? INITIAL_BUSINESS_SETTINGS.free_delivery_threshold;
    return subtotal >= threshold ? 0 : baseDeliveryFee;
  }, [cart.length, subtotal, settings.free_delivery_threshold, baseDeliveryFee]);

  const totalAmount = useMemo(
    () => (cart.length === 0 ? 0 : subtotal + deliveryFee),
    [cart.length, subtotal, deliveryFee]
  );

  const contextValue = useMemo<CartContextType>(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    selectedCity,
    setSelectedCity,
    deliveryFee,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
    businessSettings: settings,
    operatingStatus,
    refreshSettings,
  }), [
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    selectedCity,
    setSelectedCity,
    deliveryFee,
    totalAmount,
    isCartOpen,
    settings,
    operatingStatus,
    refreshSettings,
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

const defaultCartContext: CartContextType = {
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  selectedCity: 'Ramanagara',
  setSelectedCity: () => {},
  deliveryFee: 49,
  totalAmount: 49,
  isCartOpen: false,
  setIsCartOpen: () => {},
  businessSettings: INITIAL_BUSINESS_SETTINGS,
  operatingStatus: getStoreOperatingStatus(INITIAL_BUSINESS_SETTINGS),
  refreshSettings: async () => {},
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    console.warn('[useCart] Hook called outside of CartProvider, using safe fallback context');
    return defaultCartContext;
  }
  return context;
};

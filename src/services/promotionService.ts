import { Promotion, DiscountType } from '../types';
import {
  getActivePromotions,
  getAllPromotionsAdmin,
  getPromotionById,
  savePromotion,
  deletePromotion,
  togglePromotionActive,
  isPromotionActive,
  validateCouponCode,
  CouponValidationResult,
} from './dataAccess';

export const promotionService = {
  /**
   * Retrieves active promotions for public customer display.
   * Determined authoritatively by database rules:
   * is_active = true AND start_date <= now AND (end_date IS NULL OR end_date >= now)
   */
  async getActivePromotions(): Promise<Promotion[]> {
    return getActivePromotions();
  },

  /**
   * Retrieves all promotions for administrator management.
   */
  async getAllPromotionsAdmin(): Promise<Promotion[]> {
    return getAllPromotionsAdmin();
  },

  /**
   * Retrieves single promotion by ID.
   */
  async getPromotionById(id: string): Promise<Promotion | null> {
    return getPromotionById(id);
  },

  /**
   * Creates or updates a promotion.
   */
  async savePromotion(promotion: Partial<Promotion>): Promise<Promotion> {
    return savePromotion(promotion);
  },

  /**
   * Deletes a promotion by ID.
   */
  async deletePromotion(id: string): Promise<boolean> {
    return deletePromotion(id);
  },

  /**
   * Toggles active state.
   */
  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    return togglePromotionActive(id, isActive);
  },

  /**
   * Determines if a promotion is active.
   */
  isPromotionActive(promotion: Promotion): boolean {
    return isPromotionActive(promotion);
  },

  /**
   * Formats a human-friendly discount badge string without inventing fake discounts.
   */
  getDiscountBadgeText(promotion: Promotion): string | null {
    if (promotion.discount_type === 'percentage' && promotion.discount_value > 0) {
      return `${promotion.discount_value}% OFF`;
    }
    if (promotion.discount_type === 'fixed_amount' && promotion.discount_value > 0) {
      return `₹${promotion.discount_value} OFF`;
    }
    if (promotion.discount_type === 'free_delivery') {
      return 'Free Delivery';
    }
    // For 'none' or zero discounts, do not invent fake discounts
    return null;
  },

  /**
   * Calculates discount amount based on order subtotal and coupon/promotion rules.
   * Extensible for coupon code applications during checkout.
   */
  calculateDiscount(promotion: Promotion, subtotal: number, standardDeliveryFee: number = 49): {
    discountAmount: number;
    deliveryDiscount: number;
    qualified: boolean;
    reason?: string;
  } {
    if (!this.isPromotionActive(promotion)) {
      return { discountAmount: 0, deliveryDiscount: 0, qualified: false, reason: 'Promotion is expired or inactive' };
    }

    if (promotion.min_order_amount && subtotal < promotion.min_order_amount) {
      return {
        discountAmount: 0,
        deliveryDiscount: 0,
        qualified: false,
        reason: `Requires minimum order of ₹${promotion.min_order_amount}`,
      };
    }

    let discount = 0;
    let deliveryDiscount = 0;

    if (promotion.discount_type === 'percentage') {
      discount = (subtotal * promotion.discount_value) / 100;
      if (promotion.max_discount_amount && discount > promotion.max_discount_amount) {
        discount = promotion.max_discount_amount;
      }
    } else if (promotion.discount_type === 'fixed_amount') {
      discount = Math.min(promotion.discount_value, subtotal);
    } else if (promotion.discount_type === 'free_delivery') {
      deliveryDiscount = standardDeliveryFee;
    }

    return {
      discountAmount: Math.round(discount),
      deliveryDiscount,
      qualified: true,
    };
  },

  /**
   * Validates a coupon code against active database promotions.
   * Extensible for checkout and cart workflows.
   */
  async validateCouponCode(code: string, subtotal: number): Promise<CouponValidationResult> {
    return validateCouponCode(code, subtotal);
  }
};
export type { CouponValidationResult };

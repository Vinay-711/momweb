import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Category } from '../types';
import {
  getCategories,
  getProducts,
  getFeaturedProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  normalizeProduct,
  ProductFilters,
} from './dataAccess';

export const productService = {
  // 1. Categories
  async getCategories(): Promise<Category[]> {
    return getCategories();
  },

  async getAllCategoriesAdmin(): Promise<Category[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client not configured');
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []) as Category[];
  },

  async saveCategory(category: Partial<Category>): Promise<Category> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client not configured');
    }

    const dbPayload = {
      name: category.name,
      slug: category.slug || (category.name ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'category'),
      description: category.description || null,
      image_url: category.image_url || null,
      display_order: category.display_order ?? 0,
      is_active: category.is_active !== undefined ? category.is_active : true,
    };

    if (category.id && !category.id.startsWith('local-')) {
      const { data, error } = await supabase
        .from('categories')
        .update(dbPayload)
        .eq('id', category.id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert([dbPayload])
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client not configured');
    }
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // 2. Products
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    return getProducts(filters);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    return getFeaturedProducts();
  },

  async getProduct(identifier: string): Promise<Product | null> {
    return getProduct(identifier);
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    return getProduct(slug);
  },

  async getProductById(id: string): Promise<Product | null> {
    return getProduct(id);
  },

  async getAllProductsAdmin(): Promise<Product[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase client not configured');
    }
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeProduct);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (product.id && !product.id.startsWith('local-')) {
      return updateProduct(product.id, product);
    }
    return createProduct(product);
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return createProduct(product);
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return updateProduct(id, product);
  },

  async deleteProduct(id: string): Promise<boolean> {
    return deleteProduct(id);
  },

  async toggleStock(id: string, inStock: boolean): Promise<boolean> {
    return updateInventory(id, inStock ? 15 : 0, inStock);
  },

  async updateInventory(id: string, quantity: number, isAvailable?: boolean): Promise<boolean> {
    return updateInventory(id, quantity, isAvailable);
  }
};

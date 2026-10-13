import React, { useState, useEffect } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product, Category } from '../../types';
import { ImageUploadWidget } from '../../components/ImageUploadWidget';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export const AdminProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Product Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const productTriggerRef = React.useRef<HTMLElement | null>(null);

  // Category Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const categoryTriggerRef = React.useRef<HTMLElement | null>(null);

  const [toastMessage, setToastMessage] = useState('');

  const handleCloseProductModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    productTriggerRef.current?.focus();
  };

  const handleCloseCategoryModal = () => {
    setIsCatModalOpen(false);
    setEditingCategory(null);
    categoryTriggerRef.current?.focus();
  };

  // Keyboard navigation: Escape key closes modals and restores focus
  useEffect(() => {
    if (!isModalOpen && !isCatModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleCloseProductModal();
        if (isCatModalOpen) handleCloseCategoryModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isCatModalOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        productService.getAllProductsAdmin(),
        productService.getAllCategoriesAdmin(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      console.error('[AdminProductsPage] Failed to load catalog from Supabase:', err);
      setError(sanitizeErrorMessage(err, 'Unable to retrieve floral products from database.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // --- Product Handlers ---
  const handleToggleStock = async (product: Product) => {
    const isCurrentlyInStock = product.stock_quantity > 0;
    await productService.toggleStock(product.id, !isCurrentlyInStock);
    setProducts(prev =>
      prev.map(p =>
        p.id === product.id ? { ...p, stock_quantity: isCurrentlyInStock ? 0 : 15 } : p
      )
    );
    showToast(`Updated stock status for ${product.name}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product removed successfully');
    }
  };

  const handleOpenAdd = (triggerOrEvent?: HTMLElement | React.MouseEvent) => {
    if (triggerOrEvent && 'currentTarget' in triggerOrEvent) {
      productTriggerRef.current = triggerOrEvent.currentTarget as HTMLElement;
    } else if (triggerOrEvent && 'focus' in triggerOrEvent) {
      productTriggerRef.current = triggerOrEvent as HTMLElement;
    } else {
      productTriggerRef.current = document.activeElement as HTMLElement;
    }
    setEditingProduct({
      name: '',
      category_id: categories[0]?.id || 'cat-1',
      description: '',
      price: 499,
      sale_price: null,
      stock_quantity: 20,
      image_url: '/images/products/red-roses-bouquet.jpg',
      images: ['/images/products/red-roses-bouquet.jpg'],
      occasions: ['All'],
      tags: ['Fresh'],
      is_featured: false,
      is_active: true,
      lead_time_hours: 2,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product, triggerEl?: HTMLElement) => {
    productTriggerRef.current = triggerEl || (document.activeElement as HTMLElement);
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) return;

    const saved = await productService.saveProduct(editingProduct);

    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    handleCloseProductModal();
    showToast('Product saved successfully with image!');
  };

  // --- Category Handlers ---
  const handleOpenAddCategory = (triggerOrEvent?: HTMLElement | React.MouseEvent) => {
    if (triggerOrEvent && 'currentTarget' in triggerOrEvent) {
      categoryTriggerRef.current = triggerOrEvent.currentTarget as HTMLElement;
    } else if (triggerOrEvent && 'focus' in triggerOrEvent) {
      categoryTriggerRef.current = triggerOrEvent as HTMLElement;
    } else {
      categoryTriggerRef.current = document.activeElement as HTMLElement;
    }
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      image_url: '/images/products/flower-decorations.jpg',
      display_order: categories.length + 1,
      is_active: true,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category, triggerEl?: HTMLElement) => {
    categoryTriggerRef.current = triggerEl || (document.activeElement as HTMLElement);
    setEditingCategory({ ...cat });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) return;

    const saved = await productService.saveCategory(editingCategory);
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    handleCloseCategoryModal();
    showToast('Category banner and settings updated!');
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove category "${name}"?`)) {
      await productService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast('Category removed');
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed top-20 right-4 z-50 bg-[#143D2B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Catalog & Media Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage flower arrangements, category banners, prices, and Supabase Storage photos
          </p>
        </div>

        {activeTab === 'products' ? (
          <button
            onClick={handleOpenAdd}
            className="bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        ) : (
          <button
            onClick={handleOpenAddCategory}
            className="bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-[#143D2B] text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-[#143D2B] text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Category Banners ({categories.length})</span>
        </button>
      </div>

      {/* Error Alert Banner with Retry */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-red-800 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder={activeTab === 'products' ? "Search flower catalog..." : "Search categories..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#143D2B]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs text-stone-500 font-medium">
          Total: {activeTab === 'products' ? filteredProducts.length : filteredCategories.length} items
        </span>
      </div>

      {/* SECTION 1: PRODUCTS TABLE & CARDS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6">
              <table className="w-full">
                <TableRowSkeleton rows={6} columns={6} />
              </table>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No flowers in catalog"
                description={searchQuery ? "No flowers match your search criteria. Try clearing search." : "Add your first flower arrangement to begin showcasing your floral art."}
                primaryAction={{ label: "Add Flower Arrangement", onClick: () => handleOpenAdd() }}
              />
            </div>
          ) : (
            <>
              {/* Mobile Cards (< md) */}
              <div className="block md:hidden p-3 sm:p-4 space-y-3">
                {filteredProducts.map(product => {
                  const isInStock = product.stock_quantity > 0;
                  return (
                    <div
                      key={product.id}
                      className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.image_url || product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              '/images/products/flower-decorations.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-bold text-stone-900 text-sm line-clamp-2 break-words">
                              {product.name}
                            </p>
                            {product.is_featured && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0">
                                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                <span>Featured</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {product.category_name || categories.find(c => c.id === product.category_id)?.name || 'General'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-stone-900 text-sm">
                              ₹{product.sale_price ?? product.price}
                            </span>
                            {product.sale_price && (
                              <span className="text-[10px] text-stone-400 line-through">
                                ₹{product.price}
                              </span>
                            )}
                            <span className="text-[10px] text-stone-400 ml-auto">
                              Lead: {product.lead_time_hours}h
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleStock(product)}
                          className={`touch-target-44 px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-colors min-h-[40px] flex items-center gap-1.5 ${
                            isInStock
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          <span>{isInStock ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="touch-target-44 p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px]"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="touch-target-44 p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px]"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-100 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Item & Photo</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4">Featured</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.map(product => {
                      const isInStock = product.stock_quantity > 0;
                      return (
                        <tr key={product.id} className="hover:bg-stone-50/80">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image_url || product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                                onError={e => {
                                  (e.target as HTMLImageElement).src =
                                    '/images/products/flower-decorations.jpg';
                                }}
                              />
                              <div>
                                <p className="font-bold text-stone-900 line-clamp-1">{product.name}</p>
                                <p className="text-[10px] text-stone-400">Lead: {product.lead_time_hours}h</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-stone-600 font-medium">
                            {product.category_name || categories.find(c => c.id === product.category_id)?.name || 'General'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-stone-900">
                              ₹{product.sale_price ?? product.price}
                            </span>
                            {product.sale_price && (
                              <span className="text-[10px] text-stone-400 line-through block">
                                ₹{product.price}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStock(product)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                                isInStock
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {isInStock ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            {product.is_featured ? (
                              <span className="inline-flex items-center gap-1 text-[#143D2B] font-bold text-[11px]">
                                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">No</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="touch-target-44 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors inline-flex"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="touch-target-44 p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors inline-flex"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION 2: CATEGORIES TABLE & CARDS */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6">
              <table className="w-full">
                <TableRowSkeleton rows={4} columns={4} />
              </table>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No categories found"
                description="Create a category to group your floral bouquets, garlands, and varmalas."
                primaryAction={{ label: "Create Category", onClick: () => handleOpenAddCategory() }}
              />
            </div>
          ) : (
            <>
              {/* Mobile Cards (< md) */}
              <div className="block md:hidden p-3 sm:p-4 space-y-3">
                {filteredCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.image_url || '/images/products/flower-decorations.jpg'}
                        alt={cat.name}
                        className="w-14 h-12 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            '/images/products/flower-decorations.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-stone-900 text-sm truncate">{cat.name}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                              cat.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {cat.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-stone-500 truncate">
                          /{cat.slug}
                        </p>
                        <p className="text-[11px] text-stone-400">Order #{cat.display_order}</p>
                      </div>
                    </div>

                    {cat.description && (
                      <p className="text-[11px] text-stone-600 line-clamp-2 bg-white p-2.5 rounded-xl border border-stone-200/60">
                        {cat.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-200/70 flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="touch-target-44 p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px]"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="touch-target-44 p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px]"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-100 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Banner & Name</th>
                      <th className="py-3.5 px-4">Slug Identifier</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Display Order</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCategories.map(cat => (
                      <tr key={cat.id} className="hover:bg-stone-50/80">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={cat.image_url || '/images/products/flower-decorations.jpg'}
                              alt={cat.name}
                              className="w-14 h-10 rounded-xl object-cover border border-stone-200"
                              onError={e => {
                                (e.target as HTMLImageElement).src =
                                  '/images/products/flower-decorations.jpg';
                              }}
                            />
                            <div>
                              <p className="font-bold text-stone-900 line-clamp-1">{cat.name}</p>
                              <p className="text-[10px] text-stone-400">
                                {cat.image_url?.includes('supabase.co') ? '✓ Supabase Storage' : 'External URL'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600">
                          {cat.slug}
                        </td>

                        <td className="py-3.5 px-4 text-stone-500 max-w-xs line-clamp-1">
                          {cat.description || 'No description'}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-stone-800">
                          #{cat.display_order}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              cat.is_active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {cat.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="touch-target-44 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors inline-flex"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="touch-target-44 p-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors inline-flex"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {isModalOpen && editingProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-prod-modal-title"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl animate-fade-in border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 id="admin-prod-modal-title" className="font-serif font-bold text-lg text-stone-900">
                {editingProduct.id ? 'Edit Flower Product' : 'Add New Flower Arrangement'}
              </h3>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="touch-target-44 p-2 text-stone-400 hover:text-stone-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                aria-label="Close product dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label htmlFor="admin-prod-name" className="font-semibold text-stone-700 block mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-prod-name"
                  type="text"
                  required
                  placeholder="e.g. Royal Jasmine & Rose Garland"
                  value={editingProduct.name || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-prod-category" className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    id="admin-prod-category"
                    value={editingProduct.category_id || categories[0]?.id}
                    onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-prod-stock" className="font-semibold text-stone-700 block mb-1">Stock Quantity</label>
                  <input
                    id="admin-prod-stock"
                    type="number"
                    min="0"
                    value={editingProduct.stock_quantity ?? 10}
                    onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-prod-price" className="font-semibold text-stone-700 block mb-1">
                    Regular Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="admin-prod-price"
                    type="number"
                    required
                    min="1"
                    value={editingProduct.price ?? 499}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="admin-prod-sale-price" className="font-semibold text-stone-700 block mb-1">
                    Sale Price (₹) (Optional discount)
                  </label>
                  <input
                    id="admin-prod-sale-price"
                    type="number"
                    min="1"
                    placeholder="Leave empty if regular"
                    value={editingProduct.sale_price ?? ''}
                    onChange={e => setEditingProduct({ ...editingProduct, sale_price: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>
              </div>

              {/* Supabase Storage Image Upload Widget */}
              <ImageUploadWidget
                currentUrl={editingProduct.image_url || editingProduct.images?.[0] || ''}
                bucket="product-images"
                nameHint={editingProduct.slug || editingProduct.name}
                label="Product Photography (Supabase Storage)"
                onChange={url => {
                  setEditingProduct({
                    ...editingProduct,
                    image_url: url,
                    images: [url],
                  });
                }}
              />

              <div>
                <label htmlFor="admin-prod-desc" className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  id="admin-prod-desc"
                  rows={3}
                  placeholder="Details about flower variety, scent, and cultural significance..."
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-prod-lead-time" className="font-semibold text-stone-700 block mb-1">Lead Time (Hours)</label>
                  <input
                    id="admin-prod-lead-time"
                    type="number"
                    min="1"
                    value={editingProduct.lead_time_hours ?? 2}
                    onChange={e => setEditingProduct({ ...editingProduct, lead_time_hours: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <label htmlFor="admin-prod-featured" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="admin-prod-featured"
                      type="checkbox"
                      checked={Boolean(editingProduct.is_featured)}
                      onChange={e => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                      className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                    />
                    <span className="font-semibold text-stone-700">Show on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  className="touch-target-44 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold min-h-[44px] focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target-44 px-6 py-2.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white rounded-xl font-semibold shadow-md min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CATEGORY */}
      {isCatModalOpen && editingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-cat-modal-title"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 my-8 shadow-2xl animate-fade-in border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 id="admin-cat-modal-title" className="font-serif font-bold text-lg text-stone-900">
                {editingCategory.id ? 'Edit Category & Banner' : 'Create New Floral Category'}
              </h3>
              <button
                type="button"
                onClick={handleCloseCategoryModal}
                className="touch-target-44 p-2 text-stone-400 hover:text-stone-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                aria-label="Close category dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label htmlFor="admin-cat-name" className="font-semibold text-stone-700 block mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="admin-cat-name"
                  type="text"
                  required
                  placeholder="e.g. Traditional & Puja Garlands"
                  value={editingCategory.name || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-cat-slug" className="font-semibold text-stone-700 block mb-1">Slug (URL)</label>
                  <input
                    id="admin-cat-slug"
                    type="text"
                    placeholder="auto-generated-slug"
                    value={editingCategory.slug || ''}
                    onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="admin-cat-order" className="font-semibold text-stone-700 block mb-1">Display Order</label>
                  <input
                    id="admin-cat-order"
                    type="number"
                    min="1"
                    value={editingCategory.display_order ?? 1}
                    onChange={e => setEditingCategory({ ...editingCategory, display_order: Number(e.target.value) })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                  />
                </div>
              </div>

              {/* Supabase Storage Category Image Upload Widget */}
              <ImageUploadWidget
                currentUrl={editingCategory.image_url || ''}
                bucket="category-images"
                nameHint={editingCategory.slug || editingCategory.name}
                label="Category Banner Image (Supabase Storage)"
                onChange={url => {
                  setEditingCategory({
                    ...editingCategory,
                    image_url: url,
                  });
                }}
              />

              <div>
                <label htmlFor="admin-cat-desc" className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  id="admin-cat-desc"
                  rows={3}
                  placeholder="Explain what types of flowers belong to this collection..."
                  value={editingCategory.description || ''}
                  onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                />
              </div>

              <div className="pt-2">
                <label htmlFor="admin-cat-active" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="admin-cat-active"
                    type="checkbox"
                    checked={editingCategory.is_active !== false}
                    onChange={e => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                    className="rounded text-[#143D2B] focus:ring-[#143D2B]"
                  />
                  <span className="font-semibold text-stone-700">Active (Visible in Storefront & Menus)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="touch-target-44 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold min-h-[44px] focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-target-44 px-6 py-2.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white rounded-xl font-semibold shadow-md min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

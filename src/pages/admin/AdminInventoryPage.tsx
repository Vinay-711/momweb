import React, { useState, useEffect } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [toastMessage, setToastMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAllProductsAdmin();
      setProducts(data);
    } catch (err: any) {
      console.error('[AdminInventoryPage] Failed to load inventory:', err);
      setError(sanitizeErrorMessage(err, 'Unable to retrieve floral stock levels.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleUpdateQuantity = async (product: Product, delta: number) => {
    const newQty = Math.max(0, product.stock_quantity + delta);
    const newAvailable = newQty > 0;
    setUpdatingId(product.id);

    // Optimistic local update
    setProducts(prev =>
      prev.map(p => (p.id === product.id ? { ...p, stock_quantity: newQty, is_available: newAvailable } : p))
    );

    try {
      await productService.updateInventory(product.id, newQty, newAvailable);
      showToast(`Updated "${product.name}" stock to ${newQty}`);
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      showToast('Error updating stock');
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    const isCurrentlyIn = product.stock_quantity > 0 && product.is_available;
    const newQty = isCurrentlyIn ? 0 : 15;
    const newAvailable = !isCurrentlyIn;
    setUpdatingId(product.id);

    setProducts(prev =>
      prev.map(p => (p.id === product.id ? { ...p, stock_quantity: newQty, is_available: newAvailable } : p))
    );

    try {
      await productService.updateInventory(product.id, newQty, newAvailable);
      showToast(newAvailable ? `Marked "${product.name}" In Stock` : `Marked "${product.name}" Out of Stock`);
    } catch (err: any) {
      console.error('Failed to toggle stock:', err);
      showToast('Error toggling stock');
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.stock_quantity > 5).length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0 || !p.is_available).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (stockFilter === 'low') return p.stock_quantity > 0 && p.stock_quantity <= 5;
    if (stockFilter === 'out') return p.stock_quantity === 0 || !p.is_available;
    if (stockFilter === 'in') return p.stock_quantity > 5;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 bg-[#143D2B] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-[#D4AF37]/40"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Floral Inventory & Harvest
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time daily bloom counts, stock availability, and Ramanagara harvest replenishment
          </p>
        </div>

        <button
          onClick={loadData}
          aria-label="Refresh stock levels from database"
          className="self-start sm:self-auto touch-target-44 px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Stock Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total SKUs</span>
            <Package className="w-4 h-4 text-stone-600" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{totalProducts}</p>
          <p className="text-[10px] text-stone-500 mt-0.5">Catalog arrangements</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Healthy Stock</span>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">{inStockCount}</p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Available for sale</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-800">{lowStockCount}</p>
          <p className="text-[10px] text-amber-800 font-medium mt-0.5">Needs harvest restock</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 bg-red-50/40 shadow-xs">
          <div className="flex items-center justify-between text-red-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sold Out</span>
            <XCircle className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-red-700">{outOfStockCount}</p>
          <p className="text-[10px] text-red-700 font-medium mt-0.5">Hidden from store</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <label htmlFor="admin-inventory-search" className="sr-only">
            Search flower arrangements in inventory
          </label>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="admin-inventory-search"
            type="text"
            aria-label="Search flower arrangements in inventory"
            placeholder="Search flower arrangements..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#143D2B] focus:bg-white min-h-[40px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="toolbar" aria-label="Inventory stock level filters">
          <button
            onClick={() => setStockFilter('all')}
            aria-pressed={stockFilter === 'all'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              stockFilter === 'all'
                ? 'bg-[#143D2B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({totalProducts})
          </button>
          <button
            onClick={() => setStockFilter('low')}
            aria-pressed={stockFilter === 'low'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              stockFilter === 'low'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter('out')}
            aria-pressed={stockFilter === 'out'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              stockFilter === 'out'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
            }`}
          >
            Sold Out ({outOfStockCount})
          </button>
          <button
            onClick={() => setStockFilter('in')}
            aria-pressed={stockFilter === 'in'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              stockFilter === 'in'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            In Stock ({inStockCount})
          </button>
        </div>
      </div>

      {/* Main Content: Mobile Cards (< 768px) and Desktop Table (>= 768px) */}
      {loading ? (
        <div className="bg-white p-6 rounded-3xl border border-stone-200">
          <table className="w-full">
            <TableRowSkeleton rows={6} columns={6} />
          </table>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Layers}
            title="No matching arrangements found"
            description={searchQuery || stockFilter !== 'all' ? "Try adjusting your search query or stock filter to view arrangements." : "Inventory items will appear here once products are created in the catalog."}
            primaryAction={searchQuery || stockFilter !== 'all' ? { label: "Clear Filters", onClick: () => { setSearchQuery(''); setStockFilter('all'); } } : undefined}
          />
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (Visible only on < md) */}
          <div className="block md:hidden space-y-3">
            {filteredProducts.map(product => {
              const isInStock = product.stock_quantity > 0 && product.is_available;
              const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 transition-all ${
                    !isInStock ? 'border-red-200 bg-red-50/20' : isLow ? 'border-amber-200' : 'border-stone-200'
                  }`}
                >
                  {/* Top Row: Photo, Name, Category, Price */}
                  <div className="flex gap-3 items-center">
                    <img
                      src={product.image_url || product.images[0]}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          '/images/products/flower-decorations.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-[#C84B5B] uppercase tracking-wider">
                          {product.category_name || 'Floral'}
                        </span>
                        <span className="font-bold text-xs text-stone-900">
                          ₹{product.sale_price ?? product.price}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-stone-900 truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            !isInStock
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {!isInStock ? 'Out of Stock' : isLow ? `Low Stock (${product.stock_quantity})` : `In Stock (${product.stock_quantity})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: 44px Increment/Decrement Controls & Instant Toggle */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Stepper with comfortable tap areas */}
                    <div className="flex items-center bg-stone-100 rounded-xl border border-stone-300" role="group" aria-label={`Stock controls for ${product.name}`}>
                      <button
                        onClick={() => handleUpdateQuantity(product, -1)}
                        disabled={product.stock_quantity <= 0 || updatingId === product.id}
                        className="touch-target-44 px-3 text-stone-700 hover:bg-stone-200 disabled:opacity-30 rounded-l-xl"
                        aria-label={`Decrease stock of ${product.name} by 1`}
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span
                        aria-live="polite"
                        aria-label={`Current stock ${product.stock_quantity}`}
                        className="font-mono font-bold text-sm px-3 text-stone-900 min-w-[36px] text-center"
                      >
                        {product.stock_quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(product, 1)}
                        disabled={updatingId === product.id}
                        className="touch-target-44 px-3 text-stone-700 hover:bg-stone-200 rounded-r-xl"
                        aria-label={`Increase stock of ${product.name} by 1`}
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                      {/* Quick batch additions: +5 */}
                      <button
                        onClick={() => handleUpdateQuantity(product, 5)}
                        disabled={updatingId === product.id}
                        aria-label={`Add 5 units of ${product.name} to stock`}
                        className="touch-target-44 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 flex-1 sm:flex-initial text-center justify-center"
                      >
                        +5 Restock
                      </button>

                      {/* Toggle Availability Switch Button */}
                      <button
                        onClick={() => handleToggleAvailable(product)}
                        disabled={updatingId === product.id}
                        aria-label={`Mark ${product.name} as ${isInStock ? 'sold out' : 'in stock'}`}
                        className={`touch-target-44 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center justify-center ${
                          isInStock
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isInStock ? 'Mark Sold Out' : 'Mark Available'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Visible only on md+) */}
          <div className="hidden md:block bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Floral inventory stock management table">
                <thead className="bg-stone-50 text-stone-600 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="py-3.5 px-4" scope="col">Item & Visual</th>
                    <th className="py-3.5 px-4" scope="col">Category</th>
                    <th className="py-3.5 px-4" scope="col">Price</th>
                    <th className="py-3.5 px-4" scope="col">Stock Level</th>
                    <th className="py-3.5 px-4" scope="col">Adjust Units</th>
                    <th className="py-3.5 px-4 text-right" scope="col">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map(product => {
                    const isInStock = product.stock_quantity > 0 && product.is_available;
                    const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;

                    return (
                      <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
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
                              <p className="text-[10px] text-stone-500">ID: {product.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-stone-700 font-medium">
                          {product.category_name || 'Floral'}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          ₹{product.sale_price ?? product.price}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-block ${
                              !isInStock
                                ? 'bg-red-100 text-red-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {!isInStock ? 'Out of Stock' : isLow ? `Low (${product.stock_quantity})` : `In Stock (${product.stock_quantity})`}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5" role="group" aria-label={`Adjust stock for ${product.name}`}>
                            <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                              <button
                                onClick={() => handleUpdateQuantity(product, -1)}
                                disabled={product.stock_quantity <= 0}
                                aria-label={`Decrease stock of ${product.name} by 1`}
                                className="px-2 py-1 text-stone-600 hover:bg-stone-200 rounded-l"
                              >
                                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <span
                                aria-live="polite"
                                aria-label={`Current units: ${product.stock_quantity}`}
                                className="px-3 text-xs font-mono font-bold text-stone-800 min-w-[28px] text-center"
                              >
                                {product.stock_quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(product, 1)}
                                aria-label={`Increase stock of ${product.name} by 1`}
                                className="px-2 py-1 text-stone-600 hover:bg-stone-200 rounded-r"
                              >
                                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleUpdateQuantity(product, 5)}
                              aria-label={`Add 5 units of ${product.name} to stock`}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-semibold border border-stone-200"
                            >
                              +5
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleAvailable(product)}
                            aria-label={`Set ${product.name} as ${isInStock ? 'sold out' : 'in stock'}`}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                              isInStock
                                ? 'bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                            }`}
                          >
                            {isInStock ? 'Set Sold Out' : 'Set In Stock'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

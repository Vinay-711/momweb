import React, { useState, useEffect } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  MapPin,
  MessageCircle,
  ArrowRight,
  Package,
  AlertCircle,
  BarChart3,
  Tag,
  RefreshCw
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import * as whatsappService from '../../services/whatsappService';
import { Order, Product } from '../../types';
import { MetricCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allOrders, allProducts] = await Promise.all([
        orderService.getOrders({ limit: 50 }),
        productService.getAllProductsAdmin(),
      ]);
      setOrders(allOrders);
      setProducts(allProducts);
    } catch (err: any) {
      console.error('[AdminDashboardPage] Failed to load dashboard data:', err);
      setError(sanitizeErrorMessage(err, 'Unable to load real-time business statistics from Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalRevenue = orders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingOrders = orders.filter(o => o.order_status === 'pending');
  const activeDeliveries = orders.filter(
    o => o.order_status === 'preparing' || o.order_status === 'out_for_delivery'
  );

  const ramanagaraOrdersCount = orders.filter(o => o.delivery_city === 'Ramanagara').length;
  const bengaluruOrdersCount = orders.filter(o => o.delivery_city === 'Bengaluru').length;

  const lowStockProducts = products.filter(p => p.stock_quantity <= 5);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Business Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time orders, deliveries, and floral inventory for Padma's Floral
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/promotions"
            className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <Tag className="w-3.5 h-3.5 text-[#143D2B]" />
            <span>Promotions</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#143D2B]" />
            <span>Analytics</span>
          </Link>
          <Link
            to="/admin/orders"
            className="bg-[#143D2B] text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#1e5a3f] shadow-xs flex items-center gap-1.5"
          >
            <span>Manage Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <ErrorState
          error={error}
          onRetry={loadDashboard}
          retryLabel="Retry Connection"
          variant="banner"
        />
      )}

      {/* Metrics Row */}
      {loading ? (
        <MetricCardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <Link
          to="/admin/analytics"
          className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2 hover:border-[#143D2B]/40 hover:shadow-md transition-all group block"
        >
          <div className="flex justify-between items-center text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-[#143D2B] transition-colors">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold group-hover:bg-[#143D2B] group-hover:text-white transition-colors" aria-hidden="true">
              ₹
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              <span>Across all confirmed orders</span>
            </span>
            <span className="text-[#143D2B] font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
              View Trends →
            </span>
          </p>
        </Link>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-[#143D2B]/10 text-[#143D2B] flex items-center justify-center" aria-hidden="true">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            {orders.length}
          </p>
          <p className="text-[11px] text-stone-600">
            {pendingOrders.length} pending review
          </p>
        </div>

        {/* Active Deliveries */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider">In Arrangement</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center" aria-hidden="true">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            {activeDeliveries.length}
          </p>
          <p className="text-[11px] text-amber-800 font-medium">
            Scheduled for dispatch today
          </p>
        </div>

        {/* City Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-stone-600">
            <span className="text-xs font-semibold uppercase tracking-wider">City Split</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center" aria-hidden="true">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-bold text-stone-800">{ramanagaraOrdersCount}</p>
              <p className="text-[10px] text-stone-600">Ramanagara</p>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div>
              <p className="text-xs font-bold text-stone-800">{bengaluruOrdersCount}</p>
              <p className="text-[10px] text-stone-600">Bengaluru</p>
            </div>
          </div>
          <p className="text-[10px] text-stone-600">Serving both regions daily</p>
        </div>
      </div>
      )}

      {/* Low Stock Warning Banner if any */}
      {lowStockProducts.length > 0 && (
        <div role="region" aria-label="Inventory stock notice" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
            <span>
              <strong>Inventory Notice:</strong> {lowStockProducts.length} floral arrangements are running low on stock ({lowStockProducts.map(p => p.name).slice(0, 2).join(', ')}...).
            </span>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-bold text-amber-900 underline whitespace-nowrap"
          >
            Update Inventory Stock
          </Link>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 className="font-serif font-bold text-lg text-stone-900">
            Recent Flower Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-[#143D2B] hover:underline"
          >
            View All ({orders.length})
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-stone-600 text-center py-8">No orders received yet.</p>
        ) : (
          <>
            {/* Mobile Order Cards (< md) */}
            <div className="block md:hidden space-y-3">
              {recentOrders.map(o => (
                <div
                  key={o.id}
                  className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-[#143D2B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {o.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        o.order_status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.order_status === 'delivered'
                          ? 'bg-blue-100 text-blue-800'
                          : o.order_status === 'preparing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {o.order_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <p className="text-[10px] text-stone-600 uppercase font-semibold">Recipient</p>
                      <p className="font-bold text-stone-900 truncate">{o.recipient_name}</p>
                      <p className="text-[11px] text-stone-600">{o.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-600 uppercase font-semibold">Delivery</p>
                      <p className="font-semibold text-stone-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{o.delivery_city}</span>
                      </p>
                      <p className="text-[11px] text-stone-600">{o.delivery_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                    <div>
                      <span className="text-[11px] text-stone-600">{o.items?.length || 1} items • </span>
                      <strong className="text-sm font-bold text-stone-900">₹{o.total_amount}</strong>
                    </div>
                    <a
                      href={whatsappService.getAdminOrderModalUrl(o, window.location.origin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="touch-target-44 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 min-h-[40px]"
                      aria-label={`WhatsApp customer for order ${o.order_number}`}
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Recent flower orders table">
                <thead className="bg-stone-50 text-stone-700 font-semibold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-4 rounded-l-xl">Order #</th>
                    <th scope="col" className="py-3 px-4">Customer</th>
                    <th scope="col" className="py-3 px-4">City</th>
                    <th scope="col" className="py-3 px-4">Delivery Date</th>
                    <th scope="col" className="py-3 px-4">Items</th>
                    <th scope="col" className="py-3 px-4">Total</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#143D2B]">
                        {o.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-stone-900">{o.recipient_name}</p>
                        <p className="text-stone-600 text-[11px]">{o.customer_phone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                          <MapPin className="w-3 h-3 text-[#C84B5B]" aria-hidden="true" />
                          <span>{o.delivery_city}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {o.delivery_date}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {o.items?.length || 1} items
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        ₹{o.total_amount}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            o.order_status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.order_status === 'delivered'
                              ? 'bg-blue-100 text-blue-800'
                              : o.order_status === 'preparing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {o.order_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={whatsappService.getAdminOrderModalUrl(o, window.location.origin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="touch-target-44 inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px]"
                          aria-label={`WhatsApp customer for order ${o.order_number}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

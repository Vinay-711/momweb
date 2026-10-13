import React, { useState, useEffect } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  MessageCircle,
  Eye,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import * as whatsappService from '../../services/whatsappService';
import { Order, OrderStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modalTriggerRef = React.useRef<HTMLElement | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrdersPaginated({
        page: currentPage,
        pageSize,
        status: selectedStatus !== 'all' ? (selectedStatus as OrderStatus) : undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined,
        search: debouncedSearch.trim() || undefined,
      });
      setOrders(res.orders);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('[AdminOrdersPage] Failed to fetch orders from Supabase:', err);
      setError(sanitizeErrorMessage(err, 'Unable to retrieve customer orders from database.'));
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, selectedStatus, debouncedSearch]);

  // Load orders on page or filter change
  useEffect(() => {
    loadOrders();
  }, [currentPage, selectedCity, selectedStatus, debouncedSearch]);

  const handleOpenOrderModal = (order: Order, triggerEl?: HTMLElement) => {
    modalTriggerRef.current = triggerEl || (document.activeElement as HTMLElement);
    setActiveOrderModal(order);
  };

  const handleCloseOrderModal = () => {
    setActiveOrderModal(null);
    modalTriggerRef.current?.focus();
  };

  // Close order modal on Escape key & restore focus
  useEffect(() => {
    if (!activeOrderModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseOrderModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOrderModal]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await orderService.updateOrderStatus(orderId, newStatus);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, order_status: newStatus } : o))
    );
    if (activeOrderModal && activeOrderModal.id === orderId) {
      setActiveOrderModal(prev => prev ? { ...prev, order_status: newStatus } : null);
    }
  };

  const statusOptions: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Order & Delivery Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track, confirm, and dispatch flower orders across Ramanagara and Bengaluru
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Refresh Orders
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <label htmlFor="admin-orders-search" className="sr-only">
            Search orders by order number, customer name, or phone number
          </label>
          <input
            id="admin-orders-search"
            type="text"
            aria-label="Search orders by order number, customer name, or phone number"
            placeholder="Search by order #, customer, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#143D2B] min-h-[40px]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* City filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="admin-city-filter" className="text-stone-600 font-medium">
              City:
            </label>
            <select
              id="admin-city-filter"
              aria-label="Filter orders by city"
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 min-h-[38px]"
            >
              <option value="all">All Cities</option>
              <option value="Ramanagara">Ramanagara</option>
              <option value="Bengaluru">Bengaluru</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="admin-status-filter" className="text-stone-600 font-medium">
              Status:
            </label>
            <select
              id="admin-status-filter"
              aria-label="Filter orders by status"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 min-h-[38px]"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>
                  {s.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <ErrorState
          error={error}
          onRetry={loadOrders}
          retryLabel="Retry Connection"
          variant="banner"
        />
      )}

      {/* Orders Table & Mobile Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <table className="w-full">
              <TableRowSkeleton rows={6} columns={6} />
            </table>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No orders found"
              description={searchQuery || selectedStatus !== 'all' || selectedCity !== 'all' ? "No orders match your filter criteria. Try clearing search or filters." : "When customers place orders, they will appear here in real time."}
              primaryAction={searchQuery || selectedStatus !== 'all' || selectedCity !== 'all' ? { label: "Clear Filters", onClick: () => { setSearchQuery(''); setSelectedStatus('all'); setSelectedCity('all'); } } : undefined}
            />
          </div>
        ) : (
          <>
            {/* Mobile Cards (< md) */}
            <div className="block md:hidden p-3 sm:p-4 space-y-3">
              {orders.map(order => (
                <div
                  key={order.id}
                  className="p-4 bg-stone-50/90 rounded-2xl border border-stone-200 space-y-3 text-xs"
                >
                  {/* Top row: Order Number & Status dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-[#143D2B] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block sm:inline">
                        {order.order_number}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <select
                      value={order.order_status}
                      onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      aria-label={`Update order status for ${order.order_number}`}
                      className={`touch-target-44 text-xs font-bold uppercase rounded-xl px-2.5 py-2 border focus:outline-none cursor-pointer min-h-[40px] ${
                        order.order_status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : order.order_status === 'delivered'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : order.order_status === 'preparing'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : order.order_status === 'out_for_delivery'
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : order.order_status === 'cancelled'
                          ? 'bg-red-50 text-red-800 border-red-300'
                          : 'bg-stone-50 text-stone-800 border-stone-300'
                      }`}
                    >
                      {statusOptions.map(st => (
                        <option key={st} value={st}>
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer & Recipient */}
                  <div className="grid grid-cols-2 gap-2 text-stone-600">
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase font-semibold">Recipient</p>
                      <p className="font-bold text-stone-900 truncate">{order.recipient_name}</p>
                      <p className="text-[11px] text-stone-600">{order.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase font-semibold">Destination</p>
                      <p className="font-semibold text-stone-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C84B5B] flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{order.delivery_city}</span>
                      </p>
                      <p className="text-[11px] text-stone-600 truncate">{order.delivery_date}</p>
                    </div>
                  </div>

                  {/* Items summary & Total */}
                  <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-stone-900">₹{order.total_amount}</p>
                      <span className={`text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {order.payment_method} ({order.payment_status})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleOpenOrderModal(order, e.currentTarget)}
                        className="touch-target-44 p-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                        title="View Full Details"
                        aria-label={`View full details for order ${order.order_number}`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <a
                        href={whatsappService.getAdminOrderUpdateUrl(order, window.location.origin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="touch-target-44 p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors inline-flex items-center justify-center min-h-[42px] min-w-[42px] focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
                        title="Message Customer on WhatsApp"
                        aria-label={`Message customer on WhatsApp for order ${order.order_number}`}
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Customer flower orders table">
                <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4" scope="col">Order #</th>
                    <th className="py-3.5 px-4" scope="col">Customer & Recipient</th>
                    <th className="py-3.5 px-4" scope="col">Delivery</th>
                    <th className="py-3.5 px-4" scope="col">Items</th>
                    <th className="py-3.5 px-4" scope="col">Amount</th>
                    <th className="py-3.5 px-4" scope="col">Status</th>
                    <th className="py-3.5 px-4 text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-mono font-bold text-[#143D2B]">{order.order_number}</p>
                        <p className="text-[10px] text-stone-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-stone-900">{order.recipient_name}</p>
                        <p className="text-[11px] text-stone-600">{order.customer_phone}</p>
                        {order.recipient_name !== order.customer_name && (
                          <p className="text-[10px] text-stone-500">From: {order.customer_name}</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 font-semibold text-stone-800">
                          <MapPin className="w-3 h-3 text-[#C84B5B]" aria-hidden="true" />
                          <span>{order.delivery_city}</span>
                        </div>
                        <p className="text-[11px] text-stone-600">{order.delivery_date}</p>
                        <p className="text-[10px] text-stone-500">{order.delivery_time_slot.split(' ')[0]}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-medium text-stone-800">
                          {order.items && order.items.length > 0 ? order.items[0].product_name : 'Floral item'}
                        </p>
                        {order.items && order.items.length > 1 && (
                          <p className="text-[10px] text-stone-500">+{order.items.length - 1} more items</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-stone-900">₹{order.total_amount}</p>
                        <span className={`text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {order.payment_method} ({order.payment_status})
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={order.order_status}
                          onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          aria-label={`Update order status for ${order.order_number}`}
                          className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-[#143D2B] ${
                            order.order_status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.order_status === 'delivered'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : order.order_status === 'preparing'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : order.order_status === 'out_for_delivery'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : order.order_status === 'cancelled'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-stone-50 text-stone-800 border-stone-300'
                          }`}
                        >
                          {statusOptions.map(st => (
                            <option key={st} value={st}>
                              {st.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={(e) => handleOpenOrderModal(order, e.currentTarget)}
                          className="touch-target-44 p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors inline-flex items-center justify-center min-w-[36px] min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                          title="View Full Details"
                          aria-label={`View full details for order ${order.order_number}`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>

                        <a
                          href={whatsappService.getAdminOrderUpdateUrl(order, window.location.origin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="touch-target-44 p-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors inline-flex items-center justify-center min-w-[36px] min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:outline-none"
                          title="Message Customer on WhatsApp"
                          aria-label={`Message customer on WhatsApp for order ${order.order_number}`}
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-stone-600">
                  Showing <strong className="text-stone-900">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-stone-900">{Math.min(currentPage * pageSize, totalCount)}</strong> of{' '}
                  <strong className="text-stone-900">{totalCount}</strong> orders
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="touch-target-44 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none min-h-[38px]"
                    aria-label="Previous orders page"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          aria-label={`Go to orders page ${pageNum}`}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={`touch-target-44 w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none ${
                            isCurrent
                              ? 'bg-[#143D2B] text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="touch-target-44 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none min-h-[38px]"
                    aria-label="Next orders page"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {activeOrderModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-details-modal-heading"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl space-y-6 relative">
            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold text-[#C84B5B] uppercase tracking-wider">
                  Order Slip & Delivery Details
                </span>
                <h2 id="order-details-modal-heading" className="font-serif font-bold text-2xl text-stone-900">
                  {activeOrderModal.order_number}
                </h2>
                <p className="text-xs text-stone-600">
                  Placed on {new Date(activeOrderModal.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="touch-target-44 p-2 rounded-full text-stone-500 hover:text-stone-800 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#143D2B] focus-visible:outline-none"
                aria-label="Close order details dialog"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Recipient & Address Box */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <span className="font-bold text-stone-700 block">Sender:</span>
                  <p>{activeOrderModal.customer_name} ({activeOrderModal.customer_phone})</p>
                  {activeOrderModal.customer_email && <p>{activeOrderModal.customer_email}</p>}
                </div>
                <div>
                  <span className="font-bold text-stone-700 block">Recipient:</span>
                  <p>{activeOrderModal.recipient_name} ({activeOrderModal.recipient_phone})</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-700 block">Full Delivery Address:</span>
                <p className="text-stone-800 break-words">{activeOrderModal.recipient_address}</p>
                <p className="text-stone-600">
                  City: <strong>{activeOrderModal.delivery_city}</strong> • Pincode: {activeOrderModal.delivery_pincode}
                </p>
                {activeOrderModal.landmark && (
                  <p className="text-stone-500 break-words">Landmark: {activeOrderModal.landmark}</p>
                )}
              </div>

              <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-stone-700">
                <span>Delivery Date: <strong>{activeOrderModal.delivery_date}</strong></span>
                <span>Slot: <strong>{activeOrderModal.delivery_time_slot}</strong></span>
              </div>
            </div>

            {/* Greeting Note */}
            {activeOrderModal.card_message && (
              <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 text-xs">
                <span className="font-bold text-rose-900 block mb-0.5">Florist Card Note:</span>
                <p className="italic text-rose-800 break-words">"{activeOrderModal.card_message}"</p>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-stone-900">Ordered Arrangements:</h4>
              <div className="divide-y divide-stone-100 border rounded-2xl overflow-hidden">
                {activeOrderModal.items.map(item => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-2 text-xs bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.product_image && (
                        <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-stone-800 truncate">{item.product_name}</p>
                        {item.selected_variant && (
                          <p className="text-stone-500 text-[11px] truncate">{item.selected_variant}</p>
                        )}
                        <p className="text-stone-500 text-[10px]">Qty: {item.quantity} × ₹{item.unit_price}</p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-900 whitespace-nowrap">₹{item.total_price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Print button */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-500">Order Total (including delivery):</span>
                <p className="font-serif text-2xl font-bold text-[#143D2B]">₹{activeOrderModal.total_amount}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="touch-target-44 w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>

                <a
                  href={whatsappService.getAdminOrderModalUrl(activeOrderModal, window.location.origin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="touch-target-44 w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

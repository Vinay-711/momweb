import React, { useState, useEffect } from 'react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import {
  Users,
  Search,
  MessageCircle,
  Phone,
  ShoppingBag,
  MapPin,
  RefreshCw,
  Sparkles,
  Calendar,
  IndianRupee,
  UserCheck
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import * as whatsappService from '../../services/whatsappService';
import { Customer, Order } from '../../types';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<'all' | 'Ramanagara' | 'Bengaluru'>('all');
  const [onlyRepeat, setOnlyRepeat] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custList, orderList] = await Promise.all([
        orderService.getCustomers(),
        orderService.getOrders(),
      ]);

      // If database customers table is populated, use it.
      // Otherwise synthesize from orderList so that all existing customers show up accurately.
      if (custList && custList.length > 0) {
        setCustomers(custList);
      } else {
        // Synthesize unique customer profiles from order records
        const map = new Map<string, Customer>();
        orderList.forEach(o => {
          const key = o.customer_phone || o.customer_name;
          if (!map.has(key)) {
            map.set(key, {
              id: o.customer_id || `cust-${key}`,
              name: o.customer_name,
              phone: o.customer_phone,
              email: o.customer_email || undefined,
              default_city: o.delivery_city,
              default_address: o.recipient_address,
              default_pincode: o.delivery_pincode,
              total_orders: 1,
              total_spent: o.total_amount,
              created_at: o.created_at,
              updated_at: o.created_at,
            });
          } else {
            const existing = map.get(key)!;
            existing.total_orders = (existing.total_orders || 0) + 1;
            existing.total_spent = (existing.total_spent || 0) + o.total_amount;
            if (new Date(o.created_at) > new Date(existing.updated_at || 0)) {
              existing.updated_at = o.created_at;
              existing.default_city = o.delivery_city;
            }
          }
        });
        setCustomers(Array.from(map.values()));
      }
      setOrders(orderList);
    } catch (err: any) {
      console.error('[AdminCustomersPage] Failed to load customers:', err);
      setError(sanitizeErrorMessage(err, 'Unable to retrieve customer directory.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Metrics
  const totalCustomers = customers.length;
  const repeatCustomersCount = customers.filter(c => (c.total_orders || 0) > 1).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgSpendPerCustomer = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.default_city && c.default_city.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (cityFilter !== 'all' && c.default_city !== cityFilter) return false;
    if (onlyRepeat && (c.total_orders || 0) <= 1) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Customer & Patron Directory
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Loyal flower patrons across Ramanagara and Bengaluru with lifetime order history
          </p>
        </div>

        <button
          onClick={loadData}
          aria-label="Refresh customer directory"
          className="self-start sm:self-auto touch-target-44 px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patrons</span>
            <Users className="w-4 h-4 text-stone-600" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{totalCustomers}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">Ramanagara & Bengaluru</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Repeat Patrons</span>
            <UserCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-800">{repeatCustomersCount}</p>
          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">&gt;1 floral order placed</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Spend / Patron</span>
            <IndianRupee className="w-4 h-4 text-stone-600" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">₹{avgSpendPerCustomer}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">Lifetime value</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-[#C84B5B] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#143D2B]">{orders.length}</p>
          <p className="text-[10px] text-stone-600 mt-0.5">Processed storewide</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <label htmlFor="admin-customer-search" className="sr-only">
            Search patron name, phone, city
          </label>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="admin-customer-search"
            type="text"
            placeholder="Search patron name, phone, city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-full py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-[#143D2B] focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="toolbar" aria-label="Customer list filters">
          <button
            onClick={() => setCityFilter('all')}
            aria-pressed={cityFilter === 'all'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              cityFilter === 'all'
                ? 'bg-[#143D2B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Cities
          </button>
          <button
            onClick={() => setCityFilter('Ramanagara')}
            aria-pressed={cityFilter === 'Ramanagara'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              cityFilter === 'Ramanagara'
                ? 'bg-[#143D2B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Ramanagara
          </button>
          <button
            onClick={() => setCityFilter('Bengaluru')}
            aria-pressed={cityFilter === 'Bengaluru'}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              cityFilter === 'Bengaluru'
                ? 'bg-[#143D2B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Bengaluru
          </button>

          <button
            onClick={() => setOnlyRepeat(!onlyRepeat)}
            aria-pressed={onlyRepeat}
            className={`touch-target-44 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              onlyRepeat
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'
            }`}
          >
            Repeat Only ({repeatCustomersCount})
          </button>
        </div>
      </div>

      {/* Main Content: Mobile Cards (< 768px) and Desktop Table (>= 768px) */}
      {loading ? (
        <div className="bg-white p-6 rounded-3xl border border-stone-200">
          <table className="w-full">
            <TableRowSkeleton rows={5} columns={5} />
          </table>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={Users}
            title="No patrons found"
            description={searchQuery || cityFilter !== 'all' || onlyRepeat ? "No customers match your filter combination. Try clearing your filters." : "When customers place orders, their contact and address profiles will appear here."}
            primaryAction={searchQuery || cityFilter !== 'all' || onlyRepeat ? { label: "Clear Filters", onClick: () => { setSearchQuery(''); setCityFilter('all'); setOnlyRepeat(false); } } : undefined}
          />
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredCustomers.map(customer => {
              const cleanPhone = (customer.phone || '').replace(/\D/g, '');
              const whatsappChatUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
                `Namaskara ${customer.name}! Greetings from Padma's Floral Atelier. How may we assist you with your flower orders today?`
              )}`;

              return (
                <div
                  key={customer.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
                >
                  {/* Customer Header Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#143D2B]/10 text-[#143D2B] font-serif font-bold text-base flex items-center justify-center flex-shrink-0 border border-[#143D2B]/20">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-serif font-bold text-base text-stone-900 truncate">
                          {customer.name}
                        </h4>
                        {(customer.total_orders || 0) > 1 && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex-shrink-0">
                            Repeat Patron
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-stone-600">{customer.phone}</p>
                      {customer.default_city && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium mt-0.5">
                          <MapPin className="w-3 h-3 text-[#C84B5B]" />
                          <span>{customer.default_city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-2.5 rounded-xl text-xs border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-600 block">Orders Placed</span>
                      <span className="font-bold text-stone-900">{customer.total_orders || 0} orders</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-600 block">Lifetime Value</span>
                      <span className="font-bold text-[#143D2B]">₹{customer.total_spent || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Call & WhatsApp with >= 44px touch targets */}
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={`tel:${customer.phone}`}
                      aria-label={`Call ${customer.name} at ${customer.phone}`}
                      className="flex-1 touch-target-44 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>Call Patron</span>
                    </a>

                    <a
                      href={whatsappChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp chat with ${customer.name}`}
                      className="flex-1 touch-target-44 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (>= md) */}
          <div className="hidden md:block bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Customer patron directory table">
                <thead className="bg-stone-50 text-stone-700 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-100">
                  <tr>
                    <th scope="col" className="py-3.5 px-4">Patron Name</th>
                    <th scope="col" className="py-3.5 px-4">Phone Number</th>
                    <th scope="col" className="py-3.5 px-4">Delivery City</th>
                    <th scope="col" className="py-3.5 px-4">Total Orders</th>
                    <th scope="col" className="py-3.5 px-4">Lifetime Spend</th>
                    <th scope="col" className="py-3.5 px-4">Last Activity</th>
                    <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map(customer => {
                    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
                    const whatsappChatUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
                      `Namaskara ${customer.name}! Greetings from Padma's Floral Atelier. How may we assist you with your flower orders today?`
                    )}`;

                    return (
                      <tr key={customer.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#143D2B]/10 text-[#143D2B] font-serif font-bold text-xs flex items-center justify-center flex-shrink-0" aria-hidden="true">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{customer.name}</p>
                              {(customer.total_orders || 0) > 1 && (
                                <span className="text-[10px] font-bold text-emerald-700">Repeat Patron</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-stone-700">
                          {customer.phone}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                            <MapPin className="w-3 h-3 text-[#C84B5B]" aria-hidden="true" />
                            <span>{customer.default_city || 'Karnataka'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          {customer.total_orders || 0}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#143D2B]">
                          ₹{customer.total_spent || 0}
                        </td>

                        <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                          {customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : 'Recent'}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 inline-flex touch-target-44 items-center justify-center"
                            aria-label={`Call ${customer.name} at ${customer.phone}`}
                          >
                            <Phone className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                          </a>

                          <a
                            href={whatsappChatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-[#25D366] text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#20bd5a] touch-target-44 justify-center"
                            aria-label={`WhatsApp chat with ${customer.name}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>WhatsApp</span>
                          </a>
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

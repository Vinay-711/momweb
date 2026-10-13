import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Ban,
  Package,
  Layers,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Award
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { Order, Product, Category } from '../../types';
import { MetricCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  SalesTrendChart,
  OrderVolumeChart,
  CategoryDonutChart,
  TopProductsBarChart,
  DailyDataPoint,
  CategoryDataPoint,
  ProductDataPoint
} from '../../components/admin/analytics/AnalyticsCharts';

type DateFilterOption = 'today' | '7d' | '30d' | 'month' | 'all' | 'custom';

export const AdminAnalyticsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state
  const [filterOption, setFilterOption] = useState<DateFilterOption>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Load authoritative data from Supabase
  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedOrders, fetchedProducts, fetchedCategories] = await Promise.all([
        orderService.getOrders({ limit: 1000 }),
        productService.getAllProductsAdmin(),
        productService.getAllCategoriesAdmin().catch(() => productService.getCategories()),
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err: any) {
      console.error('[AdminAnalyticsPage] Failed to fetch analytics data:', err);
      setError(sanitizeErrorMessage(err, 'Failed to fetch live analytics data from Supabase.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Helper date formatting
  const getLocalDateString = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // -------------------------------------------------------------------------
  // Product and Category Maps for Accurate Attribution
  // -------------------------------------------------------------------------
  const productCategoryMap = useMemo(() => {
    const prodToCatName = new Map<string, string>();
    const catMap = new Map<string, string>(categories.map(c => [c.id, c.name]));

    products.forEach(p => {
      const catName = p.category_id && catMap.has(p.category_id)
        ? catMap.get(p.category_id)!
        : 'Fresh Flowers';
      prodToCatName.set(p.id, catName);
      prodToCatName.set(p.name.toLowerCase().trim(), catName);
    });

    return { prodToCatName, catMap };
  }, [products, categories]);

  // Product catalog image lookup map
  const productCatalogImgMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => {
      if (p.images && p.images[0]) {
        map.set(p.id, p.images[0]);
        map.set(p.name.toLowerCase().trim(), p.images[0]);
      }
    });
    return map;
  }, [products]);

  // -------------------------------------------------------------------------
  // Core Baseline & Lifetime KPIs (Strictly calculated from Supabase)
  // -------------------------------------------------------------------------
  const baselineStats = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let todaySales = 0;
    let todayOrdersCount = 0;
    let sevenDaySales = 0;
    let sevenDayOrdersCount = 0;
    let thirtyDaySales = 0;
    let thirtyDayOrdersCount = 0;
    let totalRevenue = 0;
    let nonCancelledOrdersCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    // Track all-time item performance
    const allTimeProductSales = new Map<string, { name: string; quantity: number; revenue: number; image?: string }>();
    const allTimeCategorySales = new Map<string, { name: string; quantity: number; revenue: number }>();

    orders.forEach(o => {
      const orderDate = new Date(o.created_at);
      const isCancelled = o.order_status === 'cancelled';
      const isPending = o.order_status === 'pending';
      const amount = Number(o.total_amount) || 0;

      if (isPending) pendingCount++;
      if (isCancelled) cancelledCount++;

      if (!isCancelled) {
        totalRevenue += amount;
        nonCancelledOrdersCount++;

        // Today's sales
        if (getLocalDateString(orderDate) === todayStr) {
          todaySales += amount;
          todayOrdersCount++;
        }

        // 7-day sales
        if (orderDate >= sevenDaysAgo && orderDate <= now) {
          sevenDaySales += amount;
          sevenDayOrdersCount++;
        }

        // 30-day sales
        if (orderDate >= thirtyDaysAgo && orderDate <= now) {
          thirtyDaySales += amount;
          thirtyDayOrdersCount++;
        }

        // Product & category lifetime aggregation
        (o.items || []).forEach(it => {
          const itemQty = Number(it.quantity) || 1;
          const itemRev = Number(it.total_price) || (Number(it.unit_price) * itemQty);
          const pKey = it.product_id || it.product_name;

          // Product level
          const currProd = allTimeProductSales.get(pKey) || {
            name: it.product_name,
            quantity: 0,
            revenue: 0,
            image: it.product_image,
          };
          currProd.quantity += itemQty;
          currProd.revenue += itemRev;
          if (!currProd.image && it.product_image) {
            currProd.image = it.product_image;
          }
          allTimeProductSales.set(pKey, currProd);

          // Category level
          let cName = 'Fresh Flowers';
          if (it.product_id && productCategoryMap.prodToCatName.has(it.product_id)) {
            cName = productCategoryMap.prodToCatName.get(it.product_id)!;
          } else if (productCategoryMap.prodToCatName.has(it.product_name?.toLowerCase().trim())) {
            cName = productCategoryMap.prodToCatName.get(it.product_name.toLowerCase().trim())!;
          } else {
            const lower = (it.product_name || '').toLowerCase();
            if (lower.includes('garland') || lower.includes('maaley')) cName = 'Garlands & Maaley';
            else if (lower.includes('rose') || lower.includes('bouquet')) cName = 'Rose Bouquets';
            else if (lower.includes('pooja') || lower.includes('sevanti') || lower.includes('jasmine')) cName = 'Pooja Flowers';
            else if (lower.includes('basket') || lower.includes('arrangement')) cName = 'Flower Baskets';
            else if (lower.includes('wedding') || lower.includes('decor')) cName = 'Event & Wedding Florals';
          }

          const currCat = allTimeCategorySales.get(cName) || { name: cName, quantity: 0, revenue: 0 };
          currCat.quantity += itemQty;
          currCat.revenue += itemRev;
          allTimeCategorySales.set(cName, currCat);
        });
      }
    });

    const averageOrderValue = nonCancelledOrdersCount > 0 ? totalRevenue / nonCancelledOrdersCount : 0;

    // Sort all-time top product
    const sortedAllTimeProducts = Array.from(allTimeProductSales.values())
      .map(p => ({
        ...p,
        image: p.image || productCatalogImgMap.get(p.name.toLowerCase().trim()),
      }))
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

    // Sort all-time top category
    const sortedAllTimeCategories = Array.from(allTimeCategorySales.values())
      .sort((a, b) => b.revenue - a.revenue);

    return {
      todaySales,
      todayOrdersCount,
      sevenDaySales,
      sevenDayOrdersCount,
      thirtyDaySales,
      thirtyDayOrdersCount,
      totalOrders: orders.length,
      nonCancelledOrdersCount,
      totalRevenue,
      averageOrderValue,
      pendingOrders: pendingCount,
      cancelledOrders: cancelledCount,
      allTimeTopProduct: sortedAllTimeProducts[0] || null,
      allTimeTopCategory: sortedAllTimeCategories[0] || null,
    };
  }, [orders, productCategoryMap, productCatalogImgMap]);

  // -------------------------------------------------------------------------
  // Filtered Orders for Charts and Selected Period Insights
  // -------------------------------------------------------------------------
  const { filteredOrders, dateRangeLabel, startDateObj, endDateObj } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = '';

    if (filterOption === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = 'Today';
    } else if (filterOption === '7d') {
      start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      label = 'Last 7 Days';
    } else if (filterOption === '30d') {
      start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      label = 'Last 30 Days';
    } else if (filterOption === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now);
      label = start.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (filterOption === 'custom') {
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
      label = `${customStartDate} to ${customEndDate}`;
    } else {
      // all time
      start = orders.length > 0
        ? new Date(Math.min(...orders.map(o => new Date(o.created_at).getTime())))
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      label = 'All Time';
    }

    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });

    return {
      filteredOrders: filtered,
      dateRangeLabel: label,
      startDateObj: start,
      endDateObj: end,
    };
  }, [orders, filterOption, customStartDate, customEndDate]);

  // -------------------------------------------------------------------------
  // Time Series Chart Data Points (Continuous daily grid)
  // -------------------------------------------------------------------------
  const timeSeriesData = useMemo<DailyDataPoint[]>(() => {
    if (!startDateObj || !endDateObj) return [];

    const dayMap = new Map<string, { revenue: number; orders: number; pendingOrders: number }>();

    filteredOrders.forEach(o => {
      const dStr = getLocalDateString(o.created_at);
      const curr = dayMap.get(dStr) || { revenue: 0, orders: 0, pendingOrders: 0 };
      curr.orders++;
      if (o.order_status !== 'cancelled') {
        curr.revenue += Number(o.total_amount) || 0;
      }
      if (o.order_status === 'pending') {
        curr.pendingOrders++;
      }
      dayMap.set(dStr, curr);
    });

    const points: DailyDataPoint[] = [];
    const current = new Date(startDateObj);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDateObj);
    end.setHours(23, 59, 59, 999);

    const daysDiff = Math.max(1, Math.round((end.getTime() - current.getTime()) / (24 * 60 * 60 * 1000)));
    const stepDays = daysDiff > 90 ? Math.ceil(daysDiff / 60) : 1;

    while (current <= end) {
      const dStr = getLocalDateString(current);
      const agg = dayMap.get(dStr) || { revenue: 0, orders: 0, pendingOrders: 0 };
      const label = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      points.push({
        date: dStr,
        label,
        revenue: agg.revenue,
        orders: agg.orders,
        pendingOrders: agg.pendingOrders,
      });

      current.setDate(current.getDate() + stepDays);
    }

    return points;
  }, [filteredOrders, startDateObj, endDateObj]);

  // -------------------------------------------------------------------------
  // Best-Selling Products in Filtered Range
  // -------------------------------------------------------------------------
  const bestSellingProducts = useMemo<ProductDataPoint[]>(() => {
    const prodSales = new Map<string, { name: string; quantity: number; revenue: number; image?: string }>();

    filteredOrders.forEach(o => {
      if (o.order_status === 'cancelled') return;
      (o.items || []).forEach(it => {
        const key = it.product_id || it.product_name;
        const current = prodSales.get(key) || {
          name: it.product_name,
          quantity: 0,
          revenue: 0,
          image: it.product_image,
        };
        current.quantity += Number(it.quantity) || 1;
        current.revenue += Number(it.total_price) || (Number(it.unit_price) * (Number(it.quantity) || 1));
        if (!current.image && it.product_image) {
          current.image = it.product_image;
        }
        prodSales.set(key, current);
      });
    });

    return Array.from(prodSales.values())
      .map(p => ({
        name: p.name,
        image: p.image || productCatalogImgMap.get(p.name.toLowerCase().trim()),
        quantity: p.quantity,
        revenue: p.revenue,
        averagePrice: p.quantity > 0 ? Math.round(p.revenue / p.quantity) : 0,
      }))
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  }, [filteredOrders, productCatalogImgMap]);

  // -------------------------------------------------------------------------
  // Best-Performing Categories Distribution in Filtered Range
  // -------------------------------------------------------------------------
  const categoryDistribution = useMemo<{
    data: CategoryDataPoint[];
    totalRevenue: number;
    topCategory: CategoryDataPoint | null;
  }>(() => {
    const catRevenue = new Map<string, { revenue: number; quantity: number }>();
    let totalCatRevenue = 0;

    filteredOrders.forEach(o => {
      if (o.order_status === 'cancelled') return;
      (o.items || []).forEach(it => {
        const itemRev = Number(it.total_price) || (Number(it.unit_price) * (Number(it.quantity) || 1));
        const itemQty = Number(it.quantity) || 1;

        let categoryName = 'General Flowers';
        if (it.product_id && productCategoryMap.prodToCatName.has(it.product_id)) {
          categoryName = productCategoryMap.prodToCatName.get(it.product_id)!;
        } else if (productCategoryMap.prodToCatName.has(it.product_name.toLowerCase().trim())) {
          categoryName = productCategoryMap.prodToCatName.get(it.product_name.toLowerCase().trim())!;
        } else {
          const lower = (it.product_name || '').toLowerCase();
          if (lower.includes('garland') || lower.includes('maaley')) categoryName = 'Garlands & Maaley';
          else if (lower.includes('rose') || lower.includes('bouquet')) categoryName = 'Rose Bouquets';
          else if (lower.includes('pooja') || lower.includes('sevanti') || lower.includes('jasmine')) categoryName = 'Pooja Flowers';
          else if (lower.includes('basket') || lower.includes('arrangement')) categoryName = 'Flower Baskets';
          else if (lower.includes('wedding') || lower.includes('decor')) categoryName = 'Event & Wedding Florals';
        }

        const curr = catRevenue.get(categoryName) || { revenue: 0, quantity: 0 };
        curr.revenue += itemRev;
        curr.quantity += itemQty;
        catRevenue.set(categoryName, curr);
        totalCatRevenue += itemRev;
      });
    });

    const vibrantColors = [
      '#143D2B', // Padma Emerald
      '#D4AF37', // Temple Gold
      '#854D0E', // Bronze Ochre
      '#059669', // Mint Jade
      '#DC2626', // Crimson Petal
      '#D97706', // Marigold Amber
      '#7C3AED', // Royal Violet
    ];

    const categoryList: CategoryDataPoint[] = Array.from(catRevenue.entries())
      .map(([name, stats], idx) => ({
        name,
        revenue: stats.revenue,
        quantity: stats.quantity,
        percentage: totalCatRevenue > 0 ? (stats.revenue / totalCatRevenue) * 100 : 0,
        color: vibrantColors[idx % vibrantColors.length],
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      data: categoryList,
      totalRevenue: totalCatRevenue,
      topCategory: categoryList.length > 0 ? categoryList[0] : null,
    };
  }, [filteredOrders, productCategoryMap]);

  // Filtered period aggregate totals
  const periodStats = useMemo(() => {
    let revenue = 0;
    const ordersCount = filteredOrders.length;
    let nonCancelled = 0;

    filteredOrders.forEach(o => {
      if (o.order_status !== 'cancelled') {
        revenue += Number(o.total_amount) || 0;
        nonCancelled++;
      }
    });

    return {
      revenue,
      ordersCount,
      aov: nonCancelled > 0 ? revenue / nonCancelled : 0,
    };
  }, [filteredOrders]);

  // -------------------------------------------------------------------------
  // CSV Export Handler
  // -------------------------------------------------------------------------
  const exportToCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'City',
      'Status',
      'Payment Status',
      'Total Amount (INR)',
      'Items Count',
    ];

    const rows = filteredOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleString('en-IN'),
      `"${(o.customer_name || '').replace(/"/g, '""')}"`,
      `"${o.customer_phone || ''}"`,
      o.delivery_city,
      o.order_status,
      o.payment_status,
      o.total_amount,
      (o.items || []).length,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `padmas_analytics_${filterOption}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link to="/admin" className="hover:text-stone-800 transition-colors">Admin</Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-semibold text-stone-800">Sales & Analytics</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <span>Sales & Analytics</span>
            <span className="text-xs font-sans font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Live Supabase Data
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real revenue, daily order volumes, category performance, and top-selling flowers
          </p>
        </div>

        {/* Action buttons: Refresh & Export */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            aria-label="Refresh analytics data from database"
            className="touch-target-44 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-60"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            aria-label="Export filtered analytics to CSV file"
            className="touch-target-44 px-4 py-2 rounded-xl bg-[#143D2B] text-white hover:bg-[#1e5a3f] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorState
          error={error}
          onRetry={loadAnalyticsData}
          retryLabel="Retry Connection"
          variant="banner"
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 1. Core KPIs: Sales, Orders, AOV, Leaders, & Operational Status     */}
      {/* ------------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Executive Summary & Benchmarks
          </h2>
          <span className="text-[11px] text-stone-500">
            Authoritative Supabase metrics
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <MetricCardSkeleton count={5} />
            <MetricCardSkeleton count={4} />
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Primary Tier: Sales Horizons, Total Orders & Average Order Value (5 Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Today's Sales */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>Today's Sales</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live today indicator" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-[#143D2B]">
                  ₹{baselineStats.todaySales.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-stone-600">
                  {baselineStats.todayOrdersCount} order{baselineStats.todayOrdersCount === 1 ? '' : 's'} placed today
                </p>
              </div>

              {/* 7-Day Sales */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>7-Day Sales</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                  ₹{baselineStats.sevenDaySales.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-stone-600">
                  {baselineStats.sevenDayOrdersCount} order{baselineStats.sevenDayOrdersCount === 1 ? '' : 's'} past week
                </p>
              </div>

              {/* 30-Day Sales */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>30-Day Sales</span>
                  <Calendar className="w-3.5 h-3.5 text-stone-500" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-stone-900">
                  ₹{baselineStats.thirtyDaySales.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-stone-600">
                  {baselineStats.thirtyDayOrdersCount} order{baselineStats.thirtyDayOrdersCount === 1 ? '' : 's'} past month
                </p>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-[#143D2B]">
                  {baselineStats.totalOrders}
                </p>
                <p className="text-[11px] text-stone-600">
                  {baselineStats.nonCancelledOrdersCount} active / fulfilled
                </p>
              </div>

              {/* Average Order Value (AOV) */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>Average Order Value</span>
                  <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-amber-800">
                  ₹{Math.round(baselineStats.averageOrderValue).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-stone-600">
                  Per fulfilled order
                </p>
              </div>
            </div>

            {/* Secondary Tier: Operational Status & Merchandising Champions (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Best-Selling Product Overall */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <Award className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>Best-Selling Product</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    All-Time
                  </span>
                </div>
                {baselineStats.allTimeTopProduct ? (
                  <div className="flex items-center gap-3 pt-1">
                    {baselineStats.allTimeTopProduct.image ? (
                      <img
                        src={baselineStats.allTimeTopProduct.image}
                        alt={baselineStats.allTimeTopProduct.name}
                        className="w-10 h-10 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#143D2B] flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate" title={baselineStats.allTimeTopProduct.name}>
                        {baselineStats.allTimeTopProduct.name}
                      </p>
                      <p className="text-[11px] text-stone-600 font-mono">
                        {baselineStats.allTimeTopProduct.quantity} units · ₹{baselineStats.allTimeTopProduct.revenue.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 pt-2">No product sales yet</p>
                )}
              </div>

              {/* Best-Performing Category Overall */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-stone-800">
                    <Layers className="w-3.5 h-3.5 text-[#143D2B]" aria-hidden="true" />
                    <span>Best-Performing Category</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Top Category
                  </span>
                </div>
                {baselineStats.allTimeTopCategory ? (
                  <div className="pt-1 space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 truncate" title={baselineStats.allTimeTopCategory.name}>
                      {baselineStats.allTimeTopCategory.name}
                    </p>
                    <p className="text-[11px] text-stone-600 font-mono">
                      ₹{baselineStats.allTimeTopCategory.revenue.toLocaleString('en-IN')} gross revenue ({baselineStats.allTimeTopCategory.quantity} items)
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 pt-2">No category sales yet</p>
                )}
              </div>

              {/* Pending Orders */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200 bg-amber-50/30 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-amber-900 text-[11px] font-semibold">
                  <span>Pending Orders</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-amber-800">
                  {baselineStats.pendingOrders}
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-600">Awaiting store action</span>
                  <Link to="/admin/orders?status=pending" className="text-amber-800 font-bold hover:underline">
                    View &rarr;
                  </Link>
                </div>
              </div>

              {/* Cancelled Orders */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
                <div className="flex justify-between items-center text-stone-600 text-[11px] font-semibold">
                  <span>Cancelled Orders</span>
                  <Ban className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                </div>
                <p className="font-mono text-xl sm:text-2xl font-bold text-stone-700">
                  {baselineStats.cancelledOrders}
                </p>
                <p className="text-[11px] text-stone-500">
                  Strictly excluded from sales
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Interactive Date Filter Controls                                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-sm">
            <Filter className="w-4 h-4 text-[#143D2B]" aria-hidden="true" />
            <span>Filter Period:</span>
            <span className="text-[#143D2B] font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {dateRangeLabel} ({filteredOrders.length} orders)
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Date filter presets">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterOption(opt.id as DateFilterOption)}
                aria-pressed={filterOption === opt.id}
                className={`touch-target-44 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterOption === opt.id
                    ? 'bg-[#143D2B] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Inputs */}
        {filterOption === 'custom' && (
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label htmlFor="start-date" className="font-semibold text-stone-700">Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="end-date" className="font-semibold text-stone-700">End Date:</label>
              <input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#143D2B]"
              />
            </div>
          </div>
        )}

        {/* Selected Period Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div>
            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">Selected Revenue</span>
            <p className="font-mono text-lg sm:text-xl font-bold text-stone-900">
              ₹{periodStats.revenue.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">Period Orders</span>
            <p className="font-mono text-lg sm:text-xl font-bold text-[#143D2B]">
              {periodStats.ordersCount}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">Average Order Value (AOV)</span>
            <p className="font-mono text-lg sm:text-xl font-bold text-amber-800">
              ₹{Math.round(periodStats.aov).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-stone-600 uppercase tracking-wider font-bold">Top Selling Item</span>
            <p className="text-xs sm:text-sm font-bold text-stone-800 truncate" title={bestSellingProducts[0]?.name || 'N/A'}>
              {bestSellingProducts[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Interactive Charts Section                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Over Time Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#143D2B]" />
              <span>Sales Over Time</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">
              ₹ gross sales per day
            </span>
          </div>
          <SalesTrendChart data={timeSeriesData} />
        </div>

        {/* Orders Over Time Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#143D2B]" />
              <span>Orders Over Time</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">
              daily order volume
            </span>
          </div>
          <OrderVolumeChart data={timeSeriesData} />
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. Category Distribution & Top Products Charts                      */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Donut */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#143D2B]" />
              <span>Category Distribution</span>
            </h3>
            {categoryDistribution.topCategory && (
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                Top: {categoryDistribution.topCategory.name}
              </span>
            )}
          </div>
          <CategoryDonutChart
            data={categoryDistribution.data}
            totalRevenue={categoryDistribution.totalRevenue}
          />
        </div>

        {/* Top Best-Selling Products */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#143D2B]" />
              <span>Top Products</span>
            </h3>
            <span className="text-[11px] text-stone-500 font-mono">
              ranked by volume & revenue
            </span>
          </div>
          <TopProductsBarChart products={bestSellingProducts} />
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 5. Detailed Breakdown Tables: Products & Categories                 */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Product Performance Breakdown Table */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Best-Selling Products
                </h3>
                <p className="text-xs text-stone-500">
                  Units sold, generated revenue, and average price ({dateRangeLabel})
                </p>
              </div>

              <Link
                to="/admin/products"
                className="text-xs text-[#143D2B] font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Inventory</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bestSellingProducts.length === 0 ? (
              <div className="p-8 text-center text-stone-600 text-xs">
                No product sales recorded for this date filter.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs" aria-label="Product performance breakdown table">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th scope="col" className="py-3 px-4">Rank</th>
                      <th scope="col" className="py-3 px-4">Product Name</th>
                      <th scope="col" className="py-3 px-4 text-right">Units Sold</th>
                      <th scope="col" className="py-3 px-4 text-right">Avg Price</th>
                      <th scope="col" className="py-3 px-4 text-right">Gross Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bestSellingProducts.map((prod, index) => (
                      <tr key={index} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-600">
                          #{index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-900 flex items-center gap-3">
                          {prod.image && (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 flex-shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[200px]">{prod.name}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-stone-800">
                          {prod.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-600">
                          ₹{prod.averagePrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#143D2B]">
                          ₹{prod.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Category Performance Breakdown Table */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Best-Performing Categories
                </h3>
                <p className="text-xs text-stone-500">
                  Volume, sales contribution, and share of turnover ({dateRangeLabel})
                </p>
              </div>

              <Link
                to="/admin/categories"
                className="text-xs text-[#143D2B] font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Categories</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {categoryDistribution.data.length === 0 ? (
              <div className="p-8 text-center text-stone-600 text-xs">
                No category sales recorded for this date filter.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs" aria-label="Category performance breakdown table">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 uppercase tracking-wider font-semibold">
                    <tr>
                      <th scope="col" className="py-3 px-4">Rank</th>
                      <th scope="col" className="py-3 px-4">Category</th>
                      <th scope="col" className="py-3 px-4 text-right">Items Sold</th>
                      <th scope="col" className="py-3 px-4 text-right">Gross Sales</th>
                      <th scope="col" className="py-3 px-4 text-right">Sales Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {categoryDistribution.data.map((cat, index) => (
                      <tr key={index} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-600">
                          #{index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-900 flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                            aria-hidden="true"
                          />
                          <span className="truncate max-w-[200px]">{cat.name}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-stone-800">
                          {cat.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#143D2B]">
                          ₹{cat.revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-stone-700">
                          <div className="flex items-center justify-end gap-2">
                            <span>{cat.percentage.toFixed(1)}%</span>
                            <div className="w-12 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(cat.percentage, 4)}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

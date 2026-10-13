import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, Sparkles, Layers, Package } from 'lucide-react';

export interface DailyDataPoint {
  date: string;       // YYYY-MM-DD
  label: string;      // e.g. "Sep 20"
  revenue: number;    // Gross revenue in rupees
  orders: number;     // Number of orders
  pendingOrders: number;
}

export interface CategoryDataPoint {
  name: string;
  revenue: number;
  quantity: number;
  percentage: number;
  color: string;
}

export interface ProductDataPoint {
  name: string;
  image?: string;
  quantity: number;
  revenue: number;
  averagePrice: number;
}

// ---------------------------------------------------------------------------
// 1. Sales Trend Area Chart
// ---------------------------------------------------------------------------
export const SalesTrendChart: React.FC<{
  data: DailyDataPoint[];
}> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailyDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs">
        <TrendingUp className="w-8 h-8 text-stone-300 mb-2" />
        <span>No sales recorded for the selected timeframe.</span>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1000);
  const chartHeight = 220;
  const chartWidth = Math.max(data.length * 60, 560);
  const paddingX = 45;
  const paddingBottom = 40;
  const paddingTop = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x = paddingX + (data.length > 1 ? (index / (data.length - 1)) * plotWidth : plotWidth / 2);
    const y = paddingTop + plotHeight - (d.revenue / maxRevenue) * plotHeight;
    return { ...d, x, y };
  });

  // Construct SVG Bezier / Line path
  let linePath = '';
  let areaPath = '';

  if (points.length === 1) {
    const p = points[0];
    const leftX = paddingX;
    const rightX = chartWidth - paddingX;
    const bottomY = paddingTop + plotHeight;
    linePath = `M ${leftX},${p.y} L ${rightX},${p.y}`;
    areaPath = `M ${leftX},${p.y} L ${rightX},${p.y} L ${rightX},${bottomY} L ${leftX},${bottomY} Z`;
  } else if (points.length > 1) {
    linePath = points.reduce((acc, p, idx) => {
      if (idx === 0) return `M ${p.x},${p.y}`;
      const prev = points[idx - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      return `${acc} C ${cp1x},${prev.y} ${cp2x},${p.y} ${p.x},${p.y}`;
    }, '');

    areaPath = `${linePath} L ${points[points.length - 1].x},${paddingTop + plotHeight} L ${points[0].x},${paddingTop + plotHeight} Z`;
  }

  // Y-axis tick steps (0%, 50%, 100%)
  const yTicks = [0, Math.round(maxRevenue / 2), maxRevenue];

  return (
    <div className="space-y-2">
      {/* Mobile swipe hint */}
      <div className="sm:hidden flex items-center justify-between text-[11px] text-stone-600 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-200">
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block animate-pulse">←</span>
          <span>Swipe horizontally for all dates</span>
          <span className="inline-block animate-pulse">→</span>
        </span>
        {hoveredPoint && (
          <span className="font-bold text-[#143D2B]">
            {hoveredPoint.label}: ₹{hoveredPoint.revenue.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-thin pb-2 rounded-2xl bg-white border border-stone-200 shadow-xs touch-pan-x">
        <div style={{ minWidth: `${chartWidth}px` }} className="p-4 relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-64 overflow-visible select-none"
            role="img"
            aria-label="Sales over time line chart"
          >
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#143D2B" stopOpacity="0.32" />
                <stop offset="65%" stopColor="#143D2B" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#143D2B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y Gridlines and Tick Labels */}
            {yTicks.map((tickValue, i) => {
              const yPos = paddingTop + plotHeight - (tickValue / maxRevenue) * plotHeight;
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={yPos}
                    x2={chartWidth - paddingX}
                    y2={yPos}
                    stroke="#E7E5E4"
                    strokeDasharray="4,4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="10"
                    className="fill-stone-400 font-mono font-medium"
                  >
                    ₹{tickValue >= 1000 ? `${(tickValue / 1000).toFixed(tickValue % 1000 === 0 ? 0 : 1)}k` : tickValue}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area */}
            {areaPath && <path d={areaPath} fill="url(#emeraldGradient)" />}

            {/* Curve Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#143D2B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Circles & Hover Target */}
            {points.map((p, i) => {
              const isHovered = hoveredPoint?.date === p.date;
              return (
                <g key={i} className="cursor-pointer">
                  {/* Invisible broad tap target */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="18"
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setHoveredPoint(p)}
                  />

                  {/* Outer halo on hover */}
                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="9"
                      fill="#D4AF37"
                      fillOpacity="0.4"
                      className="animate-ping"
                    />
                  )}

                  {/* Inner Node */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? '6' : '4'}
                    fill={isHovered ? '#D4AF37' : '#FFFFFF'}
                    stroke="#143D2B"
                    strokeWidth={isHovered ? '3' : '2'}
                    className="transition-all duration-150"
                  />

                  {/* X Axis Date Label */}
                  <text
                    x={p.x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    className={`font-medium transition-colors ${
                      isHovered ? 'fill-[#143D2B] font-bold text-[11px]' : 'fill-stone-500'
                    }`}
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Callout */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-[#0B2419] text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-[#D4AF37]/40 z-20 transition-all transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${points.find(p => p.date === hoveredPoint.date)?.x ?? paddingX}px`,
                top: `${(points.find(p => p.date === hoveredPoint.date)?.y ?? paddingTop) + 8}px`,
              }}
            >
              <div className="font-bold text-[#D4AF37] text-[11px] pb-0.5 border-b border-white/10 flex items-center justify-between gap-3">
                <span>{hoveredPoint.label}</span>
                <span className="text-[10px] text-stone-300">{hoveredPoint.date}</span>
              </div>
              <div className="pt-1.5 space-y-0.5 font-mono">
                <div className="flex justify-between gap-4">
                  <span className="text-stone-300 text-[11px]">Sales:</span>
                  <span className="font-bold text-white">₹{hoveredPoint.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-stone-300 text-[11px]">Orders:</span>
                  <span className="font-semibold text-emerald-300">{hoveredPoint.orders}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. Orders Volume Bar Chart
// ---------------------------------------------------------------------------
export const OrderVolumeChart: React.FC<{
  data: DailyDataPoint[];
}> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<DailyDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs">
        <ShoppingBag className="w-8 h-8 text-stone-300 mb-2" />
        <span>No orders recorded in this period.</span>
      </div>
    );
  }

  const maxOrders = Math.max(...data.map(d => d.orders), 5);
  const chartHeight = 220;
  const chartWidth = Math.max(data.length * 60, 560);
  const paddingX = 40;
  const paddingBottom = 40;
  const paddingTop = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const colWidth = plotWidth / data.length;
  const barWidth = Math.min(Math.max(colWidth * 0.45, 14), 32);

  return (
    <div className="space-y-2">
      <div className="sm:hidden flex items-center justify-between text-[11px] text-stone-600 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-200">
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block animate-pulse">←</span>
          <span>Swipe horizontally for daily volume</span>
          <span className="inline-block animate-pulse">→</span>
        </span>
        {hoveredPoint && (
          <span className="font-bold text-[#143D2B]">
            {hoveredPoint.label}: {hoveredPoint.orders} orders
          </span>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-thin pb-2 rounded-2xl bg-white border border-stone-200 shadow-xs touch-pan-x">
        <div style={{ minWidth: `${chartWidth}px` }} className="p-4 relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-64 overflow-visible select-none"
            role="img"
            aria-label="Orders volume daily bar chart"
          >
            {/* Gridlines */}
            {[0, Math.ceil(maxOrders / 2), maxOrders].map((val, idx) => {
              const y = paddingTop + plotHeight - (val / maxOrders) * plotHeight;
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#E7E5E4"
                    strokeDasharray="4,4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    className="fill-stone-400 font-mono font-medium"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, idx) => {
              const centerX = paddingX + idx * colWidth + colWidth / 2;
              const barHeight = (d.orders / maxOrders) * plotHeight;
              const barY = paddingTop + plotHeight - barHeight;
              const isHovered = hoveredPoint?.date === d.date;

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(d)}
                >
                  {/* Broad tap target */}
                  <rect
                    x={centerX - colWidth / 2}
                    y={paddingTop}
                    width={colWidth}
                    height={plotHeight}
                    fill="transparent"
                  />

                  {/* Main Bar */}
                  <rect
                    x={centerX - barWidth / 2}
                    y={d.orders > 0 ? barY : paddingTop + plotHeight - 2}
                    width={barWidth}
                    height={d.orders > 0 ? barHeight : 2}
                    rx={4}
                    fill={isHovered ? '#D4AF37' : '#143D2B'}
                    className="transition-all duration-200"
                  />

                  {/* Top value badge */}
                  {d.orders > 0 && (
                    <text
                      x={centerX}
                      y={barY - 6}
                      textAnchor="middle"
                      fontSize="10"
                      className={`font-mono font-bold ${
                        isHovered ? 'fill-[#D4AF37] font-extrabold' : 'fill-stone-600'
                      }`}
                    >
                      {d.orders}
                    </text>
                  )}

                  {/* Date Label */}
                  <text
                    x={centerX}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    className={`font-medium transition-colors ${
                      isHovered ? 'fill-[#143D2B] font-bold' : 'fill-stone-500'
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-[#0B2419] text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-[#D4AF37]/40 z-20 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${
                  paddingX +
                  data.findIndex(p => p.date === hoveredPoint.date) * colWidth +
                  colWidth / 2
                }px`,
                top: `${paddingTop + 20}px`,
              }}
            >
              <div className="font-bold text-[#D4AF37] text-[11px] pb-0.5 border-b border-white/10">
                {hoveredPoint.label} ({hoveredPoint.date})
              </div>
              <div className="pt-1 text-stone-200 font-mono text-[11px] space-y-0.5">
                <div>Total Volume: <strong className="text-white">{hoveredPoint.orders} orders</strong></div>
                <div>Sales: <strong className="text-emerald-300">₹{hoveredPoint.revenue.toLocaleString('en-IN')}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Category Distribution Donut Chart
// ---------------------------------------------------------------------------
export const CategoryDonutChart: React.FC<{
  data: CategoryDataPoint[];
  totalRevenue: number;
}> = ({ data, totalRevenue }) => {
  const [hoveredCat, setHoveredCat] = useState<CategoryDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-stone-400 text-xs">
        <Layers className="w-8 h-8 text-stone-300 mb-2" />
        <span>No category sales available.</span>
      </div>
    );
  }

  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {/* Donut SVG */}
        <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#F5F5F4"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segments */}
            {data.map((cat, idx) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += cat.percentage;
              const isHovered = hoveredCat?.name === cat.name;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredCat(cat)}
                  onMouseLeave={() => setHoveredCat(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
              {hoveredCat ? hoveredCat.name.slice(0, 16) : 'Total Revenue'}
            </span>
            <span className="text-base font-bold font-mono text-[#143D2B]">
              ₹{(hoveredCat ? hoveredCat.revenue : totalRevenue).toLocaleString('en-IN')}
            </span>
            {hoveredCat && (
              <span className="text-[10px] font-semibold text-[#D4AF37]">
                {hoveredCat.percentage.toFixed(1)}% of sales
              </span>
            )}
          </div>
        </div>

        {/* Legend / Category Breakdown List */}
        <div className="w-full flex-1 space-y-3">
          {data.map((cat, idx) => {
            const isHovered = hoveredCat?.name === cat.name;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCat(cat)}
                onMouseLeave={() => setHoveredCat(null)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isHovered ? 'bg-stone-50 border border-stone-200' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-stone-800 truncate max-w-[170px] sm:max-w-[220px]">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-2 font-mono">
                    <span className="font-bold text-stone-900">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium w-12 text-right">
                      ({cat.percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Micro progress bar */}
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cat.percentage, 2)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Top Best-Selling Products Bar Chart
// ---------------------------------------------------------------------------
export const TopProductsBarChart: React.FC<{
  products: ProductDataPoint[];
}> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 p-6">
        <Package className="w-8 h-8 text-stone-300 mb-2" />
        <span>No product sales recorded yet.</span>
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map(p => p.revenue), 100);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
      <div className="space-y-3.5">
        {products.slice(0, 5).map((p, index) => {
          const barWidthPercent = (p.revenue / maxRevenue) * 100;
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-600 text-[11px] flex-shrink-0">
                    #{index + 1}
                  </div>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-stone-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#143D2B] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-semibold text-stone-900 truncate">
                    {p.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-right font-mono">
                  <span className="text-stone-500 text-[11px]">
                    {p.quantity} units
                  </span>
                  <span className="font-bold text-[#143D2B] text-xs sm:text-sm">
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Proportional horizontal bar */}
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#143D2B] to-[#D4AF37] transition-all duration-500"
                  style={{ width: `${Math.max(barWidthPercent, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

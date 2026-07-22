import React, { useState } from 'react';
import { TrendingUp, BarChart3, LineChart, Layers } from 'lucide-react';
import type { RevenueAnalyticsData } from '../../services/reportsService';

interface RevenueAnalyticsChartProps {
  data?: RevenueAnalyticsData;
}

export const RevenueAnalyticsChart: React.FC<RevenueAnalyticsChartProps> = ({ data }) => {
  const [chartMode, setChartMode] = useState<'revenue' | 'orders' | 'aov'>('revenue');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || !data.labels || data.labels.length === 0) return null;

  const currentSeries =
    chartMode === 'revenue'
      ? data.revenue_series
      : chartMode === 'orders'
      ? data.orders_series
      : data.aov_series;

  const maxValue = Math.max(...currentSeries, 1);
  const chartHeight = 220;
  const chartWidth = 700;

  // Build SVG Path
  const points = currentSeries.map((val, idx) => {
    const x = (idx / (currentSeries.length - 1 || 1)) * chartWidth;
    const y = chartHeight - (val / maxValue) * (chartHeight - 30) - 15;
    return { x, y, val };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Revenue & Sales Performance</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#005F63]/10 text-[#005F63] rounded-full border border-[#005F63]/20">
              Live Trend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Time-series distribution across sales volume, gross revenue, and transaction average.
          </p>
        </div>

        {/* Chart View Selector */}
        <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setChartMode('revenue')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              chartMode === 'revenue'
                ? 'bg-white text-[#005F63] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue (₹)
          </button>
          <button
            onClick={() => setChartMode('orders')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              chartMode === 'orders'
                ? 'bg-white text-sky-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order Count
          </button>
          <button
            onClick={() => setChartMode('aov')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              chartMode === 'aov'
                ? 'bg-white text-teal-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AOV (₹)
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-500">Period Gross Revenue</div>
          <div className="text-lg font-extrabold text-[#005F63] mt-0.5">₹{data.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-500">Period Orders Volume</div>
          <div className="text-lg font-extrabold text-sky-800 mt-0.5">{data.total_orders.toLocaleString()} orders</div>
        </div>
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-500">Average Transaction Value</div>
          <div className="text-lg font-extrabold text-emerald-800 mt-0.5">₹{data.avg_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative mt-4 pt-2 pb-6 px-2 overflow-x-auto">
        <div className="min-w-[650px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56 overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005F63" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#005F63" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * (1 - ratio)}
                x2={chartWidth}
                y2={chartHeight * (1 - ratio)}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Line Path */}
            <path d={linePath} fill="none" stroke="#005F63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Points */}
            {points.map((p, idx) => (
              <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIdx === idx ? "6" : "4"}
                  className="fill-white stroke-[#005F63] stroke-[3px] transition-all cursor-pointer"
                />
              </g>
            ))}
          </svg>

          {/* Hover Tooltip display */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div
              className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full font-medium z-10"
              style={{
                left: `${(points[hoveredIdx].x / chartWidth) * 100}%`,
                top: `${points[hoveredIdx].y}px`,
              }}
            >
              <div className="text-[10px] text-slate-300 font-semibold">{data.labels[hoveredIdx]}</div>
              <div className="text-emerald-400 font-bold">
                {chartMode === 'orders'
                  ? `${points[hoveredIdx].val} orders`
                  : `₹${points[hoveredIdx].val.toLocaleString('en-IN')}`}
              </div>
            </div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-medium text-slate-400">
            {data.labels.filter((_, i) => i % Math.ceil(data.labels.length / 8) === 0).map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

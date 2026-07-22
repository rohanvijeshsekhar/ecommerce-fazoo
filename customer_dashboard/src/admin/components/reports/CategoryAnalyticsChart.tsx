import React from 'react';
import { PieChart, Tag } from 'lucide-react';
import type { CategoryAnalyticsData } from '../../services/reportsService';

interface CategoryAnalyticsChartProps {
  data?: CategoryAnalyticsData;
}

export const CategoryAnalyticsChart: React.FC<CategoryAnalyticsChartProps> = ({ data }) => {
  if (!data || !data.categories || data.categories.length === 0) return null;

  // Compute SVG Donut Paths
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.categories.map((cat) => {
    const startPercent = cumulativePercent;
    cumulativePercent += cat.percentage / 100;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = cat.percentage / 100 > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`,
    ].join(' ');

    return { ...cat, pathData };
  });

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Category Revenue Distribution</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-700 rounded-full border border-sky-500/20">
              Taxonomy Share
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Revenue and volume share breakdown by product category.
          </p>
        </div>

        {/* Donut Chart & Legend Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-5">
          {/* Donut Ring SVG */}
          <div className="relative flex items-center justify-center py-2">
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-48 h-48 transform -rotate-90">
              {slices.map((slice, i) => (
                <path
                  key={i}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all hover:opacity-80 cursor-pointer"
                />
              ))}
              {/* Inner White Mask for Donut Effect */}
              <circle cx="0" cy="0" r="0.65" fill="#FFFFFF" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                ₹{data.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-3">
            {data.categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                    <div className="text-[10px] text-slate-400">{cat.orders} orders placed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900">{cat.percentage}%</div>
                  <div className="text-[10px] text-slate-500 font-medium">₹{cat.revenue.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

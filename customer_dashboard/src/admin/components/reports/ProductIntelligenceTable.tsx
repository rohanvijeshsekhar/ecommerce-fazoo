import React from 'react';
import { Package, TrendingUp, ArrowUpRight, AlertCircle } from 'lucide-react';
import type { ProductIntelligenceItem } from '../../services/reportsService';

interface ProductIntelligenceTableProps {
  products?: ProductIntelligenceItem[];
}

export const ProductIntelligenceTable: React.FC<ProductIntelligenceTableProps> = ({ products = [] }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Product Intelligence & Best Sellers</h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-800 rounded-full border border-amber-500/20">
              Top 10 Drivers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dental equipment products ranked by volume and total generated sales revenue.
          </p>
        </div>
      </div>

      {/* Product List Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/60 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <th className="py-3 px-3">Rank</th>
              <th className="py-3 px-3">Product Details</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3 text-right">Units Sold</th>
              <th className="py-3 px-3 text-right">Total Revenue</th>
              <th className="py-3 px-3 text-center">Stock Availability</th>
              <th className="py-3 px-3 text-right">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {products.map((item) => {
              const rankBadgeClass =
                item.rank === 1
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : item.rank === 2
                  ? 'bg-slate-200 text-slate-800 font-bold'
                  : item.rank === 3
                  ? 'bg-amber-700/20 text-amber-900 font-bold'
                  : 'bg-slate-100 text-slate-600 font-semibold';

              const stockBadgeClass =
                item.stock_status === 'In Stock'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : item.stock_status === 'Low Stock'
                  ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20';

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Rank */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${rankBadgeClass}`}>
                      #{item.rank}
                    </span>
                  </td>

                  {/* Product Details */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-slate-200/80 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-[#005F63] transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                      {item.category}
                    </span>
                  </td>

                  {/* Units Sold */}
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {item.units_sold.toLocaleString()} units
                  </td>

                  {/* Total Revenue */}
                  <td className="py-3 px-3 text-right font-black text-[#005F63]">
                    ₹{item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Stock Availability */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stockBadgeClass}`}>
                      {item.stock_status === 'Low Stock' && <AlertCircle className="w-3 h-3" />}
                      {item.stock_status} ({item.stock_quantity})
                    </span>
                  </td>

                  {/* Growth */}
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{item.growth}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

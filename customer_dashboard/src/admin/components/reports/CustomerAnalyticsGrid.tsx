import React from 'react';
import { Users, UserPlus, RefreshCw, Award, ShoppingCart } from 'lucide-react';
import type { CustomerAnalyticsData } from '../../services/reportsService';

interface CustomerAnalyticsGridProps {
  data?: CustomerAnalyticsData;
}

export const CustomerAnalyticsGrid: React.FC<CustomerAnalyticsGridProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Customer Analytics & Lifetime Value</h3>
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 rounded-full border border-emerald-500/20">
            Retention & LTV
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          New buyer acquisition, returning client ratio, and customer lifetime value metrics.
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Card 1: New vs Returning */}
        <div className="p-4 rounded-xl border border-slate-200/60 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Acquisition Split</span>
            <UserPlus className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{data.new_customers}</span>
            <span className="text-xs font-bold text-sky-600">new buyers</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {data.returning_customers} returning customers in catalog
          </div>
        </div>

        {/* Card 2: Repeat Purchase Rate */}
        <div className="p-4 rounded-xl border border-slate-200/60 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Repeat Purchase Rate</span>
            <RefreshCw className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{data.repeat_purchase_rate}%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Customers with &gt; 1 completed order
          </div>
        </div>

        {/* Card 3: Customer LTV */}
        <div className="p-4 rounded-xl border border-slate-200/60 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customer Lifetime Value</span>
            <Award className="w-4 h-4 text-[#005F63]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#005F63]">₹{data.customer_ltv.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Average revenue per registered user
          </div>
        </div>

        {/* Card 4: Average Orders Per Customer */}
        <div className="p-4 rounded-xl border border-slate-200/60 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Orders / Buyer</span>
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-800">{data.avg_orders_per_customer}</span>
            <span className="text-xs font-semibold text-slate-400">orders</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Order frequency ratio
          </div>
        </div>
      </div>
    </div>
  );
};

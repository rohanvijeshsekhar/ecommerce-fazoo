import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ArrowUpRight, ShoppingBag,
  IndianRupee, Package, Users, Layers,
  Calendar, Activity,
  Handshake, Tag, Award, Sparkles, PlusCircle
} from 'lucide-react';
import { useBreadcrumbSync } from '../contexts/BreadcrumbContext';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService, adminService, adminCustomersService, adminDealersService, adminOrdersService } from '../services/adminService';
import type { DashboardStat } from '../types/admin';
import type { OrderDetail } from '../../services/ordersService';

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Mock Data for Sales Analytics (with 1 Year support)
// ─────────────────────────────────────────────────────────────────────────────
const ANALYTICS_DATA: Record<string, Record<string, { labels: string[]; values: number[]; dates: string[] }>> = {
  '7 Days': {
    'Revenue': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [12000, 24000, 18000, 35000, 29000, 42000, 38000],
      dates: ['July 1', 'July 2', 'July 3', 'July 4', 'July 5', 'July 6', 'July 7']
    },
    'Orders': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [3, 6, 4, 9, 7, 12, 10],
      dates: ['July 1', 'July 2', 'July 3', 'July 4', 'July 5', 'July 6', 'July 7']
    }
  },
  '30 Days': {
    'Revenue': {
      labels: ['W1', 'W2', 'W3', 'W4'],
      values: [120000, 185000, 290000, 340000],
      dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    },
    'Orders': {
      labels: ['W1', 'W2', 'W3', 'W4'],
      values: [42, 58, 85, 96],
      dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    }
  },
  '90 Days': {
    'Revenue': {
      labels: ['Apr', 'May', 'Jun'],
      values: [450000, 720000, 890000],
      dates: ['April 2026', 'May 2026', 'June 2026']
    },
    'Orders': {
      labels: ['Apr', 'May', 'Jun'],
      values: [120, 195, 245],
      dates: ['April 2026', 'May 2026', 'June 2026']
    }
  },
  '1 Year': {
    'Revenue': {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      values: [1420000, 1850000, 2490000, 3120000],
      dates: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']
    },
    'Orders': {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      values: [480, 590, 810, 990],
      dates: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']
    }
  }
};

const RECENT_ACTIVITIES = [
  { type: 'product', title: 'Product listed', desc: 'Samsung S24 listed under Dental Chairs', time: '2 hours ago' },
  { type: 'brand', title: 'Brand adjusted', desc: 'Apple brand metadata and warranty policy adjusted', time: '4 hours ago' },
  { type: 'combo', title: 'Combo published', desc: 'Orthodontic Starter Kit combo now live', time: 'Yesterday' },
  { type: 'stock', title: 'Inventory updated', desc: 'Added 50 units to NSK Pana-Max Air Turbine stock', time: '2 days ago' },
];

const AdminDashboard: React.FC = () => {
  useBreadcrumbSync([{ label: 'Dashboard' }]);
  const navigate = useNavigate();
  const { user, adminUser } = useAuth();
  const activeAdmin = adminUser || user;

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderDetail[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7 Days' | '30 Days' | '90 Days' | '1 Year'>('7 Days');
  const [analyticsMetric, setAnalyticsMetric] = useState<'Revenue' | 'Orders'>('Revenue');
  const [useDemoData, setUseDemoData] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // Time of Day Greeting helper
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Live Date & Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setDateStr(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, prodRes, customerStatsRes, dealerStatsRes, ordersRes] = await Promise.all([
        dashboardService.getStats(),
        adminService.getProducts(),
        adminCustomersService.getStats().catch(() => null),
        adminDealersService.getStats().catch(() => null),
        adminOrdersService.getOrders().catch(() => null),
      ]);

      if (ordersRes?.success && Array.isArray(ordersRes.data)) {
        setRecentOrders(ordersRes.data.slice(0, 5));
      }
      setLoadingOrders(false);

      if (statsRes.success && statsRes.data) {
        let liveStats = [...statsRes.data];

        // Patch customer count from live API
        if (customerStatsRes?.success && customerStatsRes.data) {
          liveStats = liveStats.map(s =>
            s.id === 'customers'
              ? { ...s, value: customerStatsRes.data!.total_customers, subValue: `${customerStatsRes.data!.active_customers} active` }
              : s
          );
        }

        // Patch dealer pending count from live API
        if (dealerStatsRes?.success && dealerStatsRes.data) {
          liveStats = liveStats.map(s =>
            s.id === 'dealer_approvals'
              ? { ...s, value: dealerStatsRes.data!.pending, subValue: `${dealerStatsRes.data!.pending} pending review` }
              : s
          );
        }

        setStats(liveStats);
      }
      if (prodRes.success && prodRes.data) {
        const lowItems = prodRes.data.filter(p => {
          const stock = p.inventory?.current_stock ?? 999;
          const threshold = p.inventory?.low_stock_threshold ?? 5;
          return stock <= threshold;
        });
        setLowStockItems(lowItems);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stat values or fallback to default values
  const getStatVal = (id: string, def: string | number) => {
    const found = stats.find(s => s.id === id);
    return found ? found.value : def;
  };

  const adminName = user?.full_name?.split(' ')[0] || 'Admin';

  // SVG Chart Calculation
  const currentChart = ANALYTICS_DATA[analyticsPeriod][analyticsMetric];
  const svgHeight = 180;
  const svgWidth = 600;
  const paddingX = 40;
  const paddingY = 20;
  const chartHeight = svgHeight - paddingY * 2;
  const chartWidth = svgWidth - paddingX * 2;

  const maxVal = Math.max(...currentChart.values) * 1.15 || 100;
  const points = currentChart.values.map((v, i) => {
    const x = paddingX + (i / (currentChart.values.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (v / maxVal) * chartHeight;
    return { x, y, value: v, label: currentChart.labels[i], date: currentChart.dates[i] };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Get Low Stock List to render
  const stockItemsToRender = lowStockItems.length > 0 
    ? lowStockItems.slice(0, 3) 
    : [
        { name: 'Contra-angle speed handpiece', sku: 'NSK-CA-802', current_stock: 2, low_stock_threshold: 5 },
        { name: 'LED cordless curing light', sku: 'DENT-CL-04', current_stock: 1, low_stock_threshold: 3 },
        { name: '3D intraoral scanner pro', sku: 'SCAN-3D-X', current_stock: 0, low_stock_threshold: 2 },
      ];


  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-16 px-4 md:px-6">

      {/* ── Top Hero Section ── */}
      <div className="bg-gradient-to-br from-[#005F63]/[0.02] via-[#0B7C80]/[0.04] to-white border border-[#005F63]/10 rounded-[24px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,95,99,0.015)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-[#005F63] uppercase tracking-widest bg-[#005F63]/8 px-3 py-1 rounded-full">
            Platform control center
          </span>
          <h1 className="text-[36px] md:text-[40px] font-extrabold text-[#111827] tracking-tight leading-none">
            {getGreeting()}, <span className="text-[#005F63]">{adminName}</span>
          </h1>
          <p className="text-[13px] text-[#64748B] font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateStr}</span>
            <span className="text-slate-300">•</span>
            <Clock className="w-4 h-4 text-slate-400" />
      <div className="bg-gradient-to-r from-[#004D54] via-[#005F63] to-[#0B7C80] rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(0,95,99,0.2)]">
        <div className="absolute -right-10 -bottom-20 w-96 h-96 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute right-60 -top-20 w-72 h-72 rounded-full bg-[#F58220]/[0.08] blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wide text-teal-100 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#F58220]" /> FAAZO Operational Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-100 to-amber-200">{adminName}</span>
            </h1>
            <p className="text-sm text-teal-100/80 font-medium max-w-xl leading-relaxed">
              Here's your live operational overview for today. Monitor real-time orders, manage catalog inventory, and process dealer approvals seamlessly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-teal-200/90">{dateStr}</p>
              <p className="text-xl font-black font-mono tracking-tight text-white">{timeStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Stat Cards Grid (4 columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            id: 'revenue',
            title: 'Gross revenue',
            value: `₹${Number(getStatVal('revenue', 0)).toLocaleString('en-IN')}`,
            subText: 'Total orders revenue',
            icon: IndianRupee,
            gradient: 'from-emerald-500/10 to-teal-500/5',
            border: 'border-emerald-500/15',
            iconBg: 'bg-emerald-500/10 text-emerald-600',
            onClick: () => navigate('/admin/reports')
          },
          {
            id: 'orders',
            title: 'Total orders',
            value: getStatVal('orders', 0),
            subText: 'All time orders',
            icon: ShoppingBag,
            gradient: 'from-blue-500/10 to-cyan-500/5',
            border: 'border-blue-500/15',
            iconBg: 'bg-blue-500/10 text-blue-600',
            onClick: () => navigate('/admin/orders')
          },
          {
            id: 'customers',
            title: 'Registered customers',
            value: getStatVal('customers', 0),
            subText: 'Active users',
            icon: Users,
            gradient: 'from-purple-500/10 to-indigo-500/5',
            border: 'border-purple-500/15',
            iconBg: 'bg-purple-500/10 text-purple-600',
            onClick: () => navigate('/admin/customers')
          },
          {
            id: 'dealer_approvals',
            title: 'Pending dealer requests',
            value: getStatVal('dealer_approvals', 0),
            subText: 'Requires review',
            icon: Handshake,
            gradient: 'from-amber-500/10 to-orange-500/5',
            border: 'border-amber-500/15',
            iconBg: 'bg-amber-500/10 text-amber-600',
            onClick: () => navigate('/admin/dealers')
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`bg-white rounded-[24px] p-6 border ${card.border} shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-br ${card.gradient} opacity-50 pointer-events-none`} />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.iconBg} group-hover:scale-110 transition-transform duration-200 shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">{card.value}</p>
                <p className="text-xs font-semibold text-slate-400">{card.subText}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dashboard Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left Col (65% width) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Sales Analytics Chart Card */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.01)] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#005F63]" /> Sales analytics
                </h3>
                <p className="text-[13px] text-slate-400 font-medium">Monitor customer purchase volume and values</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Metric Selector */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {(['Revenue', 'Orders'] as const).map(metric => (
                    <button
                      key={metric}
                      onClick={() => setAnalyticsMetric(metric)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        analyticsMetric === metric 
                          ? 'bg-white text-[#005F63] shadow-2xs font-extrabold' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>

                {/* Period Selector */}
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {(['7 Days', '30 Days', '90 Days', '1 Year'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setAnalyticsPeriod(period)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        analyticsPeriod === period 
                          ? 'bg-white text-[#005F63] shadow-2xs font-extrabold' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                {/* Live vs Demo Toggle */}
                <button
                  onClick={() => setUseDemoData(!useDemoData)}
                  className={`px-2.5 py-1.5 text-[10px] font-bold rounded-xl border transition-colors ${
                    useDemoData 
                      ? 'border-[#005F63]/25 bg-[#005F63]/5 text-[#005F63]' 
                      : 'border-slate-200 text-slate-455 hover:bg-slate-50'
                  }`}
                >
                  {useDemoData ? 'Demo view' : 'Live data'}
                </button>
              </div>
            </div>

            {/* Analytics Content */}
            {!useDemoData ? (
              <div className="h-[220px] border border-dashed border-slate-200 rounded-[20px] flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/50">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-[14px] font-bold text-slate-800">No transactional records</h4>
                <p className="text-[13px] text-slate-450 max-w-[320px] mt-1 leading-relaxed">
                  Integrate your billing databases to visualize live transactional patterns on the platform.
                </p>
              </div>
            ) : (
              <div className="relative pt-6">
                {/* SVG Area Chart */}
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" className="overflow-visible">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#005F63" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#005F63" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + chartHeight * ratio;
                    return (
                      <line 
                        key={idx} 
                        x1={paddingX} 
                        y1={y} 
                        x2={svgWidth - paddingX} 
                        y2={y} 
                        stroke="#EEF3F7" 
                        strokeWidth={1} 
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Area fill */}
                  <path d={areaPath} fill="url(#chartGrad)" />

                  {/* Line path */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="#005F63" 
                    strokeWidth={3} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />

                  {/* Nodes */}
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint?.index === i ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#005F63"
                      strokeWidth={hoveredPoint?.index === i ? 3.5 : 2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredPoint({ ...p, index: i })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between px-[40px] mt-3">
                  {currentChart.labels.map((lbl, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-slate-400">{lbl}</span>
                  ))}
                </div>

                {/* Interactive Tooltip Card */}
                {hoveredPoint && (
                  <div 
                    className="absolute bg-slate-900/95 backdrop-blur-xs text-white rounded-xl p-2.5 shadow-xl border border-slate-800 z-10 flex flex-col pointer-events-none transition-all duration-100"
                    style={{ 
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
                      top: `${(hoveredPoint.y / svgHeight) * 100 - 32}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-0.5">{hoveredPoint.date}</span>
                    <span className="text-xs font-extrabold">
                      {analyticsMetric === 'Revenue' ? `₹${hoveredPoint.value.toLocaleString('en-IN')}` : `${hoveredPoint.value} Orders`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-4">
            <h3 className="text-[16px] font-bold text-slate-800 px-1">Quick operational shortcuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Add product', path: '/admin/products', icon: PlusCircle, bg: 'from-teal-50 to-emerald-50', text: 'text-teal-700', border: 'border-teal-100' },
                { title: 'Create brand', path: '/admin/brands', icon: Award, bg: 'from-blue-50 to-indigo-50', text: 'text-blue-700', border: 'border-blue-100' },
                { title: 'Import inventory', path: '/admin/inventory', icon: Layers, bg: 'from-purple-50 to-pink-50', text: 'text-purple-700', border: 'border-purple-100' },
                { title: 'Manage categories', path: '/admin/categories', icon: Tag, bg: 'from-amber-50 to-orange-50', text: 'text-amber-700', border: 'border-amber-100' },
                { title: 'Create combo', path: '/admin/combos', icon: Sparkles, bg: 'from-rose-50 to-red-50', text: 'text-rose-700', border: 'border-rose-100' },
                { title: 'Manage dealers', path: '/admin/dealers', icon: Handshake, bg: 'from-sky-50 to-blue-50', text: 'text-sky-700', border: 'border-sky-100' }
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={`flex items-center gap-3.5 p-4 rounded-[20px] bg-gradient-to-br ${action.bg} border ${action.border} hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-left group`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <Icon className={`w-5 h-5 ${action.text}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 leading-tight">{action.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Quick setup →</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.01)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#005F63]" /> Recent orders
                </h3>
                <p className="text-[13px] text-slate-400 font-medium mt-0.5">The latest orders processed through the platform</p>
              </div>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="text-[11px] font-bold text-[#005F63] hover:text-[#0B7C80] flex items-center gap-0.5 bg-[#005F63]/[0.04] px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-[#005F63]/10 cursor-pointer"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        Loading recent orders…
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-semibold">
                        No orders found in system yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((ord) => {
                      const statusInfo = formatOrderStatus(ord.status);
                      const formattedDate = ord.created_at
                        ? new Date(ord.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—';
                      return (
                        <tr
                          key={ord.id}
                          onClick={() => navigate(`/admin/orders/${ord.id}`)}
                          className="hover:bg-slate-50/70 transition-all duration-150 text-xs font-semibold text-slate-650 cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 text-[#005F63] font-bold font-mono group-hover:underline">
                            {ord.order_number}
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] border border-slate-200/40 shadow-2xs shrink-0">
                                {getInitials(ord.customer_name)}
                              </div>
                              <span className="truncate max-w-[160px] text-slate-800 font-semibold">{ord.customer_name || 'Customer'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-800">
                            ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-medium">{formattedDate}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col (35% width) - Stacked Widgets */}
        <div className="space-y-8">


          {/* Inventory Health Widget */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.01)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#111827] tracking-tight">Inventory distribution</h3>
              <span className="text-[10px] font-extrabold text-[#005F63] bg-[#005F63]/[0.05] px-2 py-0.5 rounded-lg border border-[#005F63]/10">
                Healthy
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                { label: 'In stock', count: 38, pct: 84, color: 'bg-[#005F63]' },
                { label: 'Low stock', count: 4, pct: 9, color: 'bg-amber-400' },
                { label: 'Out of stock', count: 3, pct: 7, color: 'bg-rose-500' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-400 font-bold">{item.count} items ({item.pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts (Beautiful Product Cards) */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.01)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800">Critical inventory</h3>
                <p className="text-[11px] text-slate-400 font-medium">Reorder items before they impact operations</p>
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 shrink-0">
                {stockItemsToRender.filter(s => s.current_stock <= s.low_stock_threshold).length} urgent
              </span>
            </div>

            <div className="space-y-3.5">
              {stockItemsToRender.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200 space-y-3"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100/60 flex items-center justify-center text-slate-450 shrink-0 shadow-2xs">
                        <Package className="w-5 h-5 text-[#005F63]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">SKU: {item.sku || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
                      item.current_stock === 0 
                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {item.current_stock === 0 ? 'Out of stock' : 'Low stock'}
                    </span>
                  </div>

                  {/* Stock progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Stock level</span>
                      <span className="font-bold text-slate-600">{item.current_stock} / {item.low_stock_threshold} min</span>
                    </div>
                    <div className="h-1.5 w-full bg-white border border-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        item.current_stock === 0 ? 'bg-rose-500' : 'bg-amber-400'
                      }`} style={{ width: `${Math.min(100, (item.current_stock / item.low_stock_threshold) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Order action */}
                  <button 
                    onClick={() => navigate('/admin/inventory')}
                    className="w-full py-1.5 text-[11px] font-bold text-[#005F63] bg-white border border-[#005F63]/20 rounded-xl hover:bg-[#005F63]/[0.03] hover:border-[#005F63]/40 transition-colors"
                  >
                    Quick reorder
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Timeline Widget */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.01)] p-6">
            <div className="mb-5">
              <h3 className="text-[15px] font-bold text-slate-800">Operational logs</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Timeline of recent portal updates</p>
            </div>

            <div className="relative pl-5 border-l border-slate-100 space-y-6 ml-2">
              {RECENT_ACTIVITIES.map((act, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Icon/Bullet */}
                  <span className={`absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center transition-transform duration-200 group-hover:scale-110
                    ${act.type === 'product' ? 'border-teal-500' :
                      act.type === 'brand' ? 'border-blue-500' :
                      act.type === 'combo' ? 'border-rose-500' :
                      'border-amber-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${act.type === 'product' ? 'bg-teal-500' :
                        act.type === 'brand' ? 'bg-blue-500' :
                        act.type === 'combo' ? 'bg-rose-500' :
                        'bg-amber-500'}`} />
                  </span>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-700">{act.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-450 font-medium mt-0.5 leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;

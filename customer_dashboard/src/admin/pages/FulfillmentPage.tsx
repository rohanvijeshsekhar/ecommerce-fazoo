import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Package, RefreshCw, Search, Filter, Eye,
  MapPin, Clock, CheckCircle2, XCircle, AlertTriangle,
  Calendar, ChevronRight, RotateCcw,
} from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useToast } from '../components/Toast';
import { useBreadcrumbSync } from '../contexts/BreadcrumbContext';
import type { ColumnDef } from '../types/admin';
import {
  adminShippingService,
  SHIPMENT_STATUS_LABELS,
  PICKUP_STATUS_LABELS,
} from '../../services/shippingService';
import type { ShipmentListItem, ShipmentStatus, FulfillmentStats } from '../../services/shippingService';

// ── Helpers ────────────────────────────────────────────────────────────────────

const getShipmentVariant = (status: ShipmentStatus): 'success' | 'info' | 'warning' | 'error' | 'purple' | 'neutral' => {
  switch (status) {
    case 'delivered':        return 'success';
    case 'out_for_delivery': return 'info';
    case 'in_transit':       return 'info';
    case 'picked_up':        return 'purple';
    case 'pickup_scheduled': return 'warning';
    case 'created':          return 'warning';
    case 'failed_delivery':  return 'error';
    case 'cancelled':        return 'error';
    case 'rto_initiated':    return 'error';
    default:                 return 'neutral';
  }
};

const ALL_STATUSES: ShipmentStatus[] = [
  'created', 'pickup_scheduled', 'picked_up', 'reached_hub',
  'in_transit', 'out_for_delivery', 'delivered',
  'failed_delivery', 'rto_initiated', 'cancelled',
];

// ── Component ──────────────────────────────────────────────────────────────────

const FulfillmentPage: React.FC = () => {
  useBreadcrumbSync([
    { label: 'Operations' },
    { label: 'Fulfillment', path: '/admin/fulfillment' },
  ]);

  const navigate = useNavigate();
  const toast = useToast();

  const [shipments, setShipments] = useState<ShipmentListItem[]>([]);
  const [stats, setStats] = useState<FulfillmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (pickupDate) params.pickup_date = pickupDate;
      if (deliveryDate) params.delivery_date = deliveryDate;

      const [shipmentsRes, statsRes] = await Promise.all([
        adminShippingService.listShipments(params),
        adminShippingService.getStats(),
      ]);

      if (shipmentsRes.success && shipmentsRes.data) {
        setShipments(shipmentsRes.data);
        setTotal((shipmentsRes as any).meta?.pagination?.total || 0);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, pickupDate, deliveryDate, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSyncTracking = async (shipmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(shipmentId);
    try {
      const res = await adminShippingService.syncTracking(shipmentId);
      if (res.success) {
        toast.success(res.message || 'Tracking synced.');
        fetchData();
      } else {
        toast.error(res.message || 'Sync failed.');
      }
    } catch {
      toast.error('Failed to sync tracking.');
    } finally {
      setSyncing(null);
    }
  };

  // ── Table columns ────────────────────────────────────────
  const columns: ColumnDef<ShipmentListItem>[] = [
    {
      header: 'AWB / Order',
      accessor: (row) => (
        <div>
          <p className="text-xs font-black text-slate-800 font-mono">{row.awb_number || '—'}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{row.order_number}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <p className="text-xs font-bold text-slate-700">{row.customer_name}</p>
      ),
    },
    {
      header: 'Courier',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#006670]" />
          <span className="text-xs font-bold text-slate-700">{row.courier_name}</span>
        </div>
      ),
    },
    {
      header: 'Shipment Status',
      accessor: (row) => (
        <StatusBadge
          label={SHIPMENT_STATUS_LABELS[row.shipment_status] || row.shipment_status}
          variant={getShipmentVariant(row.shipment_status)}
        />
      ),
    },
    {
      header: 'Pickup',
      accessor: (row) => (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">
            {PICKUP_STATUS_LABELS[row.pickup_status] || row.pickup_status}
          </p>
          {row.pickup_scheduled_date && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date(row.pickup_scheduled_date).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[120px]">{row.current_location || '—'}</span>
        </div>
      ),
    },
    {
      header: 'EDD',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-xs">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 font-medium">
            {row.estimated_delivery_date
              ? new Date(row.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Last Synced',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" />
          {row.last_synced_at
            ? new Date(row.last_synced_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
            : 'Never'}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleSyncTracking(row.id, e)}
            disabled={syncing === row.id}
            title="Sync tracking"
            className="p-1.5 rounded-lg border border-slate-200 hover:border-[#006670] hover:text-[#006670] text-slate-500 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing === row.id ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/orders/${row.id}`);
            }}
            title="View order"
            className="p-1.5 rounded-lg border border-slate-200 hover:border-[#006670] hover:text-[#006670] text-slate-500 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ── Stats Cards ───────────────────────────────────────────────────────────────
  const statCards = stats
    ? [
        { label: 'Total Shipments', value: stats.total_shipments, icon: <Truck className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-50' },
        { label: 'Pending Packing', value: stats.pending_packing, icon: <Package className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Pickup Pending', value: stats.pickup_scheduled + stats.created, icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'In Transit', value: stats.in_transit + stats.picked_up + stats.reached_hub, icon: <ChevronRight className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Out for Delivery', value: stats.out_for_delivery, icon: <Truck className="w-4 h-4" />, color: 'text-[#006670]', bg: 'bg-[#e6f3f5]' },
        { label: 'Delivered', value: stats.delivered, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Failed Delivery', value: stats.failed_delivery, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'RTO / Cancelled', value: stats.rto_initiated + stats.cancelled, icon: <RotateCcw className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50' },
      ]
    : [];

  return (
    <div className="space-y-6 select-none text-left font-sans animate-in fade-in duration-200">
      <SectionHeader
        title="Fulfillment"
        subtitle="Manage Delhivery shipments, tracking sync, and delivery lifecycle"
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-slate-600 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm flex flex-col gap-2"
            >
              <div className={`w-7 h-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                {card.icon}
              </div>
              <div>
                <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-tight mt-0.5">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by AWB, order number, customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-[#006670] transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#006670] bg-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{SHIPMENT_STATUS_LABELS[s]}</option>
            ))}
          </select>

          {/* More Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${showFilters ? 'bg-[#006670] text-white border-[#006670]' : 'text-slate-600 border-slate-200 hover:border-slate-300 bg-white'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => { setPickupDate(e.target.value); setPage(1); }}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#006670]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => { setDeliveryDate(e.target.value); setPage(1); }}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#006670]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setPickupDate(''); setDeliveryDate(''); setSearch(''); setStatusFilter('all'); setPage(1); }}
                className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-[#006670] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={<Truck className="w-8 h-8 text-slate-300" />}
            title="No shipments found"
            description="Create a shipment by opening a packed order and clicking 'Create Shipment'."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={shipments}
              onRowClick={(row) => navigate(`/admin/orders/${row.id}`)}
            />
            {/* Pagination */}
            {total > pageSize && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-medium">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page * pageSize >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:border-slate-300 transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FulfillmentPage;

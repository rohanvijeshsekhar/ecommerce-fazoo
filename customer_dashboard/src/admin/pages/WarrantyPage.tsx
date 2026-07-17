import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, RefreshCw, Search,
  ChevronDown, Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import { warrantyService } from '../../services/warranty';
import type { WarrantyRegistration, WarrantyClaim, AdminWarrantyStats } from '../../services/warranty';

const WarrantyPage: React.FC = () => {
  const navigate = useNavigate();

  // Stats State
  const [stats, setStats] = useState<AdminWarrantyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Tab State: 'claims' | 'registrations'
  const [activeTab, setActiveTab] = useState<'claims' | 'registrations'>('registrations');

  // Sub-filter States
  // Registrations sub-filter: 'pending_verification' | 'active' | 'rejected'
  const [regSubFilter, setRegSubFilter] = useState<'pending_verification' | 'active' | 'rejected'>('pending_verification');
  // Claims sub-filter: 'submitted' | 'under_review' | 'approved' | 'assigned' | 'repair_in_progress' | 'completed' | 'closed' | 'rejected'
  const [claimSubFilter, setClaimSubFilter] = useState<string>('submitted');

  // List States
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [regs, setRegs] = useState<WarrantyRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/Filters State
  const [searchCustomer, setSearchCustomer] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await warrantyService.getAdminDashboard();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: pageSize,
      };

      if (searchCustomer.trim()) params.customer = searchCustomer.trim();
      if (filterRole) params.role = filterRole;
      if (searchProduct.trim()) params.product = searchProduct.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      if (activeTab === 'claims') {
        params.status = claimSubFilter;
        const res = await warrantyService.getAdminClaims(params);
        if (res.success && res.data) {
          setClaims(res.data);
          const meta = (res as any).meta || {};
          if (meta.pagination) {
            setTotalPages(meta.pagination.total_pages);
          }
        }
      } else {
        params.status = regSubFilter;
        const res = await warrantyService.getAdminRegistrations(params);
        if (res.success && res.data) {
          setRegs(res.data);
          const meta = (res as any).meta || {};
          if (meta.pagination) {
            setTotalPages(meta.pagination.total_pages);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load list data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, regSubFilter, claimSubFilter, page, searchCustomer, filterRole, searchProduct, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, regSubFilter, claimSubFilter, searchCustomer, filterRole, searchProduct, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetFilters = () => {
    setSearchCustomer('');
    setFilterRole('');
    setSearchProduct('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100">Submitted</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100">Under Review</span>;
      case 'need_more_info':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100">Need Info</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100">Approved</span>;
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-100">Assigned</span>;
      case 'repair_in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200">In Repair</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">Completed</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-50 border border-slate-200">Closed</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-50">{statusVal}</span>;
    }
  };

  const getRegistrationStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'pending_registration':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100">Pending Registration</span>;
      case 'pending_verification':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100">Awaiting Verification</span>;
      case 'need_more_info':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100">Need Info</span>;
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100">Active</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-50">{statusVal}</span>;
    }
  };

  const getPriorityBadge = (priorityVal: string) => {
    switch (priorityVal) {
      case 'critical': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500 text-white tracking-wider">Critical</span>;
      case 'high': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-500 text-white tracking-wider">High</span>;
      case 'medium': return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-white tracking-wider">Medium</span>;
      default: return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-400 text-white tracking-wider">Low</span>;
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight font-display">FAAZO Warranty Operations</h1>
          <p className="text-xs text-slate-400 mt-1">Verify manual customer registration submissions and resolve equipment trouble tickets.</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchData(); }}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
        </button>
      </div>

      {/* Analytics Summary */}
      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-24 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Verification Backlog</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.regs_pending_verification}</p>
            <span className="text-[9px] font-bold text-slate-400">{stats.regs_approved} Total Approved Assets</span>
          </div>

          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Claims Submitted</span>
              <Wrench className="w-4 h-4 text-[#005B63]" />
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.claims_submitted}</p>
            <span className="text-[9px] font-bold text-amber-600">⌛ {stats.claims_under_review} Under Review</span>
          </div>

          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">In Workshop</span>
              <RefreshCw className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.claims_repair_in_progress}</p>
            <span className="text-[9px] font-bold text-[#005B63]">{stats.claims_assigned} Provider Assigned</span>
          </div>

          <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Resolved Claims</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.claims_completed}</p>
            <span className="text-[9px] font-bold text-slate-400">{stats.claims_closed} Claims Closed</span>
          </div>
        </div>
      ) : null}

      {/* Main Tabs */}
      <div className="flex border-b border-slate-100 mt-6">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'registrations'
              ? 'border-[#005B63] text-[#005B63]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Warranty Registrations
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'claims'
              ? 'border-[#005B63] text-[#005B63]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Warranty Claims
        </button>
      </div>

      {/* Sub-Filters / Status Navigation */}
      <div className="flex flex-wrap gap-2 py-2">
        {activeTab === 'registrations' ? (
          <>
            <button
              onClick={() => setRegSubFilter('pending_verification')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                regSubFilter === 'pending_verification'
                  ? 'bg-[#005B63] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Pending Verification ({stats?.regs_pending_verification || 0})
            </button>
            <button
              onClick={() => setRegSubFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                regSubFilter === 'active'
                  ? 'bg-[#005B63] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Approved ({stats?.regs_approved || 0})
            </button>
            <button
              onClick={() => setRegSubFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                regSubFilter === 'rejected'
                  ? 'bg-[#005B63] text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Rejected ({stats?.regs_rejected || 0})
            </button>
          </>
        ) : (
          <>
            {[
              { id: 'submitted', label: 'Submitted', count: stats?.claims_submitted },
              { id: 'under_review', label: 'Under Review', count: stats?.claims_under_review },
              { id: 'approved', label: 'Approved', count: stats?.claims_approved },
              { id: 'assigned', label: 'Assigned', count: stats?.claims_assigned },
              { id: 'repair_in_progress', label: 'Repair In Progress', count: stats?.claims_repair_in_progress },
              { id: 'completed', label: 'Completed', count: stats?.claims_completed },
              { id: 'closed', label: 'Closed', count: stats?.claims_closed }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setClaimSubFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                  claimSubFilter === tab.id
                    ? 'bg-[#005B63] text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count || 0})
              </button>
            ))}
          </>
        )}
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Search Customer</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Doctor name or email..."
                value={searchCustomer}
                onChange={e => setSearchCustomer(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005B63]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">User Role</label>
            <div className="relative">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#005B63]"
              >
                <option value="">All Account Roles</option>
                <option value="customer">Customer (Practitioner)</option>
                <option value="dealer">Authorized Dealer</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Search Product</label>
            <div className="relative">
              <input
                type="text"
                placeholder="SKU or product name..."
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005B63]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005B63]"
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#005B63]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden font-sans">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#005B63]" />
            <p className="text-xs font-bold">Synchronizing registry ledger...</p>
          </div>
        ) : activeTab === 'registrations' ? (
          regs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">No warranty registrations match this status filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="p-4">Reg Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Serial Number</th>
                    <th className="p-4">Purchase Date</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {regs.map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-500">#{reg.id.substring(0, 8)}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{reg.user?.full_name}</p>
                        <span className="text-[10px] text-slate-400 capitalize">{reg.user?.role}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 truncate max-w-[180px]">{reg.product?.name}</p>
                        <span className="text-[10px] text-slate-400 block">SKU: {reg.product?.sku}</span>
                      </td>
                      <td className="p-4 font-mono font-black text-slate-700">
                        {reg.serial_number || <span className="text-slate-300 italic font-normal">Not Provided</span>}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{reg.purchase_date}</td>
                      <td className="p-4 text-slate-600 font-medium">{reg.warranty_end}</td>
                      <td className="p-4">{getRegistrationStatusBadge(reg.warranty_status)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/warranty/registrations/${reg.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          claims.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">No claims match this status filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="p-4">Claim Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Equipment Details</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Provider</th>
                    <th className="p-4">Date Filed</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {claims.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 font-black text-slate-800">{claim.claim_number}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{claim.registration_detail?.user?.full_name}</p>
                        <span className="text-[10px] text-slate-400 capitalize">{claim.registration_detail?.user?.role}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 truncate max-w-[180px]">{claim.registration_detail?.product?.name}</p>
                        <span className="text-[10px] text-slate-400 block font-mono">S/N: {claim.registration_detail?.serial_number || 'N/A'}</span>
                      </td>
                      <td className="p-4">{getPriorityBadge(claim.priority)}</td>
                      <td className="p-4">{getStatusBadge(claim.status)}</td>
                      <td className="p-4 text-slate-600 font-bold">{claim.assigned_provider || '—'}</td>
                      <td className="p-4 text-slate-400 font-medium">
                        {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/warranty/claims/${claim.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarrantyPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Paperclip, Shield,
  User, Package, AlertCircle, FileText, ChevronDown
} from 'lucide-react';
import { warrantyService } from '../../services/warranty';
import type { WarrantyClaim } from '../../services/warranty';

const WarrantyClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for Admin Action Panel
  const [actionNotes, setActionNotes] = useState('');
  const [actionResolution, setActionResolution] = useState('');
  const [actionProvider, setActionProvider] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchClaimDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await warrantyService.getAdminClaimDetail(id);
      if (res.success && res.data) {
        setClaim(res.data);
        setActionProvider(res.data.assigned_provider || '');
        setActionStatus(res.data.status);
      }
    } catch (err) {
      console.error('Failed to load claim detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetail();
  }, [id]);

  const handleAction = async (action: 'approve' | 'reject' | 'request_info' | 'assign' | 'update_status' | 'close') => {
    if (!id) return;
    setSubmittingAction(true);
    setErrorMessage('');

    try {
      const payload: any = {
        notes: actionNotes.trim(),
      };

      if (action === 'reject' || action === 'close') {
        if (!actionResolution.trim()) {
          setErrorMessage('Resolution notes are required for this action.');
          setSubmittingAction(false);
          return;
        }
        payload.resolution = actionResolution.trim();
      }

      if (action === 'assign') {
        if (!actionProvider.trim()) {
          setErrorMessage('Provider name is required for assignment.');
          setSubmittingAction(false);
          return;
        }
        payload.provider = actionProvider.trim();
      }

      if (action === 'update_status') {
        if (!actionStatus) {
          setErrorMessage('Status selection is required.');
          setSubmittingAction(false);
          return;
        }
        payload.status = actionStatus;
      }

      const res = await warrantyService.performClaimAction(id, action, payload);
      if (res.success && res.data) {
        setClaim(res.data);
        setActionNotes('');
        setActionResolution('');
        setActionProvider(res.data.assigned_provider || '');
        setActionStatus(res.data.status);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to execute claim action.';
      setErrorMessage(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !claim) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#005B63]" />
        <p className="text-xs font-black uppercase tracking-wider">Loading ticket metadata...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-12 text-center text-slate-400 italic font-sans">
        Warranty claim not found.
      </div>
    );
  }

  const getStatusColor = (statusVal: string) => {
    switch (statusVal) {
      case 'submitted': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'under_review': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'need_more_info': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'approved': return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'assigned': return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'repair_in_progress': return 'text-amber-800 bg-amber-100 border-amber-300';
      case 'completed': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'closed': return 'text-slate-700 bg-slate-100 border-slate-300';
      case 'rejected': return 'text-rose-700 bg-rose-50 border-rose-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getPriorityColor = (priorityVal: string) => {
    switch (priorityVal) {
      case 'critical': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-6 text-left font-sans select-none">
      {/* Back button & Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/warranty')}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Warranty Center
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-800 tracking-tight font-display">Claim {claim.claim_number}</h1>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getPriorityColor(claim.priority)}`}>
                {claim.priority}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${getStatusColor(claim.status)}`}>
                {claim.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(claim.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Details & Attachments (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#005B63] pb-3 border-b border-slate-50">Claim Diagnostic Profile</h3>

            {/* Diagnostic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Customer summary */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">Customer Details</span>
                </div>
                <p className="font-bold text-slate-800">{claim.registration_detail?.user?.full_name}</p>
                <p className="text-slate-400 font-mono text-[10px]">{claim.registration_detail?.user?.email}</p>
                <p className="text-[#005B63] font-bold capitalize text-[10px]">{claim.registration_detail?.user?.role} Account</p>
              </div>

              {/* Order reference */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Package className="w-4 h-4" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">Reference Order</span>
                </div>
                <p className="font-bold text-slate-800">Order #{claim.registration_detail?.order?.order_number || 'N/A'}</p>
                <p className="text-slate-400 text-[10px]">Invoice Ref: {claim.registration_detail?.order?.invoice_number || 'N/A'}</p>
                <p className="text-slate-400 text-[10px]">Delivered on {claim.registration_detail?.purchase_date}</p>
              </div>
            </div>

            {/* Equipment summary */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest">Clinical Equipment Allocations</span>
              </div>
              <p className="font-black text-slate-800 text-sm">{claim.registration_detail?.product?.name}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1.5">
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Brand</span>
                  <span className="font-bold text-slate-700">{claim.registration_detail?.product?.brand_name}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Serial Code</span>
                  <span className="font-mono font-black text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{claim.registration_detail?.serial_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Warranty Ends</span>
                  <span className="font-bold text-slate-700">{claim.registration_detail?.warranty_end}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Provider Default</span>
                  <span className="font-bold text-slate-700 uppercase">{claim.registration_detail?.warranty_provider}</span>
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="space-y-2 text-xs">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Problem Reported</h4>
              <div className="p-4 bg-slate-50/40 border border-slate-55 rounded-2xl italic leading-relaxed text-slate-700 font-sans">
                "{claim.description}"
              </div>
            </div>

            {/* Resolution */}
            {claim.resolution && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2 text-xs">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">Resolution Status</h4>
                <p className="font-bold text-emerald-700 leading-relaxed">
                  {claim.resolution}
                </p>
              </div>
            )}
          </div>

          {/* Attachments Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#005B63] pb-3 border-b border-slate-50">Support Attachments Log</h3>
            {claim.attachments && claim.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {claim.attachments.map(att => (
                  <div key={att.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between items-start space-y-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-700 capitalize">{att.attachment_type.replace('_', ' ')}</span>
                    </div>
                    {/* Media Previews */}
                    {['product_image', 'invoice'].includes(att.attachment_type) && (
                      <div className="w-full h-24 bg-white border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1">
                        {att.file.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-8 h-8 text-slate-300" />
                        ) : (
                          <img src={att.file} alt="Preview" className="w-full h-full object-contain" />
                        )}
                      </div>
                    )}
                    <a
                      href={att.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase text-[#005B63] hover:underline"
                    >
                      View Full File
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No verification attachments uploaded with this claim.</p>
            )}
          </div>
        </div>

        {/* Right Column: Admin Actions & History Timeline */}
        <div className="space-y-6">
          {/* Admin Action Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-4 text-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 pb-3 border-b border-slate-50">Admin Action Center</h3>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 stroke-[2]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Form Input fields */}
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Action Notes (Audit Log)</label>
                <textarea
                  rows={3}
                  placeholder="Enter comments about this operation status update..."
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#005B63] resize-none"
                />
              </div>

              {/* Resolution for reject/close */}
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Resolution details (for Reject/Close)</label>
                <textarea
                  rows={2}
                  placeholder="Provide resolution details given to user..."
                  value={actionResolution}
                  onChange={e => setActionResolution(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#005B63] resize-none"
                />
              </div>

              {/* Quick Actions Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('approve')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  Approve Claim
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('reject')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  Reject Claim
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('request_info')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  Request Info
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('close')}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  Close Ticket
                </button>
              </div>

              <div className="border-t border-slate-50 my-4 pt-4 space-y-3.5">
                {/* Routing Assignment */}
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Assign Servicing Provider</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. NSK Services Delhi"
                      value={actionProvider}
                      onChange={e => setActionProvider(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#005B63]"
                    />
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleAction('assign')}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Status Transition */}
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Transition Repair Status</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={actionStatus}
                        onChange={e => setActionStatus(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#005B63]"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="need_more_info">Need More Info</option>
                        <option value="approved">Approved</option>
                        <option value="assigned">Assigned</option>
                        <option value="repair_in_progress">Repair In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleAction('update_status')}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      Shift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 pb-3 border-b border-slate-50">Audit Trace Ledger</h3>
            <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-4 text-xs">
              {claim.timeline && claim.timeline.map((evt, idx) => (
                <div key={evt.id || idx} className="relative">
                  <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border border-white bg-[#005B63]" />
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-slate-800 text-[11px]">{evt.action}</span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {new Date(evt.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {evt.performed_by_name && (
                      <p className="text-[9px] text-[#005B63] font-bold">
                        By {evt.performed_by_name} ({evt.performed_by_role})
                      </p>
                    )}
                    {evt.notes && (
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-0.5">{evt.notes}</p>
                    )}
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

export default WarrantyClaimDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Paperclip, Shield,
  User, Package, AlertCircle, FileText, CheckCircle
} from 'lucide-react';
import { warrantyService } from '../../services/warranty';
import type { WarrantyRegistration } from '../../services/warranty';

const WarrantyRegistrationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<WarrantyRegistration | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states for Admin Action Panel
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchRegistrationDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await warrantyService.getAdminRegistrations({ page: 1, page_size: 1 });
      if (res.success && res.data) {
        // Since we are mock pagination/list, let's find the exact item
        const listRes = await warrantyService.getAdminRegistrations({ id });
        const item = listRes.data?.find(r => r.id === id);
        if (item) {
          setRegistration(item);
          setActionNotes(item.admin_notes || '');
        }
      }
    } catch (err) {
      console.error('Failed to load registration detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationDetail();
  }, [id]);

  const handleAction = async (action: 'approve' | 'reject' | 'request_info') => {
    if (!id) return;
    setSubmittingAction(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await warrantyService.performRegistrationAction(id, action, actionNotes.trim());
      if (res.success && res.data) {
        setRegistration(res.data);
        setSuccessMessage(`Registration action '${action}' successfully updated.`);
        setActionNotes('');
        setTimeout(() => navigate('/admin/warranty'), 1500);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to execute registration review action.';
      setErrorMessage(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !registration) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#005B63]" />
        <p className="text-xs font-black uppercase tracking-wider">Loading registration record...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="p-12 text-center text-slate-400 italic font-sans">
        Warranty registration not found.
      </div>
    );
  }

  const getStatusBadge = (statusVal: string) => {
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
              <h1 className="text-xl font-black text-slate-800 tracking-tight font-display">Verify Registration</h1>
              {getStatusBadge(registration.warranty_status)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Registry Ref ID: {registration.id}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Details & Attachments (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#005B63] pb-3 border-b border-slate-50">Equipment Purchase Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Customer */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-4 h-4" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">Customer Details</span>
                </div>
                <p className="font-bold text-slate-800">{registration.user?.full_name}</p>
                <p className="text-slate-400 font-mono text-[10px]">{registration.user?.email}</p>
                <p className="text-[#005B63] font-bold capitalize text-[10px]">{registration.user?.role} Account</p>
              </div>

              {/* Order Reference */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Package className="w-4 h-4" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest">Order Details</span>
                </div>
                <p className="font-bold text-slate-800">Order #{registration.order?.order_number || 'N/A'}</p>
                <p className="text-slate-400 text-[10px]">Invoice Ref: {registration.order?.invoice_number || 'N/A'}</p>
                <p className="text-slate-400 text-[10px]">Delivered on {registration.purchase_date}</p>
              </div>
            </div>

            {/* Product summary */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4" />
                <span className="text-[9px] font-extrabold uppercase tracking-widest">FAAZO Product Allocation</span>
              </div>
              <p className="font-black text-slate-800 text-sm">{registration.product?.name}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-1.5">
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Serial Code Provided</span>
                  <span className="font-mono font-black text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded">
                    {registration.serial_number || 'Not Provided'}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Serial No. Required</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {registration.product?.serial_number_required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-extrabold uppercase text-slate-400">Coverage Start/End</span>
                  <span className="font-bold text-slate-700">
                    {registration.warranty_start} to {registration.warranty_end}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {registration.notes && (
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Customer Notes</h4>
                <div className="p-4 bg-slate-50/40 border border-slate-50 rounded-2xl italic leading-relaxed text-slate-700 font-sans">
                  "{registration.notes}"
                </div>
              </div>
            )}
          </div>

          {/* Invoice File Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#005B63] pb-3 border-b border-slate-50">Uploaded Invoice Proof</h3>
            {registration.invoice_url ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start space-y-3">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-700">Invoice Document</span>
                </div>
                <div className="w-full max-w-xs h-32 bg-white border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1">
                  {registration.invoice_url.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="w-10 h-10 text-[#005B63]" />
                  ) : (
                    <img src={registration.invoice_url} alt="Invoice Proof" className="w-full h-full object-contain" />
                  )}
                </div>
                <a
                  href={registration.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase text-[#005B63] hover:underline"
                >
                  View Full Document
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No invoice proof uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Review Decisions */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] space-y-4 text-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 pb-3 border-b border-slate-50">Review Decision Panel</h3>

            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 stroke-[2]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 stroke-[2]" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Review Feedback / Notes</label>
                <textarea
                  rows={4}
                  placeholder="Provide comments about approval, rejection, or specify missing details for requesting info..."
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#005B63] resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('approve')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Approve Registration
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('reject')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Reject Registration
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleAction('request_info')}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-[10px] font-black uppercase tracking-widest text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Request More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyRegistrationDetailPage;

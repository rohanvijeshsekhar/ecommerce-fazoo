import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, FileText, MapPin, Truck, AlertTriangle, CheckCircle,
  Printer, X, Building, Package, Shield, Headphones, Copy, Check,
  Clock, CreditCard, Send, Paperclip, AlertCircle, RefreshCw,
  MessageSquare, Plus, ExternalLink, Calendar, Phone, DollarSign,
  ChevronRight, ArrowRight, CornerUpLeft, ShoppingBag
} from 'lucide-react';
import { ordersService } from '../services/ordersService';
import type { OrderDetail } from '../services/ordersService';
import { warrantyService } from '../services/warranty';
import type { WarrantyRegistration, WarrantyClaim } from '../services/warranty';
import { supportService } from '../services/support';
import type { SupportTicket } from '../services/support';
import { cartService } from '../services/cart';
import { customerShippingService, SHIPMENT_STATUS_LABELS } from '../services/shippingService';
import type { CustomerShipmentTracking } from '../services/shippingService';

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onProductClick: (slug: string) => void;
  showToast?: (msg: string) => void;
  setActiveSection?: (section: string) => void;
}

const TEAL = '#006670';
const TEAL_BG = '#e6f3f5';

/* ─── Copy Button ─────────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="ml-1 cursor-pointer text-slate-300 hover:text-[#006670] transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_payment: { label: 'Pending Payment', cls: 'bg-amber-50 border-amber-100 text-amber-600' },
    processing:      { label: 'Processing',      cls: 'bg-blue-50 border-blue-100 text-blue-600' },
    packed:          { label: 'Packed',          cls: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
    shipped:         { label: 'Shipped',         cls: 'bg-violet-50 border-violet-100 text-violet-600' },
    delivered:       { label: 'Delivered',       cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    cancelled:       { label: 'Cancelled',       cls: 'bg-rose-50 border-rose-100 text-rose-600' },
    
    captured:        { label: 'Paid',            cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    failed:          { label: 'Failed',          cls: 'bg-rose-50 border-rose-100 text-rose-600' },
    pending:         { label: 'Pending',         cls: 'bg-amber-50 border-amber-100 text-amber-600' },
    refunded:        { label: 'Refunded',        cls: 'bg-slate-50 border-slate-200 text-slate-500' },

    pending_registration: { label: 'Register Warranty', cls: 'bg-amber-50 border-amber-100 text-amber-600' },
    pending_verification: { label: 'Under Review',        cls: 'bg-blue-50 border-blue-100 text-blue-600' },
    need_more_info:       { label: 'Info Required',       cls: 'bg-orange-50 border-orange-100 text-orange-600' },
    active:               { label: 'Active',              cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    rejected:             { label: 'Rejected',            cls: 'bg-rose-50 border-rose-100 text-rose-600' },
    expired:              { label: 'Expired',             cls: 'bg-slate-50 border-slate-200 text-slate-500' },

    open:             { label: 'Open',             cls: 'bg-blue-50 border-blue-100 text-blue-600' },
    in_progress:      { label: 'In Progress',      cls: 'bg-violet-50 border-violet-100 text-violet-600' },
    waiting_customer: { label: 'Awaiting Reply',   cls: 'bg-amber-50 border-amber-100 text-amber-600' },
    resolved:         { label: 'Resolved',         cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    closed:           { label: 'Closed',           cls: 'bg-slate-50 border-slate-200 text-slate-500' },
  };
  const entry = map[status] || { label: status, cls: 'bg-slate-50 border-slate-200 text-slate-500' };
  const textSize = size === 'xs' ? 'text-[9px]' : 'text-[10px]';
  return (
    <span className={`${textSize} font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

/* ─── Invoice Print Modal ────────────────────────────────────────────────────── */
function InvoiceModal({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> FAAZO Tax Invoice
          </span>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006670] hover:bg-[#004e56] text-white rounded-lg text-xs font-extrabold uppercase cursor-pointer">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose}
              className="p-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-grow p-8 overflow-y-auto bg-white" id="print-invoice-sheet">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              #print-invoice-sheet, #print-invoice-sheet * { visibility: visible; }
              #print-invoice-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
              .print\\:hidden { display: none !important; }
            }
          ` }} />
          <div className="space-y-6 text-xs text-slate-800 text-left">
            <div className="flex justify-between items-start gap-4">
              <div>
                <img src="/images/Artboard 1@4x (1).png" alt="FAAZO" className="h-10 w-auto object-contain" />
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ENGINEERING CLINICAL EXCELLENCE</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-black text-slate-900">TAX INVOICE</h1>
                <p className="text-slate-500 font-mono mt-0.5">Invoice #: {order.invoice_number}</p>
                <p className="text-slate-500 font-mono">Order #: {order.order_number}</p>
                <p className="text-slate-500 font-mono">Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <hr className="border-slate-200" />
            <div className="grid grid-cols-2 gap-8 text-[11px] leading-relaxed">
              <div>
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Sold By</h4>
                <p className="font-extrabold text-slate-900">FAAZO Dental Solutions Pvt. Ltd.</p>
                <p className="text-slate-600">102 Dental Hub Tech Park, Bandra Kurla Complex</p>
                <p className="text-slate-600">Mumbai, Maharashtra - 400051</p>
                <p className="text-slate-500">GSTIN: 27AAFCD1024D1ZS</p>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Shipped To</h4>
                <p className="font-extrabold text-slate-900">{order.shipping_address_detail?.full_name}</p>
                {order.notes && <p className="font-bold text-slate-800">{order.notes}</p>}
                <p className="text-slate-600">{order.shipping_address_detail?.line1}{order.shipping_address_detail?.line2 && `, ${order.shipping_address_detail.line2}`}</p>
                <p className="text-slate-600">{order.shipping_address_detail?.city}, {order.shipping_address_detail?.state} - {order.shipping_address_detail?.pincode}</p>
                <p className="text-slate-500">Mobile: {order.shipping_address_detail?.mobile}</p>
              </div>
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 font-extrabold uppercase text-slate-400 text-[10px]">
                  <th className="py-2.5">Product Description</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-24">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="font-sans font-medium text-slate-700">
                    <td className="py-3 font-bold text-slate-800">{item.product_name}</td>
                    <td className="py-3 text-right">₹{Number(item.price).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right font-bold text-slate-900">₹{(item.quantity * Number(item.price)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-4">
              <div className="w-72 space-y-2 text-slate-600 font-sans text-xs">
                <div className="flex justify-between"><span>Total Net Price</span><span className="font-bold text-slate-800">₹{Number(order.selling_subtotal).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>GST Tax (18% IGST)</span><span className="font-bold text-slate-800">₹{Number(order.gst_amount).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Shipping Fees</span><span className="font-bold text-slate-800">{Number(order.shipping_fee) === 0 ? 'FREE' : `₹${Number(order.shipping_fee).toLocaleString('en-IN')}`}</span></div>
                <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-display text-sm font-black text-slate-900">
                  <span>Total Cost Paid</span><span style={{ color: TEAL }}>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <hr className="border-slate-200" />
            <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
              <p><strong>Declaration:</strong> This is a computer-generated invoice and does not require physical signatures. Transit coverage is certified ISO 13485.</p>
              <p className="mt-1">Support: operations@faazo.com · 1800-FAAZO-DENTAL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Warranty Registration Modal ─────────────────────────────────────────── */
function WarrantyRegisterModal({
  registration,
  onClose,
  onSuccess,
  showToast,
}: {
  registration: WarrantyRegistration;
  onClose: () => void;
  onSuccess: () => void;
  showToast?: (msg: string) => void;
}) {
  const [serial, setSerial] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registration.product.serial_number_required && !serial.trim()) {
      showToast?.('Serial number is required for this product.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (serial.trim()) fd.append('serial_number', serial.trim());
      if (file) fd.append('invoice', file);
      const res = await warrantyService.submitRegistration(registration.id, fd);
      if (res.success) {
        showToast?.('Warranty registration submitted successfully.');
        onSuccess();
        onClose();
      } else {
        showToast?.(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      showToast?.(err?.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Register Warranty</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-400 font-sans">{registration.product.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {registration.product.serial_number_required && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                Serial Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={serial}
                onChange={e => setSerial(e.target.value)}
                placeholder="e.g. NSK-2026-XXXXXX"
                className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Purchase Invoice (optional)
            </label>
            <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 hover:border-[#006670]/40 rounded-xl p-3 cursor-pointer transition-colors">
              <Paperclip className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">{file ? file.name : 'Click to upload PDF/JPG'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-extrabold uppercase hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="py-3 rounded-xl text-white text-xs font-extrabold uppercase cursor-pointer disabled:opacity-50"
              style={{ background: TEAL }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Warranty Claim Modal ─────────────────────────────────────────────────── */
function WarrantyClaimModal({
  registration,
  onClose,
  onSuccess,
  showToast,
}: {
  registration: WarrantyRegistration;
  onClose: () => void;
  onSuccess: () => void;
  showToast?: (msg: string) => void;
}) {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { showToast?.('Description is required.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('registration', registration.id);
      fd.append('description', description.trim());
      fd.append('priority', priority);
      if (file) fd.append('attachment', file);
      const res = await warrantyService.createClaim(fd);
      if (res.success) {
        showToast?.('Warranty claim submitted.');
        onSuccess();
        onClose();
      } else {
        showToast?.(res.message || 'Claim submission failed.');
      }
    } catch (err: any) {
      showToast?.(err?.response?.data?.error?.message || 'Claim submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Raise Warranty Claim</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-400 font-sans">{registration.product.name} · Warranty active until {new Date(registration.warranty_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Issue Description <span className="text-rose-500">*</span></label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value as any)}
              className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white focus:border-[#006670] focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 hover:border-[#006670]/40 rounded-xl p-3 cursor-pointer transition-colors">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">{file ? file.name : 'Attach photo / video (optional)'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose} className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-extrabold uppercase hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting}
              className="py-3 rounded-xl text-white text-xs font-extrabold uppercase cursor-pointer disabled:opacity-50"
              style={{ background: TEAL }}>
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Support Ticket Thread Modal ─────────────────────────────────────────── */
function TicketThreadModal({
  ticket,
  onClose,
  showToast,
  onReplySuccess,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  showToast?: (msg: string) => void;
  onReplySuccess: () => void;
}) {
  const [reply, setReply] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket.messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', reply.trim());
      if (file) fd.append('attachment', file);
      const res = await supportService.replyTicket(ticket.id, fd);
      if (res.success) {
        setReply('');
        setFile(null);
        showToast?.('Reply sent.');
        onReplySuccess();
      } else {
        showToast?.(res.message || 'Reply failed.');
      }
    } catch (err: any) {
      showToast?.(err?.response?.data?.error?.message || 'Reply failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{ticket.ticket_number}</p>
            <h3 className="text-sm font-black text-slate-800 leading-tight mt-0.5">{ticket.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={ticket.status} size="xs" />
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {ticket.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-200" />
              <p className="text-xs text-slate-400">No messages yet. Replies will appear here.</p>
            </div>
          )}
          {ticket.messages.map((msg) => {
            const isCustomer = msg.sender_role !== 'admin';
            return (
              <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs space-y-1
                  ${isCustomer ? 'bg-[#006670] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-wide ${isCustomer ? 'text-white/60' : 'text-slate-400'}`}>
                    {msg.sender_name || (isCustomer ? 'You' : 'FAAZO Support')}
                  </p>
                  <p className="leading-relaxed font-medium">{msg.message}</p>
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 text-[9px] font-bold mt-1 ${isCustomer ? 'text-white/80' : 'text-[#006670]'}`}
                    >
                      <Paperclip className="w-3 h-3" /> Attachment <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <p className={`text-[8px] ${isCustomer ? 'text-white/40' : 'text-slate-300'}`}>
                    {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {['resolved', 'closed'].includes(ticket.status) ? (
          <div className="px-5 py-3 border-t border-slate-100 text-center shrink-0">
            <p className="text-[10px] text-slate-400">This ticket is {ticket.status}. Reopen via FAAZO support.</p>
          </div>
        ) : (
          <form onSubmit={handleReply} className="px-5 py-4 border-t border-slate-100 space-y-3 shrink-0">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={2}
              placeholder="Type your reply..."
              className="w-full border border-slate-200 p-3 rounded-xl text-xs font-medium text-slate-800 bg-white focus:border-[#006670] focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                {file ? <span className="text-[#006670] font-bold truncate max-w-24">{file.name}</span> : 'Attach file'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4,.zip,.docx,.txt" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-extrabold uppercase disabled:opacity-50 cursor-pointer"
                style={{ background: TEAL }}
              >
                <Send className="w-3.5 h-3.5" /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Create Ticket Modal ─────────────────────────────────────────────────── */
function CreateTicketModal({
  order,
  onClose,
  onSuccess,
  showToast,
}: {
  order: OrderDetail;
  onClose: () => void;
  onSuccess: () => void;
  showToast?: (msg: string) => void;
}) {
  const [subject, setSubject] = useState(`Issue with Order #${order.order_number || order.id}`);
  const [category, setCategory] = useState('order_issue');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { showToast?.('Please describe your issue.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', subject.trim());
      fd.append('category', category);
      fd.append('priority', priority);
      fd.append('description', description.trim());
      fd.append('related_order', order.id);
      if (file) fd.append('attachment', file);
      const res = await supportService.createTicket(fd);
      if (res.success) {
        showToast?.('Support ticket created successfully.');
        onSuccess();
        onClose();
      } else {
        showToast?.(res.message || 'Failed to create ticket.');
      }
    } catch (err: any) {
      showToast?.(err?.response?.data?.error?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { value: 'order_issue', label: 'Order Issue' },
    { value: 'delivery_issue', label: 'Delivery Issue' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'technical_assistance', label: 'Technical Assistance' },
    { value: 'installation_help', label: 'Installation Help' },
    { value: 'general_complaint', label: 'General Complaint' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-left space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Create Support Ticket</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="bg-[#e6f3f5]/50 border border-teal-100 rounded-xl px-4 py-2.5 text-xs space-y-0.5">
          <p className="font-black text-slate-600 text-[10px] uppercase tracking-wider">Linked Order</p>
          <p className="font-bold text-slate-800">{order.order_number} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
          <p className="text-slate-400 font-sans text-[10px]">Placed {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Subject <span className="text-rose-500">*</span></label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-[#006670] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white focus:border-[#006670] focus:outline-none">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white focus:border-[#006670] focus:outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Description <span className="text-rose-500">*</span></label>
            <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe your issue in detail. Include any error messages, serial numbers, or photos..."
              className="w-full border border-slate-200 p-3 rounded-xl text-xs font-medium text-slate-800 bg-white focus:border-[#006670] focus:outline-none resize-none" />
          </div>
          <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 hover:border-[#006670]/40 rounded-xl p-3 cursor-pointer transition-colors">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">{file ? file.name : 'Attach screenshot, video, or document (optional)'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.mp4,.avi,.zip,.txt,.docx" className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-extrabold uppercase hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting}
              className="py-3 rounded-xl text-white text-xs font-extrabold uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: TEAL }}>
              {submitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId,
  onBack,
  onProductClick,
  showToast,
}) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Warranty states
  const [warranties, setWarranties] = useState<WarrantyRegistration[]>([]);
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [warrantyFetched, setWarrantyFetched] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyRegistration | null>(null);

  // Support states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsFetched, setTicketsFetched] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Shipment tracking state
  const [shipmentTracking, setShipmentTracking] = useState<CustomerShipmentTracking | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);

  // Cache refs
  const warrantyCache = useRef<WarrantyRegistration[] | null>(null);
  const ticketsCache = useRef<SupportTicket[] | null>(null);

  const fetchOrderDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersService.getOrderDetail(orderId);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        showToast?.('Order not found.');
        onBack();
      }
    } catch {
      showToast?.('Failed to load order.');
      onBack();
    } finally {
      setLoading(false);
    }
  }, [orderId, onBack, showToast]);

  useEffect(() => { fetchOrderDetail(); }, [fetchOrderDetail]);

  // Fetch warranties
  const fetchWarranties = useCallback(async () => {
    if (warrantyCache.current) {
      setWarranties(warrantyCache.current);
      setWarrantyFetched(true);
      return;
    }
    setWarrantyLoading(true);
    try {
      const res = await warrantyService.getRegistrations({ order: orderId });
      const data = res.success && res.data ? res.data : [];
      warrantyCache.current = data;
      setWarranties(data);
    } catch {
      setWarranties([]);
    } finally {
      setWarrantyLoading(false);
      setWarrantyFetched(true);
    }
  }, [orderId]);

  // Fetch support tickets
  const fetchTickets = useCallback(async () => {
    if (ticketsCache.current) {
      setTickets(ticketsCache.current);
      setTicketsFetched(true);
      return;
    }
    setTicketsLoading(true);
    try {
      const res = await supportService.getTickets({ related_order: orderId });
      const data = res.success && res.data ? res.data : [];
      ticketsCache.current = data;
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
      setTicketsFetched(true);
    }
  }, [orderId]);

  // Trigger warranty/support/shipment fetch when order is loaded
  useEffect(() => {
    if (order) {
      fetchWarranties();
      fetchTickets();
      // Fetch shipment tracking if order is shipped or delivered
      if (['shipped', 'delivered'].includes(order.status)) {
        setShipmentLoading(true);
        customerShippingService.getOrderTracking(orderId)
          .then((res) => {
            if (res.success && res.data) setShipmentTracking(res.data);
          })
          .catch(() => {})
          .finally(() => setShipmentLoading(false));
      }
    }
  }, [order, fetchWarranties, fetchTickets, orderId]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) { showToast?.('Please specify a cancellation reason.'); return; }
    setCancelling(true);
    try {
      const res = await ordersService.cancelOrder(orderId, cancelReason.trim());
      if (res.success && res.data) {
        showToast?.('Order cancelled successfully.');
        setOrder(res.data);
        setShowCancelModal(false);
        setCancelReason('');
      } else {
        showToast?.(res.message || 'Failed to cancel order.');
      }
    } catch (err: any) {
      showToast?.(err?.response?.data?.message || 'Cannot cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  // Add items back into cart for reorder
  const handleBuyAgain = async () => {
    if (!order) return;
    setReordering(true);
    try {
      for (const item of order.items) {
        await cartService.add(item.product_slug, item.quantity);
      }
      showToast?.('Items successfully added to your cart.');
    } catch {
      showToast?.('Failed to reorder items.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#f4f7f7] min-h-screen pt-[112px] lg:pt-[160px] pb-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-5xl mx-auto px-4 space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/4" />
              <div className="h-2 bg-slate-50 rounded w-3/4" />
              <div className="h-2 bg-slate-50 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isCancellable = ['pending_payment', 'processing', 'packed'].includes(order.status);
  const isDelivered = order.status === 'delivered';
  const showWarrantyCTA = isDelivered && warranties.length > 0;

  // Timeline stage processing
  const stageHierarchy = ['pending_payment', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  const timelineStages = [
    { key: 'pending_payment', label: 'Order Placed', desc: 'Order received & pending payment confirmation' },
    { key: 'processing', label: 'Payment Confirmed', desc: 'Payment verified successfully' },
    { key: 'packed', label: 'Packed', desc: 'Equipment checked, packed & ready for shipment' },
    { key: 'shipped', label: 'Shipped', desc: 'Dispatched with logistics courier' },
    { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Out for delivery to destination clinic' },
    { key: 'delivered', label: 'Delivered', desc: 'Delivered & calibrated at location' }
  ];

  const currentIdx = stageHierarchy.indexOf(order.status);

  // Map dates and notes to timeline stages
  const stageDetails: Record<string, { date?: string; notes?: string }> = {};
  if (order.created_at) stageDetails['pending_payment'] = { date: order.created_at };
  if (order.packed_at) stageDetails['packed'] = { date: order.packed_at };
  if (order.shipped_at) stageDetails['shipped'] = { date: order.shipped_at };
  if (order.delivered_at) stageDetails['delivered'] = { date: order.delivered_at };

  for (const h of order.status_history || []) {
    if (!stageDetails[h.status]) {
      stageDetails[h.status] = { date: h.created_at, notes: h.notes };
    }
  }

  return (
    <div className="w-full pb-16 font-sans select-none text-left space-y-4">

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:text-[#006670] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — ORDER SUMMARY HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#006670] to-teal-400" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">FAAZO Procurement</span>
              <h2 className="text-lg font-black text-slate-800 tracking-tight mt-0.5 uppercase flex items-center gap-1">
                Order #{order.order_number || order.id}
                <CopyBtn text={order.order_number || order.id} />
              </h2>
            </div>
            
            {/* Visual prominent status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              {order.payment_status && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 border-emerald-100 text-emerald-600">
                  <CreditCard className="w-3 h-3" /> {order.payment_status === 'captured' ? 'Paid' : order.payment_status}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 text-xs">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Order Date</span>
              <span className="font-bold text-slate-800 mt-1 block">
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Amount</span>
              <span className="font-black text-[#006670] mt-1 block">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Payment Method</span>
              <span className="font-bold text-slate-700 mt-1 block uppercase">{order.payment_method}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estimated Delivery</span>
              <span className="font-extrabold text-[#006670] mt-1 block">
                {order.estimated_delivery_date
                  ? new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  : 'Calculated after dispatch'}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Invoice Number</span>
              <span className="font-bold text-slate-700 mt-1 block">{order.invoice_number || '—'}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Payment Reference</span>
              <span className="font-mono text-[10px] text-slate-500 mt-1 block truncate max-w-[100px]" title={order.razorpay_payment_id || '—'}>
                {order.razorpay_payment_id || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — PRIMARY ACTIONS (context-aware)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap gap-3">
          {/* Download Invoice */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-colors"
            style={{ background: '#e6f3f5', color: TEAL, border: '1px solid rgba(0,102,112,0.12)' }}
          >
            <Printer className="w-4 h-4" /> Download Invoice
          </button>

          {/* Track Shipment */}
          {order.tracking_number && (
            <button
              onClick={() => {
                const el = document.getElementById('shipment-tracking-block');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer text-slate-700"
            >
              <Truck className="w-4 h-4" /> Track Shipment
            </button>
          )}

          {/* Cancel Order (only before shipment) */}
          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/50 text-rose-600 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-all"
            >
              Cancel Order
            </button>
          )}

          {/* Register Warranty (only after delivery) */}
          {showWarrantyCTA && (
            <button
              onClick={() => {
                const el = document.getElementById('warranty-center-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer"
            >
              <Shield className="w-4 h-4" /> Register Warranty
            </button>
          )}

          {/* Buy Again (only after delivery) */}
          {isDelivered && (
            <button
              onClick={handleBuyAgain}
              disabled={reordering}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100/40 rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" /> Buy Again
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — ORDER TIMELINE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fulfillment Timeline</h3>
          </div>

          {order.status === 'cancelled' ? (
            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 flex gap-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold text-rose-800 uppercase tracking-wide">Fulfillment Cancelled</h4>
                {order.cancellation_reason && (
                  <p className="text-[11px] text-rose-700">
                    <strong>Reason:</strong> {order.cancellation_reason}
                  </p>
                )}
                {order.cancelled_at && (
                  <p className="text-[10px] text-rose-400">
                    Cancelled on: {new Date(order.cancelled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop timeline - horizontal progress */}
              <div className="hidden md:flex justify-between items-start gap-4 relative">
                <div className="absolute left-6 right-6 h-0.5 bg-slate-100 top-4 z-0" />
                {timelineStages.map((stage, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const details = stageDetails[stage.key];
                  
                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                        ${isDone
                          ? 'bg-[#006670] border-[#006670] text-white shadow-sm'
                          : isCurrent
                          ? 'bg-white border-[#006670] text-[#006670]'
                          : 'bg-white border-slate-200 text-slate-300'}`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                      </div>
                      <div className="text-center space-y-1">
                        <span className={`text-xs font-black uppercase tracking-wide block ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {stage.label}
                        </span>
                        {details?.date ? (
                          <span className="text-[10px] text-[#006670] font-extrabold block">
                            {new Date(details.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}<br />
                            {new Date(details.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">{stage.desc}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Timeline - vertical progress */}
              <ol className="md:hidden relative border-l border-slate-100 ml-4 space-y-5">
                {timelineStages.map((stage, idx) => {
                  const isDone = idx <= currentIdx;
                  const details = stageDetails[stage.key];
                  return (
                    <li key={stage.key} className="ml-4">
                      <span className={`absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full ring-2 ring-white
                        ${isDone ? 'bg-[#006670]' : 'bg-slate-200'}`} />
                      <p className={`text-xs font-extrabold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>{stage.label}</p>
                      {details?.date ? (
                        <p className="text-[11px] text-[#006670] font-sans font-bold">
                          {new Date(details.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-sans">{stage.desc}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Admin notes or status history logs */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Status Updates</span>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
                {[...order.status_history].reverse().map((h) => (
                  <div key={h.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wide block">
                        {h.status.replace('_', ' ')}
                      </span>
                      {h.notes && <p className="text-slate-500 text-[10.5px] font-sans mt-0.5">{h.notes}</p>}
                    </div>
                    <span className="text-[9px] text-slate-300 font-mono shrink-0">
                      {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3B — LIVE SHIPMENT TRACKING (from Delhivery)
        ══════════════════════════════════════════════════════════════════ */}
        {(order.status === 'shipped' || order.status === 'delivered') && (
          <div id="shipment-tracking-block" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl text-[#006670]" style={{ background: '#e6f3f5' }}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Shipment Tracking</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {shipmentTracking ? `via ${shipmentTracking.courier_name}` : 'Live tracking from courier'}
                  </p>
                </div>
              </div>
              {shipmentTracking?.awb_number && (
                <a
                  href={`https://www.delhivery.com/track/package/${shipmentTracking.awb_number}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#006670] border border-[#006670]/20 hover:bg-[#e6f3f5] rounded-lg transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Track on Delhivery
                </a>
              )}
            </div>

            {shipmentLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse py-4">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Loading tracking information...
              </div>
            ) : shipmentTracking ? (
              <div className="space-y-4">
                {/* Key Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AWB Number</span>
                    <span className="font-black text-slate-800 font-mono text-sm flex items-center gap-1">
                      {shipmentTracking.awb_number || '—'}
                      <CopyBtn text={shipmentTracking.awb_number} />
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                    <span className="font-black text-[#006670] block mt-0.5">
                      {SHIPMENT_STATUS_LABELS[shipmentTracking.shipment_status] || shipmentTracking.shipment_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Est. Delivery</span>
                    <span className="font-bold text-slate-700 block mt-0.5">
                      {shipmentTracking.estimated_delivery_date
                        ? new Date(shipmentTracking.estimated_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  {shipmentTracking.current_location && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Current Location</span>
                      <span className="font-bold text-slate-700 block mt-0.5 text-xs">{shipmentTracking.current_location}</span>
                    </div>
                  )}
                </div>

                {/* Live Tracking Timeline */}
                {shipmentTracking.tracking_events && shipmentTracking.tracking_events.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Logistics Timeline</p>
                    <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-100">
                      {[...shipmentTracking.tracking_events]
                        .sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime())
                        .map((evt, idx) => (
                          <div key={evt.id} className="relative text-xs">
                            <span className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                              evt.is_delivered ? 'bg-emerald-500 border-emerald-500'
                              : idx === 0 ? 'bg-[#006670] border-[#006670]'
                              : 'bg-white border-slate-300'
                            }`} />
                            <p className="font-extrabold text-slate-800">{evt.event_label}</p>
                            {evt.location && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {evt.location}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(evt.event_timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            {evt.description && evt.description !== evt.event_label && (
                              <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              order.tracking_number ? (
                <div className="flex items-center gap-3 text-xs">
                  <Truck className="w-5 h-5 text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-600">
                      Shipped via {order.shipping_carrier || 'Logistics Partner'}
                    </p>
                    <p className="text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      AWB: <strong className="text-slate-700">{order.tracking_number}</strong>
                      <CopyBtn text={order.tracking_number} />
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">Tracking information not available yet.</p>
              )
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            GRID: LEFT (Products, Warranty, Support), RIGHT (Payment, Address)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">

            {/* SECTION 4 — PURCHASED PRODUCTS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items Purchased</h3>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item) => {
                  const itemWarranty = warranties.find(w => w.order_item === item.id);
                  const sku = itemWarranty?.product?.sku || `FAAZO-${item.product_slug.toUpperCase().slice(0, 8)}`;
                  
                  return (
                    <div key={item.id} className="py-4 flex gap-4 items-start first:pt-0 last:pb-0 text-xs">
                      {/* Thumbnail image */}
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={`http://localhost:8000${item.image_url}`}
                            alt={item.product_name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>

                      {/* Product descriptors */}
                      <div className="flex-grow min-w-0">
                        <h4
                          onClick={() => onProductClick(item.product_slug)}
                          className="font-bold text-slate-800 hover:text-[#006670] transition-colors cursor-pointer leading-snug"
                        >
                          {item.product_name}
                        </h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-1 font-sans">
                          <span>SKU: <strong className="text-slate-600 font-mono">{sku}</strong></span>
                          <span>Qty: <strong className="text-slate-600">{item.quantity}</strong></span>
                        </div>

                        {/* Product Status & Warranty Indicators */}
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          <StatusBadge status={order.status} size="xs" />
                          {itemWarranty && (
                            <StatusBadge status={itemWarranty.warranty_status} size="xs" />
                          )}
                          {itemWarranty?.serial_number && (
                            <span className="text-[10px] font-mono bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                              SN: {itemWarranty.serial_number}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <div className="shrink-0 text-right">
                        <span className="font-extrabold text-slate-700 font-sans text-sm">
                          ₹{(item.quantity * Number(item.price)).toLocaleString('en-IN')}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 7 — WARRANTY STATUS CARD */}
            <div id="warranty-center-card" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-sans">Warranty Center</h3>
              </div>

              {warrantyLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                </div>
              ) : warranties.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Shield className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p>
                    {isDelivered
                      ? 'No warranties available for this order.'
                      : 'Warranty options become available after delivery.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {warranties.map((w) => {
                    const daysColor = w.days_remaining < 30 ? 'text-rose-500' : 'text-emerald-600';
                    return (
                      <div key={w.id} className="border border-slate-100 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800 leading-snug">{w.product.name}</p>
                          <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-400 font-sans">
                            <span>Status: <strong className="text-slate-600">{w.warranty_status.replace('_', ' ').toUpperCase()}</strong></span>
                            {w.warranty_status === 'active' && (
                              <span>Expires: <strong className={daysColor}>{new Date(w.warranty_end).toLocaleDateString('en-IN')} ({w.days_remaining}d left)</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Context-aware warranty triggers */}
                        <div className="shrink-0 flex items-center gap-2 justify-end">
                          {w.warranty_status === 'pending_registration' && (
                            <button
                              onClick={() => { setSelectedWarranty(w); setShowRegModal(true); }}
                              className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                            >
                              Register Warranty
                            </button>
                          )}
                          {w.warranty_status === 'pending_verification' && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                              ⏳ Under Review
                            </span>
                          )}
                          {w.warranty_status === 'need_more_info' && (
                            <button
                              onClick={() => { setSelectedWarranty(w); setShowRegModal(true); }}
                              className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
                            >
                              Provide Info
                            </button>
                          )}
                          {w.warranty_status === 'active' && (
                            <button
                              onClick={() => { setSelectedWarranty(w); setShowClaimModal(true); }}
                              className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                            >
                              Raise Claim
                            </button>
                          )}
                          {w.warranty_status === 'expired' && (
                            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">Expired</span>
                          )}
                          {w.warranty_status === 'rejected' && (
                            <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg font-bold" title={w.admin_notes}>
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 8 — SUPPORT TICKETS (minimized card) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support Tickets</h4>
                </div>
                <button
                  onClick={() => setShowCreateTicketModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
                  style={{ background: '#e6f3f5', color: TEAL }}
                >
                  <Plus className="w-3 h-3" /> New Ticket
                </button>
              </div>

              {ticketsLoading ? (
                <div className="h-8 bg-slate-50 rounded-lg animate-pulse" />
              ) : tickets.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-sans">Need support with this order? Create a ticket above.</p>
              ) : (
                <div className="space-y-1.5">
                  {tickets.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="border border-slate-100 hover:border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono leading-none">{t.ticket_number}</p>
                        <p className="font-bold text-slate-700 truncate mt-1 leading-snug">{t.subject}</p>
                      </div>
                      <StatusBadge status={t.status} size="xs" />
                    </div>
                  ))}
                  {tickets.length > 3 && (
                    <p className="text-[10px] text-[#006670] text-center font-bold font-sans pt-1">
                      + {tickets.length - 3} more tickets
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">

            {/* SECTION 5 — PAYMENT SUMMARY */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 font-sans">
              <SectionTitle icon={<CreditCard className="w-3.5 h-3.5" />} title="Payment Details" />

              <div className="space-y-3.5 text-sm text-slate-600">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-medium">Payment Status</span>
                  <StatusBadge status={order.payment_status || 'pending'} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Method</span>
                  <span className="font-bold text-slate-800 uppercase">{order.payment_method}</span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payment ID</span>
                    <span className="font-mono text-xs text-slate-700 truncate max-w-[130px]" title={order.razorpay_payment_id}>{order.razorpay_payment_id}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold text-slate-800">₹{Number(order.selling_subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">GST Amount</span>
                  <span className="font-bold text-slate-800">₹{Number(order.gst_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Shipping</span>
                  <span className="font-bold text-slate-800">
                    {Number(order.shipping_fee) === 0 ? (
                      <span className="text-emerald-600 font-extrabold">FREE</span>
                    ) : (
                      `₹${Number(order.shipping_fee).toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>
                {Number(order.mrp_subtotal) > Number(order.selling_subtotal) && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">−₹{(Number(order.mrp_subtotal) - Number(order.selling_subtotal)).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">Total Paid</span>
                  <span className="text-lg font-black" style={{ color: TEAL }}>
                    ₹{Number(order.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 6 — DELIVERY DETAILS */}
            {order.shipping_address_detail && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 text-sm text-slate-600">
                <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} title="Delivery Location" />

                <div className="space-y-3.5">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dentist</p>
                    <p className="font-black text-slate-900 text-sm">{order.shipping_address_detail.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Clinic Name</p>
                    <p className="font-bold text-slate-800">{order.shipping_address_detail.line1}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Address</p>
                    <p className="font-sans leading-relaxed text-slate-500 font-medium">
                      {order.shipping_address_detail.line2 && <>{order.shipping_address_detail.line2},<br /></>}
                      {order.shipping_address_detail.city}, {order.shipping_address_detail.state} — {order.shipping_address_detail.pincode}
                    </p>
                  </div>
                  {order.shipping_address_detail.mobile && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" /> {order.shipping_address_detail.mobile}
                      </p>
                    </div>
                  )}

                  {/* Courier & Tracking */}
                  {order.tracking_number && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Courier Partner</p>
                        <p className="font-extrabold text-slate-700">{order.shipping_carrier || 'Logistics Partner'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Tracking Code</p>
                        <p className="font-mono text-sm text-slate-700 flex items-center gap-1">
                          {order.tracking_number}
                          <CopyBtn text={order.tracking_number} />
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Admin Notes banner */}
        {order.notes && (
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4.5 flex gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-700 uppercase tracking-wide text-[9px]">Administrator Instruction</p>
              <p className="text-amber-700 mt-0.5 font-sans leading-relaxed">{order.notes}</p>
            </div>
          </div>
        )}

      {/* ── Modals ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-5">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Cancel Order</h3>
            <p className="text-xs text-slate-400 font-medium">Are you sure you want to cancel this order? Inventory reserves will be released.</p>
            <form onSubmit={handleCancelOrder} className="space-y-4">
              <textarea
                required rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)..."
                className="w-full border border-slate-200 p-3.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:border-rose-300 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setShowCancelModal(false)}
                  className="py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-extrabold uppercase hover:bg-slate-50 cursor-pointer">Go Back</button>
                <button type="submit" disabled={cancelling}
                  className="py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-extrabold uppercase cursor-pointer">
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvoiceModal && order && (
        <InvoiceModal order={order} onClose={() => setShowInvoiceModal(false)} />
      )}

      {showRegModal && selectedWarranty && (
        <WarrantyRegisterModal
          registration={selectedWarranty}
          onClose={() => setShowRegModal(false)}
          onSuccess={() => { warrantyCache.current = null; fetchWarranties(); }}
          showToast={showToast}
        />
      )}

      {showClaimModal && selectedWarranty && (
        <WarrantyClaimModal
          registration={selectedWarranty}
          onClose={() => setShowClaimModal(false)}
          onSuccess={() => { warrantyCache.current = null; fetchWarranties(); }}
          showToast={showToast}
        />
      )}

      {showCreateTicketModal && order && (
        <CreateTicketModal
          order={order}
          onClose={() => setShowCreateTicketModal(false)}
          onSuccess={() => { ticketsCache.current = null; fetchTickets(); }}
          showToast={showToast}
        />
      )}

      {selectedTicket && (
        <TicketThreadModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          showToast={showToast}
          onReplySuccess={async () => {
            ticketsCache.current = null;
            await fetchTickets();
            const updated = tickets.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }}
        />
      )}
    </div>
  );
};

// Divider / Section Title helper
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

export default OrderDetailPage;

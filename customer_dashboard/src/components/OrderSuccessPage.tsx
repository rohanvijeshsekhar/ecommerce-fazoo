import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Download, Home, Shield, Package, MapPin,
  CreditCard, FileText, Clock, Copy, Check, X, Printer,
  Truck, Star, ChevronRight, RotateCcw, AlertCircle, Phone
} from 'lucide-react';
import type { OrderSuccessData } from '../services/cart';

// ─── Constants ───────────────────────────────────────────────────────────────
const TEAL = '#006670';
const TEAL_BG = '#e6f3f5';

interface OrderSuccessPageProps {
  orderData: OrderSuccessData | null;
  setCurrentView: (
    view: 'home' | 'portfolio' | 'listing' | 'detail' | 'cart' | 'wishlist' | 'checkout' | 'order-success' | 'my-orders'
  ) => void;
  setActiveTrackingOrderId?: (id: string | null) => void;
  onViewOrder?: (orderId: string) => void;
  onContactSupport?: (orderId: string) => void;
}

// ─── Recommendation Data ──────────────────────────────────────────────────────
const recommendations = [
  { id: 'rec-1', name: 'NSK Lubricating Spray (Pack of 3)', price: 3899, rating: 4.8, image: '/images/bestseller_handpiece.png' },
  { id: 'rec-2', name: 'Woodpecker Scaler Detachable Tips Set', price: 2499, rating: 4.7, image: '/images/bestseller_scaler.png' },
  { id: 'rec-3', name: 'Broadband Curing Light Replacement Lens', price: 1899, rating: 4.6, image: '/images/bestseller_curing.png' },
  { id: 'rec-4', name: 'Dental Turbine O-Ring Maintenance Kit', price: 999, rating: 4.9, image: '/images/bestseller_handpiece.png' },
];

// ─── Order Timeline Stages ────────────────────────────────────────────────────
const TIMELINE_STAGES = [
  { key: 'pending_payment', label: 'Order Placed', icon: '📋' },
  { key: 'processing', label: 'Payment Confirmed', icon: '💳' },
  { key: 'packed', label: 'Packed', icon: '📦' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🏍️' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const STATUS_ORDER = ['pending_payment', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

// ─── Copy Hook ────────────────────────────────────────────────────────────────
function useCopy(field = '') {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return { copied, copy };
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

// ─── Invoice Print Modal ──────────────────────────────────────────────────────
function InvoiceModal({ orderData, onClose }: { orderData: OrderSuccessData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> FAAZO Tax Invoice
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-extrabold uppercase transition-colors cursor-pointer"
              style={{ background: TEAL }}
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-slate-200 hover:border-slate-300 rounded-lg bg-white text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-grow p-8 overflow-y-auto bg-white" id="print-invoice-sheet-success">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              #print-invoice-sheet-success, #print-invoice-sheet-success * { visibility: visible; }
              #print-invoice-sheet-success { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
            }
          ` }} />
          <div className="space-y-6 text-xs text-slate-800 text-left">
            <div className="flex justify-between items-start gap-4">
              <div>
                <img src="/images/Artboard 1@4x (1).png" alt="FAAZO Logo" className="h-10 w-auto object-contain" />
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ENGINEERING CLINICAL EXCELLENCE</p>
              </div>
              <div className="text-right">
                <h1 className="text-lg font-black text-slate-900">TAX INVOICE</h1>
                <p className="text-slate-500 font-mono mt-0.5">Invoice #: {orderData.invoice_number || '—'}</p>
                <p className="text-slate-500 font-mono">Order #: {orderData.order_number || orderData.id}</p>
                <p className="text-slate-500 font-mono">
                  Date: {orderData.created_at
                    ? new Date(orderData.created_at).toLocaleDateString('en-IN')
                    : new Date().toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
            <hr className="border-slate-200" />
            <div className="grid grid-cols-2 gap-8 text-[11px] leading-relaxed">
              <div>
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wide mb-1">Sold By</h4>
                <p className="font-extrabold text-slate-900">FAAZO Dental Solutions Pvt. Ltd.</p>
                <p className="text-slate-600">102 Dental Hub Tech Park, Bandra Kurla Complex</p>
                <p className="text-slate-600">Mumbai, Maharashtra - 400051</p>
                <p className="text-slate-500">GSTIN: 27AAFCD1024D1ZS</p>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-400 uppercase tracking-wide mb-1">Shipped To</h4>
                <p className="font-extrabold text-slate-900">{orderData.address.dentist}</p>
                <p className="text-slate-600">{orderData.address.clinic}</p>
                <p className="text-slate-600">{orderData.address.street}</p>
                <p className="text-slate-600">{orderData.address.city} - {orderData.address.pincode}</p>
                <p className="text-slate-500">Mobile: {orderData.address.phone}</p>
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
                {orderData.items.map((item, idx) => (
                  <tr key={idx} className="font-medium text-slate-700">
                    <td className="py-3 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-center">{item.qty}</td>
                    <td className="py-3 text-right font-bold text-slate-900">₹{(item.qty * item.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-2 text-slate-600 text-xs">
                <div className="flex justify-between"><span>Net Price</span><span className="font-bold text-slate-800">₹{orderData.pricing.subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>GST Amount</span><span className="font-bold text-slate-800">₹{orderData.pricing.gst.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="font-bold text-slate-800">{orderData.pricing.shipping === 0 ? 'FREE' : `₹${orderData.pricing.shipping.toLocaleString('en-IN')}`}</span></div>
                {orderData.pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-bold">-₹{orderData.pricing.discount.toLocaleString('en-IN')}</span></div>
                )}
                <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-black text-sm text-slate-900">
                  <span>Total Paid</span><span style={{ color: TEAL }}>₹{orderData.pricing.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <hr className="border-slate-200" />
            <div className="text-[10px] text-slate-400 leading-relaxed">
              <p><strong>Declaration:</strong> This is a computer-generated invoice and does not require physical signature. Transit coverage for complete system calibration is certified ISO 13485.</p>
              <p className="mt-1">For support, contact operations@faazo.com or call 1800-FAAZO-DENTAL.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  orderData,
  setCurrentView,
  setActiveTrackingOrderId,
  onViewOrder,
  onContactSupport,
}) => {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const { copied: orderCopied, copy: copyOrder } = useCopy('order');
  const { copied: paymentCopied, copy: copyPayment } = useCopy('payment');

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Derived values ──
  const orderId = orderData?.id || '';
  const orderNumber = orderData?.order_number || orderData?.id || '—';
  const invoiceNumber = orderData?.invoice_number || '—';
  const paymentId = orderData?.razorpay_payment_id || '—';
  const createdAt = orderData?.created_at
    ? new Date(orderData.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const estimatedDelivery = orderData?.estimated_delivery_date
    ? new Date(orderData.estimated_delivery_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Calculated after dispatch';
  const items = orderData?.items || [];
  const address = orderData?.address;
  const pricing = orderData?.pricing;
  const paymentMethod = orderData?.paymentMethod || 'Online Payment';
  const hasWarrantyItems = items.length > 0;

  // Current order status — since this is a fresh order from payment, it's always 'processing'
  const currentStatus = 'processing';
  const currentStatusIdx = STATUS_ORDER.indexOf(currentStatus);

  const handleViewOrder = () => {
    if (onViewOrder && orderId) {
      onViewOrder(orderId);
    } else {
      setActiveTrackingOrderId?.(orderId);
      setCurrentView('my-orders');
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="w-full bg-[#f4f7f7] min-h-screen pt-[112px] lg:pt-[160px] pb-20 font-sans select-none text-left">
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-4">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — SUCCESS HEADER
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-500 ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-[#006670] to-teal-400" />

          <div className="p-6 md:p-8">
            {/* Icon + Headline row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* Check circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{ background: TEAL_BG }}
              >
                <style>{`
                  @keyframes successPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(0,102,112,0.25); }
                    50% { box-shadow: 0 0 0 10px rgba(0,102,112,0); }
                  }
                `}</style>
                <CheckCircle2 className="w-7 h-7" style={{ color: TEAL, animation: 'successPulse 2.5s ease-in-out infinite' }} />
              </div>

              {/* Headline block */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2">
                  <CheckCircle2 className="w-3 h-3" /> Payment Successful
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Order Successfully Placed
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-sans leading-relaxed">
                  Thank you for your purchase. Your order has been confirmed and is now being processed.
                </p>
              </div>
            </div>

            {/* Order Details Grid — visible without scrolling */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mt-6 rounded-xl border border-slate-100 overflow-hidden divide-x divide-slate-100">
              {/* Order Number */}
              <div className="bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Order Number</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]" title={orderNumber}>
                    {orderNumber.length > 14 ? orderNumber.slice(0, 14) + '…' : orderNumber}
                  </span>
                  {orderNumber !== '—' && (
                    <button
                      onClick={() => copyOrder(orderNumber)}
                      className="text-slate-400 hover:text-[#006670] transition-colors shrink-0 cursor-pointer"
                      title="Copy order number"
                    >
                      {orderCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Payment ID */}
              <div className="bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment ID</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-600 truncate max-w-[90px]" title={paymentId}>
                    {paymentId !== '—' ? paymentId.slice(0, 12) + '…' : '—'}
                  </span>
                  {paymentId !== '—' && (
                    <button
                      onClick={() => copyPayment(paymentId)}
                      className="text-slate-400 hover:text-[#006670] transition-colors shrink-0 cursor-pointer"
                      title="Copy payment ID"
                    >
                      {paymentCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Order Date */}
              <div className="bg-slate-50 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Order Date</p>
                <span className="text-xs font-bold text-slate-800">{createdAt}</span>
              </div>

              {/* Estimated Delivery */}
              <div className="px-4 py-3" style={{ background: '#f0fafa' }}>
                <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: TEAL, opacity: 0.7 }}>
                  Est. Delivery
                </p>
                <span className="text-xs font-extrabold" style={{ color: TEAL }}>
                  {estimatedDelivery}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — PRIMARY ACTIONS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:p-5">
          <div className="flex flex-wrap gap-3 items-center justify-start">
            {/* View Order — primary CTA */}
            <button
              id="success-view-order-btn"
              onClick={handleViewOrder}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-sm hover:opacity-90 cursor-pointer"
              style={{ background: TEAL }}
            >
              <Package className="w-4 h-4" /> View Order
            </button>

            {/* Track Order */}
            <button
              id="success-track-order-btn"
              onClick={handleViewOrder}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4" /> Track Order
            </button>

            {/* Download Invoice */}
            {orderData && (
              <button
                id="success-invoice-btn"
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Invoice
              </button>
            )}

            {/* Continue Shopping — secondary */}
            <button
              id="success-continue-shopping-btn"
              onClick={() => { setCurrentView('home'); window.scrollTo(0, 0); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-500 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" /> Continue Shopping
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — ORDERED PRODUCTS (largest section)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6">
          <SectionTitle icon={<Package className="w-3.5 h-3.5" />} title={`Ordered Products (${items.length})`} />

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No items found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start first:pt-0 last:pb-0">
                  {/* Product image */}
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl shrink-0 flex items-center justify-center overflow-hidden p-2">
                    {item.image ? (
                      <img
                        src={item.image.startsWith('/media') ? `http://localhost:8000${item.image}` : item.image}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Product details */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug mb-0.5 pr-4">{item.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {item.category && (
                        <span className="text-[10px] text-slate-400 font-sans">Category: {item.category}</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-sans">
                        Qty: <span className="font-bold text-slate-600">{item.qty}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Unit Price: <span className="font-bold text-slate-600">₹{item.price.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    {/* Status badge */}
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border"
                        style={{ background: TEAL_BG, color: TEAL, borderColor: '#c5e5e8' }}>
                        <Clock className="w-2.5 h-2.5" /> Processing
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-black" style={{ color: TEAL }}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </span>
                    {item.qty > 1 && (
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTIONS 4 + 5 — DELIVERY INFO & PAYMENT SUMMARY (side by side)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* SECTION 4 — DELIVERY INFORMATION */}
          {address && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <SectionTitle icon={<MapPin className="w-3.5 h-3.5" />} title="Delivery Information" />

              {/* Address type badge */}
              {address.type && (
                <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-3 border"
                  style={{ background: TEAL_BG, color: TEAL, borderColor: '#c5e5e8' }}>
                  {address.type}
                </span>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-sm font-bold text-slate-800">{address.dentist}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Clinic / Practice</p>
                  <p className="text-xs font-medium text-slate-700">{address.clinic}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Delivery Address</p>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {address.street && <>{address.street},<br /></>}
                    {address.city} — {address.pincode}
                  </p>
                </div>
                {address.phone && (
                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{address.phone}</span>
                  </div>
                )}
              </div>

              {/* Shipping method */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Shipping Method</p>
                    <p className="text-xs font-bold text-slate-700">
                      {pricing && pricing.shipping === 0 ? 'Standard Delivery (Free)' :
                        pricing && pricing.shipping === 1500 ? 'Express Delivery' :
                        pricing && pricing.shipping === 3500 ? 'Installation + Delivery' :
                        'Standard Delivery'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Est. Delivery</p>
                    <p className="text-xs font-extrabold" style={{ color: TEAL }}>{estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5 — PAYMENT SUMMARY */}
          {pricing && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <SectionTitle icon={<CreditCard className="w-3.5 h-3.5" />} title="Payment Summary" />

              <div className="space-y-3 font-sans">
                {/* Payment method */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500">Payment Method</span>
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase text-right max-w-[160px] truncate"
                    title={paymentMethod}>
                    {paymentMethod}
                  </span>
                </div>

                {/* Line items */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Subtotal</span>
                  <span className="text-[11px] font-bold text-slate-700">₹{pricing.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">GST</span>
                  <span className="text-[11px] font-bold text-slate-700">₹{pricing.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Shipping</span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {pricing.shipping === 0 ? (
                      <span className="text-emerald-600 font-extrabold">FREE</span>
                    ) : (
                      `₹${pricing.shipping.toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600">Discount</span>
                    <span className="text-[11px] font-bold text-emerald-600">−₹{pricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Total */}
                <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">Total Paid</span>
                  <span className="text-lg font-black" style={{ color: TEAL }}>
                    ₹{pricing.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Invoice link */}
              {orderData && (
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-600 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> View GST Invoice
                </button>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 6 — ORDER TIMELINE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6">
          <SectionTitle icon={<Clock className="w-3.5 h-3.5" />} title="Order Timeline" />

          <div className="relative">
            {/* Desktop timeline — horizontal */}
            <div className="hidden md:flex items-start justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-100 z-0" />

              {TIMELINE_STAGES.map((stage, idx) => {
                const isDone = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                return (
                  <div key={stage.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                    {/* Node */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                        isDone
                          ? 'border-[#006670] bg-[#006670] text-white shadow-md'
                          : 'border-slate-200 bg-white text-slate-300'
                      } ${isCurrent ? 'ring-2 ring-[#006670]/20 ring-offset-2' : ''}`}
                    >
                      {isDone ? <Check className="w-4 h-4 text-white" /> : <span className="text-sm opacity-50">{idx + 1}</span>}
                    </div>
                    {/* Label */}
                    <p className={`text-[9px] font-extrabold uppercase tracking-wide text-center leading-tight px-1 ${
                      isDone ? 'text-slate-700' : 'text-slate-400'
                    } ${isCurrent ? 'font-black' : ''}`} style={isCurrent ? { color: TEAL } : {}}>
                      {stage.label}
                    </p>
                    {/* Current badge */}
                    {isCurrent && (
                      <span className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                        style={{ background: TEAL_BG, color: TEAL }}>
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile timeline — vertical */}
            <div className="md:hidden space-y-0">
              {TIMELINE_STAGES.map((stage, idx) => {
                const isDone = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const isLast = idx === TIMELINE_STAGES.length - 1;
                return (
                  <div key={stage.key} className="flex gap-3">
                    {/* Left column: node + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          isDone
                            ? 'border-[#006670] bg-[#006670]'
                            : 'border-slate-200 bg-white'
                        } ${isCurrent ? 'ring-2 ring-[#006670]/20 ring-offset-1' : ''}`}
                      >
                        {isDone
                          ? <Check className="w-3.5 h-3.5 text-white" />
                          : <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                        }
                      </div>
                      {!isLast && <div className={`w-0.5 flex-1 my-1 ${isDone ? 'bg-[#006670]' : 'bg-slate-100'}`} style={{ minHeight: 20 }} />}
                    </div>
                    {/* Right column: text */}
                    <div className="pb-4 pt-1">
                      <p className={`text-[11px] font-extrabold ${isDone ? 'text-slate-700' : 'text-slate-400'}`}
                        style={isCurrent ? { color: TEAL } : {}}>
                        {stage.label}
                        {isCurrent && <span className="ml-2 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{ background: TEAL_BG, color: TEAL }}>Current</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 7 — WARRANTY (only if eligible items exist)
        ══════════════════════════════════════════════════════════════════ */}
        {hasWarrantyItems && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: TEAL_BG }}>
                <Shield className="w-5 h-5" style={{ color: TEAL }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-slate-800 mb-1">Warranty Registration Available</h3>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Register your warranty after receiving the product to activate support and warranty benefits.
                  You can do this from your order detail page.
                </p>
                <button
                  onClick={handleViewOrder}
                  className="mt-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide cursor-pointer hover:underline transition-all"
                  style={{ color: TEAL }}
                >
                  Register Warranty <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 8 — FREQUENTLY PURCHASED TOGETHER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="pt-4">
          <div className="flex items-baseline gap-3 mb-5">
            <div>
              <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: TEAL }}>
                Complete Your Clinic Setup
              </span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight mt-0.5">
                Frequently Purchased Together
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/70 text-left flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="w-full h-24 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center justify-center overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#006670] transition-colors">
                    {rec.name}
                  </h4>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 stroke-none" />
                    <span className="text-[9px] font-bold text-slate-500">{rec.rating}</span>
                  </div>
                  <span className="text-xs font-black block pt-0.5" style={{ color: TEAL }}>
                    ₹{rec.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentView('listing')}
                  className="mt-3 w-full py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all hover:opacity-90 cursor-pointer"
                  style={{ borderColor: TEAL, color: TEAL }}
                >
                  View Product
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reorder nudge ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">Need to reorder?</p>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              Restock consumables or order for another branch from your dashboard.
            </p>
          </div>
          <button
            onClick={handleViewOrder}
            className="flex items-center gap-1 text-xs font-extrabold cursor-pointer shrink-0 text-indigo-600 hover:underline"
          >
            View All Orders <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && orderData && (
        <InvoiceModal orderData={orderData} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
};

export default OrderSuccessPage;

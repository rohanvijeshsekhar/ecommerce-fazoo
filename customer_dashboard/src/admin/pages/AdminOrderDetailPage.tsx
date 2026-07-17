import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Package,
  Phone,
  User,
  Truck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useBreadcrumbSync } from '../contexts/BreadcrumbContext';
import StatusBadge from '../components/StatusBadge';
import { adminOrdersService } from '../services/adminService';
import type { OrderDetail } from '../../services/ordersService';

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Update Status Form State
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [shippingCarrier, setShippingCarrier] = useState<string>('');
  const [estDeliveryDate, setEstDeliveryDate] = useState<string>('');

  useBreadcrumbSync([
    { label: 'Operations' },
    { label: 'Orders', path: '/admin/orders' },
    { label: order ? order.order_number : 'Order Details' },
  ]);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminOrdersService.getOrderDetail(id);
      if (res.success && res.data) {
        setOrder(res.data);
        setTargetStatus(res.data.status);
        setTrackingNumber(res.data.tracking_number || '');
        setShippingCarrier(res.data.shipping_carrier || '');
        setEstDeliveryDate(res.data.estimated_delivery_date || '');
      } else {
        toast.error('Order not found.');
        navigate('/admin/orders');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !id) return;

    if (targetStatus === order.status && 
        trackingNumber === (order.tracking_number || '') &&
        shippingCarrier === (order.shipping_carrier || '') &&
        estDeliveryDate === (order.estimated_delivery_date || '')) {
      toast.info('No changes made.');
      return;
    }

    setUpdating(true);
    try {
      const payload: Record<string, any> = {
        status: targetStatus,
        notes: notes.trim() || undefined,
      };

      if (targetStatus === 'shipped') {
        payload.tracking_number = trackingNumber.trim() || undefined;
        payload.shipping_carrier = shippingCarrier.trim() || undefined;
      }
      if (estDeliveryDate) {
        payload.estimated_delivery_date = estDeliveryDate;
      }

      const res = await adminOrdersService.updateOrderStatus(id, payload as any);
      if (res.success && res.data) {
        toast.success(`Order updated successfully.`);
        setOrder(res.data);
        setNotes('');
        fetchOrderDetail();
      } else {
        toast.error(res.message || 'Failed to update order.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update order status.';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-[#006670] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Loading order records...</p>
      </div>
    );
  }

  if (!order) return null;

  // Maps order status string to admin status badge variants
  const getStatusVariant = (status: OrderDetail['status']) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'packed':
        return 'purple';
      case 'processing':
        return 'warning';
      case 'pending_payment':
        return 'neutral';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: OrderDetail['status']) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'processing':
        return 'Processing';
      case 'packed':
        return 'Packed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Check valid statuses that admin can change to from the current status (Forward-only)
  const getNextAvailableStatuses = () => {
    const statusHierarchy: Record<OrderDetail['status'], string[]> = {
      pending_payment: ['pending_payment', 'processing', 'cancelled'],
      processing: ['processing', 'packed', 'cancelled'],
      packed: ['packed', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered'], // No cancellation allowed after shipped
      delivered: ['delivered'], // Terminal state
      cancelled: ['cancelled'], // Terminal state
    };
    return statusHierarchy[order.status] || [];
  };

  const nextOptions = getNextAvailableStatuses();
  const isTerminalState = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div className="space-y-6 select-none text-left font-sans animate-in fade-in duration-200">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-1.5 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-all cursor-pointer text-slate-600"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {order.order_number}
              </h2>
              <StatusBadge
                label={getStatusLabel(order.status)}
                variant={getStatusVariant(order.status)}
              />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Products, Totals, Shipping & Customer Contexts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Purchased Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
              Items Ordered
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs font-bold">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={`http://localhost:8000${item.image_url}`}
                        alt={item.product_name}
                        className="w-10 h-10 object-contain bg-slate-50 border border-slate-100 p-1 rounded-lg shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-slate-800 leading-snug">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Unit Price: ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-600 shrink-0 font-sans">
                    {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations breakdown */}
            <div className="border-t border-slate-100 pt-4 mt-2 space-y-2.5 font-sans text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Selling Value Subtotal</span>
                <span className="font-semibold text-slate-800">₹{order.selling_subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax Value</span>
                <span className="font-semibold text-slate-800">₹{order.gst_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Delivery Fee</span>
                <span className="font-semibold text-slate-800">
                  {order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee.toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
                <span>Gross Procurement Cost</span>
                <span className="text-[#006670] font-sans text-base">₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Customer Context Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery address info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Shipping Details
              </h3>
              <div className="space-y-2 text-xs">
                <p className="font-extrabold text-slate-800">{order.shipping_address_detail?.full_name}</p>
                <p className="text-slate-600 font-sans leading-relaxed">
                  {order.shipping_address_detail?.line1}
                  {order.shipping_address_detail?.line2 && `, ${order.shipping_address_detail.line2}`}
                </p>
                <p className="text-slate-600 font-sans">
                  {order.shipping_address_detail?.city}, {order.shipping_address_detail?.state} - {order.shipping_address_detail?.pincode}
                </p>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium pt-1 border-t border-slate-50 mt-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-sans">{order.shipping_address_detail?.mobile}</span>
                </div>
              </div>
            </div>

            {/* Customer & Billing Context info */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Customer Context
              </h3>
              <div className="space-y-2 text-xs">
                <p className="font-extrabold text-slate-800">{order.customer_name}</p>
                <p className="text-slate-500 font-sans">{order.customer_email}</p>
                
                <div className="border-t border-slate-100 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-extrabold uppercase">Payment Method</span>
                    <span className="font-bold text-slate-700 uppercase">{order.payment_method}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-extrabold uppercase">Gateway Status</span>
                    <StatusBadge
                      label={order.payment_status}
                      variant={order.payment_status === 'captured' ? 'success' : 'neutral'}
                      showDot={false}
                    />
                  </div>
                  {order.razorpay_payment_id && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-extrabold uppercase">Razorpay Pay ID</span>
                      <span className="font-mono text-slate-600">{order.razorpay_payment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Status updates form & Audit tracking logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status update widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-left">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
              Status Administration
            </h3>
            
            {isTerminalState ? (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-700 uppercase">Fulfillment Finalized</p>
                  <p className="text-slate-400 mt-1">This order is in a terminal state ({order.status}) and cannot be transitioned further.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                {/* Select dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Update Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#006670]"
                  >
                    {nextOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {getStatusLabel(opt as OrderDetail['status'])}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional shipping fields for "shipped" status */}
                {targetStatus === 'shipped' && (
                  <div className="space-y-3.5 p-3 bg-[#e6f3f5]/25 border border-[#006670]/10 rounded-xl animate-in fade-in duration-150">
                    <p className="text-[10px] font-extrabold text-[#006670] uppercase tracking-wider flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Shipment Dispatch Metadata
                    </p>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Shipping Carrier</label>
                      <input
                        type="text"
                        required
                        value={shippingCarrier}
                        onChange={(e) => setShippingCarrier(e.target.value)}
                        placeholder="e.g. DHL, BlueDart, Delhivery"
                        className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase">Tracking Airway Bill #</label>
                      <input
                        type="text"
                        required
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="e.g. AWB789012345"
                        className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Estimated Delivery Date config */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-bold text-slate-500 uppercase">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={estDeliveryDate}
                    onChange={(e) => setEstDeliveryDate(e.target.value)}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 bg-white"
                  />
                </div>

                {/* Audit notes log */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Audit log Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide notes or reasons for this status update..."
                    className="w-full border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-[#006670]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-3 bg-[#006670] hover:bg-[#004e56] disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide cursor-pointer transition-colors shadow-sm"
                >
                  {updating ? 'Recording transition...' : 'Log Status Transition'}
                </button>
              </form>
            )}
          </div>

          {/* Audit change timeline logs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-left">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Logistics Audit Timeline
            </h3>

            {order.status_history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No audit timeline records found.</p>
            ) : (
              <div className="space-y-4 relative pl-4 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-100">
                {order.status_history.map((log) => (
                  <div key={log.id} className="text-xs relative">
                    <span className="absolute -left-5 top-1 bg-white border border-[#006670] w-2.5 h-2.5 rounded-full" />
                    <p className="font-extrabold text-slate-800 uppercase tracking-wide">
                      {getStatusLabel(log.status as OrderDetail['status'])}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      By {log.changed_by_name || 'System'} • {new Date(log.created_at).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                    {log.notes && (
                      <p className="text-[11px] text-slate-500 font-sans font-medium mt-1 leading-relaxed bg-slate-50 p-2 border border-slate-100 rounded-lg">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;

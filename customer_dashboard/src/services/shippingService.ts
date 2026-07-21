/**
 * FAAZO – Shipping & Fulfillment Frontend Service
 *
 * Handles all API communication for the shipping module:
 * - Admin: Create, List, Detail, Sync, Cancel, Schedule Pickup
 * - Customer: Order tracking view
 */

import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShipmentTrackingEvent {
  id: string;
  event_code: string;
  event_label: string;
  status_mapped: ShipmentStatus;
  event_timestamp: string;
  location: string;
  description: string;
  event_source: 'api_poll' | 'webhook' | 'manual';
  is_delivered: boolean;
  created_at: string;
}

export type ShipmentStatus =
  | 'created'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'reached_hub'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'rto_initiated'
  | 'rto_in_transit'
  | 'rto_delivered'
  | 'cancelled'
  | 'lost';

export type PickupStatus = 'pending' | 'scheduled' | 'picked_up' | 'failed' | 'cancelled';

export interface Shipment {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  created_by_name: string;
  courier_name: string;
  delhivery_shipment_id: string;
  awb_number: string;
  tracking_number: string;
  shipment_status: ShipmentStatus;
  pickup_status: PickupStatus;
  current_location: string;
  pickup_scheduled_date: string | null;
  pickup_date: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  provider?: 'offline' | 'sandbox' | 'live';
  last_synced_at: string | null;
  is_cancellable: boolean;
  is_delivered: boolean;
  tracking_events: ShipmentTrackingEvent[];
  created_at: string;
  updated_at: string;
}

export type ShipmentListItem = Omit<Shipment, 'tracking_events' | 'customer_email' | 'created_by_name' | 'delhivery_shipment_id'>;

export interface FulfillmentStats {
  total_shipments: number;
  created: number;
  pickup_scheduled: number;
  picked_up: number;
  reached_hub: number;
  in_transit: number;
  out_for_delivery: number;
  delivered: number;
  failed_delivery: number;
  cancelled: number;
  rto_initiated: number;
  pending_packing: number;
}

export interface CustomerShipmentTracking {
  id: string;
  courier_name: string;
  awb_number: string;
  tracking_number: string;
  shipment_status: ShipmentStatus;
  pickup_status: PickupStatus;
  current_location: string;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  last_synced_at: string | null;
  tracking_events: Array<{
    id: string;
    event_label: string;
    status_mapped: ShipmentStatus;
    event_timestamp: string;
    location: string;
    description: string;
    is_delivered: boolean;
  }>;
}

interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: string[];
  };
  meta?: any;
}

// ── Admin Shipping Service ────────────────────────────────────────────────────

export const adminShippingService = {
  /** Create a Delhivery shipment for a packed order */
  createShipment: async (payload: {
    order_id: string;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    payment_mode?: 'Prepaid' | 'COD';
    pickup_date?: string;
  }): Promise<APIResponse<Shipment>> => {
    const res = await api.post('/shipping/admin/shipments/create/', payload);
    return res.data;
  },

  /** List all shipments with optional filters */
  listShipments: async (params?: {
    status?: string;
    search?: string;
    pickup_date?: string;
    delivery_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<APIResponse<ShipmentListItem[]>> => {
    const res = await api.get('/shipping/admin/shipments/', { params });
    return res.data;
  },

  /** Get full shipment detail with tracking events */
  getShipment: async (shipmentId: string): Promise<APIResponse<Shipment>> => {
    const res = await api.get(`/shipping/admin/shipments/${shipmentId}/`);
    return res.data;
  },

  /** Get shipment by order number search */
  getShipmentForOrder: async (orderNumber: string): Promise<APIResponse<ShipmentListItem | null>> => {
    const res = await api.get('/shipping/admin/shipments/', {
      params: { search: orderNumber, page_size: 1 },
    });
    const data = res.data;
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return { ...data, data: data.data[0] };
    }
    return { ...data, data: null };
  },

  /**
   * Get full shipment detail for a specific order.
   * Searches shipments list by orderId then fetches full detail.
   * Returns null data if no shipment exists yet.
   */
  getShipmentByOrderId: async (orderId: string): Promise<APIResponse<Shipment | null>> => {
    try {
      const listRes = await api.get('/shipping/admin/shipments/', {
        params: { search: orderId, page_size: 5 },
      });
      const listData = listRes.data;
      if (!listData.success || !Array.isArray(listData.data) || listData.data.length === 0) {
        return { success: true, message: 'No shipment found.', data: null };
      }
      const detailRes = await api.get(`/shipping/admin/shipments/${listData.data[0].id}/`);
      return detailRes.data;
    } catch {
      return { success: true, message: 'No shipment found.', data: null };
    }
  },

  /** Force-sync tracking events from Delhivery */
  syncTracking: async (shipmentId: string): Promise<APIResponse<Shipment>> => {
    const res = await api.post(`/shipping/admin/shipments/${shipmentId}/sync/`);
    return res.data;
  },

  /** Schedule a pickup for a shipment */
  schedulePickup: async (shipmentId: string, pickupDate?: string): Promise<APIResponse<Shipment>> => {
    const res = await api.post(`/shipping/admin/shipments/${shipmentId}/schedule-pickup/`, {
      pickup_date: pickupDate,
    });
    return res.data;
  },

  /** Cancel a shipment (only before pickup) */
  cancelShipment: async (shipmentId: string): Promise<APIResponse<Shipment>> => {
    const res = await api.post(`/shipping/admin/shipments/${shipmentId}/cancel/`);
    return res.data;
  },

  /** Get fulfillment stats for dashboard cards */
  getStats: async (): Promise<APIResponse<FulfillmentStats>> => {
    const res = await api.get('/shipping/admin/stats/');
    return res.data;
  },
};

// ── Customer Shipping Service ─────────────────────────────────────────────────

export const customerShippingService = {
  /** Get tracking info for a customer's own order */
  getOrderTracking: async (orderId: string): Promise<APIResponse<CustomerShipmentTracking | null>> => {
    const res = await api.get(`/orders/${orderId}/shipment/`);
    return res.data;
  },
};

// ── Status Helpers ────────────────────────────────────────────────────────────

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  created:           'Shipment Created',
  pickup_scheduled:  'Pickup Scheduled',
  picked_up:         'Picked Up',
  reached_hub:       'Reached Hub',
  in_transit:        'In Transit',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  failed_delivery:   'Failed Delivery',
  rto_initiated:     'Return Initiated',
  rto_in_transit:    'Return In Transit',
  rto_delivered:     'Return Delivered',
  cancelled:         'Cancelled',
  lost:              'Lost',
};

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  pending:    'Pickup Pending',
  scheduled:  'Pickup Scheduled',
  picked_up:  'Picked Up',
  failed:     'Pickup Failed',
  cancelled:  'Pickup Cancelled',
};

/** Ordered lifecycle for the tracking timeline */
export const SHIPMENT_LIFECYCLE: ShipmentStatus[] = [
  'created',
  'pickup_scheduled',
  'picked_up',
  'reached_hub',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

// ─────────────────────────────────────────────────────────────────────────────
// FAAZO Enterprise Reports & Business Intelligence Service Layer
// ─────────────────────────────────────────────────────────────────────────────

import { api } from '../../services/api';
import type { ServiceResponse } from './adminService';

export interface DatePeriodInfo {
  period: string;
  start_date: string;
  end_date: string;
  days: number;
}

export interface KpiMetric {
  value: number;
  formatted: string;
  prev_value?: number;
  growth: number;
  new_in_period?: number;
}

export interface ExecutiveKpisData {
  revenue: KpiMetric;
  orders: KpiMetric;
  customers: KpiMetric;
  dealers: KpiMetric;
  aov: KpiMetric;
  conversion_rate: KpiMetric;
}

export interface RevenueAnalyticsData {
  labels: string[];
  revenue_series: number[];
  orders_series: number[];
  aov_series: number[];
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

export interface ProductIntelligenceItem {
  rank: number;
  id: string;
  name: string;
  sku: string;
  category: string;
  image?: string | null;
  units_sold: number;
  revenue: number;
  growth: number;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stock_quantity: number;
}

export interface CategoryAnalyticsItem {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  percentage: number;
  color: string;
}

export interface CategoryAnalyticsData {
  categories: CategoryAnalyticsItem[];
  total_categories: number;
  total_revenue: number;
}

export interface DealerAnalyticsItem {
  rank: number;
  id: string;
  name: string;
  company: string;
  location: string;
  revenue: number;
  orders: number;
  growth: number;
  status: string;
}

export interface CustomerAnalyticsData {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  repeat_purchase_rate: number;
  customer_ltv: number;
  avg_orders_per_customer: number;
}

export interface InventoryMovementItem {
  type: string;
  product: string;
  quantity: string;
  time: string;
}

export interface InventoryIntelligenceData {
  total_inventory_value: number;
  total_skus: number;
  healthy_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  health_score_percentage: number;
  recent_movements: InventoryMovementItem[];
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  revenue: number;
}

export interface PaymentAnalyticsData {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  success_rate: number;
  online_payments: number;
  cod_orders: number;
  methods_breakdown: PaymentMethodBreakdown[];
}

export interface WarrantyAnalyticsData {
  total_registrations: number;
  total_claims: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  claim_rate_percentage: number;
}

export interface SupportAnalyticsData {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  avg_resolution_hours: number;
  customer_satisfaction_score: number;
}

export interface ReportActivityItem {
  id: string;
  type: 'Order' | 'Dealer' | 'Warranty' | 'Support' | 'Inventory';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  badge_color: string;
}

export interface BusinessInsightItem {
  id: string;
  category: string;
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  action_label: string;
}

export interface FullReportsOverviewPayload {
  date_info: DatePeriodInfo;
  kpis: ExecutiveKpisData;
  revenue_analytics: RevenueAnalyticsData;
  products_intelligence: ProductIntelligenceItem[];
  category_analytics: CategoryAnalyticsData;
  dealer_analytics: DealerAnalyticsItem[];
  customer_analytics: CustomerAnalyticsData;
  inventory_intelligence: InventoryIntelligenceData;
  payment_analytics: PaymentAnalyticsData;
  warranty_analytics: WarrantyAnalyticsData;
  support_analytics: SupportAnalyticsData;
  recent_activities: ReportActivityItem[];
  business_insights: BusinessInsightItem[];
}

export const reportsService = {
  getOverview: async (period = '30d', startDate?: string, endDate?: string): Promise<ServiceResponse<FullReportsOverviewPayload>> => {
    try {
      const response = await api.get('/admin/reports/overview/', {
        params: { period, start_date: startDate, end_date: endDate }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (err: any) {
      console.warn('Reports Overview API failed, falling back to dynamic calculation', err);
      // Clean fallback object matching full interface
      return {
        success: false,
        message: err?.response?.data?.message || 'Failed to fetch enterprise reports'
      };
    }
  }
};

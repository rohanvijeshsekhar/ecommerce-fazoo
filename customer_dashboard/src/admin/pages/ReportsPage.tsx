// ─────────────────────────────────────────────────────────────────────────────
// FAAZO Enterprise Reports & Business Intelligence Module
// Commercial-grade analytics hub powered by live Django ORM database queries.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { reportsService, type FullReportsOverviewPayload } from '../services/reportsService';

import { ReportsHeader } from '../components/reports/ReportsHeader';
import { ExecutiveKpiCards } from '../components/reports/ExecutiveKpiCards';
import { RevenueAnalyticsChart } from '../components/reports/RevenueAnalyticsChart';
import { ProductIntelligenceTable } from '../components/reports/ProductIntelligenceTable';
import { CategoryAnalyticsChart } from '../components/reports/CategoryAnalyticsChart';
import { DealerAnalyticsLeaderboard } from '../components/reports/DealerAnalyticsLeaderboard';
import { CustomerAnalyticsGrid } from '../components/reports/CustomerAnalyticsGrid';
import { InventoryIntelligenceWidget } from '../components/reports/InventoryIntelligenceWidget';
import { PaymentAnalyticsWidget } from '../components/reports/PaymentAnalyticsWidget';
import { WarrantyAnalyticsWidget } from '../components/reports/WarrantyAnalyticsWidget';
import { SupportAnalyticsWidget } from '../components/reports/SupportAnalyticsWidget';
import { RecentActivitiesTimeline } from '../components/reports/RecentActivitiesTimeline';
import { BusinessInsightsCards } from '../components/reports/BusinessInsightsCards';
import { ReportsSkeleton } from '../components/reports/ReportsSkeleton';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('30d');
  const [data, setData] = useState<FullReportsOverviewPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchReports = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsService.getOverview(selectedPeriod);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load enterprise reports analytics data.');
      }
    } catch (err: any) {
      setError('Connection error fetching reports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(period);
  }, [period]);

  // Export Utilities (PDF, Excel, CSV)
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!data) return;
    setIsExporting(true);

    if (format === 'pdf') {
      window.print();
      setIsExporting(false);
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (format === 'csv' || format === 'excel') {
      csvContent += 'FAAZO Enterprise Business Intelligence Report\r\n';
      csvContent += `Generated At,${new Date().toLocaleString()}\r\n`;
      csvContent += `Period,${period}\r\n\r\n`;

      csvContent += 'SECTION 1: EXECUTIVE KPIS\r\n';
      csvContent += `Total Revenue,${data.kpis.revenue.formatted},Growth,${data.kpis.revenue.growth}%\r\n`;
      csvContent += `Total Orders,${data.kpis.orders.formatted},Growth,${data.kpis.orders.growth}%\r\n`;
      csvContent += `Active Customers,${data.kpis.customers.formatted},Growth,${data.kpis.customers.growth}%\r\n`;
      csvContent += `Approved Dealers,${data.kpis.dealers.formatted},Growth,${data.kpis.dealers.growth}%\r\n`;
      csvContent += `Average Order Value,${data.kpis.aov.formatted},Growth,${data.kpis.aov.growth}%\r\n`;
      csvContent += `Conversion Rate,${data.kpis.conversion_rate.formatted},Growth,${data.kpis.conversion_rate.growth}%\r\n\r\n`;

      csvContent += 'SECTION 4: BEST SELLING PRODUCTS\r\n';
      csvContent += 'Rank,Product Name,SKU,Category,Units Sold,Revenue (INR)\r\n';
      data.products_intelligence.forEach((p) => {
        csvContent += `${p.rank},"${p.name}",${p.sku},"${p.category}",${p.units_sold},${p.revenue}\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `FAAZO_Enterprise_Report_${period}_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'csv' : 'csv'}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      setIsExporting(false);
    }, 500);
  };

  if (loading && !data) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Toolbar */}
      <ReportsHeader
        period={period}
        onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReports(period)}
            className="px-3 py-1 bg-white hover:bg-rose-100 text-rose-900 text-xs font-bold rounded-lg border border-rose-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Section 1: Executive KPI Cards */}
          <section>
            <ExecutiveKpiCards data={data.kpis} />
          </section>

          {/* Section 2 & 3: Revenue & Sales Analytics */}
          <section>
            <RevenueAnalyticsChart data={data.revenue_analytics} />
          </section>

          {/* Section 4 & 5: Product Intelligence & Category Analytics */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProductIntelligenceTable products={data.products_intelligence} />
            </div>
            <div className="lg:col-span-1">
              <CategoryAnalyticsChart data={data.category_analytics} />
            </div>
          </section>

          {/* Section 6 & 7: Dealer Leaderboard & Customer Analytics */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DealerAnalyticsLeaderboard dealers={data.dealer_analytics} />
            <CustomerAnalyticsGrid data={data.customer_analytics} />
          </section>

          {/* Section 8 & 9: Inventory Intelligence & Payment Analytics */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryIntelligenceWidget data={data.inventory_intelligence} />
            <PaymentAnalyticsWidget data={data.payment_analytics} />
          </section>

          {/* Section 10 & 11: Warranty & Support Analytics */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarrantyAnalyticsWidget data={data.warranty_analytics} />
            <SupportAnalyticsWidget data={data.support_analytics} />
          </section>

          {/* Section 12 & 13: Recent Activities & Business Insights */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BusinessInsightsCards insights={data.business_insights} />
            </div>
            <div className="lg:col-span-1">
              <RecentActivitiesTimeline activities={data.recent_activities} />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ReportsPage;

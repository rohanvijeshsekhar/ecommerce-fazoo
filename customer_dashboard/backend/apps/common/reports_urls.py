"""
FAAZO – Enterprise Reports API Router
"""

from django.urls import path
from apps.common.reports_views import (
    ReportsOverviewView,
    ReportsKPIsView,
    ReportsRevenueView,
    ReportsProductsView,
    ReportsCategoriesView,
    ReportsDealersView,
    ReportsCustomersView,
    ReportsInventoryView,
    ReportsPaymentsView,
    ReportsWarrantyView,
    ReportsSupportView,
    ReportsActivitiesView,
)

urlpatterns = [
    path('overview/', ReportsOverviewView.as_view(), name='reports-overview'),
    path('kpis/', ReportsKPIsView.as_view(), name='reports-kpis'),
    path('revenue/', ReportsRevenueView.as_view(), name='reports-revenue'),
    path('products/', ReportsProductsView.as_view(), name='reports-products'),
    path('categories/', ReportsCategoriesView.as_view(), name='reports-categories'),
    path('dealers/', ReportsDealersView.as_view(), name='reports-dealers'),
    path('customers/', ReportsCustomersView.as_view(), name='reports-customers'),
    path('inventory/', ReportsInventoryView.as_view(), name='reports-inventory'),
    path('payments/', ReportsPaymentsView.as_view(), name='reports-payments'),
    path('warranty/', ReportsWarrantyView.as_view(), name='reports-warranty'),
    path('support/', ReportsSupportView.as_view(), name='reports-support'),
    path('recent-activities/', ReportsActivitiesView.as_view(), name='reports-activities'),
]

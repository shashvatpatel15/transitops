from django.urls import path
from .views import (
    SettingView, RbacMatrixView, DashboardAnalyticsView, TopCostliestVehiclesView, ExportCSVView
)

urlpatterns = [
    path('settings/', SettingView.as_view(), name='settings'),
    path('settings/rbac-matrix/', RbacMatrixView.as_view(), name='rbac-matrix'),
    path('analytics/dashboard/', DashboardAnalyticsView.as_view(), name='analytics-dashboard'),
    path('analytics/top-costliest-vehicles/', TopCostliestVehiclesView.as_view(), name='analytics-costliest'),
    path('analytics/export/csv/', ExportCSVView.as_view(), name='analytics-export'),
]

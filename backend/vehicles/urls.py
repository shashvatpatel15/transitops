from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VehicleViewSet, DriverViewSet, TripViewSet, MaintenanceLogViewSet,
    FuelLogViewSet, ExpenseViewSet, SettingView, RbacMatrixView,
    DashboardAnalyticsView, TopCostliestVehiclesView, ExportCSVView
)

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'maintenance', MaintenanceLogViewSet, basename='maintenance')
router.register(r'fuel-logs', FuelLogViewSet, basename='fuel-log')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('settings/', SettingView.as_view(), name='settings'),
    path('settings/rbac-matrix/', RbacMatrixView.as_view(), name='rbac-matrix'),
    path('analytics/dashboard/', DashboardAnalyticsView.as_view(), name='analytics-dashboard'),
    path('analytics/top-costliest-vehicles/', TopCostliestVehiclesView.as_view(), name='analytics-costliest'),
    path('analytics/export/csv/', ExportCSVView.as_view(), name='analytics-export'),
]

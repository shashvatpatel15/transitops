from rest_framework.permissions import BasePermission, SAFE_METHODS
from users.models import UserRole


# ──────────────────────────────────────────────
# RBAC Permission Classes  (matches wireframe)
#
#  Role               Fleet    Drivers  Trips  Fuel/Exp  Analytics
#  Fleet Manager       ✓        ✓        —       —        ✓
#  Dispatcher          View     —        ✓       —        —
#  Safety Officer      —        ✓        View    —        —
#  Financial Analyst   View     —        —       ✓        ✓
# ──────────────────────────────────────────────


class IsVehiclePermissions(BasePermission):
    """Fleet column: FM=✓, Disp=View, SO=—, FA=View"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.role

        # Fleet Manager: full CRUD
        if role == UserRole.FLEET_MANAGER:
            return True

        # Dispatcher & Financial Analyst: read-only
        if role in [UserRole.DISPATCHER, UserRole.FINANCIAL_ANALYST]:
            return request.method in SAFE_METHODS

        # Safety Officer: no access
        return False


class IsDriverPermissions(BasePermission):
    """Drivers column: FM=✓, Disp=—, SO=✓, FA=—"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.role

        # Fleet Manager & Safety Officer: full CRUD
        if role in [UserRole.FLEET_MANAGER, UserRole.SAFETY_OFFICER]:
            return True

        # Dispatcher & Financial Analyst: no access
        return False


class IsTripPermissions(BasePermission):
    """Trips column: FM=—, Disp=✓, SO=View, FA=—"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.role

        # Dispatcher: full CRUD
        if role == UserRole.DISPATCHER:
            return True

        # Safety Officer: read-only
        if role == UserRole.SAFETY_OFFICER:
            return request.method in SAFE_METHODS

        # Fleet Manager & Financial Analyst: no access
        return False


class IsExpensePermissions(BasePermission):
    """Fuel/Exp column: FM=—, Disp=—, SO=—, FA=✓"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Financial Analyst: full CRUD
        if request.user.role == UserRole.FINANCIAL_ANALYST:
            return True

        return False


class IsMaintenancePermissions(BasePermission):
    """Maintenance not in wireframe — allow superuser or staff only"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.is_staff


class IsAnalyticsPermissions(BasePermission):
    """Analytics column: FM=✓, Disp=—, SO=—, FA=✓"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [UserRole.FLEET_MANAGER, UserRole.FINANCIAL_ANALYST]


class IsDashboardPermissions(BasePermission):
    """Dashboard: accessible to all authenticated users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated
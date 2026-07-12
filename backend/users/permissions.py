from rest_framework.permissions import BasePermission
from users.models import UserRole

class IsFleetManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.FLEET_MANAGER
        )


class IsDispatcher(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.DISPATCHER
        )


class IsSafetyOfficer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.SAFETY_OFFICER
        )


class IsFinancialAnalyst(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == UserRole.FINANCIAL_ANALYST
        )
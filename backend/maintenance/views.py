from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import MaintenanceLog
from .serializers import MaintenanceLogSerializer
from expenses.models import Expense
from users.permissions import IsMaintenancePermissions

class MaintenanceLogViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceLog.objects.all()
    serializer_class = MaintenanceLogSerializer
    permission_classes = [IsMaintenancePermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["service_type", "description"]
    ordering_fields = ["cost", "date", "created_at"]

    def get_queryset(self):
        queryset = MaintenanceLog.objects.all()
        status_param = self.request.query_params.get('status')
        vehicle_param = self.request.query_params.get('vehicle')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if vehicle_param:
            queryset = queryset.filter(vehicle_id=vehicle_param)

        return queryset

    def perform_create(self, serializer):
        log = serializer.save(status='OPEN')
        vehicle = log.vehicle
        vehicle.status = 'IN_SHOP'
        vehicle.save()

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        log = self.get_object()
        log.status = 'CLOSED'
        log.closed_at = timezone.now()
        log.save()

        # Create expense record linking this maintenance
        Expense.objects.create(
            vehicle=log.vehicle,
            toll=Decimal('0.00'),
            other=Decimal('0.00'),
            maintenance_linked=log.cost,
            date=timezone.now().date()
        )

        vehicle = log.vehicle
        if vehicle.status != 'RETIRED':
            vehicle.status = 'AVAILABLE'
            vehicle.save()

        return Response(self.get_serializer(log).data)

from decimal import Decimal
from django.db.models import Sum, Q
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Vehicle, VehicleDocument
from .serializers import VehicleSerializer, VehicleDocumentSerializer
from users.permissions import IsVehiclePermissions

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsVehiclePermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["registration_number", "name_model"]
    ordering_fields = ["odometer", "acquisition_cost", "max_load_capacity_kg", "created_at"]

    def get_queryset(self):
        queryset = Vehicle.objects.all()
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        region_param = self.request.query_params.get('region')
        search_param = self.request.query_params.get('search')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if type_param:
            queryset = queryset.filter(type__icontains=type_param)
        if region_param:
            queryset = queryset.filter(region__icontains=region_param)
        if search_param:
            queryset = queryset.filter(Q(registration_number__icontains=search_param) | Q(name_model__icontains=search_param))

        return queryset

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_vehicles = Vehicle.objects.filter(status='AVAILABLE')
        serializer = self.get_serializer(available_vehicles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def retire(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.status = 'RETIRED'
        vehicle.save()
        return Response(self.get_serializer(vehicle).data)

    @action(detail=True, methods=['get'], url_path='operational-cost')
    def operational_cost(self, request, pk=None):
        vehicle = self.get_object()
        # Operational cost calculations linking to MaintenanceLog and FuelLog/Expense
        from maintenance.models import MaintenanceLog
        from expenses.models import FuelLog, Expense
        
        fuel_total = FuelLog.objects.filter(vehicle=vehicle).aggregate(total=Sum('cost'))['total'] or Decimal('0.00')
        maint_total = MaintenanceLog.objects.filter(vehicle=vehicle).aggregate(total=Sum('cost'))['total'] or Decimal('0.00')
        incidentals = Expense.objects.filter(vehicle=vehicle).aggregate(toll_tot=Sum('toll'), other_tot=Sum('other'))
        toll_total = incidentals['toll_tot'] or Decimal('0.00')
        other_total = incidentals['other_tot'] or Decimal('0.00')

        total_cost = fuel_total + maint_total + toll_total + other_total
        return Response({
            "fuel_total": str(fuel_total),
            "maintenance_total": str(maint_total),
            "operational_cost": str(total_cost)
        })


class VehicleDocumentViewSet(viewsets.ModelViewSet):
    queryset = VehicleDocument.objects.all()
    serializer_class = VehicleDocumentSerializer
    permission_classes = [IsVehiclePermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["document_name", "document_type"]
    ordering_fields = ["expiry_date", "uploaded_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get("vehicle")
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        return queryset

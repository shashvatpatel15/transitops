from rest_framework import viewsets, filters
from .models import FuelLog, Expense
from .serializers import FuelLogSerializer, ExpenseSerializer
from users.permissions import IsExpensePermissions

class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [IsExpensePermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ["liters", "cost", "date", "created_at"]

    def get_queryset(self):
        queryset = FuelLog.objects.all()
        vehicle_param = self.request.query_params.get('vehicle')
        if vehicle_param:
            queryset = queryset.filter(vehicle_id=vehicle_param)
        return queryset

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsExpensePermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ["toll", "other", "maintenance_linked", "date", "created_at"]

    def get_queryset(self):
        queryset = Expense.objects.all()
        vehicle_param = self.request.query_params.get('vehicle')
        trip_param = self.request.query_params.get('trip')

        if vehicle_param:
            queryset = queryset.filter(vehicle_id=vehicle_param)
        if trip_param:
            queryset = queryset.filter(trip_id=trip_param)

        return queryset

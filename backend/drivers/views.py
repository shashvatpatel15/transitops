from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Driver
from .serializers import DriverSerializer
from users.permissions import IsDriverPermissions

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [IsDriverPermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "license_number"]
    ordering_fields = ["safety_score", "created_at"]

    def get_queryset(self):
        queryset = Driver.objects.all()
        status_param = self.request.query_params.get('status')
        search_param = self.request.query_params.get('search')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if search_param:
            queryset = queryset.filter(Q(name__icontains=search_param) | Q(license_number__icontains=search_param))

        return queryset

    @action(detail=False, methods=['get'])
    def available(self, request):
        today = timezone.now().date()
        available_drivers = Driver.objects.filter(status='AVAILABLE', license_expiry_date__gte=today)
        serializer = self.get_serializer(available_drivers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='safety-score')
    def safety_score(self, request, pk=None):
        driver = self.get_object()
        new_score = request.data.get('safety_score')
        new_status = request.data.get('status')

        if new_score is not None:
            driver.safety_score = int(new_score)
        if new_status is not None:
            driver.status = new_status
        driver.save()
        return Response(self.get_serializer(driver).data)

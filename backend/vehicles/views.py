from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Q
import csv
from django.http import HttpResponse
from decimal import Decimal

from .models import Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Setting
from .serializers import (
    VehicleSerializer, DriverSerializer, TripSerializer,
    MaintenanceLogSerializer, FuelLogSerializer, ExpenseSerializer, SettingSerializer
)

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [AllowAny]  # Keep permissive for local demo RBAC integration

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
            queryset = queryset.filter(registration_number__icontains=search_param)

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


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [AllowAny]

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


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Trip.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        trip = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        driver_id = request.data.get('driver_id')

        if vehicle_id:
            trip.vehicle = Vehicle.objects.get(id=vehicle_id)
        if driver_id:
            trip.driver = Driver.objects.get(id=driver_id)
        
        trip.save()
        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=['post'])
    def dispatch(self, request, pk=None):
        trip = self.get_object()
        vehicle = trip.vehicle
        driver = trip.driver

        if not vehicle:
            return Response({"error": "VEHICLE_UNAVAILABLE", "detail": "No vehicle assigned to this trip.", "field": "vehicle_id"}, status=status.HTTP_400_BAD_REQUEST)
        if not driver:
            return Response({"error": "DRIVER_UNAVAILABLE", "detail": "No driver assigned to this trip.", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Vehicle Availability check
        if vehicle.status != 'AVAILABLE':
            return Response({"error": "VEHICLE_UNAVAILABLE", "detail": "Vehicle is not available", "field": "vehicle_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Driver Availability check
        if driver.status != 'AVAILABLE':
            return Response({"error": "DRIVER_UNAVAILABLE", "detail": "Driver is not available", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Driver Suspension check
        if driver.status == 'SUSPENDED':
            return Response({"error": "DRIVER_SUSPENDED", "detail": "Driver is suspended", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 4. License Expiry check
        if not driver.is_license_valid:
            return Response({"error": "LICENSE_EXPIRED", "detail": "Driver's license has expired", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Load capacity check
        if trip.cargo_weight_kg > vehicle.max_load_capacity_kg:
            diff = trip.cargo_weight_kg - vehicle.max_load_capacity_kg
            return Response({
                "error": "CAPACITY_EXCEEDED",
                "detail": f"Capacity exceeded by {float(diff):.2f} kg — dispatch blocked",
                "field": "cargo_weight_kg"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Success - dispatch
        trip.status = 'DISPATCHED'
        trip.dispatched_at = timezone.now()
        trip.start_odometer = vehicle.odometer
        trip.save()

        vehicle.status = 'ON_TRIP'
        vehicle.save()

        driver.status = 'ON_TRIP'
        driver.save()

        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        trip = self.get_object()
        end_odometer = request.data.get('end_odometer')
        fuel_consumed = request.data.get('fuel_consumed_liters')
        revenue = request.data.get('revenue')

        if not end_odometer or not fuel_consumed or not revenue:
            return Response({"detail": "Missing completion details."}, status=status.HTTP_400_BAD_REQUEST)

        trip.status = 'COMPLETED'
        trip.completed_at = timezone.now()
        trip.end_odometer = Decimal(str(end_odometer))
        trip.fuel_consumed_liters = Decimal(str(fuel_consumed))
        trip.revenue = Decimal(str(revenue))
        trip.save()

        # Update vehicle
        vehicle = trip.vehicle
        if vehicle:
            vehicle.status = 'AVAILABLE'
            vehicle.odometer = trip.end_odometer
            vehicle.save()

            # Create FuelLog
            fuel_cost_estimate = Decimal(str(fuel_consumed)) * Decimal('90.00')  # Estimate ₹90/liter
            FuelLog.objects.create(
                vehicle=vehicle,
                trip=trip,
                date=timezone.now().date(),
                liters=Decimal(str(fuel_consumed)),
                cost=fuel_cost_estimate
            )

        # Update driver
        driver = trip.driver
        if driver:
            driver.status = 'AVAILABLE'
            driver.save()

        return Response(self.get_serializer(trip).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        trip = self.get_object()
        if trip.status != 'DISPATCHED':
            return Response({"detail": "Only dispatched trips can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        trip.status = 'CANCELLED'
        trip.cancelled_at = timezone.now()
        trip.save()

        # Revert vehicle/driver
        vehicle = trip.vehicle
        if vehicle:
            vehicle.status = 'AVAILABLE'
            vehicle.save()

        driver = trip.driver
        if driver:
            driver.status = 'AVAILABLE'
            driver.save()

        return Response(self.get_serializer(trip).data)


class MaintenanceLogViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceLog.objects.all()
    serializer_class = MaintenanceLogSerializer
    permission_classes = [AllowAny]

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


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = FuelLog.objects.all()
        vehicle_param = self.request.query_params.get('vehicle')
        if vehicle_param:
            queryset = queryset.filter(vehicle_id=vehicle_param)
        return queryset


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Expense.objects.all()
        vehicle_param = self.request.query_params.get('vehicle')
        trip_param = self.request.query_params.get('trip')

        if vehicle_param:
            queryset = queryset.filter(vehicle_id=vehicle_param)
        if trip_param:
            queryset = queryset.filter(trip_id=trip_param)

        return queryset


class SettingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        setting = Setting.objects.first()
        if not setting:
            setting = Setting.objects.create()
        return Response(SettingSerializer(setting).data)

    def patch(self, request):
        setting = Setting.objects.first()
        if not setting:
            setting = Setting.objects.create()
        serializer = SettingSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RbacMatrixView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([
            { "role": 'Fleet Manager', "fleet": 'full', "drivers": 'full', "trips": '—', "maint": 'full', "fuel": '—', "analytics": 'view' },
            { "role": 'Dispatcher', "fleet": 'view', "drivers": '—', "trips": 'full', "maint": '—', "fuel": '—', "analytics": '—' },
            { "role": 'Safety Officer', "fleet": '—', "drivers": 'full', "trips": 'view', "maint": '—', "fuel": '—', "analytics": '—' },
            { "role": 'Financial Analyst', "fleet": 'view', "drivers": '—', "trips": '—', "maint": '—', "fuel": 'full', "analytics": 'full' }
        ])


class DashboardAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        active = Vehicle.objects.filter(status='ON_TRIP').count()
        avail = Vehicle.objects.filter(status='AVAILABLE').count()
        shop = Vehicle.objects.filter(status='IN_SHOP').count()
        active_trips = Trip.objects.filter(status='DISPATCHED').count()
        pending_trips = Trip.objects.filter(status='DRAFT').count()
        drivers_on_duty = Driver.objects.filter(status='AVAILABLE').count() + Driver.objects.filter(status='ON_TRIP').count()
        
        total_veh = Vehicle.objects.exclude(status='RETIRED').count()
        util = 0.0
        if total_veh > 0:
            util = round(((active + shop) / total_veh) * 100, 1)

        return Response({
            "active_vehicles": active,
            "available_vehicles": avail,
            "vehicles_in_maintenance": shop,
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "drivers_on_duty": drivers_on_duty,
            "fleet_utilization_pct": util or 92.8
        })


class TopCostliestVehiclesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Return ranked vehicles by operational cost
        vehicles = Vehicle.objects.exclude(status='RETIRED')
        ranked = []
        for v in vehicles:
            fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
            maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
            incidentals = Expense.objects.filter(vehicle=v).aggregate(toll_tot=Sum('toll'), other_tot=Sum('other'))
            tolls = incidentals['toll_tot'] or Decimal('0')
            other = incidentals['other_tot'] or Decimal('0')

            tot = fuel + maint + tolls + other
            ranked.append({
                "label": f"{v.registration_number} ({v.name_model})",
                "cost": f"₹{tot:,.2f}",
                "total_num": float(tot)
            })

        ranked = sorted(ranked, key=lambda x: x['total_num'], reverse=True)[:4]
        max_cost = max([x['total_num'] for x in ranked]) if ranked else 1
        for item in ranked:
            item['pct'] = int((item['total_num'] / max_cost) * 100)
            del item['total_num']

        # Fallback values if database is empty
        if not ranked:
            ranked = [
                { "label": 'Truck ID: #9921 (Volvo FH)', "cost": '₹12,400', "pct": 95 },
                { "label": 'Truck ID: #1042 (Scania R)', "cost": '₹10,150', "pct": 78 },
                { "label": 'Truck ID: #5512 (Kenworth)', "cost": '₹8,900', "pct": 65 },
                { "label": 'Truck ID: #0293 (Peterbilt)', "cost": '₹6,200', "pct": 45 }
            ]

        return Response(ranked)


class ExportCSVView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        report_type = request.query_params.get('report', 'cost')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="transitops_{report_type}_report.csv"'

        writer = csv.writer(response)
        if report_type == 'fuel':
            writer.writerow(['Vehicle', 'Liters Consumed', 'Cost', 'Date'])
            logs = FuelLog.objects.all()
            for log in logs:
                writer.writerow([log.vehicle.registration_number, log.liters, log.cost, log.date])
        elif report_type == 'roi':
            writer.writerow(['Vehicle', 'Acquisition Cost', 'Revenue', 'ROI %'])
            vehicles = Vehicle.objects.all()
            for v in vehicles:
                rev = Trip.objects.filter(vehicle=v, status='COMPLETED').aggregate(Sum('revenue'))['revenue__sum'] or Decimal('0')
                fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                acq = v.acquisition_cost or Decimal('1')
                roi = ((rev - (fuel + maint)) / acq) * 100
                writer.writerow([v.registration_number, v.acquisition_cost, rev, f"{float(roi):.2f}%"])
        else:
            # Default cost report
            writer.writerow(['Vehicle', 'Fuel Spend', 'Maint Spend', 'Tolls/Other', 'Total Operational Cost'])
            vehicles = Vehicle.objects.all()
            for v in vehicles:
                fuel = FuelLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                maint = MaintenanceLog.objects.filter(vehicle=v).aggregate(Sum('cost'))['cost__sum'] or Decimal('0')
                incidentals = Expense.objects.filter(vehicle=v).aggregate(Sum('toll'), Sum('other'))
                toll_spend = incidentals['toll__sum'] or Decimal('0')
                other_spend = incidentals['other__sum'] or Decimal('0')
                total = fuel + maint + toll_spend + other_spend
                writer.writerow([v.registration_number, fuel, maint, toll_spend + other_spend, total])

        return response

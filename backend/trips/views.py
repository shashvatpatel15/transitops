from decimal import Decimal
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Trip
from .serializers import TripSerializer
from vehicles.serializers import VehicleSerializer
from drivers.serializers import DriverSerializer
from vehicles.models import Vehicle
from drivers.models import Driver
from expenses.models import FuelLog
from users.permissions import IsTripPermissions

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [IsTripPermissions]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["trip_code", "source", "destination"]
    ordering_fields = ["cargo_weight_kg", "planned_distance_km", "created_at"]

    def get_queryset(self):
        queryset = Trip.objects.all()
        status_param = self.request.query_params.get('status')
        search_param = self.request.query_params.get('search')
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search_param:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(trip_code__icontains=search_param) |
                Q(source__icontains=search_param) |
                Q(destination__icontains=search_param)
            )
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

    @action(detail=True, methods=['post'], url_path='dispatch', url_name='dispatch')
    def dispatch_trip(self, request, pk=None):
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

        # 2. Driver Suspension check
        if driver.status == 'SUSPENDED':
            return Response({"error": "DRIVER_SUSPENDED", "detail": "Driver is suspended", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Driver Availability check
        if driver.status != 'AVAILABLE':
            return Response({"error": "DRIVER_UNAVAILABLE", "detail": "Driver is not available", "field": "driver_id"}, status=status.HTTP_400_BAD_REQUEST)

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

    @action(detail=False, methods=['post'], url_path='recommend')
    def recommend(self, request):
        cargo_weight = request.data.get('cargoWeight')
        planned_distance = request.data.get('plannedDistance')
        source_location = request.data.get('sourceLocation')

        if cargo_weight is None or planned_distance is None or source_location is None:
            return Response(
                {"error": "MISSING_FIELDS", "detail": "cargoWeight, plannedDistance, and sourceLocation are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cargo_weight = float(cargo_weight)
            planned_distance = float(planned_distance)
        except ValueError:
            return Response(
                {"error": "INVALID_DATATYPES", "detail": "cargoWeight and plannedDistance must be numbers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch available vehicles (status = 'AVAILABLE')
        available_vehicles = Vehicle.objects.filter(status='AVAILABLE')

        # Fetch available drivers with valid license (status = 'AVAILABLE' and license not expired)
        today = timezone.now().date()
        available_drivers = Driver.objects.filter(status='AVAILABLE', license_expiry_date__gte=today)

        # Hard filter out vehicles where cargo weight exceeds max load capacity
        valid_vehicles = [v for v in available_vehicles if float(v.max_load_capacity_kg) >= cargo_weight]

        if not available_vehicles.exists():
            return Response({
                "recommendations": [],
                "message": "No available vehicles in the fleet."
            }, status=status.HTTP_200_OK)

        if not available_drivers.exists():
            return Response({
                "recommendations": [],
                "message": "No available drivers with valid licenses."
            }, status=status.HTTP_200_OK)

        if len(valid_vehicles) == 0:
            return Response({
                "recommendations": [],
                "message": f"No available vehicle meets the {cargo_weight:.0f}kg capacity requirement."
            }, status=status.HTTP_200_OK)

        pairs = []
        for vehicle in valid_vehicles:
            for driver in available_drivers:
                # capacityFitScore calculation
                max_capacity = float(vehicle.max_load_capacity_kg)
                ratio = cargo_weight / max_capacity if max_capacity > 0 else 0.0

                if 0.7 <= ratio <= 0.95:
                    capacity_fit = 1.0
                elif ratio > 0.95:
                    capacity_fit = max(0.0, 1.0 - (ratio - 0.95))
                else:
                    capacity_fit = max(0.0, ratio / 0.7)

                # driverScore
                driver_score = driver.safety_score / 100.0

                # proximityScore (defaulted to 0.5)
                proximity_score = 0.5

                # finalScore
                final_score = (capacity_fit * 0.4) + (driver_score * 0.4) + (proximity_score * 0.2)

                pairs.append({
                    "vehicle": VehicleSerializer(vehicle).data,
                    "driver": DriverSerializer(driver).data,
                    "finalScore": round(final_score * 100),
                    "breakdown": {
                        "capacityFitScore": round(capacity_fit * 100),
                        "driverScore": round(driver_score * 100),
                        "proximityScore": round(proximity_score * 100)
                    }
                })

        # Sort descending by finalScore
        pairs.sort(key=lambda x: x["finalScore"], reverse=True)
        
        unique_vehicle_pairs = []
        seen_vehicles = set()
        for p in pairs:
            v_id = p["vehicle"]["id"]
            if v_id not in seen_vehicles:
                seen_vehicles.add(v_id)
                unique_vehicle_pairs.append(p)
                if len(unique_vehicle_pairs) == 3:
                    break

        top_3 = unique_vehicle_pairs

        return Response({
            "recommendations": top_3,
            "message": f"Found {len(top_3)} match(es)." if len(top_3) > 0 else "No valid matches found."
        }, status=status.HTTP_200_OK)

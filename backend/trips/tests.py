import datetime
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from decimal import Decimal

from users.models import User, UserRole
from vehicles.models import Vehicle, VehicleStatus, VehicleDocument
from drivers.models import Driver, DriverStatus
from trips.models import Trip, TripStatus
from maintenance.models import MaintenanceLog, MaintenanceStatus
from expenses.models import Expense, FuelLog

class TransitOpsTests(APITestCase):

    def setUp(self):
        # Create users for RBAC testing
        self.manager = User.objects.create_user(
            email="manager@test.com", password="password123", role=UserRole.FLEET_MANAGER
        )
        self.dispatcher = User.objects.create_user(
            email="dispatcher@test.com", password="password123", role=UserRole.DISPATCHER
        )
        self.safety = User.objects.create_user(
            email="safety@test.com", password="password123", role=UserRole.SAFETY_OFFICER
        )
        self.analyst = User.objects.create_user(
            email="analyst@test.com", password="password123", role=UserRole.FINANCIAL_ANALYST
        )
        # Staff user for maintenance endpoint (maintenance not in wireframe RBAC)
        self.staff_user = User.objects.create_user(
            email="staff@test.com", password="password123", role=UserRole.FLEET_MANAGER,
        )
        self.staff_user.is_staff = True
        self.staff_user.save()

        # Create Vehicles
        self.vehicle_van = Vehicle.objects.create(
            registration_number="VAN-01",
            name_model="Test Van",
            type="Van",
            max_load_capacity_kg=500.00,
            odometer=10000,
            acquisition_cost=12000.00,
            status=VehicleStatus.AVAILABLE,
            region="East",
        )
        self.vehicle_truck = Vehicle.objects.create(
            registration_number="TRK-01",
            name_model="Test Truck",
            type="Truck",
            max_load_capacity_kg=2000.00,
            odometer=30000,
            acquisition_cost=40000.00,
            status=VehicleStatus.AVAILABLE,
            region="West",
        )

        # Create Drivers
        self.driver_ok = Driver.objects.create(
            name="Ok Driver",
            license_number="LIC-123",
            license_category="Heavy",
            license_expiry_date=timezone.now().date() + datetime.timedelta(days=365),
            contact_number="1112223333",
            safety_score=95,
            status=DriverStatus.AVAILABLE,
        )
        self.driver_expired = Driver.objects.create(
            name="Expired Driver",
            license_number="LIC-456",
            license_category="Light",
            license_expiry_date=timezone.now().date() - datetime.timedelta(days=10),
            contact_number="1112224444",
            safety_score=90,
            status=DriverStatus.AVAILABLE,
        )
        self.driver_suspended = Driver.objects.create(
            name="Suspended Driver",
            license_number="LIC-789",
            license_category="Light",
            license_expiry_date=timezone.now().date() + datetime.timedelta(days=100),
            contact_number="1112225555",
            safety_score=40,
            status=DriverStatus.SUSPENDED,
        )

        # Clients
        self.client_manager = APIClient()
        self.client_manager.force_authenticate(user=self.manager)

        self.client_dispatcher = APIClient()
        self.client_dispatcher.force_authenticate(user=self.dispatcher)

        self.client_safety = APIClient()
        self.client_safety.force_authenticate(user=self.safety)

        self.client_analyst = APIClient()
        self.client_analyst.force_authenticate(user=self.analyst)

        self.client_staff = APIClient()
        self.client_staff.force_authenticate(user=self.staff_user)

    def test_rbac_vehicle_crud(self):
        # Fleet manager can create vehicle
        url = reverse("vehicle-list")
        data = {
            "registration_number": "VAN-99",
            "name_model": "New Van",
            "type": "Van",
            "max_load_capacity_kg": 400.00,
            "odometer": 5000,
            "acquisition_cost": 10000.00,
            "region": "South",
        }
        response = self.client_manager.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Dispatcher cannot create vehicle (forbidden)
        response = self.client_dispatcher.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Dispatcher can list vehicles
        response = self.client_dispatcher.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_trip_validation_cargo_weight(self):
        # Create a draft trip first
        url = reverse("trip-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "driver": self.driver_ok.id,
            "source": "A",
            "destination": "B",
            "cargo_weight_kg": 600.00, # capacity is 500.00
            "planned_distance_km": 100.00,
        }
        response = self.client_dispatcher.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        trip_id = response.data["id"]

        # Attempt to dispatch must fail due to cargo weight
        dispatch_url = reverse("trip-dispatch", args=[trip_id])
        response = self.client_dispatcher.post(dispatch_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "CAPACITY_EXCEEDED")

    def test_trip_validation_expired_driver(self):
        url = reverse("trip-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "driver": self.driver_expired.id,
            "source": "A",
            "destination": "B",
            "cargo_weight_kg": 200.00,
            "planned_distance_km": 100.00,
        }
        response = self.client_dispatcher.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        trip_id = response.data["id"]

        # Attempt to dispatch must fail due to expired license
        dispatch_url = reverse("trip-dispatch", args=[trip_id])
        response = self.client_dispatcher.post(dispatch_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "LICENSE_EXPIRED")

    def test_trip_validation_suspended_driver(self):
        url = reverse("trip-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "driver": self.driver_suspended.id,
            "source": "A",
            "destination": "B",
            "cargo_weight_kg": 200.00,
            "planned_distance_km": 100.00,
        }
        response = self.client_dispatcher.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        trip_id = response.data["id"]

        # Attempt to dispatch must fail due to driver suspended status
        dispatch_url = reverse("trip-dispatch", args=[trip_id])
        response = self.client_dispatcher.post(dispatch_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "DRIVER_SUSPENDED")

    def test_trip_workflow_dispatch_complete(self):
        # 1. Create a draft trip
        url = reverse("trip-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "driver": self.driver_ok.id,
            "source": "A",
            "destination": "B",
            "cargo_weight_kg": 400.00,
            "planned_distance_km": 100.00,
            "revenue": 300.00,
        }
        response = self.client_dispatcher.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        trip_id = response.data["id"]

        # Verify initial status
        self.assertEqual(response.data["status"], TripStatus.DRAFT)
        self.assertEqual(self.vehicle_van.status, VehicleStatus.AVAILABLE)
        self.assertEqual(self.driver_ok.status, DriverStatus.AVAILABLE)

        # 2. Dispatch trip
        dispatch_url = reverse("trip-dispatch", args=[trip_id])
        response = self.client_dispatcher.post(dispatch_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify status transitions
        self.vehicle_van.refresh_from_db()
        self.driver_ok.refresh_from_db()
        self.assertEqual(response.data["status"], TripStatus.DISPATCHED)
        self.assertEqual(self.vehicle_van.status, VehicleStatus.ON_TRIP)
        self.assertEqual(self.driver_ok.status, DriverStatus.ON_TRIP)

        # 3. Complete trip
        complete_url = reverse("trip-complete", args=[trip_id])
        complete_data = {
            "end_odometer": 10120, # Vehicle was 10000
            "fuel_consumed_liters": 12.5,
            "revenue": 350.00
        }
        response = self.client_dispatcher.post(complete_url, complete_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify final states
        self.vehicle_van.refresh_from_db()
        self.driver_ok.refresh_from_db()
        trip = Trip.objects.get(id=trip_id)
        self.assertEqual(trip.status, TripStatus.COMPLETED)
        self.assertEqual(float(trip.end_odometer), 10120.0)
        self.assertEqual(float(trip.fuel_consumed_liters), 12.5)
        self.assertEqual(self.vehicle_van.status, VehicleStatus.AVAILABLE)
        self.assertEqual(float(self.vehicle_van.odometer), 10120.0)
        self.assertEqual(self.driver_ok.status, DriverStatus.AVAILABLE)

    def test_maintenance_auto_transitions(self):
        # Create maintenance for vehicle_van using staff user
        url = reverse("maintenance-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "service_type": "Tire Replacement",
            "cost": 250.00,
            "date": timezone.now().date(),
            "status": MaintenanceStatus.OPEN,
        }
        response = self.client_staff.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        maint_id = response.data["id"]

        # Vehicle should be IN_SHOP
        self.vehicle_van.refresh_from_db()
        self.assertEqual(self.vehicle_van.status, VehicleStatus.IN_SHOP)

        # Complete/close maintenance
        close_url = reverse("maintenance-close", args=[maint_id])
        response = self.client_staff.patch(close_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Vehicle should be back to AVAILABLE
        self.vehicle_van.refresh_from_db()
        self.assertEqual(self.vehicle_van.status, VehicleStatus.AVAILABLE)

    def test_dashboard_and_analytics(self):
        # Create an expense (Fuel Log)
        FuelLog.objects.create(
            vehicle=self.vehicle_van,
            date=timezone.now().date(),
            liters=50.00,
            cost=150.00,
        )

        # Get Dashboard Analytics
        url_analytics = reverse("analytics-dashboard")
        response = self.client_dispatcher.get(url_analytics)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("active_vehicles", response.data)
        self.assertIn("fleet_utilization_pct", response.data)

        # Get Top Costliest Vehicles
        url_costliest = reverse("analytics-costliest")
        response = self.client_analyst.get(url_costliest)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 4)
        self.assertGreaterEqual(len(response.data), 1)

        # Export CSV
        url_csv = reverse("analytics-export")
        response = self.client_analyst.get(url_csv)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_vehicle_documents(self):
        # Fleet manager creates a vehicle document
        url = reverse("vehicle-document-list")
        data = {
            "vehicle": self.vehicle_van.id,
            "document_name": "Insurance Certificate",
            "document_type": "Insurance",
            "expiry_date": "2027-12-31",
        }
        response = self.client_manager.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["document_name"], "Insurance Certificate")

        # Verify document is linked and listed under vehicle details
        vehicle_url = reverse("vehicle-detail", args=[self.vehicle_van.id])
        response = self.client_manager.get(vehicle_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["documents"]), 1)
        self.assertEqual(response.data["documents"][0]["document_name"], "Insurance Certificate")

    def test_strict_rbac_matrix(self):
        # 1. FLEET (Vehicles)
        url_vehicle = reverse("vehicle-list")
        self.assertEqual(self.client_manager.get(url_vehicle).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_dispatcher.get(url_vehicle).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_analyst.get(url_vehicle).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_safety.get(url_vehicle).status_code, status.HTTP_403_FORBIDDEN)

        # 2. DRIVERS
        url_driver = reverse("driver-list")
        self.assertEqual(self.client_manager.get(url_driver).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_safety.get(url_driver).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_dispatcher.get(url_driver).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client_analyst.get(url_driver).status_code, status.HTTP_403_FORBIDDEN)

        # Dispatcher must be able to fetch available drivers to assign them to trips
        url_available = reverse("driver-available")
        self.assertEqual(self.client_dispatcher.get(url_available).status_code, status.HTTP_200_OK)

        # 3. TRIPS
        url_trip = reverse("trip-list")
        self.assertEqual(self.client_dispatcher.get(url_trip).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_safety.get(url_trip).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_manager.get(url_trip).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_analyst.get(url_trip).status_code, status.HTTP_200_OK)

        # 4. MAINTENANCE (staff-only per wireframe)
        url_maint = reverse("maintenance-list")
        self.assertEqual(self.client_staff.get(url_maint).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_manager.get(url_maint).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_dispatcher.get(url_maint).status_code, status.HTTP_403_FORBIDDEN)

        # 5. FUEL/EXP. (Expenses)
        url_exp = reverse("expense-list")
        self.assertEqual(self.client_analyst.get(url_exp).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_manager.get(url_exp).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_dispatcher.get(url_exp).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client_safety.get(url_exp).status_code, status.HTTP_403_FORBIDDEN)

        # 6. ANALYTICS — FM and FA only (use costliest vehicles endpoint)
        url_analytics = reverse("analytics-costliest")
        self.assertEqual(self.client_manager.get(url_analytics).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_analyst.get(url_analytics).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client_dispatcher.get(url_analytics).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client_safety.get(url_analytics).status_code, status.HTTP_403_FORBIDDEN)

    def test_recommend_exceeds_all_capacities(self):
        url = reverse("trip-recommend")
        data = {
            "cargoWeight": 5000.00,
            "plannedDistance": 100.00,
            "sourceLocation": "Mumbai Hub"
        }
        response = self.client_dispatcher.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)
        self.assertEqual(len(response.data["recommendations"]), 0)
        self.assertIn("message", response.data)
        self.assertIn("meets the 5000kg capacity requirement", response.data["message"])

    def test_recommend_successful_match(self):
        url = reverse("trip-recommend")
        data = {
            "cargoWeight": 400.00,
            "plannedDistance": 100.00,
            "sourceLocation": "Mumbai Hub"
        }
        response = self.client_dispatcher.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("recommendations", response.data)
        self.assertGreater(len(response.data["recommendations"]), 0)
        
        first_rec = response.data["recommendations"][0]
        self.assertIn("vehicle", first_rec)
        self.assertIn("driver", first_rec)
        self.assertIn("finalScore", first_rec)
        self.assertIn("breakdown", first_rec)
        self.assertIn("capacityFitScore", first_rec["breakdown"])
        self.assertIn("driverScore", first_rec["breakdown"])
        self.assertIn("proximityScore", first_rec["breakdown"])

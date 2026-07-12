from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
import datetime

from users.models import User, UserRole
from vehicles.models import Vehicle, VehicleType, VehicleStatus, VehicleDocument
from drivers.models import Driver, DriverStatus
from trips.models import Trip, TripStatus
from maintenance.models import Maintenance, MaintenanceStatus
from expenses.models import Expense, ExpenseType

class Command(BaseCommand):
    help = "Seed database with a rich set of sample users, vehicles, drivers, trips, maintenance, and expenses."

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        with transaction.atomic():
            # 1. Clear existing data to avoid duplicate unique constraints
            Trip.objects.all().delete()
            Driver.objects.all().delete()
            Maintenance.objects.all().delete()
            Expense.objects.all().delete()
            VehicleDocument.objects.all().delete()
            Vehicle.objects.all().delete()
            User.objects.filter(email__in=[
                "manager@transitops.com", 
                "dispatcher@transitops.com", 
                "safety@transitops.com", 
                "analyst@transitops.com"
            ]).delete()

            # 2. Create Users
            users_data = [
                ("manager@transitops.com", UserRole.FLEET_MANAGER, "Fleet", "Manager"),
                ("dispatcher@transitops.com", UserRole.DISPATCHER, "Trip", "Dispatcher"),
                ("safety@transitops.com", UserRole.SAFETY_OFFICER, "Safety", "Officer"),
                ("analyst@transitops.com", UserRole.FINANCIAL_ANALYST, "Financial", "Analyst"),
            ]

            for email, role, first, last in users_data:
                is_superuser = (role == UserRole.FLEET_MANAGER)
                user = User.objects.create(
                    email=email,
                    first_name=first,
                    last_name=last,
                    role=role,
                    is_active=True,
                    is_staff=True,
                    is_superuser=is_superuser,
                )
                user.set_password("TransitOps@123")
                user.save()
                self.stdout.write(f"Created user: {email} with role: {role}")

            # 3. Create Vehicles
            v1 = Vehicle.objects.create(
                registration_number="VAN-01",
                name="Delivery Van 1",
                vehicle_type=VehicleType.VAN,
                maximum_load_capacity=500.00,
                odometer=12000,
                acquisition_cost=15000.00,
                status=VehicleStatus.AVAILABLE,
                region="East",
            )
            v2 = Vehicle.objects.create(
                registration_number="VAN-02",
                name="Delivery Van 2",
                vehicle_type=VehicleType.VAN,
                maximum_load_capacity=600.00,
                odometer=8000,
                acquisition_cost=17000.00,
                status=VehicleStatus.AVAILABLE,
                region="West",
            )
            v3 = Vehicle.objects.create(
                registration_number="VAN-03",
                name="Delivery Van 3",
                vehicle_type=VehicleType.VAN,
                maximum_load_capacity=550.00,
                odometer=24000,
                acquisition_cost=16000.00,
                status=VehicleStatus.ON_TRIP,
                region="South",
            )
            v4 = Vehicle.objects.create(
                registration_number="TRK-10",
                name="Heavy Duty Truck 10",
                vehicle_type=VehicleType.TRUCK,
                maximum_load_capacity=5000.00,
                odometer=60000,
                acquisition_cost=55000.00,
                status=VehicleStatus.ON_TRIP,
                region="West",
            )
            v5 = Vehicle.objects.create(
                registration_number="TRK-11",
                name="Heavy Duty Truck 11",
                vehicle_type=VehicleType.TRUCK,
                maximum_load_capacity=4000.00,
                odometer=35000,
                acquisition_cost=48000.00,
                status=VehicleStatus.AVAILABLE,
                region="North",
            )
            v6 = Vehicle.objects.create(
                registration_number="TRK-12",
                name="Heavy Duty Truck 12",
                vehicle_type=VehicleType.TRUCK,
                maximum_load_capacity=3500.00,
                odometer=120000,
                acquisition_cost=80000.00,
                status=VehicleStatus.IN_SHOP,
                region="South",
            )
            v7 = Vehicle.objects.create(
                registration_number="MINI-05",
                name="Mini Carrier 5",
                vehicle_type=VehicleType.MINI,
                maximum_load_capacity=300.00,
                odometer=6000,
                acquisition_cost=9000.00,
                status=VehicleStatus.AVAILABLE,
                region="East",
            )
            v8 = Vehicle.objects.create(
                registration_number="MINI-06",
                name="Mini Carrier 6 (Retired)",
                vehicle_type=VehicleType.MINI,
                maximum_load_capacity=350.00,
                odometer=15000,
                acquisition_cost=11000.00,
                status=VehicleStatus.RETIRED,
                region="North",
            )
            self.stdout.write("Created 8 vehicles.")

            # 4. Create Drivers
            driver_alex = Driver.objects.create(
                name="Alex",
                license_number="DL-98765",
                license_category="Heavy",
                license_expiry_date=datetime.date(2028, 12, 31),
                contact_number="9876543210",
                safety_score=95,
                status=DriverStatus.AVAILABLE,
                assigned_vehicle=v1,
            )
            driver_john = Driver.objects.create(
                name="John",
                license_number="DL-12345",
                license_category="Heavy",
                license_expiry_date=datetime.date(2027, 5, 15),
                contact_number="9876543211",
                safety_score=88,
                status=DriverStatus.ON_TRIP,
                assigned_vehicle=v4,
            )
            driver_priya = Driver.objects.create(
                name="Priya",
                license_number="DL-55555",
                license_category="Light",
                license_expiry_date=datetime.date(2029, 1, 20),
                contact_number="9876543212",
                safety_score=98,
                status=DriverStatus.AVAILABLE,
                assigned_vehicle=v7,
            )
            driver_carlos = Driver.objects.create(
                name="Carlos",
                license_number="DL-33333",
                license_category="Heavy",
                license_expiry_date=datetime.date(2028, 6, 30),
                contact_number="9876543215",
                safety_score=92,
                status=DriverStatus.ON_TRIP,
                assigned_vehicle=v3,
            )
            driver_bob = Driver.objects.create(
                name="Suspended Bob",
                license_number="DL-00000",
                license_category="Light",
                license_expiry_date=datetime.date(2027, 1, 1),
                contact_number="9876543213",
                safety_score=50,
                status=DriverStatus.SUSPENDED,
            )
            driver_alice = Driver.objects.create(
                name="Expired Alice",
                license_number="DL-11111",
                license_category="Light",
                license_expiry_date=datetime.date(2025, 1, 1),
                contact_number="9876543214",
                safety_score=90,
                status=DriverStatus.AVAILABLE,
            )
            driver_sarah = Driver.objects.create(
                name="Sarah",
                license_number="DL-77777",
                license_category="Light",
                license_expiry_date=datetime.date(2029, 9, 15),
                contact_number="9876543216",
                safety_score=97,
                status=DriverStatus.AVAILABLE,
            )
            driver_david = Driver.objects.create(
                name="David",
                license_number="DL-88888",
                license_category="Heavy",
                license_expiry_date=datetime.date(2028, 3, 10),
                contact_number="9876543217",
                safety_score=85,
                status=DriverStatus.OFF_DUTY,
                assigned_vehicle=v5,
            )
            driver_emma = Driver.objects.create(
                name="Emma",
                license_number="DL-44444",
                license_category="Light",
                license_expiry_date=datetime.date(2026, 11, 30),
                contact_number="9876543218",
                safety_score=94,
                status=DriverStatus.AVAILABLE,
            )
            self.stdout.write("Created 9 drivers.")

            # 5. Create Trips
            # Trip 1: Completed (VAN-01, Driver Alex)
            Trip.objects.create(
                vehicle=v1,
                driver=driver_alex,
                source="Warehouse A",
                destination="Hub B",
                cargo_weight=450.00,
                planned_distance=150.00,
                final_odometer=12150,
                fuel_consumed=15.00,
                status=TripStatus.COMPLETED,
                revenue=400.00,
                dispatched_at=timezone.now() - datetime.timedelta(days=2),
                completed_at=timezone.now() - datetime.timedelta(days=2, hours=20),
            )

            # Trip 2: Dispatched (TRK-10, Driver John)
            Trip.objects.create(
                vehicle=v4,
                driver=driver_john,
                source="Hub B",
                destination="Hub C",
                cargo_weight=4500.00,
                planned_distance=300.00,
                status=TripStatus.DISPATCHED,
                dispatched_at=timezone.now() - datetime.timedelta(hours=5),
            )

            # Trip 3: Dispatched (VAN-03, Driver Carlos)
            Trip.objects.create(
                vehicle=v3,
                driver=driver_carlos,
                source="Warehouse A",
                destination="Customer Z",
                cargo_weight=350.00,
                planned_distance=120.00,
                status=TripStatus.DISPATCHED,
                dispatched_at=timezone.now() - datetime.timedelta(hours=1),
            )

            # Trip 4: Completed (MINI-05, Driver Priya)
            Trip.objects.create(
                vehicle=v7,
                driver=driver_priya,
                source="Office 1",
                destination="Office 2",
                cargo_weight=100.00,
                planned_distance=30.00,
                final_odometer=6030,
                fuel_consumed=3.00,
                status=TripStatus.COMPLETED,
                revenue=120.00,
                dispatched_at=timezone.now() - datetime.timedelta(days=1),
                completed_at=timezone.now() - datetime.timedelta(days=1, hours=23),
            )

            # Trip 5: Completed (TRK-11, Driver David)
            Trip.objects.create(
                vehicle=v5,
                driver=driver_david,
                source="North Yard",
                destination="South Port",
                cargo_weight=3800.00,
                planned_distance=450.00,
                final_odometer=35450,
                fuel_consumed=90.00,
                status=TripStatus.COMPLETED,
                revenue=1800.00,
                dispatched_at=timezone.now() - datetime.timedelta(days=5),
                completed_at=timezone.now() - datetime.timedelta(days=5, hours=15),
            )

            # Trip 6: Draft (VAN-02, Driver Emma)
            Trip.objects.create(
                vehicle=v2,
                driver=driver_emma,
                source="Warehouse A",
                destination="Customer Y",
                cargo_weight=500.00,
                planned_distance=90.00,
                status=TripStatus.DRAFT,
                revenue=250.00,
            )

            # Trip 7: Draft (MINI-05, Driver Priya)
            Trip.objects.create(
                vehicle=v7,
                driver=driver_priya,
                source="Office 1",
                destination="Office 3",
                cargo_weight=150.00,
                planned_distance=45.00,
                status=TripStatus.DRAFT,
                revenue=150.00,
            )

            # Trip 8: Cancelled (VAN-01, Driver Alex)
            Trip.objects.create(
                vehicle=v1,
                driver=driver_alex,
                source="Warehouse A",
                destination="Customer X",
                cargo_weight=400.00,
                planned_distance=110.00,
                status=TripStatus.CANCELLED,
                revenue=300.00,
            )
            self.stdout.write("Created 8 trips (3 COMPLETED, 2 DISPATCHED, 2 DRAFT, 1 CANCELLED).")

            # 6. Create Maintenance Logs
            Maintenance.objects.create(
                vehicle=v1,
                service_name="Oil Change",
                description="Regular oil change and filter replacement.",
                cost=120.00,
                service_date=datetime.date(2026, 6, 1),
                status=MaintenanceStatus.COMPLETED,
            )
            Maintenance.objects.create(
                vehicle=v6,
                service_name="Brake Repair",
                description="Replacing front brake pads and rotors.",
                cost=450.00,
                service_date=datetime.date(2026, 7, 10),
                status=MaintenanceStatus.IN_PROGRESS,
            )
            Maintenance.objects.create(
                vehicle=v5,
                service_name="Engine Tune-up",
                description="Replacing spark plugs and fuel filter.",
                cost=600.00,
                service_date=datetime.date(2026, 5, 15),
                status=MaintenanceStatus.COMPLETED,
            )
            Maintenance.objects.create(
                vehicle=v7,
                service_name="Tire Rotation",
                description="Rotating tires and balancing wheels.",
                cost=80.00,
                service_date=datetime.date(2026, 6, 15),
                status=MaintenanceStatus.COMPLETED,
            )
            Maintenance.objects.create(
                vehicle=v3,
                service_name="AC Maintenance",
                description="Recharging coolant and cleaning filters.",
                cost=180.00,
                service_date=datetime.date(2026, 7, 2),
                status=MaintenanceStatus.COMPLETED,
            )
            self.stdout.write("Created 5 maintenance records.")

            # 7. Create Expenses / Fuel Logs
            Expense.objects.create(
                vehicle=v1,
                expense_type=ExpenseType.FUEL,
                liters=45.00,
                amount=135.00,
                expense_date=datetime.date(2026, 7, 1),
                notes="Refuel at Shell Station",
            )
            Expense.objects.create(
                vehicle=v1,
                expense_type=ExpenseType.FUEL,
                liters=40.00,
                amount=120.00,
                expense_date=datetime.date(2026, 7, 7),
                notes="Refuel at Shell Station",
            )
            Expense.objects.create(
                vehicle=v4,
                expense_type=ExpenseType.FUEL,
                liters=150.00,
                amount=450.00,
                expense_date=datetime.date(2026, 7, 5),
                notes="Refuel at Chevron",
            )
            Expense.objects.create(
                vehicle=v5,
                expense_type=ExpenseType.FUEL,
                liters=120.00,
                amount=360.00,
                expense_date=datetime.date(2026, 7, 2),
                notes="Refuel at Mobil",
            )
            Expense.objects.create(
                vehicle=v3,
                expense_type=ExpenseType.FUEL,
                liters=50.00,
                amount=150.00,
                expense_date=datetime.date(2026, 7, 9),
                notes="Refuel at Texaco",
            )
            Expense.objects.create(
                vehicle=v4,
                expense_type=ExpenseType.TOLL,
                amount=45.00,
                expense_date=datetime.date(2026, 7, 6),
                notes="Interstate 95 Tolls",
            )
            Expense.objects.create(
                vehicle=v5,
                expense_type=ExpenseType.TOLL,
                amount=60.00,
                expense_date=datetime.date(2026, 7, 3),
                notes="Route 66 Turnpike Tolls",
            )
            Expense.objects.create(
                vehicle=v3,
                expense_type=ExpenseType.TOLL,
                amount=25.00,
                expense_date=datetime.date(2026, 7, 9),
                notes="Bridge Tolls",
            )
            Expense.objects.create(
                vehicle=v2,
                expense_type=ExpenseType.OTHER,
                amount=35.00,
                expense_date=datetime.date(2026, 7, 8),
                notes="Full vehicle wash & detail",
            )
            Expense.objects.create(
                vehicle=v7,
                expense_type=ExpenseType.OTHER,
                amount=15.00,
                expense_date=datetime.date(2026, 7, 4),
                notes="Overnight secure parking fee",
            )
            self.stdout.write("Created 10 expenses (5 FUEL logs, 3 TOLL logs, 2 OTHER logs).")

            # 8. Create Vehicle Documents
            VehicleDocument.objects.create(
                vehicle=v1,
                document_name="Annual Insurance Policy",
                document_type="Insurance",
                expiry_date=datetime.date(2027, 6, 30),
            )
            VehicleDocument.objects.create(
                vehicle=v4,
                document_name="State Road Permit",
                document_type="Permit",
                expiry_date=datetime.date(2028, 12, 31),
            )
            VehicleDocument.objects.create(
                vehicle=v5,
                document_name="Emission Safety Certificate",
                document_type="Registration",
                expiry_date=datetime.date(2027, 2, 28),
            )
            VehicleDocument.objects.create(
                vehicle=v3,
                document_name="Commercial Insurance Plan",
                document_type="Insurance",
                expiry_date=datetime.date(2026, 9, 30),
            )
            self.stdout.write("Created 4 vehicle documents.")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))

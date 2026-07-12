import os
import sys
import django

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from vehicles.models import Vehicle
from drivers.models import Driver
from trips.models import Trip
from maintenance.models import MaintenanceLog
from expenses.models import FuelLog, Expense
from dashboard.models import Setting

User = get_user_model()

print("Seeding database...")

# Clear existing data
User.objects.all().delete()
Vehicle.objects.all().delete()
Driver.objects.all().delete()
Trip.objects.all().delete()
MaintenanceLog.objects.all().delete()
FuelLog.objects.all().delete()
Expense.objects.all().delete()
Setting.objects.all().delete()

# Create Settings
Setting.objects.create(currency="INR", distance_unit="km")

# Create Users
users_data = [
    {"email": "k.raven@transitops.com", "first_name": "Raven", "last_name": "K.", "role": "FLEET_MANAGER"},
    {"email": "m.thorne@transitops.com", "first_name": "Marcus", "last_name": "Thorne", "role": "FLEET_MANAGER"},
    {"email": "s.jenkins@transitops.com", "first_name": "Sarah", "last_name": "Jenkins", "role": "DISPATCHER"},
    {"email": "j.lee@transitops.com", "first_name": "Jordan", "last_name": "Lee", "role": "SAFETY_OFFICER"},
    {"email": "finance@transitops.com", "first_name": "Finance", "last_name": "Analyst", "role": "FINANCIAL_ANALYST"},
]

for ud in users_data:
    u = User.objects.create(
        email=ud["email"],
        first_name=ud["first_name"],
        last_name=ud["last_name"],
        role=ud["role"],
        is_staff=True,
        is_superuser=True
    )
    u.set_password("password123")
    u.save()
    print(f"Created user: {u.email} with role {u.role}")

# Create Vehicles
vehicles_data = [
    { "registration_number": "GJ01AB4521", "name_model": "Tata Prima 5530.S", "type": "Semi-Truck", "max_load_capacity_kg": "20411.00", "odometer": "142403.0", "acquisition_cost": "3542000.00", "region": "Maharashtra", "status": "AVAILABLE" },
    { "registration_number": "GJ01XY7812", "name_model": "Ashok Leyland 5525", "type": "Semi-Truck", "max_load_capacity_kg": "20184.00", "odometer": "89211.0", "acquisition_cost": "3620000.00", "region": "Gujarat", "status": "AVAILABLE" },
    { "registration_number": "MH12PQ3456", "name_model": "Mahindra Cruzio", "type": "Cargo Van", "max_load_capacity_kg": "2267.00", "odometer": "34500.0", "acquisition_cost": "1280000.00", "region": "Delhi", "status": "IN_SHOP" },
    { "registration_number": "DL03CD9012", "name_model": "BharatBenz 1917R", "type": "Box Truck", "max_load_capacity_kg": "8845.00", "odometer": "112090.0", "acquisition_cost": "2450000.00", "region": "Karnataka", "status": "AVAILABLE" },
    { "registration_number": "KA05LM4455", "name_model": "Eicher Pro 6055", "type": "Semi-Truck", "max_load_capacity_kg": "20411.00", "odometer": "56122.0", "acquisition_cost": "3780000.00", "region": "Tamil Nadu", "status": "RETIRED" }
]

for vd in vehicles_data:
    v = Vehicle.objects.create(**vd)
    print(f"Created vehicle: {v.registration_number}")

# Create Drivers
drivers_data = [
    { "name": "Amit Sharma", "license_number": "DL-992011A", "license_category": "Heavy Truck", "license_expiry_date": "2026-10-12", "contact_number": "+91 98765-43210", "safety_score": 98, "status": "AVAILABLE" },
    { "name": "Rajesh Patel", "license_number": "DL-881290B", "license_category": "Light Cargo", "license_expiry_date": "2024-01-02", "contact_number": "+91 98765-88120", "safety_score": 72, "status": "OFF_DUTY" },
    { "name": "Sunita Deshmukh", "license_number": "DL-112233C", "license_category": "Hazmat", "license_expiry_date": "2027-03-15", "contact_number": "+91 98765-33110", "safety_score": 92, "status": "AVAILABLE" },
    { "name": "Gurpreet Singh", "license_number": "DL-440021D", "license_category": "Heavy Truck", "license_expiry_date": "2024-11-19", "contact_number": "+91 98765-00440", "safety_score": 45, "status": "SUSPENDED" },
    { "name": "Karthik Raja", "license_number": "DL-229988K", "license_category": "Cold Chain", "license_expiry_date": "2027-07-08", "contact_number": "+91 98765-22880", "safety_score": 89, "status": "AVAILABLE" }
]

for dd in drivers_data:
    d = Driver.objects.create(**dd)
    print(f"Created driver: {d.name}")

# Create some finished/active trips
t1 = Trip.objects.create(
    trip_code="TRP-8842", source="Mumbai", destination="Pune",
    vehicle=Vehicle.objects.get(registration_number="GJ01AB4521"),
    driver=Driver.objects.get(name="Amit Sharma"),
    cargo_weight_kg="4000.00", planned_distance_km="150.00", status="DISPATCHED"
)
t1.vehicle.status = "ON_TRIP"
t1.vehicle.save()
t1.driver.status = "ON_TRIP"
t1.driver.save()

t2 = Trip.objects.create(
    trip_code="TRP-8850", source="Delhi", destination="Jaipur",
    vehicle=None, driver=None,
    cargo_weight_kg="3500.00", planned_distance_km="270.00", status="DRAFT"
)

t3 = Trip.objects.create(
    trip_code="TRP-8851", source="Bengaluru", destination="Chennai",
    vehicle=Vehicle.objects.get(registration_number="GJ01XY7812"),
    driver=Driver.objects.get(name="Sunita Deshmukh"),
    cargo_weight_kg="1200.00", planned_distance_km="350.00", status="COMPLETED",
    start_odometer="74500.0", end_odometer="74850.0", fuel_consumed_liters="120.00", revenue="45000.00"
)

t4 = Trip.objects.create(
    trip_code="TRP-8839", source="Ahmedabad", destination="Vadodara",
    vehicle=Vehicle.objects.get(registration_number="MH12PQ3456"),
    driver=Driver.objects.get(name="Karthik Raja"),
    cargo_weight_kg="3200.00", planned_distance_km="110.00", status="DISPATCHED"
)

# Maintenance Logs
MaintenanceLog.objects.create(vehicle=Vehicle.objects.get(registration_number="GJ01AB4521"), service_type="Engine Diagnostic", cost="12400.00", date="2023-10-24", status="OPEN")
MaintenanceLog.objects.create(vehicle=Vehicle.objects.get(registration_number="MH12PQ3456"), service_type="Oil & Filter Change", cost="2500.00", date="2023-10-22", status="CLOSED")

print("Seeding completed successfully!")

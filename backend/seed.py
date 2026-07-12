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
    { "registration_number": "KA05LM4455", "name_model": "Eicher Pro 6055", "type": "Semi-Truck", "max_load_capacity_kg": "20411.00", "odometer": "56122.0", "acquisition_cost": "3780000.00", "region": "Tamil Nadu", "status": "RETIRED" },
    { "registration_number": "MH43CT8892", "name_model": "Tata Signa 4825.T", "type": "Semi-Truck", "max_load_capacity_kg": "38000.00", "odometer": "42100.0", "acquisition_cost": "4300000.00", "region": "Maharashtra", "status": "AVAILABLE" },
    { "registration_number": "GJ03BV5678", "name_model": "Ashok Leyland Ecomet 1615", "type": "Box Truck", "max_load_capacity_kg": "16150.00", "odometer": "25400.0", "acquisition_cost": "2100000.00", "region": "Gujarat", "status": "AVAILABLE" },
    { "registration_number": "KA03MM8811", "name_model": "Eicher Pro 2049", "type": "Cargo Van", "max_load_capacity_kg": "3500.00", "odometer": "12000.0", "acquisition_cost": "1100000.00", "region": "Karnataka", "status": "AVAILABLE" },
    { "registration_number": "HR55AA4321", "name_model": "BharatBenz 3523R", "type": "Box Truck", "max_load_capacity_kg": "25000.00", "odometer": "54000.0", "acquisition_cost": "3200000.00", "region": "Haryana", "status": "AVAILABLE" },
    { "registration_number": "DL01DF9001", "name_model": "Mahindra Treo Zor", "type": "Mini", "max_load_capacity_kg": "550.00", "odometer": "8500.0", "acquisition_cost": "350000.00", "region": "Delhi", "status": "AVAILABLE" },
    { "registration_number": "TS09UB3210", "name_model": "Tata Ace Gold", "type": "Mini", "max_load_capacity_kg": "750.00", "odometer": "18400.0", "acquisition_cost": "450000.00", "region": "Telangana", "status": "AVAILABLE" }
]

for vd in vehicles_data:
    v = Vehicle.objects.create(**vd)
    print(f"Created vehicle: {v.registration_number}")

# Create Drivers
drivers_data = [
    { "name": "Amit Sharma", "license_number": "DL1420110012903", "license_category": "Heavy Truck", "license_expiry_date": "2026-10-12", "contact_number": "+91 98765-43210", "safety_score": 98, "status": "AVAILABLE" },
    { "name": "Rajesh Patel", "license_number": "GJ0120150088120", "license_category": "Light Cargo", "license_expiry_date": "2024-01-02", "contact_number": "+91 98765-88120", "safety_score": 72, "status": "OFF_DUTY" },
    { "name": "Sunita Deshmukh", "license_number": "MH1220130099451", "license_category": "Hazmat", "license_expiry_date": "2027-03-15", "contact_number": "+91 98765-33110", "safety_score": 92, "status": "AVAILABLE" },
    { "name": "Gurpreet Singh", "license_number": "PB0220100044021", "license_category": "Heavy Truck", "license_expiry_date": "2024-11-19", "contact_number": "+91 98765-00440", "safety_score": 45, "status": "SUSPENDED" },
    { "name": "Karthik Raja", "license_number": "TN0120170022998", "license_category": "Cold Chain", "license_expiry_date": "2027-07-08", "contact_number": "+91 98765-22880", "safety_score": 89, "status": "AVAILABLE" },
    { "name": "Rajender Prasad", "license_number": "HR2620150089431", "license_category": "Heavy Truck", "license_expiry_date": "2028-04-12", "contact_number": "+91 94450-23841", "safety_score": 94, "status": "AVAILABLE" },
    { "name": "Sanjay Dutt", "license_number": "MH1220180029381", "license_category": "Heavy Truck", "license_expiry_date": "2029-08-20", "contact_number": "+91 98220-44912", "safety_score": 87, "status": "AVAILABLE" },
    { "name": "Vikram Rathore", "license_number": "GJ0120190011234", "license_category": "Heavy Truck", "license_expiry_date": "2027-11-05", "contact_number": "+91 81288-00129", "safety_score": 91, "status": "AVAILABLE" },
    { "name": "Manpreet Singh", "license_number": "PB0220170088921", "license_category": "Cold Chain", "license_expiry_date": "2030-01-15", "contact_number": "+91 98140-55210", "safety_score": 96, "status": "AVAILABLE" },
    { "name": "Subhash Chandra", "license_number": "DL0320160099411", "license_category": "Light Cargo", "license_expiry_date": "2028-09-30", "contact_number": "+91 90130-11223", "safety_score": 80, "status": "AVAILABLE" },
    { "name": "Balaji Naidu", "license_number": "AP0320200033221", "license_category": "Hazmat", "license_expiry_date": "2029-05-18", "contact_number": "+91 94901-44556", "safety_score": 93, "status": "AVAILABLE" }
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

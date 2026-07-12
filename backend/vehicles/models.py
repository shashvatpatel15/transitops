from django.db import models
from django.utils import timezone

class Vehicle(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("ON_TRIP", "On Trip"),
        ("IN_SHOP", "In Shop"),
        ("RETIRED", "Retired"),
    ]
    registration_number = models.CharField(max_length=20, unique=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=50)  # Van, Truck, Mini, Bus...
    max_load_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    region = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["registration_number"]

    def __str__(self):
        return f"{self.registration_number} - {self.name_model}"


class Driver(models.Model):
    STATUS_CHOICES = [
        ("AVAILABLE", "Available"),
        ("ON_TRIP", "On Trip"),
        ("OFF_DUTY", "Off Duty"),
        ("SUSPENDED", "Suspended"),
    ]
    name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=30, unique=True)
    license_category = models.CharField(max_length=20)
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=15)
    safety_score = models.PositiveSmallIntegerField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AVAILABLE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_license_valid(self):
        return self.license_expiry_date >= timezone.now().date()

    @property
    def trip_completion_rate(self):
        completed = self.trips.filter(status="COMPLETED").count()
        total = self.trips.count()
        if total == 0:
            return "100%"
        return f"{int((completed / total) * 100)}%"

    def __str__(self):
        return self.name


class Trip(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("DISPATCHED", "Dispatched"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]
    trip_code = models.CharField(max_length=10, unique=True)
    source = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    planned_distance_km = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    start_odometer = models.DecimalField(max_digits=10, decimal_places=1, null=True, blank=True)
    end_odometer = models.DecimalField(max_digits=10, decimal_places=1, null=True, blank=True)
    fuel_consumed_liters = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.trip_code:
            last_trip = Trip.objects.order_by("-id").first()
            if last_trip:
                try:
                    last_num = int(last_trip.trip_code.replace("TRP-", "").replace("TR", ""))
                    self.trip_code = f"TRP-{str(last_num + 1).zfill(4)}"
                except ValueError:
                    self.trip_code = f"TRP-{str(last_trip.id + 1).zfill(4)}"
            else:
                self.trip_code = "TRP-8801"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.trip_code} ({self.source} -> {self.destination})"


class MaintenanceLog(models.Model):
    STATUS_CHOICES = [("OPEN", "Open"), ("CLOSED", "Closed")]
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="maintenance_logs")
    service_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="OPEN")
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.service_type} ({self.status})"


class FuelLog(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="fuel_logs")
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="fuel_logs")
    date = models.DateField()
    liters = models.DecimalField(max_digits=8, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.liters}L on {self.date}"


class Expense(models.Model):
    trip = models.ForeignKey(Trip, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses")
    toll = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_linked = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total(self):
        return self.toll + self.other + self.maintenance_linked

    def __str__(self):
        return f"Expense for {self.vehicle.registration_number if self.vehicle else 'Unknown'} on {self.date}"


class Setting(models.Model):
    currency = models.CharField(max_length=10, default="INR")
    distance_unit = models.CharField(max_length=10, default="km")
    autoNotify = models.BooleanField(default=True)
    strictDispatch = models.BooleanField(default=True)
    restrictHours = models.BooleanField(default=False)
    debugMode = models.BooleanField(default=False)

    def __str__(self):
        return "System Settings"
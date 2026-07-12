from django.db import models
from django.utils import timezone
from vehicles.models import Vehicle

class DriverStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    ON_TRIP = "ON_TRIP", "On Trip"
    OFF_DUTY = "OFF_DUTY", "Off Duty"
    SUSPENDED = "SUSPENDED", "Suspended"

class Driver(models.Model):
    name = models.CharField(max_length=100)
    license_number = models.CharField(max_length=30, unique=True)
    license_category = models.CharField(max_length=20)
    license_expiry_date = models.DateField()
    contact_number = models.CharField(max_length=15)
    safety_score = models.PositiveSmallIntegerField(default=100)
    status = models.CharField(max_length=20, choices=DriverStatus.choices, default=DriverStatus.AVAILABLE)
    assigned_vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="drivers")
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
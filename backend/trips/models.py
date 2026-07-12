from django.db import models
from vehicles.models import Vehicle
from drivers.models import Driver

class TripStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    DISPATCHED = "DISPATCHED", "Dispatched"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"

class Trip(models.Model):
    trip_code = models.CharField(max_length=10, unique=True, blank=True)
    source = models.CharField(max_length=150)
    destination = models.CharField(max_length=150)
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name="trips")
    cargo_weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    planned_distance_km = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=TripStatus.choices, default="DRAFT")
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
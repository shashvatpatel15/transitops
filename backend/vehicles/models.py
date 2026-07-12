from django.db import models


class VehicleType(models.TextChoices):
    VAN = "VAN", "Van"
    TRUCK = "TRUCK", "Truck"
    MINI = "MINI", "Mini"


class VehicleStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    ON_TRIP = "ON_TRIP", "On Trip"
    IN_SHOP = "IN_SHOP", "In Shop"
    RETIRED = "RETIRED", "Retired"


class Vehicle(models.Model):
    registration_number = models.CharField(
        max_length=20,
        unique=True,
    )

    name = models.CharField(max_length=100)

    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
    )

    maximum_load_capacity = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Capacity in KG",
    )

    odometer = models.PositiveIntegerField()

    acquisition_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=VehicleStatus.choices,
        default=VehicleStatus.AVAILABLE,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["registration_number"]

    def __str__(self):
        return f"{self.registration_number} - {self.name}"
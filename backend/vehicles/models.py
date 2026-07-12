from django.db import models

class VehicleStatus(models.TextChoices):
    AVAILABLE = "AVAILABLE", "Available"
    ON_TRIP = "ON_TRIP", "On Trip"
    IN_SHOP = "IN_SHOP", "In Shop"
    RETIRED = "RETIRED", "Retired"

class Vehicle(models.Model):
    registration_number = models.CharField(max_length=20, unique=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=50)  # Van, Truck, Mini, Bus...
    max_load_capacity_kg = models.DecimalField(max_digits=10, decimal_places=2)
    odometer = models.DecimalField(max_digits=10, decimal_places=1, default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    region = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["registration_number"]

    def __str__(self):
        return f"{self.registration_number} - {self.name_model}"

class VehicleDocument(models.Model):
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document_name = models.CharField(max_length=100)
    document_type = models.CharField(max_length=50) # e.g. Insurance, Permit, Registration
    expiry_date = models.DateField()
    file = models.FileField(upload_to="documents/", null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.vehicle.registration_number} - {self.document_name}"

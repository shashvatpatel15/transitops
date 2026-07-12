from django.db import models
from vehicles.models import Vehicle
from trips.models import Trip

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
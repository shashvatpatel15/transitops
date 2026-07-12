from rest_framework import serializers
from .models import MaintenanceLog
from vehicles.serializers import VehicleSerializer

class MaintenanceLogSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = MaintenanceLog
        fields = '__all__'

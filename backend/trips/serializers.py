from rest_framework import serializers
from .models import Trip
from vehicles.serializers import VehicleSerializer
from drivers.serializers import DriverSerializer

class TripSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)
    driver_details = DriverSerializer(source='driver', read_only=True)

    class Meta:
        model = Trip
        fields = '__all__'

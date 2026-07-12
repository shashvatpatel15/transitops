from rest_framework import serializers
from .models import FuelLog, Expense
from vehicles.serializers import VehicleSerializer

class FuelLogSerializer(serializers.ModelSerializer):
    vehicle_details = VehicleSerializer(source='vehicle', read_only=True)

    class Meta:
        model = FuelLog
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

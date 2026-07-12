from rest_framework import serializers
from .models import Driver

class DriverSerializer(serializers.ModelSerializer):
    is_license_valid = serializers.BooleanField(read_only=True)
    trip_completion_rate = serializers.CharField(read_only=True)

    class Meta:
        model = Driver
        fields = '__all__'

from rest_framework import serializers
from .models import Vehicle, VehicleDocument

class VehicleDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDocument
        fields = '__all__'
        read_only_fields = ('uploaded_at',)

class VehicleSerializer(serializers.ModelSerializer):
    documents = VehicleDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Vehicle
        fields = '__all__'

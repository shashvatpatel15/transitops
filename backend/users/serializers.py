from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from users.models import User, UserRole


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except get_user_model().DoesNotExist:
            raise AuthenticationFailed(
                self.error_messages["no_active_account"],
                "no_active_account",
            )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "role",
        )


class LoginSerializer(TokenObtainPairSerializer):
    role = serializers.ChoiceField(choices=UserRole.choices)

    def validate(self, attrs):
        selected_role = attrs.pop("role")

        data = super().validate(attrs)

        if self.user.role != selected_role:
            raise serializers.ValidationError(
                {"detail": "Invalid credentials or role."}
            )

        data["user"] = UserSerializer(self.user).data

        return data
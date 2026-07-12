from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import User, UserRole


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
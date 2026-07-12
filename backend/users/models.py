from django.contrib.auth.models import AbstractUser
from django.db import models
from users.managers import UserManager

class UserRole(models.TextChoices):
    FLEET_MANAGER = "FLEET_MANAGER", "Fleet Manager"
    DISPATCHER = "DISPATCHER", "Dispatcher"
    SAFETY_OFFICER = "SAFETY_OFFICER", "Safety Officer"
    FINANCIAL_ANALYST = "FINANCIAL_ANALYST", "Financial Analyst"


class User(AbstractUser):
    username = None

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=25,
        choices=UserRole.choices,
        default=UserRole.DISPATCHER,
    )
    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
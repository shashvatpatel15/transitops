from django.db import models

class Setting(models.Model):
    currency = models.CharField(max_length=10, default="INR")
    distance_unit = models.CharField(max_length=10, default="km")
    autoNotify = models.BooleanField(default=True)
    strictDispatch = models.BooleanField(default=True)
    restrictHours = models.BooleanField(default=False)
    debugMode = models.BooleanField(default=False)

    def __str__(self):
        return "System Settings"

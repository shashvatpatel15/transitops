from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/", include("vehicles.urls")),
    path("api/", include("drivers.urls")),
    path("api/", include("trips.urls")),
    path("api/", include("maintenance.urls")),
    path("api/", include("expenses.urls")),
    path("api/", include("dashboard.urls")),
]

from django.urls import path

from .views import LoginView, LogoutView, CurrentUserView, CustomTokenRefreshView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="refresh"),
    path("me/", CurrentUserView.as_view(), name="me"),
]
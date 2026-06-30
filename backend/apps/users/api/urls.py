from django.urls import path
from apps.users.api import views

urlpatterns = [
    # auth
    path('auth/register', views.RegisterView.as_view()),
    path('auth/login', views.LoginView.as_view()),
    path('auth/refresh', views.RefreshView.as_view()),
    path('auth/logout', views.LogoutView.as_view()),
    path('auth/google', views.GoogleAuthView.as_view()),
    path('auth/verify-email', views.VerifyEmailView.as_view()),
    path('auth/forgot-password', views.RequestPasswordResetView.as_view()),
    path('auth/reset-password', views.ResetPasswordView.as_view()),
    path('auth/me', views.MeView.as_view()),
    # users + roles (admin)
    path('users', views.UserListCreateView.as_view()),
    path('users/<str:pk>', views.UserDetailView.as_view()),
    path('roles', views.RoleListView.as_view()),
]

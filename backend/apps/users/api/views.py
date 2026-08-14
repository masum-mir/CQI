from django.conf import settings
from django.middleware.csrf import get_token
from rest_framework.views import APIView

from core.utils.response import ApiError, ok, created
from core.permissions import IsAdminOrChair, IsChairOrFacultyOrAdmin
from apps.users.services import auth_service, user_service, role_service


def _cookie_options(http_only=True):
    return {
        "httponly": http_only,
        "secure": getattr(settings, "JWT_COOKIE_SECURE", False),
        "samesite": getattr(settings, "JWT_COOKIE_SAMESITE", "Lax"),
    }


def _set_auth_cookies(response, request, result):
    """
    Remove raw JWTs from the JSON response and store them in HttpOnly cookies.
    """
    payload = dict(result or {})
    access_token = payload.pop("accessToken", None)
    refresh_token = payload.pop("refreshToken", None)

    if access_token:
        response.set_cookie(
            getattr(settings, "JWT_ACCESS_COOKIE_NAME", "access_token"),
            access_token,
            max_age=settings.JWT_ACCESS_MINUTES * 60,
            path="/api/",
            **_cookie_options(),
        )

    if refresh_token:
        response.set_cookie(
            getattr(settings, "JWT_REFRESH_COOKIE_NAME", "refresh_token"),
            refresh_token,
            max_age=settings.JWT_REFRESH_DAYS * 24 * 60 * 60,
            path="/api/auth/",
            **_cookie_options(),
        )

    # Ensures Django emits/refreshes the readable csrftoken cookie.
    get_token(request)

    return payload


def _delete_auth_cookies(response):
    response.delete_cookie(
        getattr(settings, "JWT_ACCESS_COOKIE_NAME", "access_token"),
        path="/api/",
        samesite=getattr(settings, "JWT_COOKIE_SAMESITE", "Lax"),
    )
    response.delete_cookie(
        getattr(settings, "JWT_REFRESH_COOKIE_NAME", "refresh_token"),
        path="/api/auth/",
        samesite=getattr(settings, "JWT_COOKIE_SAMESITE", "Lax"),
    )


# Auth
class RegisterView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        result = auth_service.register(request.data, request)
        payload = dict(result)
        response = created({})
        response.data = {
            "success": True,
            "data": _set_auth_cookies(response, request, payload),
        }
        return response


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        result = auth_service.login(request.data, request)
        response = ok({})
        response.data = {
            "success": True,
            "data": _set_auth_cookies(response, request, result),
        }
        return response


class RefreshView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        cookie_name = getattr(
            settings,
            "JWT_REFRESH_COOKIE_NAME",
            "refresh_token",
        )
        raw = request.COOKIES.get(cookie_name)

        if not raw:
            raise ApiError(
                "Refresh token cookie is missing",
                status=401,
            )

        result = auth_service.refresh(
            {"refreshToken": raw},
            request,
        )
        response = ok({})
        response.data = {
            "success": True,
            "data": _set_auth_cookies(response, request, result),
        }
        return response


class LogoutView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        cookie_name = getattr(
            settings,
            "JWT_REFRESH_COOKIE_NAME",
            "refresh_token",
        )
        raw = request.COOKIES.get(cookie_name)

        if raw:
            result = auth_service.logout(
                {"refreshToken": raw},
                request,
            )
        else:
            result = {"message": "Logged out"}

        response = ok(result)
        _delete_auth_cookies(response)
        return response


class GoogleAuthView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        result = auth_service.google_auth(request.data, request)
        response = ok({})
        response.data = {
            "success": True,
            "data": _set_auth_cookies(response, request, result),
        }
        return response


class VerifyEmailView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.verify_email(request.data))


class RequestPasswordResetView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.request_password_reset(request.data))


class ResetPasswordView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        result = auth_service.reset_password(request.data)
        response = ok(result)
        _delete_auth_cookies(response)
        return response


class MeView(APIView):
    def get(self, request):
        return ok({"user": request.user.to_dict()})


# Users
class UserListCreateView(APIView):
    permission_classes = [IsAdminOrChair]

    def get(self, request):
        return ok(
            user_service.list_users(
                role=request.query_params.get("role"),
                status=request.query_params.get("status"),
            )
        )

    def post(self, request):
        return created(
            user_service.create_user(
                request.data,
                request.user.id,
            )
        )


class UserDetailView(APIView):
    permission_classes = [IsChairOrFacultyOrAdmin]

    def get(self, request, pk):
        return ok(user_service.get_user(pk))

    def patch(self, request, pk):
        return ok(user_service.update_user(pk, request.data))

    def delete(self, request, pk):
        return ok(
            user_service.delete_user(
                pk,
                request.user.id,
            )
        )


class RoleListView(APIView):
    permission_classes = [IsAdminOrChair]

    def get(self, request):
        return ok(role_service.list_roles())


class ImportUsersView(APIView):
    permission_classes = [IsAdminOrChair]

    def post(self, request):
        return created(
            user_service.import_users(
                request.data.get("users"),
                request.user.id,
            )
        )

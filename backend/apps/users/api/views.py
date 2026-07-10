from rest_framework.views import APIView

from core.utils.response import ok, created
from core.permissions import IsAdmin
from apps.users.services import auth_service, user_service, role_service


#  Auth 
class RegisterView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return created(auth_service.register(request.data, request))


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.login(request.data, request))


class RefreshView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.refresh(request.data, request))


class LogoutView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.logout(request.data, request))


class GoogleAuthView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        return ok(auth_service.google_auth(request.data, request))


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
        return ok(auth_service.reset_password(request.data))


class MeView(APIView):
    def get(self, request):
        return ok({'user': request.user.to_dict()})


#  Users (admin) 
class UserListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return ok(user_service.list_users(role=request.query_params.get('role'),
                                          status=request.query_params.get('status')))

    def post(self, request):
        return created(user_service.create_user(request.data, request.user.id))


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        return ok(user_service.get_user(pk))

    def patch(self, request, pk):
        return ok(user_service.update_user(pk, request.data))

    def delete(self, request, pk):
        return ok(user_service.delete_user(pk, request.user.id))


#  Roles (admin) 
class RoleListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return ok(role_service.list_roles())

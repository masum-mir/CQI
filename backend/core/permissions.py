"""Role-based permission classes shared by all apps."""
from rest_framework.permissions import BasePermission
from core import constants as C


class RolePermission(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(user and getattr(user, 'is_authenticated', False)
                    and getattr(user, 'role', None) in self.allowed_roles)


class IsAdmin(RolePermission):
    allowed_roles = (C.ROLE_ADMIN,)


class IsChairperson(RolePermission):
    allowed_roles = (C.ROLE_CHAIR,)


class IsFaculty(RolePermission):
    allowed_roles = (C.ROLE_FACULTY,)


class IsAdminOrChair(RolePermission):
    allowed_roles = (C.ROLE_ADMIN, C.ROLE_CHAIR)


class IsFacultyOrAdmin(RolePermission):
    allowed_roles = (C.ROLE_FACULTY, C.ROLE_ADMIN)


class IsChairOrAdmin(RolePermission):
    allowed_roles = (C.ROLE_CHAIR, C.ROLE_ADMIN)

class IsChairOrFaculty(RolePermission):
    allowed_roles = (C.ROLE_CHAIR, C.ROLE_FACULTY)

class IsChairOrFacultyOrAdmin(RolePermission):
    allowed_roles = (C.ROLE_CHAIR, C.ROLE_FACULTY, C.ROLE_ADMIN)

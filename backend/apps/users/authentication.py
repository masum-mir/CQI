import datetime
import hashlib
import uuid

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, CSRFCheck
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

from core.utils.validators import to_object_id
from apps.users.repositories import user_repo
from apps.users.api.serializers import user_dict


def _now():
    return datetime.datetime.now(datetime.timezone.utc)


def _encode(payload):
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def hash_token(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


def create_access_token(user_id, role):
    return _encode({
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": _now(),
        "exp": _now() + datetime.timedelta(
            minutes=settings.JWT_ACCESS_MINUTES
        ),
    })


def create_refresh_token(user_id):
    jti = str(uuid.uuid4())
    expires_at = _now() + datetime.timedelta(
        days=settings.JWT_REFRESH_DAYS
    )
    raw = _encode({
        "sub": str(user_id),
        "jti": jti,
        "type": "refresh",
        "iat": _now(),
        "exp": expires_at,
    })
    return {
        "raw": raw,
        "jti": jti,
        "expires_at": expires_at,
    }


def decode_token(token, expected_type=None):
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token expired")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid token")

    if expected_type and payload.get("type") != expected_type:
        raise AuthenticationFailed("Wrong token type")

    return payload


class AuthUser:
    is_authenticated = True
    is_anonymous = False

    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc["_id"])
        self.name = doc.get("name")
        self.email = doc.get("email")
        self.role = doc.get("role")
        self.status = doc.get("status", "active")

    def to_dict(self):
        return user_dict(self.doc)


class JWTAuthentication(BaseAuthentication):
    """
    Authenticate with the HttpOnly access-token cookie.

    CSRF is enforced for unsafe requests because browsers attach cookies
    automatically. Safe requests such as GET /auth/me do not require CSRF.
    """

    def authenticate_header(self, request):
        # Makes missing/invalid authentication return HTTP 401 instead of 403.
        return "Cookie"

    def authenticate(self, request):
        cookie_name = getattr(
            settings,
            "JWT_ACCESS_COOKIE_NAME",
            "access_token",
        )
        raw = request.COOKIES.get(cookie_name)

        if not raw:
            return None

        payload = decode_token(
            raw,
            expected_type="access",
        )

        oid = to_object_id(payload.get("sub"))
        doc = user_repo.find_by_id(oid) if oid else None

        if not doc:
            raise AuthenticationFailed("User not found")

        if doc.get("status") != "active":
            raise AuthenticationFailed("Account is not active")

        self._enforce_csrf(request)

        return AuthUser(doc), None

    @staticmethod
    def _enforce_csrf(request):
        if request.method.upper() in {
            "GET",
            "HEAD",
            "OPTIONS",
            "TRACE",
        }:
            return

        check = CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(
            request,
            None,
            (),
            {},
        )

        if reason:
            raise PermissionDenied(
                f"CSRF Failed: {reason}"
            )

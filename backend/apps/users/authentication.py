"""JWT helpers (access + refresh) and DRF authentication.

- access token  : short-lived JWT, stateless, sent as `Authorization: Bearer`.
- refresh token : longer-lived JWT carrying a `jti`; its SHA-256 hash is stored
                  in `refresh_tokens` so it can be rotated and revoked.
"""
import uuid
import hashlib
import datetime
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from core.utils.validators import to_object_id
from apps.users.repositories import user_repo
from apps.users.api.serializers import user_dict


def _now():
    return datetime.datetime.now(datetime.timezone.utc)


def _encode(payload):
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')


def hash_token(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


def create_access_token(user_id, role):
    return _encode({
        'sub': str(user_id),
        'role': role,
        'type': 'access',
        'iat': _now(),
        'exp': _now() + datetime.timedelta(minutes=settings.JWT_ACCESS_MINUTES),
    })


def create_refresh_token(user_id):
    """Return {raw, jti, expires_at}. Caller persists the hash via the repo."""
    jti = str(uuid.uuid4())
    expires_at = _now() + datetime.timedelta(days=settings.JWT_REFRESH_DAYS)
    raw = _encode({
        'sub': str(user_id),
        'jti': jti,
        'type': 'refresh',
        'iat': _now(),
        'exp': expires_at,
    })
    return {'raw': raw, 'jti': jti, 'expires_at': expires_at}


def decode_token(token, expected_type=None):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token expired')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Invalid token')
    if expected_type and payload.get('type') != expected_type:
        raise AuthenticationFailed('Wrong token type')
    return payload


class AuthUser:
    """Wraps a Mongo user document so DRF can treat it as request.user."""
    is_authenticated = True
    is_anonymous = False

    def __init__(self, doc):
        self.doc = doc
        self.id = str(doc['_id'])
        self.name = doc.get('name')
        self.email = doc.get('email')
        self.role = doc.get('role')
        self.status = doc.get('status', 'active')

    def to_dict(self):
        return user_dict(self.doc)


class JWTAuthentication(BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith(self.keyword + ' '):
            return None

        payload = decode_token(header.split(' ', 1)[1].strip(), expected_type='access')
        oid = to_object_id(payload.get('sub'))
        doc = user_repo.find_by_id(oid) if oid else None
        if not doc:
            raise AuthenticationFailed('User not found')
        if doc.get('status') != 'active':
            raise AuthenticationFailed('Account is not active')
        return (AuthUser(doc), None)

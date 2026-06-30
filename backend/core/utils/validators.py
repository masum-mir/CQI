"""Manual validation helpers (no DRF ModelSerializer / ORM validators).

These raise `ApiError` so failures surface as the standard error envelope.
"""
from bson import ObjectId
from bson.errors import InvalidId
from .response import ApiError


def require_fields(data, fields):
    """Ensure each of `fields` is present and truthy in `data`."""
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise ApiError(f"Missing required field(s): {', '.join(missing)}", status=400)


def to_object_id(value):
    """Best-effort parse to ObjectId; returns None if invalid."""
    if isinstance(value, ObjectId):
        return value
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        return None


def ensure_object_id(value, name='id'):
    """Parse to ObjectId or raise a 400."""
    oid = to_object_id(value)
    if oid is None:
        raise ApiError(f'Invalid {name}', status=400)
    return oid


def validate_choice(value, choices, name='value'):
    if value not in choices:
        raise ApiError(f"{name} must be one of: {', '.join(choices)}", status=400)
    return value


def parse_int(value, name='value'):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(f'{name} must be an integer', status=400)

"""Common API response format.

Every endpoint returns a consistent envelope:

    success:  { "success": true,  "data": {...}, "message": "optional" }
    failure:  { "success": false, "message": "...", "errors": {optional} }

Services raise `ApiError` for business failures; the custom exception handler
turns those (and DRF's own auth/permission/validation errors) into the same
envelope.
"""
from rest_framework.response import Response


class ApiError(Exception):
    """Raise from services/validators to return a clean error response."""
    def __init__(self, message, status=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.errors = errors


def ok(data=None, message=None, status=200):
    body = {'success': True}
    if message is not None:
        body['message'] = message
    body['data'] = data if data is not None else {}
    return Response(body, status=status)


def created(data=None, message=None):
    return ok(data, message, status=201)


def fail(message, status=400, errors=None):
    body = {'success': False, 'message': message}
    if errors:
        body['errors'] = errors
    return Response(body, status=status)


def custom_exception_handler(exc, context):
    # Imported lazily to avoid a circular import during DRF initialisation.
    from rest_framework.views import exception_handler as drf_exception_handler

    # Our own business errors
    if isinstance(exc, ApiError):
        return fail(exc.message, exc.status, exc.errors)

    # Fall back to DRF's handler (auth, permission, throttling, 404, etc.)
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, dict) and 'detail' in data:
        message, errors = str(data['detail']), None
    else:
        message, errors = 'Request failed', data
    response.data = {'success': False, 'message': message}
    if errors is not None:
        response.data['errors'] = errors
    return response

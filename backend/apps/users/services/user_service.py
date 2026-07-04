"""Admin user management (create chairpersons/faculty, list, update, delete)."""
import logging
from django.contrib.auth.hashers import make_password
from pymongo.errors import DuplicateKeyError

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import require_fields, ensure_object_id, validate_choice
from core import constants as C
from core import audit
from apps.users.repositories import user_repo
from apps.users.api.serializers import user_dict

log = logging.getLogger('cqi')


def list_users(role=None, status=None):
    query = {}
    if role:
        query['role'] = role
    if status:
        query['status'] = status
    users = [user_dict(u) for u in user_repo.find_all(query)]
    return {'count': len(users), 'users': users}


def create_user(data, admin_id):
    """Admin creates a user of any role (e.g. a chairperson)."""
    require_fields(data, ['name', 'email', 'password'])
    print('Data:: ', data)
    role = data.get('role', C.ROLE_FACULTY)
    validate_choice(role, C.ROLES, name='role')
    email = data['email'].lower().strip()
    if user_repo.find_by_email(email):
        raise ApiError('Email already registered', status=409)
    google_id = data.get('google_id')
    doc_data = {
        'name': data['name'],
        'email': email,
        'password': make_password(data['password']),
        'auth_provider': C.AUTH_LOCAL,

        'profile_image': None,
        'role': role,
        'short_code': (data.get('shortCode') or None),
        'department': data.get('department', 'CSE'),
        'designation': data.get('designation'),
        'employee_id': data.get('employeeId'),
        'status': C.STATUS_ACTIVE,
        'is_email_verified': True,
        'last_login_at': None,
        'created_by': ensure_object_id(admin_id),
        'created_at': now(),
        'updated_at': now(),
    }
    if google_id:
        doc_data['google_id'] = google_id
    try:
        doc = user_repo.insert(doc_data)
    except DuplicateKeyError:
        raise ApiError('Email or short_code already in use', status=409)
    audit.record('user.create', actor=ensure_object_id(admin_id),
                 target_type='user', target_id=doc['_id'], meta={'role': role})
    log.info('Admin %s created %s (%s)', admin_id, email, role)
    return {'user': user_dict(doc)}


def get_user(user_id):
    doc = user_repo.find_by_id(ensure_object_id(user_id))
    if not doc:
        raise ApiError('User not found', status=404)
    return {'user': user_dict(doc)}


def update_user(user_id, data):
    oid = ensure_object_id(user_id)
    if not user_repo.find_by_id(oid):
        raise ApiError('User not found', status=404)
    updates = {}
    for field, attr in [('name', 'name'), ('role', 'role'), ('department', 'department'),
                        ('designation', 'designation'), ('employeeId', 'employee_id'),
                        ('shortCode', 'short_code'), ('status', 'status')]:
        if field in data:
            updates[attr] = data[field]
    if 'role' in updates:
        validate_choice(updates['role'], C.ROLES, name='role')
    if 'status' in updates:
        validate_choice(updates['status'], C.USER_STATUS, name='status')
    if data.get('password'):
        updates['password'] = make_password(data['password'])
    updates['updated_at'] = now()
    return {'user': user_dict(user_repo.update(oid, updates))}


def delete_user(user_id, current_user_id):
    if str(user_id) == str(current_user_id):
        raise ApiError('You cannot delete your own account', status=400)
    if user_repo.delete(ensure_object_id(user_id)) == 0:
        raise ApiError('User not found', status=404)
    audit.record('user.delete', actor=ensure_object_id(current_user_id),
                 target_type='user', target_id=ensure_object_id(user_id))
    return {'message': 'User deleted'}

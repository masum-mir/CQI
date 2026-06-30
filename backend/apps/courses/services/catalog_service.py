"""Business logic for the course catalog (stable course definitions)."""
from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import require_fields, ensure_object_id, validate_choice
from core import constants as C
from apps.courses.repositories import catalog_repo
from apps.courses.api.serializers import catalog_dict


def list_catalog(query_params):
    query = {}
    if query_params.get('department'):
        query['department'] = query_params['department']
    items = [catalog_dict(c) for c in catalog_repo.find_all(query)]
    return {'count': len(items), 'catalog': items}


def _department_from_code(code):
    import re
    m = re.match(r'[A-Za-z]+', code)
    return m.group().upper() if m else 'CSE'


def create_catalog(data):
    require_fields(data, ['courseCode', 'title'])
    code = data['courseCode'].upper().strip()
    if catalog_repo.find_by_code(code):
        raise ApiError('Course code already in catalog', status=409)
    course_type = data.get('courseType', 'theory')
    validate_choice(course_type, C.COURSE_TYPES, name='courseType')
    doc = catalog_repo.insert({
        'course_code': code,
        'title': data['title'],
        'department': data.get('department') or _department_from_code(code),
        'course_type': course_type,
        'credit_hours': data.get('creditHours'),
        'default_required_items': data.get('defaultRequiredItems', []),
        'active': data.get('active', True),
        'created_at': now(),
        'updated_at': now(),
    })
    return {'catalog': catalog_dict(doc)}


def update_catalog(catalog_id, data):
    oid = ensure_object_id(catalog_id)
    if not catalog_repo.find_by_id(oid):
        raise ApiError('Catalog entry not found', status=404)
    updates = {}
    for field, attr in [('title', 'title'), ('department', 'department'),
                        ('courseType', 'course_type'), ('creditHours', 'credit_hours'),
                        ('defaultRequiredItems', 'default_required_items'), ('active', 'active')]:
        if field in data:
            updates[attr] = data[field]
    if 'course_type' in updates:
        validate_choice(updates['course_type'], C.COURSE_TYPES, name='courseType')
    updates['updated_at'] = now()
    return {'catalog': catalog_dict(catalog_repo.update(oid, updates))}


def delete_catalog(catalog_id):
    if catalog_repo.delete(ensure_object_id(catalog_id)) == 0:
        raise ApiError('Catalog entry not found', status=404)
    return {'message': 'Catalog entry deleted'}

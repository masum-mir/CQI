# """Business logic for course offerings."""
# import logging
# from pymongo.errors import DuplicateKeyError
#
# from core.utils import now
# from core.utils.response import ApiError
# from core.utils.validators import require_fields, ensure_object_id, to_object_id
# from core import constants as C
# from apps.courses.repositories import course_repo, catalog_repo
# from apps.courses.api.serializers import course_dict
# from apps.users.repositories import user_repo
#
# log = logging.getLogger('cqi')
#
#
# def department_from_code(code):
#     import re
#     m = re.match(r'[A-Za-z]+', code or '')
#     return m.group().upper() if m else 'CSE'
#
#
# def resolve_faculty(faculty_code):
#     if not faculty_code or faculty_code.upper() == 'TBA':
#         return None
#     user = user_repo.find_by_short_code(faculty_code.upper())
#     return user['_id'] if user else None
#
#
# def resolve_required_items(course):
#     """Effective required item numbers for a course (offering -> catalog -> all)."""
#     if course.get('required_items'):
#         return course['required_items']
#     cat = catalog_repo.find_by_code(course.get('course_code'))
#     if cat and cat.get('default_required_items'):
#         return cat['default_required_items']
#     return []  # empty => "all active items" (resolved at completeness time)
#
#
# def _with_faculty(course):
#     fac = user_repo.find_by_id(course['faculty']) if course.get('faculty') else None
#     return course_dict(course, faculty_doc=fac)
#
#
# def list_courses(user, query_params):
#     query = {}
#     if user.role == C.ROLE_FACULTY:
#         query['faculty'] = ensure_object_id(user.id)
#     elif query_params.get('faculty'):
#         query['faculty'] = ensure_object_id(query_params['faculty'])
#     if query_params.get('semester'):
#         query['semester'] = query_params['semester']
#     if query_params.get('courseCode'):
#         query['course_code'] = query_params['courseCode'].upper()
#     courses = [_with_faculty(c) for c in course_repo.find_all(query)]
#     return {'count': len(courses), 'courses': courses}
#
#
# def create_course(data):
#     require_fields(data, ['courseCode', 'section', 'semester'])
#     code = data['courseCode'].upper().strip()
#
#     faculty_oid = None
#     if data.get('faculty'):
#         faculty_oid = ensure_object_id(data['faculty'], name='faculty')
#         fac = user_repo.find_by_id(faculty_oid)
#         if not fac or fac.get('role') != C.ROLE_FACULTY:
#             raise ApiError('Assigned faculty is invalid', status=400)
#     elif data.get('facultyCode'):
#         faculty_oid = resolve_faculty(data['facultyCode'])
#
#     cat = catalog_repo.find_by_code(code)
#     title = data.get('title') or (cat['title'] if cat else None)
#     course_type = data.get('type') or (cat['course_type'] if cat else 'theory')
#
#     doc = {
#         'course_code': code,
#         'section': str(data['section']),
#         'title': title,
#         'semester': data['semester'],
#         'course_type': course_type,
#         'department': data.get('department') or department_from_code(code),
#         'faculty': faculty_oid,
#         'faculty_code': (data.get('facultyCode') or None),
#         'capacity': data.get('capacity'),
#         'schedule': data.get('schedule', []),
#         'required_items': data.get('requiredItems', []),
#         'source': None,
#         'created_at': now(),
#         'updated_at': now(),
#     }
#     try:
#         doc = course_repo.insert(doc)
#     except DuplicateKeyError:
#         raise ApiError('Course (code + section + semester) already exists', status=409)
#     log.info('Course created: %s-%s %s', doc['course_code'], doc['section'], doc['semester'])
#     return {'course': course_dict(doc)}
#
#
# def get_course(user, course_id):
#     course = course_repo.find_by_id(ensure_object_id(course_id))
#     if not course:
#         raise ApiError('Course not found', status=404)
#     if user.role == C.ROLE_FACULTY and str(course.get('faculty')) != str(user.id):
#         raise ApiError('Forbidden: not your course', status=403)
#     return {'course': _with_faculty(course)}
#
#
# def update_course(course_id, data):
#     oid = ensure_object_id(course_id)
#     if not course_repo.find_by_id(oid):
#         raise ApiError('Course not found', status=404)
#     updates = {}
#     for field, attr in [('title', 'title'), ('semester', 'semester'), ('type', 'course_type'),
#                         ('department', 'department'), ('requiredItems', 'required_items'),
#                         ('section', 'section'), ('capacity', 'capacity'), ('schedule', 'schedule')]:
#         if field in data:
#             updates[attr] = data[field]
#     if 'faculty' in data:
#         updates['faculty'] = to_object_id(data['faculty']) if data['faculty'] else None
#     if 'facultyCode' in data:
#         updates['faculty_code'] = data['facultyCode']
#         if 'faculty' not in data:
#             updates['faculty'] = resolve_faculty(data['facultyCode'])
#     updates['updated_at'] = now()
#     return {'course': course_dict(course_repo.update(oid, updates))}
#
#
# def delete_course(course_id):
#     if course_repo.delete(ensure_object_id(course_id)) == 0:
#         raise ApiError('Course not found', status=404)
#     return {'message': 'Course deleted'}


"""Business logic for course offerings.

Replace: apps/courses/services/course_service.py

Fix: faculty course listing now matches by resolved ObjectId OR by the user's
short_code, so courses imported before the short code was set still appear.
Also adds relink_courses_for_user() to permanently claim them.
"""
import logging
from pymongo.errors import DuplicateKeyError

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import require_fields, ensure_object_id, to_object_id
from core import constants as C
from apps.courses.repositories import course_repo, catalog_repo
from apps.courses.api.serializers import course_dict
from apps.users.repositories import user_repo

log = logging.getLogger('cqi')


def department_from_code(code):
    import re
    m = re.match(r'[A-Za-z]+', code or '')
    return m.group().upper() if m else 'CSE'


def resolve_faculty(faculty_code):
    """Map a faculty short-code (e.g. 'MAR') to a user id; None if unresolved/TBA."""
    if not faculty_code or faculty_code.upper() == 'TBA':
        return None
    user = user_repo.find_by_short_code(faculty_code.upper())
    return user['_id'] if user else None


def relink_courses_for_user(user_id, short_code):
    """Claim imported courses whose faculty_code matches this user's short_code
    but whose faculty reference is still unresolved (null). Call this whenever a
    user's short_code is set or changed. Returns the number of courses linked."""
    if not short_code:
        return 0
    linked = course_repo.claim_by_faculty_code(short_code.upper(),
                                               ensure_object_id(user_id))
    if linked:
        log.info('Relinked %d course(s) to user %s via short_code %s',
                 linked, user_id, short_code)
    return linked


def resolve_required_items(course):
    """Effective required item numbers for a course (offering -> catalog -> all)."""
    if course.get('required_items'):
        return course['required_items']
    cat = catalog_repo.find_by_code(course.get('course_code'))
    if cat and cat.get('default_required_items'):
        return cat['default_required_items']
    return []  # empty => "all active items" (resolved at completeness time)


def _with_faculty(course):
    fac = user_repo.find_by_id(course['faculty']) if course.get('faculty') else None
    return course_dict(course, faculty_doc=fac)


def list_courses(user, query_params):
    query = {}
    if user.role == C.ROLE_FACULTY:
        # Match by resolved ObjectId OR by the user's short_code, so courses
        # imported before the short code existed are still visible.
        me = user_repo.find_by_id(ensure_object_id(user.id))
        ors = [{'faculty': ensure_object_id(user.id)}]
        if me and me.get('short_code'):
            ors.append({'faculty_code': me['short_code']})
        query['$or'] = ors
    elif query_params.get('faculty'):
        query['faculty'] = ensure_object_id(query_params['faculty'])
    if query_params.get('semester'):
        query['semester'] = query_params['semester']
    if query_params.get('courseCode'):
        query['course_code'] = query_params['courseCode'].upper()
    courses = [_with_faculty(c) for c in course_repo.find_all(query)]
    return {'count': len(courses), 'courses': courses}


def create_course(data):
    require_fields(data, ['courseCode', 'section', 'semester'])
    code = data['courseCode'].upper().strip()

    faculty_oid = None
    if data.get('faculty'):
        faculty_oid = ensure_object_id(data['faculty'], name='faculty')
        fac = user_repo.find_by_id(faculty_oid)
        if not fac or fac.get('role') != C.ROLE_FACULTY:
            raise ApiError('Assigned faculty is invalid', status=400)
    elif data.get('facultyCode'):
        faculty_oid = resolve_faculty(data['facultyCode'])

    cat = catalog_repo.find_by_code(code)
    title = data.get('title') or (cat['title'] if cat else None)
    course_type = data.get('type') or (cat['course_type'] if cat else 'theory')

    doc = {
        'course_code': code,
        'section': str(data['section']),
        'title': title,
        'semester': data['semester'],
        'course_type': course_type,
        'department': data.get('department') or department_from_code(code),
        'faculty': faculty_oid,
        'faculty_code': (data.get('facultyCode') or None),
        'capacity': data.get('capacity'),
        'schedule': data.get('schedule', []),
        'required_items': data.get('requiredItems', []),
        'source': None,
        'created_at': now(),
        'updated_at': now(),
    }
    try:
        doc = course_repo.insert(doc)
    except DuplicateKeyError:
        raise ApiError('Course (code + section + semester) already exists', status=409)
    log.info('Course created: %s-%s %s', doc['course_code'], doc['section'], doc['semester'])
    return {'course': course_dict(doc)}


def get_course(user, course_id):
    course = course_repo.find_by_id(ensure_object_id(course_id))
    if not course:
        raise ApiError('Course not found', status=404)
    if user.role == C.ROLE_FACULTY and str(course.get('faculty')) != str(user.id):
        # Allow access when the course is theirs via short_code but not yet linked.
        me = user_repo.find_by_id(ensure_object_id(user.id))
        code_match = (me and me.get('short_code')
                      and course.get('faculty_code') == me['short_code'])
        if not code_match:
            raise ApiError('Forbidden: not your course', status=403)
    return {'course': _with_faculty(course)}


def update_course(course_id, data):
    oid = ensure_object_id(course_id)
    if not course_repo.find_by_id(oid):
        raise ApiError('Course not found', status=404)
    updates = {}
    for field, attr in [('title', 'title'), ('semester', 'semester'), ('type', 'course_type'),
                        ('department', 'department'), ('requiredItems', 'required_items'),
                        ('section', 'section'), ('capacity', 'capacity'), ('schedule', 'schedule')]:
        if field in data:
            updates[attr] = data[field]
    if 'faculty' in data:
        updates['faculty'] = to_object_id(data['faculty']) if data['faculty'] else None
    if 'facultyCode' in data:
        updates['faculty_code'] = data['facultyCode']
        if 'faculty' not in data:
            updates['faculty'] = resolve_faculty(data['facultyCode'])
    updates['updated_at'] = now()
    return {'course': course_dict(course_repo.update(oid, updates))}


def delete_course(course_id):
    if course_repo.delete(ensure_object_id(course_id)) == 0:
        raise ApiError('Course not found', status=404)
    return {'message': 'Course deleted'}
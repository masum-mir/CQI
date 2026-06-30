"""Business logic for course files: the submission + review workflow,
upload handling, and on-the-fly completeness computation."""
import logging

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id, validate_choice, parse_int
from core import constants as C
from core import audit

from apps.courses.repositories import course_repo
from apps.fileList.repositories import item_repo, course_file_repo, document_repo
from apps.fileList.api.serializers import course_file_dict, document_dict
from apps.fileList.services import storage

log = logging.getLogger('cqi')


# --- access control --------------------------------------------------------
def can_access(user, course_file):
    if user.role in (C.ROLE_ADMIN, C.ROLE_CHAIR):
        return True
    return str(course_file.get('faculty')) == str(user.id)


def _require_access(user, course_file):
    if not can_access(user, course_file):
        raise ApiError('Forbidden', status=403)


# --- completeness ----------------------------------------------------------
def build_completeness(course, course_file_id):
    all_items = item_repo.find_active()
    required_nums = course.get('required_items') or []
    required = [i for i in all_items if i['item_no'] in required_nums] if required_nums else all_items

    docs = document_repo.find_by_course_file(course_file_id)

    report = []
    for item in required:
        item_docs = [d for d in docs
                     if d.get('item_no') == item['item_no'] and not d.get('is_additional')]
        sub_items = item.get('sub_items') or []
        if item.get('has_sub_items') and sub_items:
            covered = {d.get('sub_item') for d in item_docs}
            fulfilled = all(s['key'] in covered for s in sub_items)
        else:
            fulfilled = len(item_docs) > 0
        report.append({
            'itemNo': item['item_no'], 'name': item['name'],
            'hasSubItems': item.get('has_sub_items', False), 'subItems': sub_items,
            'uploadedCount': len(item_docs), 'fulfilled': fulfilled,
        })
    completed = sum(1 for r in report if r['fulfilled'])
    total = len(report)
    return {
        'totalRequired': total, 'completed': completed, 'pending': total - completed,
        'percent': round(completed / total * 100) if total else 0, 'items': report,
    }


# --- workflow --------------------------------------------------------------
def create_course_file(user, data):
    course = course_repo.find_by_id(ensure_object_id(data.get('courseId'), name='courseId'))
    if not course:
        raise ApiError('Course not found', status=404)
    if user.role == C.ROLE_FACULTY and str(course.get('faculty')) != str(user.id):
        raise ApiError('Forbidden: not your course', status=403)

    existing = course_file_repo.find_by_course(course['_id'])
    if existing:
        return {'courseFile': course_file_dict(existing), 'message': 'Already exists'}

    doc = course_file_repo.insert({
        'course': course['_id'],
        'faculty': course.get('faculty') or ensure_object_id(user.id),
        'semester': course['semester'], 'status': C.CF_DRAFT,
        'review': {'reviewed_by': None, 'comment': None, 'reviewed_at': None},
        'submitted_at': None,
        'created_at': now(), 'updated_at': now(),
    })
    log.info('Course file created for course %s', course['_id'])
    return {'courseFile': course_file_dict(doc)}


def list_course_files(user, query_params):
    query = {}
    if user.role == C.ROLE_FACULTY:
        query['faculty'] = ensure_object_id(user.id)
    if query_params.get('status'):
        query['status'] = query_params['status']
    if query_params.get('semester'):
        query['semester'] = query_params['semester']

    out = []
    for cf in course_file_repo.find_all(query):
        course = course_repo.find_by_id(cf['course']) if cf.get('course') else None
        out.append(course_file_dict(cf, course_doc=course))
    return {'count': len(out), 'courseFiles': out}


def get_course_file(user, cf_id):
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError('Course file not found', status=404)
    _require_access(user, cf)
    course = course_repo.find_by_id(cf['course'])
    documents = [document_dict(d) for d in document_repo.find_by_course_file(cf['_id'])]
    return {
        'courseFile': course_file_dict(cf, course_doc=course),
        'documents': documents,
        'completeness': build_completeness(course, cf['_id']),
    }


def upload_document(user, cf_id, uploaded_file, data):
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError('Course file not found', status=404)
    _require_access(user, cf)

    if not uploaded_file:
        raise ApiError('No file uploaded (field name must be "file")', status=400)
    storage.validate_extension(uploaded_file.name)
    storage.validate_size(uploaded_file)

    is_additional = str(data.get('isAdditional', '')).lower() in ('1', 'true', 'yes')
    item_no, sub_item = None, None

    if is_additional:
        # Free-form "any work the faculty believes should be submitted".
        if data.get('itemNo'):
            item_no = parse_int(data.get('itemNo'), name='itemNo')
    else:
        item_no = parse_int(data.get('itemNo'), name='itemNo')
        item = item_repo.find_by_item_no(item_no)
        if not item or not item.get('active', True):
            raise ApiError(f'Unknown itemNo {item_no}', status=400)
        sub_item = data.get('subItem') or None
        if item.get('has_sub_items'):
            keys = [s['key'] for s in item.get('sub_items', [])]
            if sub_item not in keys:
                raise ApiError(f"Item {item_no} requires subItem one of: {', '.join(keys)}",
                               status=400)
        else:
            sub_item = None
        # One file per slot: replace any existing upload for this (item, sub_item).
        existing = document_repo.find_slot(cf['_id'], item_no, sub_item)
        if existing:
            storage.remove_file((existing.get('storage') or {}).get('file_path'))
            document_repo.delete(existing['_id'])

    meta = storage.save_upload(uploaded_file)
    doc = document_repo.insert({
        'course_file': cf['_id'], 'course': cf['course'],
        'item_no': item_no, 'sub_item': sub_item, 'is_additional': is_additional,
        'storage': {
            'original_name': meta['original_name'], 'file_name': meta['file_name'],
            'file_path': meta['file_path'], 'mime_type': meta['mime_type'], 'size': meta['size'],
        },
        'processing': {'status': C.PROC_PENDING},
        'review': {'status': C.DOC_PENDING, 'remark': None},
        'uploaded_by': ensure_object_id(user.id),
        'created_at': now(), 'updated_at': now(),
    })

    # A new upload after a decision reopens the file.
    if cf.get('status') in (C.CF_REJECTED, C.CF_APPROVED):
        course_file_repo.update(cf['_id'], {'status': C.CF_DRAFT, 'updated_at': now()})

    return {'document': document_dict(doc)}


def submit(user, cf_id):
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError('Course file not found', status=404)
    _require_access(user, cf)

    course = course_repo.find_by_id(cf['course'])
    completeness = build_completeness(course, cf['_id'])
    if completeness['pending'] > 0:
        raise ApiError(
            f"Cannot submit: {completeness['pending']} required item(s) still missing",
            status=400, errors={'completeness': completeness})

    updated = course_file_repo.update(cf['_id'], {
        'status': C.CF_SUBMITTED, 'submitted_at': now(), 'updated_at': now(),
    })
    audit.record('coursefile.submit', actor=ensure_object_id(user.id),
                 target_type='course_file', target_id=cf['_id'])
    log.info('Course file %s submitted', cf['_id'])
    return {'courseFile': course_file_dict(updated), 'message': 'Submitted for review'}


def review(user, cf_id, data):
    decision = data.get('decision')
    validate_choice(decision, (C.CF_APPROVED, C.CF_REJECTED, C.CF_UNDER_REVIEW), name='decision')
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError('Course file not found', status=404)
    updated = course_file_repo.update(cf['_id'], {
        'status': decision,
        'review': {'reviewed_by': ensure_object_id(user.id),
                   'comment': data.get('comment'), 'reviewed_at': now()},
        'updated_at': now(),
    })
    audit.record('coursefile.review', actor=ensure_object_id(user.id),
                 target_type='course_file', target_id=cf['_id'], meta={'decision': decision})
    log.info('Course file %s reviewed: %s', cf['_id'], decision)
    return {'courseFile': course_file_dict(updated), 'message': f'Course file {decision}'}

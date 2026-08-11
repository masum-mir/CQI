import hashlib
import logging

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id
from core import constants as C
from core import audit
from apps.courses.repositories import course_repo, import_batch_repo, catalog_repo
from apps.courses.api.serializers import import_batch_dict
from apps.courses.services import course_service, excel_parser, pdf_parser

log = logging.getLogger('cqi')


def _detect_kind(filename, data):
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''
    if ext in ('xls', 'xlsx', 'htm', 'html'):
        return 'excel'
    if ext == 'pdf':
        return 'pdf'
    head = data[:2048].lstrip().lower()
    if head.startswith(b'%pdf'):
        return 'pdf'
    if head.startswith(b'<') or b'<table' in head or b'<html' in head:
        return 'excel'
    return 'excel'  # default: treat unknown as spreadsheet/HTML


def _parse(filename, data, departments):
    """Return (kind_label, parsed) where parsed = {semester, offerings, errors}."""
    kind = _detect_kind(filename, data)
    if kind == 'pdf':
        try:
            text = pdf_parser.extract_text(data)
        except RuntimeError as exc:
            raise ApiError(str(exc), status=501)
        return 'offered_courses_pdf', pdf_parser.parse_offered_courses(text, departments=departments)
    try:
        return 'offered_courses_excel', excel_parser.parse_offered_courses(
            data, filename=filename, departments=departments)
    except RuntimeError as exc:
        raise ApiError(str(exc), status=501)


def preview(uploaded_file, departments, admin_id):
    if not uploaded_file:
        raise ApiError('No file uploaded (field name must be "file")', status=400)
    filename = getattr(uploaded_file, 'name', 'upload.xls')
    data = uploaded_file.read()
    file_hash = hashlib.sha256(data).hexdigest()

    duplicate = import_batch_repo.find_committed_by_hash(file_hash)

    kind, parsed = _parse(filename, data, departments)
    offerings = parsed['offerings']
    semester = parsed['semester'] or 'Unknown'

    if not offerings:
        raise ApiError('No course offerings found in the file. '
                       'Check that it is the offered-courses export.', status=400)

    unresolved = 0
    for off in offerings:
        fid = course_service.resolve_faculty(off.get('faculty_code'))
        off['_faculty_resolved'] = bool(fid)
        if not fid:
            unresolved += 1

    batch = import_batch_repo.insert({
        'kind': kind,
        'semester': semester,
        'file_name': filename,
        'file_hash': file_hash,
        'department_filter': [d.upper() for d in (departments or [])],
        'status': C.IMPORT_PREVIEW,
        'stats': {
            'offerings': len(offerings),
            'faculty_unresolved': unresolved,
            'created': 0, 'updated': 0,
        },
        'errors': parsed['errors'],
        'parsed': offerings,                 # stored so commit needn't re-parse
        'uploaded_by': ensure_object_id(admin_id),
        'created_at': now(),
        'committed_at': None,
    })
    audit.record('course.import_preview', actor=ensure_object_id(admin_id),
                 target_type='import_batch', target_id=batch['_id'],
                 meta={'semester': semester, 'offerings': len(offerings), 'kind': kind})

    note = 'This exact file was already committed earlier.' if duplicate else None

    return {
        'batch': import_batch_dict(batch),
        'sample': offerings[:10],            # first few for the admin to eyeball
        'note': note,
    }


def _course_type_for(title, code, cat):
    if cat and cat.get('course_type'):
        return cat['course_type']
    blob = f"{title or ''} {code or ''}".lower()
    return 'lab' if 'lab' in blob else 'theory'


def commit(batch_id, admin_id):
    batch = import_batch_repo.find_by_id(ensure_object_id(batch_id))
    if not batch:
        raise ApiError('Import batch not found', status=404)
    if batch.get('status') != C.IMPORT_PREVIEW:
        raise ApiError('Batch is not in preview state', status=400)

    semester = batch['semester']
    created = updated = 0
    for off in batch.get('parsed', []):
        code = off['course_code']
        section = off['section']
        faculty_id = course_service.resolve_faculty(off.get('faculty_code'))
        cat = catalog_repo.find_by_code(code)
        title = off.get('title') or (cat.get('title') if cat else None)  # Excel title wins
        set_fields = {
            'title': title,
            'course_type': _course_type_for(title, code, cat),
            'department': course_service.department_from_code(code),
            'faculty': faculty_id,
            'faculty_code': (str(off.get('faculty_code')).strip().upper()
                             if off.get('faculty_code') else None),
            'capacity': off.get('capacity'),
            'schedule': off.get('schedule', []),
            'source': {'import_batch': batch['_id'],
                       'file_name': batch['file_name'], 'imported_at': now()},
            'updated_at': now(),
        }
        on_insert = {'course_code': code, 'section': section, 'semester': semester,
                     'required_items': [], 'created_at': now()}
        was_created = course_repo.upsert_offering(code, section, semester, set_fields, on_insert)
        created += int(was_created)
        updated += int(not was_created)

    stats = dict(batch.get('stats', {}))
    stats.update({'created': created, 'updated': updated})
    import_batch_repo.update(batch['_id'], {
        'status': C.IMPORT_COMMITTED, 'stats': stats,
        'committed_at': now(), 'parsed': []})  # drop the staged payload
    audit.record('course.import_commit', actor=ensure_object_id(admin_id),
                 target_type='import_batch', target_id=batch['_id'], meta=stats)
    log.info('Import %s committed: +%d created, %d updated', batch['_id'], created, updated)
    return {'batch': import_batch_dict(import_batch_repo.find_by_id(batch['_id'])),
            'stats': stats}


def list_batches():
    return {'batches': [import_batch_dict(b) for b in import_batch_repo.find_all()]}

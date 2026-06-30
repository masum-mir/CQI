"""Presenters for courses and the course catalog (camelCase JSON)."""


def catalog_dict(doc):
    if not doc:
        return None
    return {
        'id': str(doc['_id']),
        'courseCode': doc.get('course_code'),
        'title': doc.get('title'),
        'department': doc.get('department'),
        'courseType': doc.get('course_type'),
        'creditHours': doc.get('credit_hours'),
        'defaultRequiredItems': doc.get('default_required_items', []),
        'active': doc.get('active', True),
        'createdAt': doc.get('created_at'),
        'updatedAt': doc.get('updated_at'),
    }


def course_dict(doc, faculty_doc=None):
    if not doc:
        return None
    cap = doc.get('capacity') or None
    src = doc.get('source') or None
    d = {
        'id': str(doc['_id']),
        'courseCode': doc.get('course_code'),
        'section': doc.get('section'),
        'label': f"{doc.get('course_code')}-{doc.get('section')}",
        'title': doc.get('title'),
        'semester': doc.get('semester'),
        'type': doc.get('course_type'),
        'department': doc.get('department'),
        'faculty': str(doc['faculty']) if doc.get('faculty') else None,
        'facultyCode': doc.get('faculty_code'),
        'capacity': {'enrolled': cap.get('enrolled'), 'total': cap.get('total')} if cap else None,
        'schedule': doc.get('schedule', []),
        'requiredItems': doc.get('required_items', []),
        'source': {
            'importBatch': str(src['import_batch']) if src.get('import_batch') else None,
            'fileName': src.get('file_name'),
            'importedAt': src.get('imported_at'),
        } if src else None,
        'createdAt': doc.get('created_at'),
        'updatedAt': doc.get('updated_at'),
    }
    if faculty_doc:
        d['facultyInfo'] = {
            'id': str(faculty_doc['_id']),
            'name': faculty_doc.get('name'),
            'email': faculty_doc.get('email'),
            'shortCode': faculty_doc.get('short_code'),
        }
    return d


def import_batch_dict(doc):
    if not doc:
        return None
    s = doc.get('stats', {}) or {}
    return {
        'id': str(doc['_id']),
        'kind': doc.get('kind'),
        'semester': doc.get('semester'),
        'fileName': doc.get('file_name'),
        'fileHash': doc.get('file_hash'),
        'departmentFilter': doc.get('department_filter', []),
        'status': doc.get('status'),
        'stats': {
            'offerings': s.get('offerings', 0),
            'facultyUnresolved': s.get('faculty_unresolved', 0),
            'created': s.get('created', 0),
            'updated': s.get('updated', 0),
        },
        'errors': doc.get('errors', []),
        'createdAt': doc.get('created_at'),
        'committedAt': doc.get('committed_at'),
    }

"""Presenters: raw Mongo docs -> JSON-friendly dicts (camelCase)."""


def item_dict(doc):
    if not doc:
        return None
    return {
        'id': str(doc['_id']),
        'itemNo': doc.get('item_no'),
        'name': doc.get('name'),
        'description': doc.get('description'),
        'category': doc.get('category'),
        'hasSubItems': doc.get('has_sub_items', False),
        'subItems': doc.get('sub_items', []),
        'allowedExtensions': doc.get('allowed_extensions', []),
        'maxSizeMb': doc.get('max_size_mb'),
        'isMandatory': doc.get('is_mandatory', True),
        'active': doc.get('active', True),
    }


def course_file_dict(doc, course_doc=None):
    if not doc:
        return None
    review = doc.get('review') or {}
    d = {
        'id': str(doc['_id']),
        'course': str(doc['course']) if doc.get('course') else None,
        'faculty': str(doc['faculty']) if doc.get('faculty') else None,
        'semester': doc.get('semester'),
        'status': doc.get('status'),
        'review': {
            'reviewedBy': str(review['reviewed_by']) if review.get('reviewed_by') else None,
            'comment': review.get('comment'),
            'reviewedAt': review.get('reviewed_at'),
        },
        'submittedAt': doc.get('submitted_at'),
        'createdAt': doc.get('created_at'),
        'updatedAt': doc.get('updated_at'),
    }
    if course_doc:
        d['courseInfo'] = {
            'courseCode': course_doc.get('course_code'),
            'section': course_doc.get('section'),
            'title': course_doc.get('title'),
        }
    return d


def document_dict(doc):
    if not doc:
        return None
    storage = doc.get('storage') or {}
    processing = doc.get('processing') or {}
    review = doc.get('review') or {}
    return {
        'id': str(doc['_id']),
        'courseFile': str(doc['course_file']) if doc.get('course_file') else None,
        'course': str(doc['course']) if doc.get('course') else None,
        'itemNo': doc.get('item_no'),
        'subItem': doc.get('sub_item'),
        'isAdditional': doc.get('is_additional', False),
        'storage': {
            'originalName': storage.get('original_name'),
            'fileName': storage.get('file_name'),
            'mimeType': storage.get('mime_type'),
            'size': storage.get('size'),
        },
        'processing': {'status': processing.get('status')},
        'review': {'status': review.get('status'), 'remark': review.get('remark')},
        'uploadedBy': str(doc['uploaded_by']) if doc.get('uploaded_by') else None,
        'createdAt': doc.get('created_at'),
        'updatedAt': doc.get('updated_at'),
    }

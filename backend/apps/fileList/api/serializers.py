def course_file_dict(doc, course_doc=None, documents=None):
    if not doc:
        return None

    review = doc.get('review') or {}

    data = {
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
        data['courseInfo'] = {
            'courseCode': course_doc.get('course_code'),
            'section': course_doc.get('section'),
            'title': course_doc.get('title'),
        }

    data['documents'] = [
        document_dict(document)
        for document in (documents or [])
    ]

    return data

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
"""Business logic for individual uploaded documents."""
import os

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id, validate_choice
from core import constants as C

from apps.fileList.repositories import document_repo, course_file_repo
from apps.fileList.api.serializers import document_dict
from apps.fileList.services.course_file_service import can_access
from apps.fileList.services import storage


def _load_with_access(user, doc_id):
    doc = document_repo.find_by_id(ensure_object_id(doc_id))
    if not doc:
        raise ApiError('Document not found', status=404)
    cf = course_file_repo.find_by_id(doc['course_file'])
    if not cf or not can_access(user, cf):
        raise ApiError('Forbidden', status=403)
    return doc


def resolve_download(user, doc_id):
    """Return (abs_path, original_name) for streaming, or raise ApiError."""
    doc = _load_with_access(user, doc_id)
    st = doc.get('storage') or {}
    if not st.get('file_path') or not os.path.exists(st['file_path']):
        raise ApiError('File no longer on disk', status=410)
    return st['file_path'], st.get('original_name')


def delete_document(user, doc_id):
    doc = _load_with_access(user, doc_id)
    storage.remove_file((doc.get('storage') or {}).get('file_path'))
    document_repo.delete(doc['_id'])
    return {'message': 'Document deleted'}


def review_document(doc_id, data):
    status = data.get('status')
    validate_choice(status, C.DOC_REVIEW_STATUS, name='status')
    oid = ensure_object_id(doc_id)
    if not document_repo.find_by_id(oid):
        raise ApiError('Document not found', status=404)
    updated = document_repo.update(oid, {
        'review.status': status, 'review.remark': data.get('remark'), 'updated_at': now()})
    return {'document': document_dict(updated)}
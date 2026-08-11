import os

from core import constants as C
from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id, validate_choice

from apps.courses.repositories import course_repo
from apps.fileList.api.serializers import document_dict
from apps.fileList.repositories import course_file_repo, document_repo
from apps.fileList.services import storage
from apps.fileList.services.course_file_service import TOTAL_ITEMS, can_access


def _load_with_access(user, doc_id):
    doc = document_repo.find_by_id(ensure_object_id(doc_id))
    if not doc:
        raise ApiError("Document not found", status=404)

    course_file = course_file_repo.find_by_id(doc["course_file"])
    if not course_file or not can_access(user, course_file):
        raise ApiError("Forbidden", status=403)

    return doc


def _parse_item_no(raw_item_no, *, required):
    if raw_item_no in (None, ""):
        if required:
            raise ApiError("itemNo is required", status=400)
        return None

    try:
        item_no = int(raw_item_no)
    except (TypeError, ValueError):
        raise ApiError("itemNo must be an integer", status=400)

    if not 1 <= item_no <= TOTAL_ITEMS:
        raise ApiError(
            f"itemNo must be between 1 and {TOTAL_ITEMS}",
            status=400,
        )

    return item_no


def _storage_context(user, course_file):
    course = (
        course_repo.find_by_id(course_file["course"])
        if course_file.get("course")
        else None
    ) or {}

    user_doc = getattr(user, "doc", {}) or {}
    user_name = getattr(user, "name", None) or user_doc.get("name") or "user"
    user_key = user_doc.get("short_code") or str(user.id)[-8:]

    return {
        "user_name": user_name,
        "user_key": user_key,
        "semester": course_file.get("semester") or course.get("semester") or "unknown_semester",
        "course_code": course.get("course_code") or str(course_file.get("course"))[-8:],
        "section": course.get("section"),
    }


def upload_document(user, cf_id, uploaded_file, data):
    cf_id = ensure_object_id(cf_id)

    course_file = course_file_repo.find_by_id(cf_id)
    if not course_file:
        raise ApiError("Course file not found", status=404)

    if not can_access(user, course_file):
        raise ApiError("Forbidden", status=403)

    if not uploaded_file:
        raise ApiError(
            'No file uploaded (field name must be "file")',
            status=400,
        )

    storage.validate_extension(uploaded_file.name)
    storage.validate_size(uploaded_file)

    is_additional = str(data.get("isAdditional", "")).lower() in {
        "1",
        "true",
        "yes",
    }
    item_no = _parse_item_no(
        data.get("itemNo"),
        required=not is_additional,
    )

    existing = None
    if not is_additional:
        existing = document_repo.find_slot(cf_id, item_no)

    meta = storage.save_upload(
        uploaded_file,
        item_no=item_no,
        **_storage_context(user, course_file),
    )

    try:
        doc = document_repo.insert(
            {
                "course_file": cf_id,
                "course": course_file["course"],
                "item_no": item_no,
                "is_additional": is_additional,
                "storage": {
                    "original_name": meta["original_name"],
                    "file_name": meta["file_name"],
                    "file_path": meta["file_path"],
                    "mime_type": meta["mime_type"],
                    "size": meta["size"],
                },
                "processing": {"status": C.PROC_PENDING},
                "review": {
                    "status": C.DOC_PENDING,
                    "remark": None,
                },
                "uploaded_by": ensure_object_id(user.id),
                "created_at": now(),
                "updated_at": now(),
            }
        )
    except Exception:
        storage.remove_file(meta["file_path"])
        raise

    # Replace the previous slot only after the new file and DB record succeed.
    if existing:
        old_path = (existing.get("storage") or {}).get("file_path")
        document_repo.delete(existing["_id"])
        storage.remove_file(old_path)

    if course_file.get("status") in (C.CF_REJECTED, C.CF_APPROVED):
        course_file_repo.update(
            cf_id,
            {
                "status": C.CF_DRAFT,
                "updated_at": now(),
            },
        )

    return {"document": document_dict(doc)}


def resolve_download(user, doc_id):
    doc = _load_with_access(user, doc_id)
    stored = doc.get("storage") or {}
    path = stored.get("file_path")

    if not path or not os.path.exists(path):
        raise ApiError("File no longer on disk", status=410)

    # New uploads download with the consistent stored filename.
    # Old records remain backward-compatible via original_name.
    download_name = stored.get("file_name") or stored.get("original_name")
    return path, download_name


def delete_document(user, doc_id):
    doc = _load_with_access(user, doc_id)

    storage.remove_file((doc.get("storage") or {}).get("file_path"))
    document_repo.delete(doc["_id"])

    return {"message": "Document deleted"}


def review_document(user, doc_id, data):
    doc_id = ensure_object_id(doc_id)

    status = data.get("status")
    validate_choice(status, C.DOC_REVIEW_STATUS, name="status")

    doc = document_repo.find_by_id(doc_id)
    if not doc:
        raise ApiError("Document not found", status=404)

    updated = document_repo.update(
        doc_id,
        {
            "review.status": status,
            "review.remark": data.get("remark"),
            "updated_at": now(),
        },
    )

    return {"document": document_dict(updated)}
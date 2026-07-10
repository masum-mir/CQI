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


# ------------------------------------------------------------
# INTERNAL: load document with permission check
# ------------------------------------------------------------
def _load_with_access(user, doc_id):
    doc = document_repo.find_by_id(ensure_object_id(doc_id))
    if not doc:
        raise ApiError("Document not found", status=404)

    cf = course_file_repo.find_by_id(doc["course_file"])
    if not cf or not can_access(user, cf):
        raise ApiError("Forbidden", status=403)

    return doc


# ------------------------------------------------------------
# UPLOAD DOCUMENT
# ------------------------------------------------------------
def upload_document(user, cf_id, uploaded_file, data):
    cf_id = ensure_object_id(cf_id)

    cf = course_file_repo.find_by_id(cf_id)
    if not cf:
        raise ApiError("Course file not found", status=404)

    if not can_access(user, cf):
        raise ApiError("Forbidden", status=403)

    if not uploaded_file:
        raise ApiError('No file uploaded (field name must be "file")', status=400)

    # validate file via storage layer
    storage.validate_extension(uploaded_file.name)
    storage.validate_size(uploaded_file)

    item_no = data.get("itemNo")
    is_additional = str(data.get("isAdditional", "")).lower() in (
        "1",
        "true",
        "yes",
    )

    if not is_additional:
        if not item_no:
            raise ApiError("itemNo is required", status=400)
        item_no = int(item_no)

        # replace existing slot (1 file per item rule)
        existing = document_repo.find_slot(cf_id, item_no)
        if existing:
            storage.remove_file((existing.get("storage") or {}).get("file_path"))
            document_repo.delete(existing["_id"])
    else:
        item_no = int(item_no) if item_no else None

    # save file to disk
    meta = storage.save_upload(uploaded_file)

    doc = document_repo.insert(
        {
            "course_file": cf_id,
            "course": cf["course"],
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
            "review": {"status": C.DOC_PENDING, "remark": None},
            "uploaded_by": ensure_object_id(user.id),
            "created_at": now(),
            "updated_at": now(),
        }
    )

    # reopen course file if previously finalized
    if cf.get("status") in (C.CF_REJECTED, C.CF_APPROVED):
        course_file_repo.update(
            cf_id,
            {"status": C.CF_DRAFT, "updated_at": now()},
        )

    return {"document": document_dict(doc)}


# ------------------------------------------------------------
# DOWNLOAD
# ------------------------------------------------------------
def resolve_download(user, doc_id):
    doc = _load_with_access(user, doc_id)

    st = doc.get("storage") or {}
    path = st.get("file_path")

    if not path or not os.path.exists(path):
        raise ApiError("File no longer on disk", status=410)

    return path, st.get("original_name")


# ------------------------------------------------------------
# DELETE
# ------------------------------------------------------------
def delete_document(user, doc_id):
    doc = _load_with_access(user, doc_id)

    storage.remove_file((doc.get("storage") or {}).get("file_path"))
    document_repo.delete(doc["_id"])

    return {"message": "Document deleted"}


# ------------------------------------------------------------
# REVIEW (chair/admin)
# ------------------------------------------------------------
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
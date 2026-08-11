import os
import re
import unicodedata
import uuid

from django.conf import settings

from core.utils.response import ApiError


def validate_extension(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise ApiError("File type not allowed", status=400)


def validate_size(uploaded_file):
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if uploaded_file.size > max_bytes:
        raise ApiError(
            f"File exceeds {settings.MAX_FILE_SIZE_MB} MB",
            status=400,
        )


def _safe_component(value, fallback="unknown", max_length=60):
    """Return a filesystem-safe ASCII path/name component."""
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^A-Za-z0-9._-]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("._-")
    return (text or fallback)[:max_length]


def save_upload(
    uploaded_file,
    *,
    user_name,
    semester,
    user_key=None,
    course_code=None,
    section=None,
    item_no=None,
):
    """
    Save a document in a predictable hierarchy:

        MEDIA_ROOT/UPLOAD_SUBDIR/
            <user-name>[_<user-key>]/
                <semester>/
                    <course>[_<section>]/
                        <user>_<semester>_<course>_item_XX_<original>_<id>.<ext>

    The short unique suffix prevents collisions while keeping filenames readable.
    """
    original_name = os.path.basename(uploaded_file.name)
    original_stem, ext = os.path.splitext(original_name)

    user_part = _safe_component(user_name, "user", 50)
    user_key_part = _safe_component(user_key, "", 24) if user_key else ""
    semester_part = _safe_component(semester, "unknown_semester", 40)
    course_part = _safe_component(course_code, "course", 30)
    section_part = _safe_component(section, "", 20) if section else ""
    original_part = _safe_component(original_stem, "document", 50)

    user_folder = (
        f"{user_key_part}"
        if user_key_part
        else user_part
    )
    course_folder = (
        f"{course_part}_{section_part}"
        if section_part
        else course_part
    )

    upload_dir = os.path.join(
        settings.MEDIA_ROOT,
        settings.UPLOAD_SUBDIR,
        user_folder,
        semester_part,
        course_folder,
    )
    os.makedirs(upload_dir, exist_ok=True)

    filename_parts = [user_part, semester_part, course_folder]
    if item_no is not None:
        filename_parts.append(f"item_{int(item_no):02d}")
    filename_parts.append(original_part)
    filename_parts.append(uuid.uuid4().hex[:8])

    stored_name = "_".join(filename_parts) + ext.lower()
    abs_path = os.path.join(upload_dir, stored_name)

    with open(abs_path, "wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    return {
        "original_name": original_name,
        "file_name": stored_name,
        "file_path": abs_path,
        "mime_type": getattr(uploaded_file, "content_type", None),
        "size": uploaded_file.size,
    }


def remove_file(path):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
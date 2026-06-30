"""Disk storage for uploaded documents. Swap this module to use GridFS or S3."""
import os
import re
import uuid
from django.conf import settings

from core.utils.response import ApiError


def validate_extension(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        raise ApiError('File type not allowed', status=400)


def validate_size(uploaded_file):
    if uploaded_file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ApiError(f'File exceeds {settings.MAX_FILE_SIZE_MB} MB', status=400)


def save_upload(uploaded_file):
    """Store the file under MEDIA_ROOT/uploads and return metadata."""
    upload_dir = os.path.join(settings.MEDIA_ROOT, settings.UPLOAD_SUBDIR)
    os.makedirs(upload_dir, exist_ok=True)

    name, ext = os.path.splitext(uploaded_file.name)
    safe = re.sub(r'[^A-Za-z0-9_-]', '_', name)[:40]
    stored = f'{safe}-{uuid.uuid4().hex}{ext.lower()}'
    abs_path = os.path.join(upload_dir, stored)

    with open(abs_path, 'wb') as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    return {
        'original_name': uploaded_file.name,
        'file_name': stored,
        'file_path': abs_path,
        'mime_type': getattr(uploaded_file, 'content_type', None),
        'size': uploaded_file.size,
    }


def remove_file(path):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass

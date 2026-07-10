"""Document shapes for fileList domain (no ORM)."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from bson import ObjectId

from core import constants as C


COURSE_FILES_COLLECTION = C.COL_COURSE_FILES
DOCUMENTS_COLLECTION = C.COL_DOCUMENTS

# Course File
@dataclass
class CourseFileSchema:
    course: ObjectId                               # ref > courses._id (unique per course)
    faculty: ObjectId                              # ref > users._id
    semester: str

    status: str = C.CF_DRAFT

    reviewed_by: Optional[ObjectId] = None
    review_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Document
@dataclass
class DocumentSchema:
    course_file: ObjectId
    course: ObjectId
    item_no: int

    original_name: str
    file_name: str
    file_path: str
    mime_type: Optional[str]
    size: Optional[int]

    uploaded_by: ObjectId
    status: str = C.DOC_PENDING

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
"""Document shapes for the fileList domain (reference only — no ORM):
required_items, course_files, documents.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict
from bson import ObjectId

from core import constants as C

REQUIRED_ITEMS_COLLECTION = C.COL_REQUIRED_ITEMS
COURSE_FILES_COLLECTION = C.COL_COURSE_FILES
DOCUMENTS_COLLECTION = C.COL_DOCUMENTS


@dataclass
class RequiredItemSchema:
    item_no: int                                   # 1..17 (unique)
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    has_sub_items: bool = False
    sub_items: List[Dict] = field(default_factory=list)   # [{key, label}]
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class CourseFileSchema:
    course: ObjectId                               # ref -> courses._id (unique)
    faculty: ObjectId                              # ref -> users._id
    semester: str
    status: str = C.CF_DRAFT                        # one of C.CF_STATUS
    reviewed_by: Optional[ObjectId] = None         # ref -> users._id
    review_comment: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class DocumentSchema:
    course_file: ObjectId                          # ref -> course_files._id
    course: ObjectId                               # ref -> courses._id
    item_no: int
    sub_item: Optional[str]                        # e.g. 'question' | 'samples' | None
    original_name: str
    file_name: str
    file_path: str
    mime_type: Optional[str]
    size: Optional[int]
    uploaded_by: ObjectId                          # ref -> users._id
    status: str = C.DOC_PENDING                     # one of C.DOC_STATUS
    remark: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

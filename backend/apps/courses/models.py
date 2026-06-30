"""Document shape for the `courses` collection (reference only — no ORM)."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from core import constants as C

COLLECTION = C.COL_COURSES


@dataclass
class CourseSchema:
    course_code: str                       # e.g. CSE251
    section: str                           # e.g. 5
    title: str
    semester: str                          # e.g. "Fall 2024"
    course_type: str = 'theory'            # one of C.COURSE_TYPES
    department: str = 'CSE'
    faculty: Optional[ObjectId] = None     # ref -> users._id
    required_items: List[int] = field(default_factory=list)  # item numbers; [] => all
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

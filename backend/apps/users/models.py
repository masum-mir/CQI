"""Document shape for the `users` collection (reference only — no ORM).

This project stores data in MongoDB via PyMongo; there is no Django/ODM model.
This dataclass documents the schema and is not used for persistence.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from core import constants as C

COLLECTION = C.COL_USERS


@dataclass
class UserSchema:
    name: str
    email: str
    password: str                      # hashed (PBKDF2)
    role: str = C.ROLE_FACULTY         # one of C.ROLES
    department: str = 'CSE'
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

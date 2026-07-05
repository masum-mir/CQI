# """Business logic for course files: submission, review,
# upload handling, and completeness computation (required_item based)."""
#
# import logging
#
# from core.utils import now
# from core.utils.response import ApiError
# from core.utils.validators import ensure_object_id, validate_choice
# from core import constants as C
# from core import audit
#
# from apps.courses.repositories import course_repo
# from apps.fileList.repositories import course_file_repo, document_repo
# from apps.fileList.api.serializers import course_file_dict, document_dict
# from apps.fileList.services import storage
#
# log = logging.getLogger("cqi")
#
#
# # ---------------------------------------------------------------------
# # Access Control
# # ---------------------------------------------------------------------
# def can_access(user, course_file):
#     if user.role in (C.ROLE_ADMIN, C.ROLE_CHAIR):
#         return True
#     return str(course_file.get("faculty")) == str(user.id)
#
#
# def _require_access(user, course_file):
#     if not can_access(user, course_file):
#         raise ApiError("Forbidden", status=403)
#
#
# # ---------------------------------------------------------------------
# # Completeness (IMPORTANT UPDATED PART)
# # ---------------------------------------------------------------------
# def build_completeness(course_file_id):
#     docs = document_repo.find_all({"course_file": course_file_id})
#
#     uploaded = {d["item_no"] for d in docs}
#
#     result = []
#     completed = 0
#
#     for i in range(1, 22):
#         if i in uploaded:
#             completed += 1
#             status = "uploaded"
#         else:
#             status = "pending"
#
#         result.append({
#             "itemNo": i,
#             "status": status
#         })
#
#     return {
#         "total": 21,
#         "completed": completed,
#         "pending": 21 - completed,
#         "percent": int((completed / 21) * 100),
#         "documents": result
#     }
#
# # ---------------------------------------------------------------------
# # Create Course File
# # ---------------------------------------------------------------------
# def create_course_file(user, data):
#     course = course_repo.find_by_id(
#         ensure_object_id(data.get("courseId"), name="courseId")
#     )
#
#     if not course:
#         raise ApiError("Course not found", status=404)
#
#     if user.role == C.ROLE_FACULTY and str(course.get("faculty")) != str(user.id):
#         raise ApiError("Forbidden: not your course", status=403)
#
#     existing = course_file_repo.find_by_course(course["_id"])
#     if existing:
#         return {"courseFile": course_file_dict(existing), "message": "Already exists"}
#
#     doc = course_file_repo.insert({
#         "course": course["_id"],
#         "faculty": course.get("faculty") or ensure_object_id(user.id),
#         "semester": course["semester"],
#         "status": C.CF_DRAFT,
#         "review": {
#             "reviewed_by": None,
#             "comment": None,
#             "reviewed_at": None
#         },
#         "submitted_at": None,
#         "created_at": now(),
#         "updated_at": now(),
#     })
#
#     log.info("Course file created for course %s", course["_id"])
#     return {"courseFile": course_file_dict(doc)}
#
#
# # ---------------------------------------------------------------------
# # List Course Files
# # ---------------------------------------------------------------------
# def list_course_files(user, query_params):
#     query = {}
#
#     if user.role == C.ROLE_FACULTY:
#         query["faculty"] = ensure_object_id(user.id)
#
#     if query_params.get("status"):
#         query["status"] = query_params["status"]
#
#     if query_params.get("semester"):
#         query["semester"] = query_params["semester"]
#
#     out = []
#
#     for cf in course_file_repo.find_all(query):
#         course = course_repo.find_by_id(cf["course"])
#         out.append(course_file_dict(cf, course_doc=course))
#
#     return {"count": len(out), "courseFiles": out}
#
#
# # ---------------------------------------------------------------------
# # Get Single Course File
# # ---------------------------------------------------------------------
# from bson import ObjectId
# from core import constants as C
#
#
# def get_course_file(course_file_id):
#     db = C.get_db()
#
#     try:
#         cf = db[C.COL_COURSE_FILES].find_one({
#             "_id": ObjectId(course_file_id)
#         })
#     except Exception:
#         raise Exception("Invalid course_file_id format")
#
#     if not cf:
#         raise Exception("Course file not found")
#
#     # convert ObjectId → string (VERY IMPORTANT for frontend)
#     cf["_id"] = str(cf["_id"])
#     cf["course"] = str(cf["course"])
#     cf["faculty"] = str(cf["faculty"])
#
#     # attach documents
#     docs = list(db[C.COL_DOCUMENTS].find({
#         "course_file": ObjectId(course_file_id)
#     }))
#
#     for d in docs:
#         d["_id"] = str(d["_id"])
#         d["course_file"] = str(d["course_file"])
#
#     cf["documents"] = docs
#
#     return cf
#
#
# # ---------------------------------------------------------------------
# # Submit Course File
# # ---------------------------------------------------------------------
# def submit(user, cf_id):
#     cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
#
#     if not cf:
#         raise ApiError("Course file not found", status=404)
#
#     _require_access(user, cf)
#
#     course = course_repo.find_by_id(cf["course"])
#     completeness = build_completeness(course, cf["_id"])
#
#     if completeness["pending"] > 0:
#         raise ApiError(
#             f"Cannot submit: {completeness['pending']} required item(s) still missing",
#             status=400,
#             errors={"completeness": completeness},
#         )
#
#     updated = course_file_repo.update(cf["_id"], {
#         "status": C.CF_SUBMITTED,
#         "submitted_at": now(),
#         "updated_at": now(),
#     })
#
#     audit.record(
#         "coursefile.submit",
#         actor=ensure_object_id(user.id),
#         target_type="course_file",
#         target_id=cf["_id"],
#     )
#
#     log.info("Course file %s submitted", cf["_id"])
#
#     return {
#         "courseFile": course_file_dict(updated),
#         "message": "Submitted for review",
#     }
#
#
# # ---------------------------------------------------------------------
# # Review Course File
# # ---------------------------------------------------------------------
# def review(user, cf_id, data):
#     decision = data.get("decision")
#
#     validate_choice(
#         decision,
#         (C.CF_APPROVED, C.CF_REJECTED, C.CF_UNDER_REVIEW),
#         name="decision",
#     )
#
#     cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
#
#     if not cf:
#         raise ApiError("Course file not found", status=404)
#
#     updated = course_file_repo.update(cf["_id"], {
#         "status": decision,
#         "review": {
#             "reviewed_by": ensure_object_id(user.id),
#             "comment": data.get("comment"),
#             "reviewed_at": now(),
#         },
#         "updated_at": now(),
#     })
#
#     audit.record(
#         "coursefile.review",
#         actor=ensure_object_id(user.id),
#         target_type="course_file",
#         target_id=cf["_id"],
#         meta={"decision": decision},
#     )
#
#     log.info("Course file %s reviewed: %s", cf["_id"], decision)
#
#     return {
#         "courseFile": course_file_dict(updated),
#         "message": f"Course file {decision}",
#     }

"""Business logic for course files: submission, review, upload handling,
and completeness computation (flat 21-item model)."""

import logging

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id, validate_choice
from core import constants as C
from core import audit

from apps.courses.repositories import course_repo
from apps.fileList.repositories import course_file_repo, document_repo
from apps.fileList.api.serializers import course_file_dict, document_dict

log = logging.getLogger("cqi")


# ---------------------------------------------------------------------
# Required-item catalogue (flat: 21 items, matches the upload page slots)
# ---------------------------------------------------------------------
ITEM_NAMES = {
    1: "Final grades (Tabulation Sheet)",
    2: "OBE Excel Sheet",
    3: "CO Attainment Report",
    4: "PO Attainment Report",
    5: "Grade Summary with CQI Improvement Plan",
    6: "Instructor Feedback",
    7: "Course Outline",
    8: "Class Test — Assessment Question",
    9: "Class Test — Representative Sample Answer Scripts",
    10: "Midterm — Assessment Question",
    11: "Midterm — Representative Sample Answer Scripts",
    12: "Final Exam — Assessment Question",
    13: "Final Exam — Representative Sample Answer Scripts",
    14: "Project / Assignment List",
    15: "Representative Sample Project Reports",
    16: "List of Lab Experiments",
    17: "Class Attendance",
    18: "Lab Attendance",
    19: "Midterm Exam Attendance",
    20: "Final Exam Attendance",
    21: "Capstone Project Report",
}
TOTAL_ITEMS = len(ITEM_NAMES)


# ---------------------------------------------------------------------
# Access Control
# ---------------------------------------------------------------------
def can_access(user, course_file):
    if user.role in (C.ROLE_ADMIN, C.ROLE_CHAIR):
        return True
    return str(course_file.get("faculty")) == str(user.id)


def _require_access(user, course_file):
    if not can_access(user, course_file):
        raise ApiError("Forbidden", status=403)


# ---------------------------------------------------------------------
# Completeness (flat, with item names — shape the detail page expects)
# ---------------------------------------------------------------------
def build_completeness(course_file_id):
    docs = document_repo.find_by_course_file(course_file_id)
    uploaded = {d.get("item_no") for d in docs if not d.get("is_additional")}

    items = []
    completed = 0
    for i in range(1, TOTAL_ITEMS + 1):
        fulfilled = i in uploaded
        if fulfilled:
            completed += 1
        items.append({
            "itemNo": i,
            "name": ITEM_NAMES.get(i, f"Item {i}"),
            "fulfilled": fulfilled,
        })

    return {
        "totalRequired": TOTAL_ITEMS,
        "completed": completed,
        "pending": TOTAL_ITEMS - completed,
        "percent": int((completed / TOTAL_ITEMS) * 100) if TOTAL_ITEMS else 0,
        "items": items,
    }


# ---------------------------------------------------------------------
# Create Course File
# ---------------------------------------------------------------------
def create_course_file(user, data):
    course = course_repo.find_by_id(
        ensure_object_id(data.get("courseId"), name="courseId")
    )
    if not course:
        raise ApiError("Course not found", status=404)

    if user.role == C.ROLE_FACULTY and str(course.get("faculty")) != str(user.id):
        raise ApiError("Forbidden: not your course", status=403)

    existing = course_file_repo.find_by_course(course["_id"])
    if existing:
        return {"courseFile": course_file_dict(existing), "message": "Already exists"}

    doc = course_file_repo.insert({
        "course": course["_id"],
        "faculty": course.get("faculty") or ensure_object_id(user.id),
        "semester": course["semester"],
        "status": C.CF_DRAFT,
        "review": {"reviewed_by": None, "comment": None, "reviewed_at": None},
        "submitted_at": None,
        "created_at": now(),
        "updated_at": now(),
    })
    log.info("Course file created for course %s", course["_id"])
    return {"courseFile": course_file_dict(doc)}


# ---------------------------------------------------------------------
# List Course Files
# ---------------------------------------------------------------------
def list_course_files(user, query_params):
    query = {}
    if user.role == C.ROLE_FACULTY:
        query["faculty"] = ensure_object_id(user.id)
    if query_params.get("status"):
        query["status"] = query_params["status"]
    if query_params.get("semester"):
        query["semester"] = query_params["semester"]

    out = []
    for cf in course_file_repo.find_all(query):
        course = course_repo.find_by_id(cf["course"]) if cf.get("course") else None
        out.append(course_file_dict(cf, course_doc=course))
    return {"count": len(out), "courseFiles": out}


# ---------------------------------------------------------------------
# Get Single Course File  (camelCase — { courseFile, documents, completeness })
# ---------------------------------------------------------------------
def get_course_file(user, cf_id):
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError("Course file not found", status=404)

    _require_access(user, cf)

    course = course_repo.find_by_id(cf["course"]) if cf.get("course") else None
    docs = document_repo.find_by_course_file(cf["_id"])
    doc_dicts = [document_dict(d) for d in docs]

    return {
        # documents embedded inside courseFile AND provided top-level,
        # so both the upload page and the detail page can read them.
        "courseFile": course_file_dict(cf, course_doc=course, documents=docs),
        "documents": doc_dicts,
        "completeness": build_completeness(cf["_id"]),
    }


# ---------------------------------------------------------------------
# Submit Course File
# ---------------------------------------------------------------------
def submit(user, cf_id):
    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError("Course file not found", status=404)

    _require_access(user, cf)

    completeness = build_completeness(cf["_id"])
    if completeness["pending"] > 0:
        raise ApiError(
            f"Cannot submit: {completeness['pending']} required item(s) still missing",
            status=400,
            errors={"completeness": completeness},
        )

    updated = course_file_repo.update(cf["_id"], {
        "status": C.CF_SUBMITTED,
        "submitted_at": now(),
        "updated_at": now(),
    })
    audit.record("coursefile.submit", actor=ensure_object_id(user.id),
                 target_type="course_file", target_id=cf["_id"])
    log.info("Course file %s submitted", cf["_id"])
    return {"courseFile": course_file_dict(updated), "message": "Submitted for review"}


# ---------------------------------------------------------------------
# Review Course File
# ---------------------------------------------------------------------
def review(user, cf_id, data):
    decision = data.get("decision")
    validate_choice(decision, (C.CF_APPROVED, C.CF_REJECTED, C.CF_UNDER_REVIEW), name="decision")

    cf = course_file_repo.find_by_id(ensure_object_id(cf_id))
    if not cf:
        raise ApiError("Course file not found", status=404)

    updated = course_file_repo.update(cf["_id"], {
        "status": decision,
        "review": {
            "reviewed_by": ensure_object_id(user.id),
            "comment": data.get("comment"),
            "reviewed_at": now(),
        },
        "updated_at": now(),
    })
    audit.record("coursefile.review", actor=ensure_object_id(user.id),
                 target_type="course_file", target_id=cf["_id"], meta={"decision": decision})
    log.info("Course file %s reviewed: %s", cf["_id"], decision)
    return {"courseFile": course_file_dict(updated), "message": f"Course file {decision}"}
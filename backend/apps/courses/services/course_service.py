import logging
import re

from pymongo.errors import DuplicateKeyError

from core import constants as C
from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import ensure_object_id, require_fields, to_object_id
from apps.courses.api.serializers import course_dict
from apps.courses.repositories import catalog_repo, course_repo
from apps.users.repositories import user_repo

log = logging.getLogger("cqi")


def _normalize_code(value):
    value = str(value or "").strip().upper()
    return value or None


def _same_code(a, b):
    return _normalize_code(a) == _normalize_code(b) and _normalize_code(a) is not None


def department_from_code(code):
    match = re.match(r"[A-Za-z]+", str(code or ""))
    return match.group().upper() if match else "CSE"


def resolve_faculty(faculty_code):
    """Map a faculty short code to a faculty user id, or None if unresolved/TBA."""
    code = _normalize_code(faculty_code)
    if not code or code == "TBA":
        return None

    user = user_repo.find_by_short_code(code)
    return user["_id"] if user else None


def _with_faculty(course):
    faculty = user_repo.find_by_id(course["faculty"]) if course.get("faculty") else None
    return course_dict(course, faculty_doc=faculty)


def list_courses(user, query_params):
    query = {}

    if user.role == C.ROLE_FACULTY:
        user_oid = ensure_object_id(user.id)
        me = user_repo.find_by_id(user_oid)
        ors = [{"faculty": user_oid}]

        short_code = _normalize_code(me.get("short_code") if me else None)
        if short_code:
            ors.append({"faculty_code": short_code})

        query["$or"] = ors
    elif query_params.get("faculty"):
        query["faculty"] = ensure_object_id(query_params["faculty"])

    if query_params.get("semester"):
        query["semester"] = query_params["semester"]

    if query_params.get("courseCode"):
        query["course_code"] = str(query_params["courseCode"]).strip().upper()

    courses = [_with_faculty(course) for course in course_repo.find_all(query)]
    return {"count": len(courses), "courses": courses}


def create_course(data):
    require_fields(data, ["courseCode", "section", "semester"])

    code = str(data["courseCode"]).strip().upper()
    section = str(data["section"]).strip()
    faculty_code = _normalize_code(data.get("facultyCode"))

    faculty_oid = None
    if data.get("faculty"):
        faculty_oid = ensure_object_id(data["faculty"], name="faculty")
        faculty = user_repo.find_by_id(faculty_oid)
        if not faculty or faculty.get("role") != C.ROLE_FACULTY:
            raise ApiError("Assigned faculty is invalid", status=400)
    elif faculty_code:
        faculty_oid = resolve_faculty(faculty_code)

    catalog = catalog_repo.find_by_code(code)
    title = data.get("title") or (catalog.get("title") if catalog else None)
    course_type = data.get("type") or (catalog.get("course_type") if catalog else "theory")

    doc = {
        "course_code": code,
        "section": section,
        "title": title,
        "semester": data["semester"],
        "course_type": course_type,
        "department": str(data.get("department") or department_from_code(code)).strip().upper(),
        "faculty": faculty_oid,
        "faculty_code": faculty_code,
        "capacity": data.get("capacity"),
        "schedule": data.get("schedule", []),
        "required_items": data.get("requiredItems", []),
        "source": None,
        "created_at": now(),
        "updated_at": now(),
    }

    try:
        doc = course_repo.insert(doc)
    except DuplicateKeyError:
        raise ApiError("Course (code + section + semester) already exists", status=409)

    log.info("Course created: %s-%s %s", doc["course_code"], doc["section"], doc["semester"])
    return {"course": course_dict(doc)}


def get_course(user, course_id):
    course = course_repo.find_by_id(ensure_object_id(course_id))
    if not course:
        raise ApiError("Course not found", status=404)

    if user.role == C.ROLE_FACULTY and str(course.get("faculty")) != str(user.id):
        me = user_repo.find_by_id(ensure_object_id(user.id))
        if not _same_code(course.get("faculty_code"), me.get("short_code") if me else None):
            raise ApiError("Forbidden: not your course", status=403)

    return {"course": _with_faculty(course)}


def update_course(course_id, data):
    oid = ensure_object_id(course_id)
    if not course_repo.find_by_id(oid):
        raise ApiError("Course not found", status=404)

    updates = {}
    field_map = (
        ("title", "title"),
        ("semester", "semester"),
        ("type", "course_type"),
        ("requiredItems", "required_items"),
        ("capacity", "capacity"),
        ("schedule", "schedule"),
    )

    for field, attr in field_map:
        if field in data:
            updates[attr] = data[field]

    if "section" in data:
        updates["section"] = str(data["section"]).strip()

    if "department" in data:
        updates["department"] = str(data["department"] or "").strip().upper()

    if "faculty" in data:
        updates["faculty"] = to_object_id(data["faculty"]) if data["faculty"] else None

    if "facultyCode" in data:
        faculty_code = _normalize_code(data["facultyCode"])
        updates["faculty_code"] = faculty_code
        if "faculty" not in data:
            updates["faculty"] = resolve_faculty(faculty_code)

    updates["updated_at"] = now()
    return {"course": course_dict(course_repo.update(oid, updates))}


def delete_course(course_id):
    if course_repo.delete(ensure_object_id(course_id)) == 0:
        raise ApiError("Course not found", status=404)
    return {"message": "Course deleted"}
# """Admin user management (create chairpersons/faculty, list, update, delete)."""
# import logging
# from django.contrib.auth.hashers import make_password
# from pymongo.errors import DuplicateKeyError
#
# from core.utils import now
# from core.utils.response import ApiError
# from core.utils.validators import require_fields, ensure_object_id, validate_choice
# from core import constants as C
# from core import audit
# from apps.users.repositories import user_repo
# from apps.users.api.serializers import user_dict
#
# log = logging.getLogger('cqi')
#
#
# def list_users(role=None, status=None):
#     query = {}
#     if role:
#         query['role'] = role
#     if status:
#         query['status'] = status
#     users = [user_dict(u) for u in user_repo.find_all(query)]
#     return {'count': len(users), 'users': users}
#
#
# def create_user(data, admin_id):
#     """Admin creates a user of any role (e.g. a chairperson)."""
#     require_fields(data, ['name', 'email', 'password'])
#     print('Data:: ', data)
#     role = data.get('role', C.ROLE_FACULTY)
#     validate_choice(role, C.ROLES, name='role')
#     email = data['email'].lower().strip()
#     if user_repo.find_by_email(email):
#         raise ApiError('Email already registered', status=409)
#     google_id = data.get('google_id')
#     doc_data = {
#         'name': data['name'],
#         'email': email,
#         'password': make_password(data['password']),
#         'auth_provider': C.AUTH_LOCAL,
#
#         'profile_image': None,
#         'role': role,
#         'short_code': (data.get('shortCode') or None),
#         'department': data.get('department', 'CSE'),
#         'designation': data.get('designation'),
#         'employee_id': data.get('employeeId'),
#         'status': C.STATUS_ACTIVE,
#         'is_email_verified': True,
#         'last_login_at': None,
#         'created_by': ensure_object_id(admin_id),
#         'created_at': now(),
#         'updated_at': now(),
#     }
#     if google_id:
#         doc_data['google_id'] = google_id
#     try:
#         doc = user_repo.insert(doc_data)
#     except DuplicateKeyError:
#         raise ApiError('Email or short_code already in use', status=409)
#     audit.record('user.create', actor=ensure_object_id(admin_id),
#                  target_type='user', target_id=doc['_id'], meta={'role': role})
#     log.info('Admin %s created %s (%s)', admin_id, email, role)
#     return {'user': user_dict(doc)}
#
#
# def get_user(user_id):
#     doc = user_repo.find_by_id(ensure_object_id(user_id))
#     if not doc:
#         raise ApiError('User not found', status=404)
#     return {'user': user_dict(doc)}
#
#
# def update_user(user_id, data):
#     oid = ensure_object_id(user_id)
#     if not user_repo.find_by_id(oid):
#         raise ApiError('User not found', status=404)
#     updates = {}
#     for field, attr in [('name', 'name'), ('role', 'role'), ('department', 'department'),
#                         ('designation', 'designation'), ('employeeId', 'employee_id'),
#                         ('shortCode', 'short_code'), ('status', 'status')]:
#         if field in data:
#             updates[attr] = data[field]
#     if 'role' in updates:
#         validate_choice(updates['role'], C.ROLES, name='role')
#     if 'status' in updates:
#         validate_choice(updates['status'], C.USER_STATUS, name='status')
#     if data.get('password'):
#         updates['password'] = make_password(data['password'])
#     updates['updated_at'] = now()
#     return {'user': user_dict(user_repo.update(oid, updates))}
#
#
# def delete_user(user_id, current_user_id):
#     if str(user_id) == str(current_user_id):
#         raise ApiError('You cannot delete your own account', status=400)
#     if user_repo.delete(ensure_object_id(user_id)) == 0:
#         raise ApiError('User not found', status=404)
#     audit.record('user.delete', actor=ensure_object_id(current_user_id),
#                  target_type='user', target_id=ensure_object_id(user_id))
#     return {'message': 'User deleted'}

import logging

from django.contrib.auth.hashers import make_password
from pymongo.errors import DuplicateKeyError

from core.utils import now
from core.utils.response import ApiError
from core.utils.validators import (
    require_fields,
    ensure_object_id,
    validate_choice,
)
from core import constants as C
from core import audit
from apps.users.repositories import user_repo
from apps.users.api.serializers import user_dict


log = logging.getLogger("cqi")


def list_users(role=None, status=None):
    query = {}

    if role:
        query["role"] = role

    if status:
        query["status"] = status

    users = [
        user_dict(u)
        for u in user_repo.find_all(query)
    ]

    return {
        "count": len(users),
        "users": users,
    }


def create_user(data, admin_id):
    """Admin creates a user of any supported role."""
    require_fields(
        data,
        ["name", "email", "password"],
    )

    role = data.get(
        "role",
        C.ROLE_FACULTY,
    )

    validate_choice(
        role,
        C.ROLES,
        name="role",
    )

    email = data["email"].lower().strip()

    if user_repo.find_by_email(email):
        raise ApiError(
            "Email already registered",
            status=409,
        )

    doc_data = {
        "name": data["name"],
        "email": email,
        "password": make_password(
            data["password"]
        ),
        "auth_provider": C.AUTH_LOCAL,
        "auth_providers": [
            C.AUTH_LOCAL
        ],
        "profile_image": None,
        "role": role,
        "department": (
            data.get("department")
            or "CSE"
        ),
        "designation": data.get(
            "designation"
        ),
        "employee_id": data.get(
            "employeeId"
        ),
        "status": C.STATUS_ACTIVE,
        "is_email_verified": True,
        "last_login_at": None,
        "created_by": ensure_object_id(
            admin_id
        ),
        "created_at": now(),
        "updated_at": now(),
    }

    short_code = data.get("shortCode")

    if short_code:
        doc_data["short_code"] = (
            short_code
        )

    google_id = data.get("google_id")

    if google_id:
        doc_data["google_id"] = str(
            google_id
        )

        if C.AUTH_GOOGLE not in doc_data["auth_providers"]:
            doc_data["auth_providers"].append(
                C.AUTH_GOOGLE
            )

    try:
        doc = user_repo.insert(
            doc_data
        )
    except DuplicateKeyError:
        raise ApiError(
            "Email, short code, or Google account already in use",
            status=409,
        )

    audit.record(
        "user.create",
        actor=ensure_object_id(admin_id),
        target_type="user",
        target_id=doc["_id"],
        meta={"role": role},
    )

    log.info(
        "Admin %s created %s (%s)",
        admin_id,
        email,
        role,
    )

    return {
        "user": user_dict(doc)
    }


def get_user(user_id):
    doc = user_repo.find_by_id(
        ensure_object_id(user_id)
    )

    if not doc:
        raise ApiError(
            "User not found",
            status=404,
        )

    return {
        "user": user_dict(doc)
    }


def update_user(user_id, data):
    oid = ensure_object_id(
        user_id
    )

    if not user_repo.find_by_id(oid):
        raise ApiError(
            "User not found",
            status=404,
        )

    updates = {}
    unset_fields = []

    for field, attr in [
        ("name", "name"),
        ("role", "role"),
        ("department", "department"),
        ("designation", "designation"),
        ("employeeId", "employee_id"),
        ("status", "status"),
    ]:
        if field in data:
            updates[attr] = data[field]

    if "shortCode" in data:
        if data.get("shortCode"):
            updates["short_code"] = data[
                "shortCode"
            ]
        else:
            unset_fields.append(
                "short_code"
            )

    if "role" in updates:
        validate_choice(
            updates["role"],
            C.ROLES,
            name="role",
        )

    if "status" in updates:
        validate_choice(
            updates["status"],
            C.USER_STATUS,
            name="status",
        )

    if data.get("password"):
        updates["password"] = make_password(
            data["password"]
        )

        doc = user_repo.find_by_id(
            oid
        )

        providers = list(
            doc.get("auth_providers")
            or []
        )

        if C.AUTH_LOCAL not in providers:
            providers.append(
                C.AUTH_LOCAL
            )

        updates["auth_providers"] = (
            providers
        )

    updates["updated_at"] = now()

    try:
        doc = user_repo.update(
            oid,
            updates,
            unset_fields=unset_fields,
        )
    except DuplicateKeyError:
        raise ApiError(
            "Email, short code, or Google account already in use",
            status=409,
        )

    return {
        "user": user_dict(doc)
    }


def delete_user(
    user_id,
    current_user_id,
):
    if str(user_id) == str(
        current_user_id
    ):
        raise ApiError(
            "You cannot delete your own account",
            status=400,
        )

    oid = ensure_object_id(
        user_id
    )

    if user_repo.delete(oid) == 0:
        raise ApiError(
            "User not found",
            status=404,
        )

    audit.record(
        "user.delete",
        actor=ensure_object_id(
            current_user_id
        ),
        target_type="user",
        target_id=oid,
    )

    return {
        "message": "User deleted"
    }

def import_users(rows, admin_id):
    """
    Fast bulk import used by the existing Preview -> Save Users flow.

    Performance strategy:
    - one Mongo query for all existing emails
    - one Mongo query for all existing short codes
    - one password hash for the shared default password 1234
    - one insert_many() call for all new users
    - one audit record for the whole import

    Existing users are never overwritten.
    """
    if not isinstance(rows, list):
        raise ApiError(
            "users must be a list",
            status=400,
        )

    if not rows:
        raise ApiError(
            "No users supplied for import",
            status=400,
        )

    if len(rows) > 5000:
        raise ApiError(
            "A maximum of 5000 users can be imported at once",
            status=400,
        )

    admin_oid = ensure_object_id(
        admin_id
    )

    errors = []
    invalid_count = 0

    # ------------------------------------------------------ #
    # 1. Normalize/validate rows in memory
    # ------------------------------------------------------ #
    normalized_rows = []

    for index, row in enumerate(
        rows,
        start=2,
    ):
        if not isinstance(row, dict):
            invalid_count += 1

            if len(errors) < 50:
                errors.append({
                    "row": index,
                    "error": "Invalid row format",
                })

            continue

        name = str(
            row.get("name") or ""
        ).strip()

        email = str(
            row.get("email") or ""
        ).strip().lower()

        short_code = str(
            row.get("shortCode") or ""
        ).strip()

        if not name or not email:
            invalid_count += 1

            if len(errors) < 50:
                errors.append({
                    "row": index,
                    "email": email or None,
                    "error": (
                        "Name and email are required"
                    ),
                })

            continue

        normalized_rows.append({
            "source_row": index,
            "name": name,
            "email": email,
            "short_code": short_code,
            "department": str(
                row.get("department") or ""
            ).strip() or "CSE",
            "designation": str(
                row.get("designation") or ""
            ).strip() or None,
            "mobile": str(
                row.get("mobile") or ""
            ).strip() or None,
        })

    if not normalized_rows:
        return {
            "total": len(rows),
            "created": 0,
            "skipped": 0,
            "failed": invalid_count,
            "defaultPassword": "1234",
            "errors": errors,
        }

    # ------------------------------------------------------ #
    # 2. Check existing database values using only 2 queries
    # ------------------------------------------------------ #
    all_emails = [
        row["email"]
        for row in normalized_rows
    ]

    all_short_codes = [
        row["short_code"]
        for row in normalized_rows
        if row["short_code"]
    ]

    existing_emails = (
        user_repo.find_existing_emails(
            all_emails
        )
    )

    existing_short_codes = (
        user_repo.find_existing_short_codes(
            all_short_codes
        )
    )

    # ------------------------------------------------------ #
    # 3. Remove DB duplicates + duplicates inside Excel
    # ------------------------------------------------------ #
    seen_emails = set()
    seen_short_codes = set()

    skipped_count = 0
    rows_to_insert = []

    for row in normalized_rows:
        email = row["email"]
        short_code = row["short_code"]

        duplicate_reason = None

        if email in existing_emails:
            duplicate_reason = (
                "Email already exists"
            )

        elif email in seen_emails:
            duplicate_reason = (
                "Duplicate email in Excel file"
            )

        elif (
            short_code
            and short_code
            in existing_short_codes
        ):
            duplicate_reason = (
                "Short code already exists"
            )

        elif (
            short_code
            and short_code
            in seen_short_codes
        ):
            duplicate_reason = (
                "Duplicate short code in Excel file"
            )

        if duplicate_reason:
            skipped_count += 1

            if len(errors) < 50:
                errors.append({
                    "row": row["source_row"],
                    "email": email,
                    "error": duplicate_reason,
                })

            continue

        seen_emails.add(
            email
        )

        if short_code:
            seen_short_codes.add(
                short_code
            )

        rows_to_insert.append(
            row
        )

    if not rows_to_insert:
        result = {
            "total": len(rows),
            "created": 0,
            "skipped": skipped_count,
            "failed": invalid_count,
            "defaultPassword": "1234",
            "errors": errors,
        }

        audit.record(
            "user.bulk_import",
            actor=admin_oid,
            target_type="users",
            target_id=None,
            meta={
                "total": result["total"],
                "created": 0,
                "skipped": result["skipped"],
                "failed": result["failed"],
            },
        )

        return result

    # ------------------------------------------------------ #
    # 4. Expensive password hash ONCE for the whole batch
    # ------------------------------------------------------ #
    default_password_hash = (
        make_password("1234")
    )

    batch_time = now()

    documents = []

    for row in rows_to_insert:
        doc = {
            "name": row["name"],
            "email": row["email"],
            "password": (
                default_password_hash
            ),
            "auth_provider": (
                C.AUTH_LOCAL
            ),
            "auth_providers": [
                C.AUTH_LOCAL
            ],
            "profile_image": None,
            "role": C.ROLE_FACULTY,
            "department": (
                row["department"]
            ),
            "designation": (
                row["designation"]
            ),
            "employee_id": None,
            "mobile": row["mobile"],
            "status": C.STATUS_ACTIVE,
            "is_email_verified": True,
            "last_login_at": None,
            "created_by": admin_oid,
            "created_at": batch_time,
            "updated_at": batch_time,
        }

        # Do not save short_code=None because the field is optional/unique.
        if row["short_code"]:
            doc["short_code"] = (
                row["short_code"]
            )

        documents.append(
            doc
        )

    # ------------------------------------------------------ #
    # 5. One MongoDB insert_many()
    # ------------------------------------------------------ #
    created_count = 0
    bulk_failed_count = 0
    bulk_skipped_count = 0

    try:
        inserted_ids = (
            user_repo.insert_many(
                documents,
                ordered=False,
            )
        )

        created_count = len(
            inserted_ids
        )

    except BulkWriteError as exc:
        details = (
            exc.details
            or {}
        )

        created_count = int(
            details.get(
                "nInserted",
                0,
            )
        )

        for write_error in (
            details.get(
                "writeErrors",
                []
            )
        ):
            operation_index = (
                write_error.get("index")
            )

            source = (
                rows_to_insert[
                    operation_index
                ]
                if isinstance(
                    operation_index,
                    int,
                )
                and 0
                <= operation_index
                < len(rows_to_insert)
                else None
            )

            if (
                write_error.get("code")
                == 11000
            ):
                bulk_skipped_count += 1
                error_text = (
                    "Duplicate value detected while saving"
                )
            else:
                bulk_failed_count += 1
                error_text = (
                    write_error.get("errmsg")
                    or "Bulk insert failed"
                )

            if len(errors) < 50:
                errors.append({
                    "row": (
                        source["source_row"]
                        if source
                        else None
                    ),
                    "email": (
                        source["email"]
                        if source
                        else None
                    ),
                    "error": error_text,
                })

    except Exception as exc:
        log.exception(
            "Bulk user import failed"
        )

        raise ApiError(
            f"Failed to import users: {exc}",
            status=500,
        )

    skipped_count += (
        bulk_skipped_count
    )

    failed_count = (
        invalid_count
        + bulk_failed_count
    )

    # ------------------------------------------------------ #
    # 6. One audit write instead of one audit per user
    # ------------------------------------------------------ #
    audit.record(
        "user.bulk_import",
        actor=admin_oid,
        target_type="users",
        target_id=None,
        meta={
            "total": len(rows),
            "created": created_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "default_role": C.ROLE_FACULTY,
        },
    )

    log.info(
        "Admin %s bulk imported users: "
        "total=%s created=%s skipped=%s failed=%s",
        admin_id,
        len(rows),
        created_count,
        skipped_count,
        failed_count,
    )

    return {
        "total": len(rows),
        "created": created_count,
        "skipped": skipped_count,
        "failed": failed_count,
        "defaultPassword": "1234",
        "errors": errors,
    }
from bson import ObjectId

from core.db.client import get_collection
from core import constants as C

def _col():
    return get_collection(C.COL_USERS)


def find_by_email(email):
    if not email:
        return None

    return _col().find_one({
        "email": str(email).strip().lower()
    })


def find_by_id(user_id):
    try:
        oid = (
            user_id
            if isinstance(user_id, ObjectId)
            else ObjectId(str(user_id))
        )

        return _col().find_one({
            "_id": oid
        })
    except Exception:
        return None


def find_by_google_id(google_id):
    if not google_id:
        return None

    return _col().find_one({
        "google_id": str(google_id)
    })


def find_by_short_code(short_code):
    if not short_code:
        return None

    return _col().find_one({
        "short_code": short_code
    })


def find_all(query=None, sort_field="name", sort_dir=1):
    return list(
        _col()
        .find(query or {})
        .sort(sort_field, sort_dir)
    )

# Fast bulk-import lookup helpers
def find_existing_emails(emails):
    """
    Return all emails that already exist in MongoDB.

    One $in query is used instead of one find_one() per Excel row.
    """
    normalized = list({
        str(email).strip().lower()
        for email in (emails or [])
        if email
    })

    if not normalized:
        return set()

    docs = _col().find(
        {
            "email": {
                "$in": normalized
            }
        },
        {
            "_id": 0,
            "email": 1,
        }
    )

    return {
        doc["email"]
        for doc in docs
        if doc.get("email")
    }


def find_existing_short_codes(short_codes):
    """
    Return all short codes that already exist in MongoDB.

    One $in query is used instead of one find_one() per Excel row.
    """
    values = list({
        str(code).strip()
        for code in (short_codes or [])
        if code
    })

    if not values:
        return set()

    docs = _col().find(
        {
            "short_code": {
                "$in": values
            }
        },
        {
            "_id": 0,
            "short_code": 1,
        }
    )

    return {
        doc["short_code"]
        for doc in docs
        if doc.get("short_code")
    }


def insert(doc):
    result = _col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def insert_many(docs, ordered=False):
    """
    Insert many MongoDB user documents in one network operation.

    `ordered=False` allows MongoDB to continue inserting other valid users
    even if a concurrent duplicate-key conflict occurs for one document.
    """
    if not docs:
        return []

    result = _col().insert_many(
        docs,
        ordered=ordered,
    )

    return result.inserted_ids


def update(oid, updates, unset_fields=None):
    """
    Partially update a user without replacing the MongoDB document.
    """
    oid = (
        oid
        if isinstance(oid, ObjectId)
        else ObjectId(str(oid))
    )

    operation = {}

    if updates:
        operation["$set"] = updates

    if unset_fields:
        operation["$unset"] = {
            field: ""
            for field in unset_fields
        }

    if operation:
        _col().update_one(
            {
                "_id": oid
            },
            operation
        )

    return _col().find_one({
        "_id": oid
    })


def delete(oid):
    oid = (
        oid
        if isinstance(oid, ObjectId)
        else ObjectId(str(oid))
    )

    return _col().delete_one({
        "_id": oid
    }).deleted_count


def link_google_account(
    user_id,
    google_id,
    providers,
    updated_at,
    profile_image=None,
):
    """
    Link a verified Google identity to an existing MongoDB user.

    Existing password, role, department, designation, employee ID,
    short code and _id remain unchanged.
    """
    oid = (
        user_id
        if isinstance(user_id, ObjectId)
        else ObjectId(str(user_id))
    )

    updates = {
        "google_id": str(google_id),
        "auth_providers": providers,
        "is_email_verified": True,
        "last_login_at": updated_at,
        "updated_at": updated_at,
    }

    if profile_image is not None:
        updates["profile_image"] = profile_image

    _col().update_one(
        {
            "_id": oid
        },
        {
            "$set": updates
        }
    )

    return _col().find_one({
        "_id": oid
    })
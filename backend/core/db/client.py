"""Single source of MongoDB connectivity (PyMongo).

The client is created lazily on first use, so importing this never requires a
running MongoDB. Tests inject an in-memory database via `set_db()`.
"""
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import OperationFailure
from django.conf import settings
from core import constants as C

log = logging.getLogger('cqi')

_db = None
_indexes_ready = False


def set_db(db):
    """Override the active database (used by tests with mongomock)."""
    global _db, _indexes_ready
    _db = db
    _indexes_ready = False
    ensure_indexes()


def get_db():
    global _db
    if _db is None:
        client = MongoClient(settings.MONGO_URI, tz_aware=True)
        _db = client[settings.MONGO_DB]
        log.info('Connected to MongoDB: %s', settings.MONGO_DB)
        ensure_indexes()
    return _db


def get_collection(name):
    return get_db()[name]


def _safe(coll, keys, **opts):
    """Create an index, tolerating engines (e.g. mongomock) that don't support
    a given option such as TTL or partial filters."""
    try:
        coll.create_index(keys, **opts)
    except (OperationFailure, NotImplementedError, TypeError) as exc:
        log.warning('Index skipped on %s (%s): %s', coll.name, keys, exc)


def _partial_unique_string_index(coll, field):
    index_name = f'{field}_1'
    desired_filter = {field: {'$type': 'string'}}

    try:
        info = coll.index_information().get(index_name)
        if info:
            current_filter = info.get('partialFilterExpression')
            if not info.get('unique') or current_filter != desired_filter:
                coll.drop_index(index_name)
                log.info('Replaced legacy MongoDB index: %s.%s', coll.name, index_name)
    except (OperationFailure, NotImplementedError, TypeError) as exc:
        log.warning('Could not inspect/replace index %s.%s: %s',
                    coll.name, index_name, exc)

    _safe(
        coll,
        [(field, ASCENDING)],
        name=index_name,
        unique=True,
        partialFilterExpression=desired_filter,
    )

def ensure_indexes():
    global _indexes_ready
    if _indexes_ready or _db is None:
        return
    db = _db

    _safe(db[C.COL_ROLES], [('name', ASCENDING)], unique=True)

    _safe(db[C.COL_USERS], [('email', ASCENDING)], unique=True)
    _partial_unique_string_index(db[C.COL_USERS], 'short_code')
    _partial_unique_string_index(db[C.COL_USERS], 'google_id')
    _safe(db[C.COL_USERS], [('role', ASCENDING)])
    _safe(db[C.COL_USERS], [('status', ASCENDING)])

    _safe(db[C.COL_REFRESH_TOKENS], [('jti', ASCENDING)], unique=True)
    _safe(db[C.COL_REFRESH_TOKENS], [('user', ASCENDING)])
    _safe(db[C.COL_REFRESH_TOKENS], [('token_hash', ASCENDING)])
    _safe(db[C.COL_REFRESH_TOKENS], [('expires_at', ASCENDING)], expireAfterSeconds=0)

    _safe(db[C.COL_ONE_TIME_TOKENS], [('token_hash', ASCENDING)])
    _safe(db[C.COL_ONE_TIME_TOKENS], [('user', ASCENDING), ('purpose', ASCENDING)])
    _safe(db[C.COL_ONE_TIME_TOKENS], [('expires_at', ASCENDING)], expireAfterSeconds=0)

    _safe(db[C.COL_AUDIT_LOGS], [('actor', ASCENDING), ('created_at', DESCENDING)])
    _safe(db[C.COL_AUDIT_LOGS], [('action', ASCENDING)])
    _safe(db[C.COL_AUDIT_LOGS], [('target_type', ASCENDING), ('target_id', ASCENDING)])

    _safe(db[C.COL_COURSES],[('course_code', ASCENDING), ('section', ASCENDING), ('semester', ASCENDING)], unique=True)
    _safe(db[C.COL_COURSES], [('faculty', ASCENDING)])
    _safe(db[C.COL_COURSES], [('semester', ASCENDING)])
    _safe(db[C.COL_COURSES], [('faculty_code', ASCENDING)])
    _safe(db[C.COL_COURSES], [('source.import_batch', ASCENDING)])

    _safe(db[C.COL_COURSE_FILES], [('course', ASCENDING)], unique=True)
    _safe(db[C.COL_COURSE_FILES], [('faculty', ASCENDING)])
    _safe(db[C.COL_COURSE_FILES], [('status', ASCENDING)])
    _safe(db[C.COL_COURSE_FILES], [('semester', ASCENDING)])

    _safe(db[C.COL_DOCUMENTS],[('course_file', ASCENDING), ('item_no', ASCENDING)],unique=False)

    _safe(db[C.COL_DOCUMENTS], [('course_file', ASCENDING)])
    _safe(db[C.COL_DOCUMENTS], [('course', ASCENDING)])
    _safe(db[C.COL_DOCUMENTS], [('uploaded_by', ASCENDING)])

    _safe(db[C.COL_DOCUMENTS], [('status', ASCENDING)])
    _safe(db[C.COL_DOCUMENTS], [('item_no', ASCENDING)])

    _safe(db[C.COL_IMPORT_BATCHES], [('file_hash', ASCENDING)])
    _safe(db[C.COL_IMPORT_BATCHES], [('semester', ASCENDING)])
    _safe(db[C.COL_IMPORT_BATCHES], [('status', ASCENDING)])
    _safe(db[C.COL_IMPORT_BATCHES], [('uploaded_by', ASCENDING), ('created_at', DESCENDING)])

    _indexes_ready = True
    log.info('MongoDB indexes ensured')

"""ALL MongoDB queries for the courses collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_COURSES)


def find_by_id(oid):
    return _col().find_one({'_id': oid})


def find_one(query):
    return _col().find_one(query)


def find_all(query=None):
    return list(_col().find(query or {}).sort([('course_code', 1), ('section', 1)]))


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def update(oid, updates):
    _col().update_one({'_id': oid}, {'$set': updates})
    return find_by_id(oid)


def delete(oid):
    return _col().delete_one({'_id': oid}).deleted_count


def upsert_offering(code, section, semester, set_fields, on_insert):
    """Idempotent import upsert keyed on (course_code, section, semester).
    Returns True if a new course was created, False if an existing one updated."""
    res = _col().update_one(
        {'course_code': code, 'section': section, 'semester': semester},
        {'$set': set_fields, '$setOnInsert': on_insert}, upsert=True)
    return res.upserted_id is not None

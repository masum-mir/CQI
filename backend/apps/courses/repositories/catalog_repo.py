"""ALL MongoDB queries for the course_catalog collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_COURSE_CATALOG)


def find_by_id(oid):
    return _col().find_one({'_id': oid})


def find_by_code(code):
    return _col().find_one({'course_code': code})


def find_all(query=None):
    return list(_col().find(query or {}).sort('course_code', 1))


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def update(oid, updates):
    _col().update_one({'_id': oid}, {'$set': updates})
    return find_by_id(oid)


def upsert_by_code(code, set_fields, on_insert):
    _col().update_one({'course_code': code},
                      {'$set': set_fields, '$setOnInsert': on_insert}, upsert=True)
    return find_by_code(code)


def delete(oid):
    return _col().delete_one({'_id': oid}).deleted_count

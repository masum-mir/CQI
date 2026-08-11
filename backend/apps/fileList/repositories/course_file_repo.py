from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_COURSE_FILES)


def find_by_id(oid):
    return _col().find_one({'_id': oid})


def find_by_course(course_oid):
    return _col().find_one({'course': course_oid})


def find_all(query=None):
    return list(_col().find(query or {}).sort('updated_at', -1))


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def update(oid, updates):
    _col().update_one({'_id': oid}, {'$set': updates})
    return find_by_id(oid)

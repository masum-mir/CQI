"""ALL MongoDB queries for the users collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_USERS)


def find_by_email(email):
    return _col().find_one({'email': email})


def find_by_id(oid):
    return _col().find_one({'_id': oid})


def find_by_google_id(google_id):
    return _col().find_one({'google_id': google_id})


def find_by_short_code(short_code):
    return _col().find_one({'short_code': short_code})


def find_all(query=None, sort_field='name', sort_dir=1):
    return list(_col().find(query or {}).sort(sort_field, sort_dir))


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def update(oid, updates):
    _col().update_one({'_id': oid}, {'$set': updates})
    return find_by_id(oid)


def delete(oid):
    return _col().delete_one({'_id': oid}).deleted_count

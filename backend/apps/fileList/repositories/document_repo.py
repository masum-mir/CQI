"""ALL MongoDB queries for the documents collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_DOCUMENTS)


def find_by_id(oid):
    return _col().find_one({'_id': oid})


def find_by_course_file(cf_oid):
    return list(_col().find({'course_file': cf_oid}).sort('item_no', 1))


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def update(oid, updates):
    _col().update_one({'_id': oid}, {'$set': updates})
    return find_by_id(oid)


def delete(oid):
    return _col().delete_one({'_id': oid}).deleted_count


def find_slot(cf_oid, item_no, sub_item):
    """The existing non-additional document for a given (course_file,item,sub)."""
    return _col().find_one({'course_file': cf_oid, 'item_no': item_no,
                            'sub_item': sub_item, 'is_additional': False})


def delete_by_course_file(cf_oid):
    return _col().delete_many({'course_file': cf_oid}).deleted_count

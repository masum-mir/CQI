from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_ROLES)


def find_by_name(name):
    return _col().find_one({'name': name})


def find_all():
    return list(_col().find({}).sort('name', 1))


def upsert(name, set_fields, on_insert):
    _col().update_one({'name': name},
                      {'$set': set_fields, '$setOnInsert': on_insert}, upsert=True)
    return find_by_name(name)

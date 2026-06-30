"""ALL MongoDB queries for the required_items collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_REQUIRED_ITEMS)


def find_active():
    return list(_col().find({'active': True}).sort('item_no', 1))


def find_by_item_no(item_no):
    return _col().find_one({'item_no': item_no})


def upsert(item_no, set_fields, on_insert):
    _col().update_one({'item_no': item_no},
                      {'$set': set_fields, '$setOnInsert': on_insert}, upsert=True)
    return find_by_item_no(item_no)


def update(item_no, updates):
    _col().update_one({'item_no': item_no}, {'$set': updates})
    return find_by_item_no(item_no)

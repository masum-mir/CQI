"""ALL MongoDB queries for the one_time_tokens collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_ONE_TIME_TOKENS)


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def find_active_by_hash(token_hash, purpose):
    return _col().find_one({'token_hash': token_hash, 'purpose': purpose, 'used_at': None})


def mark_used(oid, when):
    _col().update_one({'_id': oid}, {'$set': {'used_at': when}})


def invalidate_for_user(user_oid, purpose):
    """Single active token per purpose: mark previous ones used."""
    from core.utils import now
    _col().update_many({'user': user_oid, 'purpose': purpose, 'used_at': None},
                       {'$set': {'used_at': now()}})

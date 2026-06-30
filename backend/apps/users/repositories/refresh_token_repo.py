"""ALL MongoDB queries for the refresh_tokens collection live here."""
from core.db.client import get_collection
from core import constants as C


def _col():
    return get_collection(C.COL_REFRESH_TOKENS)


def insert(doc):
    doc['_id'] = _col().insert_one(doc).inserted_id
    return doc


def find_by_jti(jti):
    return _col().find_one({'jti': jti})


def revoke(jti, replaced_by=None):
    _col().update_one({'jti': jti},
                      {'$set': {'revoked': True, 'replaced_by': replaced_by}})


def revoke_all_for_user(user_oid):
    _col().update_many({'user': user_oid, 'revoked': False},
                       {'$set': {'revoked': True}})

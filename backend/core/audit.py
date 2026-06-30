"""Cross-cutting audit trail. Writes append-only records to `audit_logs`.

Auditing must never break a request, so all failures are swallowed (logged).
"""
import logging
from core.db.client import get_collection
from core import constants as C
from core.utils import now

log = logging.getLogger('cqi')


def record(action, actor=None, target_type=None, target_id=None, meta=None, ip=None):
    """Insert one audit entry. `actor`/`target_id` may be ObjectId, str, or None."""
    try:
        get_collection(C.COL_AUDIT_LOGS).insert_one({
            'actor': actor,
            'action': action,
            'target_type': target_type,
            'target_id': target_id,
            'meta': meta or {},
            'ip': ip,
            'created_at': now(),
        })
    except Exception as exc:  # never let auditing break the request
        log.warning('audit record failed (%s): %s', action, exc)


def client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')

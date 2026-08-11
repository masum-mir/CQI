"""Role listing/seeding. RBAC enforcement is role-name based (core.permissions);
this collection stores the role catalogue for reference and management UIs."""
from core.utils import now
from apps.users.repositories import role_repo
from apps.users.api.serializers import role_dict

SYSTEM_ROLES = [
    ('admin', 'System administrator'),
    ('chairperson', 'Reviews and approves course files'),
    ('faculty', 'Creates course files and uploads documents'),
]


def list_roles():
    roles = [role_dict(r) for r in role_repo.find_all()]
    return {'count': len(roles), 'roles': roles}


def seed_system_roles():
    for name, desc in SYSTEM_ROLES:
        role_repo.upsert(name,
                         {'description': desc, 'is_system': True},
                         {'name': name, 'created_at': now()})

"""Presenters: raw Mongo documents -> JSON-friendly dicts (camelCase)."""


def user_dict(doc):
    if not doc:
        return None
    pi = doc.get('profile_image') or None
    return {
        'id': str(doc['_id']),
        'name': doc.get('name'),
        'email': doc.get('email'),
        'role': doc.get('role'),
        'authProvider': doc.get('auth_provider', 'local'),
        'googleId': doc.get('google_id'),
        'profileImage': {
            'url': pi.get('url'),
            'provider': pi.get('provider'),
        } if pi else None,
        'shortCode': doc.get('short_code'),
        'department': doc.get('department'),
        'designation': doc.get('designation'),
        'employeeId': doc.get('employee_id'),
        'status': doc.get('status', 'active'),
        'isEmailVerified': doc.get('is_email_verified', False),
        'lastLoginAt': doc.get('last_login_at'),
        'createdBy': str(doc['created_by']) if doc.get('created_by') else None,
        'createdAt': doc.get('created_at'),
        'updatedAt': doc.get('updated_at'),
    }


def role_dict(doc):
    if not doc:
        return None
    return {
        'id': str(doc['_id']),
        'name': doc.get('name'),
        'description': doc.get('description'),
        'isSystem': doc.get('is_system', False),
        'createdAt': doc.get('created_at'),
    }

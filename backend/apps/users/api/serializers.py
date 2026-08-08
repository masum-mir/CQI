def _provider_list(doc):
    providers = []

    for provider in doc.get("auth_providers") or []:
        if provider and provider not in providers:
            providers.append(provider)

    legacy_provider = doc.get("auth_provider")

    if legacy_provider and legacy_provider not in providers:
        providers.append(legacy_provider)

    # Backward compatibility for older records.
    if doc.get("password") and "local" not in providers:
        providers.append("local")

    if doc.get("google_id") and "google" not in providers:
        providers.append("google")

    return providers


def user_dict(doc):
    if not doc:
        return None

    pi = doc.get("profile_image") or None
    providers = _provider_list(doc)

    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "email": doc.get("email"),
        "role": doc.get("role"),

        # Keep old frontend field for backward compatibility.
        "authProvider": doc.get(
            "auth_provider",
            providers[0] if providers else "local",
        ),

        # New field correctly represents linked accounts.
        "authProviders": providers,

        "googleId": doc.get("google_id"),

        "profileImage": (
            {
                "url": pi.get("url"),
                "provider": pi.get("provider"),
            }
            if pi
            else None
        ),

        "shortCode": doc.get("short_code"),
        "department": doc.get("department"),
        "designation": doc.get("designation"),
        "employeeId": doc.get("employee_id"),
        "mobile": doc.get("mobile"),
        "status": doc.get(
            "status",
            "active",
        ),
        "isEmailVerified": doc.get(
            "is_email_verified",
            False,
        ),
        "lastLoginAt": doc.get(
            "last_login_at"
        ),
        "createdBy": (
            str(doc["created_by"])
            if doc.get("created_by")
            else None
        ),
        "createdAt": doc.get(
            "created_at"
        ),
        "updatedAt": doc.get(
            "updated_at"
        ),
    }


def role_dict(doc):
    if not doc:
        return None

    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "description": doc.get(
            "description"
        ),
        "isSystem": doc.get(
            "is_system",
            False,
        ),
        "createdAt": doc.get(
            "created_at"
        ),
    }
import hashlib
import logging
import secrets

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from pymongo.errors import DuplicateKeyError

from core.utils import now, ensure_aware
from core.utils.response import ApiError
from core.utils.validators import require_fields
from core import constants as C
from core import audit
from apps.users.repositories import (
    user_repo,
    refresh_token_repo,
    one_time_token_repo,
)
from apps.users.api.serializers import user_dict
from apps.users import authentication as auth


log = logging.getLogger("cqi")


# Provider helpers
def _provider_list(user_doc):
    """
    Return a normalized provider list while remaining compatible with old
    documents that only have `auth_provider`.
    """
    providers = []

    for provider in user_doc.get("auth_providers") or []:
        if provider and provider not in providers:
            providers.append(provider)

    legacy_provider = user_doc.get("auth_provider")
    if legacy_provider and legacy_provider not in providers:
        providers.append(legacy_provider)

    # A stored password means local login is available even if an old document
    # was later marked auth_provider='google'.
    if user_doc.get("password") and C.AUTH_LOCAL not in providers:
        providers.append(C.AUTH_LOCAL)

    if user_doc.get("google_id") and C.AUTH_GOOGLE not in providers:
        providers.append(C.AUTH_GOOGLE)

    return providers


# Token issuing
def _issue_tokens(user_doc, request=None):
    access = auth.create_access_token(
        user_doc["_id"],
        user_doc["role"],
    )
    refresh = auth.create_refresh_token(
        user_doc["_id"]
    )

    refresh_token_repo.insert({
        "user": user_doc["_id"],
        "jti": refresh["jti"],
        "token_hash": auth.hash_token(refresh["raw"]),
        "expires_at": refresh["expires_at"],
        "revoked": False,
        "replaced_by": None,
        "user_agent": (
            request.META.get("HTTP_USER_AGENT")
            if request
            else None
        ),
        "ip": (
            audit.client_ip(request)
            if request
            else None
        ),
        "created_at": now(),
    })

    return {
        "accessToken": access,
        "refreshToken": refresh["raw"],
    }


def _auth_payload(user_doc, request=None):
    return {
        "user": user_dict(user_doc),
        **_issue_tokens(user_doc, request),
    }


# Register / login
def register(data, request=None):
    """Public self-registration — always faculty."""
    require_fields(
        data,
        ["name", "email", "password"],
    )

    email = data["email"].lower().strip()

    if user_repo.find_by_email(email):
        raise ApiError(
            "Email already registered",
            status=409,
        )

    doc_data = {
        "name": data["name"],
        "email": email,
        "password": make_password(data["password"]),

        # Backward-compatible primary provider.
        "auth_provider": C.AUTH_LOCAL,

        # New multi-provider representation.
        "auth_providers": [C.AUTH_LOCAL],

        "profile_image": (
            {
                "url": data["profileImage"],
                "public_id": None,
                "provider": "local",
            }
            if data.get("profileImage")
            else None
        ),

        "role": C.ROLE_FACULTY,
        "department": data.get("department") or "CSE",
        "designation": data.get("designation"),
        "employee_id": data.get("employeeId"),
        "status": C.STATUS_ACTIVE,
        "is_email_verified": False,
        "last_login_at": None,
        "created_by": None,
        "created_at": now(),
        "updated_at": now(),
    }

    # Do NOT store google_id=None. A normal local account simply does not have
    # a google_id field until Google is linked.
    short_code = data.get("shortCode")
    if short_code:
        doc_data["short_code"] = short_code

    try:
        doc = user_repo.insert(doc_data)
    except DuplicateKeyError:
        raise ApiError(
            "Email or short code already in use",
            status=409,
        )

    audit.record(
        "user.register",
        actor=doc["_id"],
        target_type="user",
        target_id=doc["_id"],
        ip=(
            audit.client_ip(request)
            if request
            else None
        ),
    )

    result = _auth_payload(doc, request)
    _attach_email_verification(doc, result)

    return result


def login(data, request=None):
    require_fields(
        data,
        ["email", "password"],
    )

    doc = user_repo.find_by_email(
        data["email"].lower().strip()
    )

    if (
        not doc
        or not doc.get("password")
        or not check_password(
            data["password"],
            doc["password"],
        )
    ):
        raise ApiError(
            "Invalid credentials",
            status=401,
        )

    if doc.get("status") != C.STATUS_ACTIVE:
        raise ApiError(
            "Account is not active",
            status=403,
        )

    providers = _provider_list(doc)
    if C.AUTH_LOCAL not in providers:
        providers.append(C.AUTH_LOCAL)

    doc = user_repo.update(
        doc["_id"],
        {
            "last_login_at": now(),
            "updated_at": now(),
            "auth_providers": providers,
        },
    )

    audit.record(
        "user.login",
        actor=doc["_id"],
        target_type="user",
        target_id=doc["_id"],
        ip=(
            audit.client_ip(request)
            if request
            else None
        ),
    )

    return _auth_payload(doc, request)


# Refresh rotation / logout
def refresh(data, request=None):
    raw = data.get("refreshToken")

    if not raw:
        raise ApiError(
            "refreshToken is required",
            status=400,
        )

    payload = auth.decode_token(
        raw,
        expected_type="refresh",
    )

    record = refresh_token_repo.find_by_jti(
        payload.get("jti")
    )

    if not record:
        raise ApiError(
            "Invalid refresh token",
            status=401,
        )

    if record.get("revoked"):
        refresh_token_repo.revoke_all_for_user(
            record["user"]
        )

        audit.record(
            "auth.refresh_reuse_detected",
            actor=record["user"],
            target_type="user",
            target_id=record["user"],
        )

        raise ApiError(
            "Refresh token reuse detected. Please log in again.",
            status=401,
        )

    if record.get("token_hash") != auth.hash_token(raw):
        raise ApiError(
            "Invalid refresh token",
            status=401,
        )

    user = user_repo.find_by_id(
        record["user"]
    )

    if (
        not user
        or user.get("status") != C.STATUS_ACTIVE
    ):
        raise ApiError(
            "Account is not active",
            status=403,
        )

    tokens = _issue_tokens(
        user,
        request,
    )

    new_payload = auth.decode_token(
        tokens["refreshToken"],
        expected_type="refresh",
    )

    refresh_token_repo.revoke(
        record["jti"],
        replaced_by=new_payload.get("jti"),
    )

    return {
        "user": user_dict(user),
        **tokens,
    }


def logout(data, request=None):
    raw = data.get("refreshToken")

    if not raw:
        raise ApiError(
            "refreshToken is required",
            status=400,
        )

    try:
        payload = auth.decode_token(
            raw,
            expected_type="refresh",
        )

        refresh_token_repo.revoke(
            payload.get("jti")
        )
    except Exception:
        # Logout is best-effort/idempotent.
        pass

    return {
        "message": "Logged out"
    }


# Google OAuth
def google_auth(data, request=None):
    """
    Sign in/up with Google.

    Safe merge behaviour:
    1. Verify the Google token.
    2. If google_id already exists -> login that same account.
    3. Otherwise find by the verified Google email.
    4. If that email belongs to a local account -> link Google to that SAME
       MongoDB document. No old user data is replaced.
    5. If neither exists -> create a new Google-only account.
    """
    profile = _resolve_google_profile(data)

    email = profile["email"].strip().lower()
    google_id = str(profile["sub"])

    # ------------------------------------------------------ #
    # A. Already linked Google identity
    # ------------------------------------------------------ #
    doc = user_repo.find_by_google_id(
        google_id
    )

    if doc:
        if doc.get("status") != C.STATUS_ACTIVE:
            raise ApiError(
                "Account is not active",
                status=403,
            )

        providers = _provider_list(doc)

        if C.AUTH_GOOGLE not in providers:
            providers.append(C.AUTH_GOOGLE)

        updates = {
            "auth_providers": providers,
            "is_email_verified": True,
            "last_login_at": now(),
            "updated_at": now(),
        }

        # Do not replace an existing profile image.
        if (
            profile.get("picture")
            and not doc.get("profile_image")
        ):
            updates["profile_image"] = {
                "url": profile["picture"],
                "public_id": None,
                "provider": "google",
            }

        doc = user_repo.update(
            doc["_id"],
            updates,
        )

    # ------------------------------------------------------ #
    # B. Same verified email already exists -> LINK/MERGE
    # ------------------------------------------------------ #
    else:
        existing = user_repo.find_by_email(
            email
        )

        if existing:
            if existing.get("status") != C.STATUS_ACTIVE:
                raise ApiError(
                    "Account is not active",
                    status=403,
                )

            existing_google_id = existing.get(
                "google_id"
            )

            # Never silently replace a different linked Google identity.
            if (
                existing_google_id
                and str(existing_google_id) != google_id
            ):
                raise ApiError(
                    "This account is already linked to another Google account.",
                    status=409,
                )

            providers = _provider_list(
                existing
            )

            if (
                existing.get("password")
                and C.AUTH_LOCAL not in providers
            ):
                providers.append(
                    C.AUTH_LOCAL
                )

            if C.AUTH_GOOGLE not in providers:
                providers.append(
                    C.AUTH_GOOGLE
                )

            google_profile_image = None

            # Preserve local/custom image. Use Google picture only when there
            # was no existing profile image.
            if (
                profile.get("picture")
                and not existing.get("profile_image")
            ):
                google_profile_image = {
                    "url": profile["picture"],
                    "public_id": None,
                    "provider": "google",
                }

            try:
                doc = user_repo.link_google_account(
                    user_id=existing["_id"],
                    google_id=google_id,
                    providers=providers,
                    updated_at=now(),
                    profile_image=google_profile_image,
                )
            except DuplicateKeyError:
                raise ApiError(
                    "This Google account is already linked to another user.",
                    status=409,
                )

        # -------------------------------------------------- #
        # C. Completely new Google user
        # -------------------------------------------------- #
        else:
            doc_data = {
                "name": (
                    profile.get("name")
                    or email.split("@")[0]
                ),
                "email": email,
                "password": None,

                "auth_provider": C.AUTH_GOOGLE,
                "auth_providers": [
                    C.AUTH_GOOGLE
                ],

                "google_id": google_id,

                "profile_image": (
                    {
                        "url": profile["picture"],
                        "public_id": None,
                        "provider": "google",
                    }
                    if profile.get("picture")
                    else None
                ),

                "role": C.ROLE_FACULTY,
                "department": "CSE",
                "designation": None,
                "employee_id": None,
                "status": C.STATUS_ACTIVE,
                "is_email_verified": True,
                "last_login_at": now(),
                "created_by": None,
                "created_at": now(),
                "updated_at": now(),
            }

            # Do not store short_code=None.

            try:
                doc = user_repo.insert(
                    doc_data
                )
            except DuplicateKeyError:
                # Race-safe fallback: if another request created/linked the
                # same identity between lookup and insert, return a clear
                # conflict rather than a 500.
                raise ApiError(
                    "Google account or email is already registered.",
                    status=409,
                )

    audit.record(
        "user.login_google",
        actor=doc["_id"],
        target_type="user",
        target_id=doc["_id"],
        ip=(
            audit.client_ip(request)
            if request
            else None
        ),
    )

    return _auth_payload(
        doc,
        request,
    )


def _resolve_google_profile(data):
    id_token = data.get("idToken")

    if id_token:
        try:
            from google.oauth2 import id_token as g_id_token
            from google.auth.transport import requests as g_requests

            info = g_id_token.verify_oauth2_token(
                id_token,
                g_requests.Request(),
                settings.GOOGLE_CLIENT_ID or None,
            )

            if not info.get("email_verified", False):
                raise ApiError(
                    "Google email not verified",
                    status=401,
                )

            return {
                "email": info["email"],
                "sub": info["sub"],
                "name": info.get("name"),
                "picture": info.get("picture"),
            }

        except ImportError:
            raise ApiError(
                "Google verification unavailable (install google-auth)",
                status=501,
            )
        except ApiError:
            raise
        except Exception:
            raise ApiError(
                "Invalid Google token",
                status=401,
            )

    # Development-only profile bypass.
    if (
        settings.DEBUG
        and isinstance(
            data.get("profile"),
            dict,
        )
    ):
        p = data["profile"]

        require_fields(
            p,
            ["email", "sub"],
        )

        return {
            "email": p["email"],
            "sub": str(p["sub"]),
            "name": p.get("name"),
            "picture": p.get("picture"),
        }

    raise ApiError(
        "idToken is required",
        status=400,
    )


# Email verification
def _new_raw_token():
    return secrets.token_urlsafe(32)


def _attach_email_verification(user_doc, result):
    raw = _new_raw_token()

    one_time_token_repo.invalidate_for_user(
        user_doc["_id"],
        C.OTT_EMAIL_VERIFY,
    )

    one_time_token_repo.insert({
        "user": user_doc["_id"],
        "purpose": C.OTT_EMAIL_VERIFY,
        "token_hash": hashlib.sha256(
            raw.encode()
        ).hexdigest(),
        "expires_at": (
            now()
            + __import__("datetime").timedelta(
                hours=settings.EMAIL_VERIFY_TTL_HOURS
            )
        ),
        "used_at": None,
        "created_at": now(),
    })

    link = (
        f"{settings.FRONTEND_URL}"
        f"/verify-email?token={raw}"
    )

    log.info(
        "Email verification link for %s: %s",
        user_doc["email"],
        link,
    )

    if settings.EXPOSE_DEV_TOKENS:
        result["emailVerifyToken"] = raw


def verify_email(data):
    raw = data.get("token")

    if not raw:
        raise ApiError(
            "token is required",
            status=400,
        )

    token_hash = hashlib.sha256(
        raw.encode()
    ).hexdigest()

    rec = one_time_token_repo.find_active_by_hash(
        token_hash,
        C.OTT_EMAIL_VERIFY,
    )

    if (
        not rec
        or ensure_aware(rec["expires_at"]) < now()
    ):
        raise ApiError(
            "Invalid or expired token",
            status=400,
        )

    one_time_token_repo.mark_used(
        rec["_id"],
        now(),
    )

    user_repo.update(
        rec["user"],
        {
            "is_email_verified": True,
            "updated_at": now(),
        },
    )

    audit.record(
        "user.email_verified",
        actor=rec["user"],
        target_type="user",
        target_id=rec["user"],
    )

    return {
        "message": "Email verified"
    }


# Password reset
def request_password_reset(data):
    email = (
        data.get("email")
        or ""
    ).lower().strip()

    doc = user_repo.find_by_email(
        email
    )

    # Do not leak whether an account exists.
    result = {
        "message": (
            "If the account exists, "
            "a reset link has been sent"
        )
    }

    # IMPORTANT:
    # A merged local+Google account still has a password, so it must continue
    # to support password reset. Do not check auth_provider == 'local'.
    if doc and doc.get("password"):
        raw = _new_raw_token()

        one_time_token_repo.invalidate_for_user(
            doc["_id"],
            C.OTT_PASSWORD_RESET,
        )

        one_time_token_repo.insert({
            "user": doc["_id"],
            "purpose": C.OTT_PASSWORD_RESET,
            "token_hash": hashlib.sha256(
                raw.encode()
            ).hexdigest(),
            "expires_at": (
                now()
                + __import__("datetime").timedelta(
                    minutes=settings.PASSWORD_RESET_TTL_MINUTES
                )
            ),
            "used_at": None,
            "created_at": now(),
        })

        link = (
            f"{settings.FRONTEND_URL}"
            f"/reset-password?token={raw}"
        )

        log.info(
            "Password reset link for %s: %s",
            email,
            link,
        )

        if settings.EXPOSE_DEV_TOKENS:
            result["resetToken"] = raw

    return result


def reset_password(data):
    require_fields(
        data,
        ["token", "password"],
    )

    token_hash = hashlib.sha256(
        data["token"].encode()
    ).hexdigest()

    rec = one_time_token_repo.find_active_by_hash(
        token_hash,
        C.OTT_PASSWORD_RESET,
    )

    if (
        not rec
        or ensure_aware(rec["expires_at"]) < now()
    ):
        raise ApiError(
            "Invalid or expired token",
            status=400,
        )

    one_time_token_repo.mark_used(
        rec["_id"],
        now(),
    )

    user = user_repo.find_by_id(
        rec["user"]
    )

    providers = _provider_list(
        user or {}
    )

    if C.AUTH_LOCAL not in providers:
        providers.append(
            C.AUTH_LOCAL
        )

    user_repo.update(
        rec["user"],
        {
            "password": make_password(
                data["password"]
            ),
            "auth_providers": providers,
            "updated_at": now(),
        },
    )

    refresh_token_repo.revoke_all_for_user(
        rec["user"]
    )

    audit.record(
        "user.password_reset",
        actor=rec["user"],
        target_type="user",
        target_id=rec["user"],
    )

    return {
        "message": "Password updated. Please log in again."
    }
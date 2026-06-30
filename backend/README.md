# CQI System — Backend (Django REST + MongoDB / PyMongo)

Complete backend for the EWU CSE **Course File / CQI** system, implemented to the
uploaded database design. Layered architecture, raw PyMongo (no ORM, no
MongoEngine), JWT access + refresh tokens, role-based access control, an
offered-courses **PDF importer**, and the full course-file submission/review
workflow.

```
api (DRF views) → services (business rules) → repositories (all Mongo queries) → MongoDB
core/ = db client, JWT auth, RBAC, response envelope, validators, audit, constants
apps/ = users (auth + roles), courses (catalog + offerings + import), fileList (items + course_files + documents)
```

## 1. Collections (11)

`roles`, `users`, `refresh_tokens`, `one_time_tokens`, `audit_logs`,
`required_items`, `course_catalog`, `courses`, `course_files`, `documents`,
`import_batches` — exactly as in the design doc. All indexes (unique, sparse,
TTL, and the partial unique index for one-file-per-slot) are created on first DB
use in `core/db/client.py`.

## 2. Run

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set MONGO_URI, JWT_SECRET, (optional) GOOGLE_CLIENT_ID
# make sure MongoDB is running (local mongod or an Atlas URI)
python manage.py migrate      # Django internals only (SQLite); domain data is in MongoDB
python manage.py seed         # roles, 17 items, catalog, demo users, demo courses
python manage.py runserver    # http://localhost:8000
```

Health: `GET /api/health`. Seeded logins:

| Role | Email | Password |
|---|---|---|
| admin | admin@ewu.edu | Admin@1234 |
| chairperson | chair@ewu.edu | Chair@1234 |
| faculty | faculty@ewu.edu (short_code `RDA`) | Faculty@1234 |

## 3. Authentication & tokens

- **Login / register** return `{ accessToken, refreshToken, user }`. Access tokens
  are short-lived (`JWT_ACCESS_MINUTES`, default 15) and sent as
  `Authorization: Bearer <accessToken>`. Refresh tokens live `JWT_REFRESH_DAYS`
  (default 7); only their SHA-256 hash is stored in `refresh_tokens`.
- **`POST /api/auth/refresh`** rotates: the old refresh token is revoked and a new
  pair issued. Presenting an already-revoked refresh token triggers **reuse
  detection** — all of that user's refresh tokens are revoked.
- **`POST /api/auth/logout`** revokes the presented refresh token.
- **Google sign-in** (`POST /api/auth/google`): post `idToken`; verified with
  `google-auth` when `GOOGLE_CLIENT_ID` is set. In `DEBUG` you may post
  `{ "profile": { "email", "sub", "name", "picture" } }` to exercise the flow
  without Google credentials.
- **Email verify / password reset** use single-use, TTL-expiring `one_time_tokens`.
  No SMTP is wired: in `DEBUG` (`EXPOSE_DEV_TOKENS=True`) the raw token is returned
  in the response and logged, so the flow is testable. In production, send it by
  email and remove the dev exposure.

## 4. RBAC

Role-name based (`core/permissions.py`); the `roles` collection stores the role
catalogue. Faculty self-register (always `faculty`); only an admin can create a
`chairperson`/`admin` (stamped with `created_by`). Faculty act only on their own
courses/files (`:own` scope enforced in services).

## 5. API surface

```
# Auth
POST   /api/auth/register            (public; always faculty)
POST   /api/auth/login
POST   /api/auth/refresh             (rotate)
POST   /api/auth/logout
POST   /api/auth/google
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me

# Users & roles (admin)
GET|POST            /api/users           (?role=&status=)
GET|PATCH|DELETE    /api/users/<id>
GET                 /api/roles

# Required items
GET    /api/items ; POST /api/items (admin) ; PATCH /api/items/<itemNo> (admin)

# Course catalog (admin writes)
GET|POST            /api/catalog
PATCH|DELETE        /api/catalog/<id>

# Courses
GET    /api/courses (?semester=&faculty=&courseCode=)
POST   /api/courses                  (admin/chair)
GET    /api/courses/<id>
PATCH  /api/courses/<id>             (admin/chair)
DELETE /api/courses/<id>             (admin)

# Offered-courses PDF import (admin)
POST   /api/courses/import/preview        (multipart: file, departments=CSE)
POST   /api/courses/import/<batchId>/commit
GET    /api/courses/import/batches

# Course files (workflow)
POST   /api/course-files                  ({ courseId })
GET    /api/course-files                  (?status=&semester=)
GET    /api/course-files/<id>             (documents + completeness)
POST   /api/course-files/<id>/upload      (multipart: file, itemNo, subItem?, isAdditional?)
PATCH  /api/course-files/<id>/submit
PATCH  /api/course-files/<id>/review      ({ decision, comment })

# Documents
GET    /api/documents/<id>/download
DELETE /api/documents/<id>
PATCH  /api/documents/<id>/review         ({ status, remark })
```

All responses use the envelope `{ success, data, message? }` /
`{ success: false, message, errors? }`.

## 6. PDF import

`POST /api/courses/import/preview` parses the EWU "Offered Courses" PDF
(`apps/courses/services/pdf_parser.py`), groups each section's multiple meeting
rows into one offering with a `schedule[]`, resolves `faculty_code → users.short_code`,
and stores an `import_batches` record (`status: preview`) **without writing
courses**. `POST /api/courses/import/<id>/commit` then idempotently upserts the
offerings by `(course_code, section, semester)` — re-importing updates rather than
duplicates. Titles/types are filled from `course_catalog`. The parser is a pure
function (unit-testable without a PDF); PDF→text uses `pdfplumber` (lazy import).

## 7. Documents — one file per slot

A non-additional upload is unique per `(course_file, item_no, sub_item)` (partial
unique index + service-side replace): re-uploading the same slot replaces the old
file. `isAdditional=true` uploads are the free-form "any work the faculty believes
should be submitted" and may repeat. A course file can be **submitted** only when
every required item (and every required sub-item) has a file.

## 8. What to finish for production

- **Email transport** — wire an SMTP/provider in the email-verify/reset flow and
  set `EXPOSE_DEV_TOKENS=False`.
- **Google** — set `GOOGLE_CLIENT_ID`; the verification path is already there.
- **File storage** — uploads go to `media/uploads/`. To use S3/GridFS, change only
  `apps/fileList/services/storage.py`.
- **Cascade deletes** — deleting a course/course-file should cascade to documents
  in a transaction (helper `document_repo.delete_by_course_file` is provided).

## 9. Verified

A full end-to-end run (auth + refresh rotation/reuse + email/reset + RBAC +
catalog + PDF import preview/commit + one-file-per-slot workflow + audit) passes
40/40 checks against an in-memory MongoDB. `python manage.py check` is clean.

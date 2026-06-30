"""Project-wide constants: domain vocabularies and MongoDB collection names."""

# Roles
ROLE_ADMIN = 'admin'
ROLE_CHAIR = 'chairperson'
ROLE_FACULTY = 'faculty'
ROLES = (ROLE_ADMIN, ROLE_CHAIR, ROLE_FACULTY)

# User account status
STATUS_ACTIVE = 'active'
STATUS_INACTIVE = 'inactive'
STATUS_SUSPENDED = 'suspended'
USER_STATUS = (STATUS_ACTIVE, STATUS_INACTIVE, STATUS_SUSPENDED)

# Auth providers
AUTH_LOCAL = 'local'
AUTH_GOOGLE = 'google'
AUTH_PROVIDERS = (AUTH_LOCAL, AUTH_GOOGLE)

# One-time token purposes
OTT_EMAIL_VERIFY = 'email_verify'
OTT_PASSWORD_RESET = 'password_reset'
OTT_PURPOSES = (OTT_EMAIL_VERIFY, OTT_PASSWORD_RESET)

# Course-file workflow statuses
CF_DRAFT = 'draft'
CF_SUBMITTED = 'submitted'
CF_UNDER_REVIEW = 'under_review'
CF_APPROVED = 'approved'
CF_REJECTED = 'rejected'
CF_STATUS = (CF_DRAFT, CF_SUBMITTED, CF_UNDER_REVIEW, CF_APPROVED, CF_REJECTED)

# Per-document review statuses
DOC_PENDING = 'pending'
DOC_APPROVED = 'approved'
DOC_REJECTED = 'rejected'
DOC_REVIEW_STATUS = (DOC_PENDING, DOC_APPROVED, DOC_REJECTED)

# Document processing (parse pipeline) statuses
PROC_PENDING = 'pending'
PROC_COMPLETED = 'completed'
PROC_FAILED = 'failed'
PROC_STATUS = (PROC_PENDING, PROC_COMPLETED, PROC_FAILED)

# Import batch statuses
IMPORT_PREVIEW = 'preview'
IMPORT_COMMITTED = 'committed'
IMPORT_FAILED = 'failed'
IMPORT_STATUS = (IMPORT_PREVIEW, IMPORT_COMMITTED, IMPORT_FAILED)

# Course types
COURSE_TYPES = ('theory', 'lab', 'project', 'thesis', 'other')

# MongoDB collection names
COL_ROLES = 'roles'
COL_USERS = 'users'
COL_REFRESH_TOKENS = 'refresh_tokens'
COL_ONE_TIME_TOKENS = 'one_time_tokens'
COL_AUDIT_LOGS = 'audit_logs'
COL_REQUIRED_ITEMS = 'required_items'
COL_COURSE_CATALOG = 'course_catalog'
COL_COURSES = 'courses'
COL_COURSE_FILES = 'course_files'
COL_DOCUMENTS = 'documents'
COL_IMPORT_BATCHES = 'import_batches'

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', '8uF!mP2#xKswe9@qR4$zW7@J&nL1*eT6^&*#cV3!aH598H&^%$9878623hgytfe&6^g7&^')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# --- Apps -------------------------------------------------------------------
# Django contrib + DRF run on a tiny local SQLite (internal plumbing only).
# ALL application data lives in MongoDB, accessed via PyMongo in the
# repositories layer (apps/*/repositories). No ORM, no MongoEngine.
DJANGO_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.staticfiles',
]
THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
]
LOCAL_APPS = [
    'apps.users',
    'apps.courses',
    'apps.fileList',
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': []},
}]

# SQLite is ONLY for Django's internal apps. Domain data is in MongoDB.
DATABASES = {

}

# --- MongoDB (PyMongo) ------------------------------------------------------
MONGO_DB = os.getenv('MONGO_DB', 'cqi_db')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017')

# --- DRF --------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.users.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'UNAUTHENTICATED_USER': None,
    'EXCEPTION_HANDLER': 'core.utils.response.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# --- JWT --------------------------------------------------------------------
JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
JWT_ACCESS_MINUTES = int(os.getenv('JWT_ACCESS_MINUTES', '15'))
JWT_REFRESH_DAYS = int(os.getenv('JWT_REFRESH_DAYS', '7'))
# Backwards-compat alias (older code referenced JWT_EXPIRES_DAYS)
JWT_EXPIRES_DAYS = JWT_REFRESH_DAYS

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]

JWT_ACCESS_COOKIE_NAME = "access_token"
JWT_REFRESH_COOKIE_NAME = "refresh_token"

JWT_COOKIE_SAMESITE = "Lax"
JWT_COOKIE_SECURE = os.getenv(
    "JWT_COOKIE_SECURE", "False" if DEBUG else "True"
).lower() == "true"

CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = os.getenv(
    "CSRF_COOKIE_SECURE", "False" if DEBUG else "True"
).lower() == "true"

# --- OAuth / email ----------------------------------------------------------
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '356893553017-4s8q20ff3p91t9hjpfobuctlhconpq1b.apps.googleusercontent.com')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://127.0.0.1:5173')
EMAIL_VERIFY_TTL_HOURS = int(os.getenv('EMAIL_VERIFY_TTL_HOURS', '24'))
PASSWORD_RESET_TTL_MINUTES = int(os.getenv('PASSWORD_RESET_TTL_MINUTES', '30'))
# In DEBUG, one-time tokens are returned in the API response / logged instead of
# emailed, so the flow is testable without an SMTP provider.pip install google-auth requests
EXPOSE_DEV_TOKENS = os.getenv('EXPOSE_DEV_TOKENS', str(DEBUG)).lower() == 'true'

# --- Files ------------------------------------------------------------------
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'
UPLOAD_SUBDIR = 'uploads'
MAX_FILE_SIZE_MB = int(os.getenv('MAX_FILE_SIZE_MB', '25'))
ALLOWED_UPLOAD_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
    '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip',
]

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
CORS_ALLOW_ALL_ORIGINS = True

# --- Logging (-> logs/app.log) ---------------------------------------------
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

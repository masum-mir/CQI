import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-insecure-secret-change-me')
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
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
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
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# --- JWT --------------------------------------------------------------------
JWT_SECRET = os.getenv('JWT_SECRET', SECRET_KEY)
JWT_ACCESS_MINUTES = int(os.getenv('JWT_ACCESS_MINUTES', '15'))
JWT_REFRESH_DAYS = int(os.getenv('JWT_REFRESH_DAYS', '7'))
# Backwards-compat alias (older code referenced JWT_EXPIRES_DAYS)
JWT_EXPIRES_DAYS = JWT_REFRESH_DAYS

# --- OAuth / email ----------------------------------------------------------
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
EMAIL_VERIFY_TTL_HOURS = int(os.getenv('EMAIL_VERIFY_TTL_HOURS', '24'))
PASSWORD_RESET_TTL_MINUTES = int(os.getenv('PASSWORD_RESET_TTL_MINUTES', '30'))
# In DEBUG, one-time tokens are returned in the API response / logged instead of
# emailed, so the flow is testable without an SMTP provider.
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

# Seed defaults
ADMIN_NAME = os.getenv('ADMIN_NAME', 'System Admin')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@ewu.edu')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin@1234')

# --- Logging (-> logs/app.log) ---------------------------------------------
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '{asctime} [{levelname}] {name}: {message}', 'style': '{'},
    },
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': str(LOG_DIR / 'app.log'),
            'maxBytes': 5 * 1024 * 1024,
            'backupCount': 3,
            'formatter': 'verbose',
        },
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
    },
    'loggers': {
        'cqi': {'handlers': ['file', 'console'], 'level': 'INFO', 'propagate': False},
    },
}

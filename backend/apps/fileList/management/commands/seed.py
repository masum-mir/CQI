"""Seed roles, required items, course catalog, default users and demo courses.

Run: python manage.py seed
"""
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password

from core.utils import now
from core import constants as C
from apps.users.repositories import user_repo
from apps.users.services.role_service import seed_system_roles
from apps.courses.repositories import course_repo, catalog_repo
from apps.fileList.repositories import item_repo

DOC_EXT = ['.pdf', '.doc', '.docx']
SHEET_EXT = ['.xls', '.xlsx', '.csv']

ITEMS = [
    {'item_no': 1, 'name': 'Final grades of the students (Tabulation Sheet)',
     'category': 'grades', 'allowed_extensions': DOC_EXT + SHEET_EXT},
    {'item_no': 2, 'name': 'OBE Excel Sheet (soft copy)', 'category': 'obe',
     'allowed_extensions': SHEET_EXT},
    {'item_no': 3, 'name': 'CO Attainment Report (From OBE Excel)', 'category': 'obe'},
    {'item_no': 4, 'name': 'PO Attainment Report (From OBE Excel)', 'category': 'obe'},
    {'item_no': 5, 'name': 'Grade Summary with CQI Improvement Plan (From OBE Excel)', 'category': 'obe'},
    {'item_no': 6, 'name': 'Instructor Feedback (From OBE Excel)', 'category': 'obe'},
    {'item_no': 7, 'name': 'Course Outline', 'category': 'outline'},
    {'item_no': 8, 'name': 'Class Test Assessment Question', 'category': 'assessment'},
    {'item_no': 9, 'name': 'Class Test Assessment - Representative Samples of Answer Scripts',
     'category': 'assessment'},
    {'item_no': 10, 'name': 'Midterm Assessment Question', 'category': 'assessment'},
    {'item_no': 11, 'name': 'Midterm Assessment - Representative Samples of Answer Scripts',
     'category': 'assessment'},
    {'item_no': 12, 'name': 'Final Exam Question', 'category': 'assessment'},
    {'item_no': 13, 'name': 'Final Exam - Representative Samples of Answer Scripts',
     'category': 'assessment'},
    {'item_no': 14, 'name': 'List of Projects/Assignments with Description', 'category': 'project'},
    {'item_no': 15, 'name': 'Projects/Assignments - Representative Samples of Reports',
     'category': 'project'},
    {'item_no': 16, 'name': 'List of lab experiments', 'category': 'lab'},
    {'item_no': 17, 'name': 'Class Attendance', 'category': 'attendance'},
    {'item_no': 18, 'name': 'Lab Attendance', 'category': 'attendance'},
    {'item_no': 19, 'name': 'Mid Term Exam Attendance', 'category': 'attendance'},
    {'item_no': 20, 'name': 'Final Exam Attendance', 'category': 'attendance'},
    {'item_no': 21, 'name': 'Capstone Project Report', 'category': 'project'},
]

CATALOG = [
    {'course_code': 'CSE251', 'title': 'Digital Logic Design', 'course_type': 'lab',
     'credit_hours': 3, 'default_required_items': [1, 14, 15, 16, 18]},
    {'course_code': 'CSE407', 'title': 'Software Engineering', 'course_type': 'theory',
     'credit_hours': 3, 'default_required_items': [1, 3, 4, 10, 11, 12, 13, 14, 15, 19, 20]},
    {'course_code': 'CSE101', 'title': 'Structured Programming', 'course_type': 'lab',
     'credit_hours': 3, 'default_required_items': [1, 8, 9, 14, 15, 16, 18]},
]


def ensure_user(email, name, role, password, short_code=None, designation=None):
    existing = user_repo.find_by_email(email)
    if existing:
        return existing
    doc = user_repo.insert({
        'name': name, 'email': email, 'password': make_password(password),
        'auth_provider': C.AUTH_LOCAL, 'google_id': None, 'profile_image': None,
        'role': role, 'short_code': short_code, 'department': 'CSE',
        'designation': designation, 'employee_id': None,
        'status': C.STATUS_ACTIVE, 'is_email_verified': True,
        'last_login_at': None, 'created_by': None,
        'created_at': now(), 'updated_at': now(),
    })
    print(f'  + created {role}: {email}' + (f' [short_code={short_code}]' if short_code else ''))
    return doc


class Command(BaseCommand):
    help = 'Seed roles, items, catalog, default users and demo courses into MongoDB.'

    def handle(self, *args, **opts):
        seed_system_roles()
        print('Seeded 3 system roles')

        for it in ITEMS:
            item_repo.upsert(
                it['item_no'],
                {'name': it['name'], 'category': it.get('category'),
                 'description': it.get('description'),
                 'allowed_extensions': it.get('allowed_extensions', DOC_EXT),
                 'max_size_mb': it.get('max_size_mb', settings.MAX_FILE_SIZE_MB),
                 'is_mandatory': it.get('is_mandatory', True),
                 'active': True, 'updated_at': now()},
                {'item_no': it['item_no'], 'created_at': now()})
        print(f'Seeded {len(ITEMS)} required items')

        for c in CATALOG:
            catalog_repo.upsert_by_code(
                c['course_code'],
                {'title': c['title'], 'department': 'CSE', 'course_type': c['course_type'],
                 'credit_hours': c['credit_hours'],
                 'default_required_items': c['default_required_items'],
                 'active': True, 'updated_at': now()},
                {'course_code': c['course_code'], 'created_at': now()})
        print(f'Seeded {len(CATALOG)} catalog entries')

        ensure_user(settings.ADMIN_EMAIL.lower(), settings.ADMIN_NAME, C.ROLE_ADMIN,
                    settings.ADMIN_PASSWORD)
        ensure_user('chair@ewu.edu', 'Department Chairperson', C.ROLE_CHAIR, 'Chair@1234')
        faculty = ensure_user('faculty@ewu.edu', 'Demo Faculty', C.ROLE_FACULTY,
                              'Faculty@1234', short_code='RDA', designation='Lecturer')

        demo = [
            {'course_code': 'CSE251', 'section': '5', 'title': 'Digital Logic Design',
             'course_type': 'lab', 'required_items': [1, 14, 15, 16, 18]},
            {'course_code': 'CSE251', 'section': '6', 'title': 'Digital Logic Design',
             'course_type': 'lab', 'required_items': [1, 14, 15, 16, 18]},
            {'course_code': 'CSE407', 'section': '1', 'title': 'Software Engineering',
             'course_type': 'theory', 'required_items': [1, 3, 4, 10, 11, 12, 13, 14, 15, 19, 20]},
            {'course_code': 'CSE407', 'section': '2', 'title': 'Software Engineering',
             'course_type': 'theory', 'required_items': [1, 3, 4, 10, 11, 12, 13, 14, 15, 20]},
        ]
        for c in demo:
            if not course_repo.find_one({'course_code': c['course_code'], 'section': c['section'],
                                         'semester': 'Fall 2024'}):
                course_repo.insert({
                    **c, 'semester': 'Fall 2024', 'department': 'CSE',
                    'faculty': faculty['_id'], 'faculty_code': 'RDA',
                    'capacity': None, 'schedule': [], 'source': None,
                    'created_at': now(), 'updated_at': now()})
        print(f'Seeded {len(demo)} demo courses (assigned to {faculty["email"]})')

        print('\n--- Login credentials ---')
        print(f'admin       : {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}')
        print('chairperson : chair@ewu.edu / Chair@1234')
        print('faculty     : faculty@ewu.edu / Faculty@1234')
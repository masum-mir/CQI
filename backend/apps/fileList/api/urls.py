# from django.urls import path
# from apps.fileList.api import views
#
# urlpatterns = [
#
#     # -----------------------------------------------------
#     # Course File Workflow
#     # -----------------------------------------------------
#     path('course-files', views.CourseFileListCreateView.as_view()),
#     path('course-files/<str:pk>', views.CourseFileDetailView.as_view()),
#
#     # Upload document into a course file
#     path('course-files/<str:pk>/upload', views.CourseFileUploadView.as_view()),
#
#     # Submit course file
#     path('course-files/<str:pk>/submit', views.CourseFileSubmitView.as_view()),
#
#     # Review course file (chair)
#     path('course-files/<str:pk>/review', views.CourseFileReviewView.as_view()),
#
#     # -----------------------------------------------------
#     # Documents
#     # -----------------------------------------------------
#
#     # ⭐ NEW: list all documents of a course file (IMPORTANT)
#     path(
#         'course-files/<str:pk>/documents',
#         views.CourseFileDocumentsView.as_view()
#     ),
#
#     # download single document
#     path('documents/<str:pk>/download', views.DocumentDownloadView.as_view()),
#
#     # delete document
#     path('documents/<str:pk>', views.DocumentDetailView.as_view()),
#
#     # review document
#     path('documents/<str:pk>/review', views.DocumentReviewView.as_view()),
# ]

from django.urls import path
from apps.fileList.api import views

urlpatterns = [
    # Course Files
    path('course-files', views.CourseFileListCreateView.as_view()),
    path('course-files/<str:pk>', views.CourseFileDetailView.as_view()),
    path('course-files/<str:pk>/upload', views.CourseFileUploadView.as_view()),
    path('course-files/<str:pk>/submit', views.CourseFileSubmitView.as_view()),
    path('course-files/<str:pk>/review', views.CourseFileReviewView.as_view()),

    # Documents
    path('documents/<str:pk>', views.DocumentDetailView.as_view()),
    path('documents/<str:pk>/download', views.DocumentDownloadView.as_view()),
    path('documents/<str:pk>/review', views.DocumentReviewView.as_view()),
]
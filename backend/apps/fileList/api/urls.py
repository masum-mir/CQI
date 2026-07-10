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
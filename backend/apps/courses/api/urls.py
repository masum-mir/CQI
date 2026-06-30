from django.urls import path
from apps.courses.api import views

urlpatterns = [
    # catalog
    path('catalog', views.CatalogListCreateView.as_view()),
    path('catalog/<str:pk>', views.CatalogDetailView.as_view()),
    # courses
    path('courses', views.CourseListCreateView.as_view()),
    path('courses/<str:pk>', views.CourseDetailView.as_view()),
    # import
    path('courses/import/preview', views.ImportPreviewView.as_view()),
    path('courses/import/<str:pk>/commit', views.ImportCommitView.as_view()),
    path('courses/import/batches', views.ImportListView.as_view()),
]

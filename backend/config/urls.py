from django.urls import path, include
from django.http import JsonResponse


def health(_request):
    return JsonResponse({'success': True, 'data': {'status': 'ok', 'service': 'CQI'}})


urlpatterns = [
    path('api/health', health),
    path('api/', include('apps.users.api.urls')),
    path('api/', include('apps.courses.api.urls')),
    path('api/', include('apps.fileList.api.urls')),
]

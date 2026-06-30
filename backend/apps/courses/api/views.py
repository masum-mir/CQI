from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.utils.response import ok, created
from core.permissions import IsAdmin, IsAdminOrChair
from apps.courses.services import course_service, catalog_service, import_service


# --- Course catalog --------------------------------------------------------
class CatalogListCreateView(APIView):
    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else super().get_permissions()

    def get(self, request):
        return ok(catalog_service.list_catalog(request.query_params))

    def post(self, request):
        return created(catalog_service.create_catalog(request.data))


class CatalogDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        return ok(catalog_service.update_catalog(pk, request.data))

    def delete(self, request, pk):
        return ok(catalog_service.delete_catalog(pk))


# --- Courses ---------------------------------------------------------------
class CourseListCreateView(APIView):
    def get_permissions(self):
        return [IsAdminOrChair()] if self.request.method == 'POST' else super().get_permissions()

    def get(self, request):
        return ok(course_service.list_courses(request.user, request.query_params))

    def post(self, request):
        return created(course_service.create_course(request.data))


class CourseDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'PATCH':
            return [IsAdminOrChair()]
        if self.request.method == 'DELETE':
            return [IsAdmin()]
        return super().get_permissions()

    def get(self, request, pk):
        return ok(course_service.get_course(request.user, pk))

    def patch(self, request, pk):
        return ok(course_service.update_course(pk, request.data))

    def delete(self, request, pk):
        return ok(course_service.delete_course(pk))


# --- Import (admin) --------------------------------------------------------
class ImportPreviewView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        departments = request.data.get('departments')
        if isinstance(departments, str):
            departments = [d.strip() for d in departments.split(',') if d.strip()]
        return created(import_service.preview(request.FILES.get('file'),
                                              departments, request.user.id))


class ImportCommitView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        return ok(import_service.commit(pk, request.user.id))


class ImportListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return ok(import_service.list_batches())

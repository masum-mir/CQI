"""Thin DRF controllers for the fileList domain."""
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.utils.response import ok, created
from core.permissions import IsAdmin, IsFacultyOrAdmin, IsChairOrAdmin
from apps.fileList.services import item_service, course_file_service, document_service


# --- Required items --------------------------------------------------------
class ItemListCreateView(APIView):
    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else super().get_permissions()

    def get(self, request):
        return ok(item_service.list_items())

    def post(self, request):
        return created(item_service.upsert_item(request.data))


class ItemDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, item_no):
        return ok(item_service.update_item(item_no, request.data))


# --- Course files ----------------------------------------------------------
class CourseFileListCreateView(APIView):
    def get(self, request):
        return ok(course_file_service.list_course_files(request.user, request.query_params))

    def post(self, request):
        return created(course_file_service.create_course_file(request.user, request.data))


class CourseFileDetailView(APIView):
    def get(self, request, pk):
        return ok(course_file_service.get_course_file(request.user, pk))


class CourseFileUploadView(APIView):
    permission_classes = [IsFacultyOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        result = course_file_service.upload_document(
            request.user, pk, request.FILES.get('file'), request.data)
        return created(result)


class CourseFileSubmitView(APIView):
    permission_classes = [IsFacultyOrAdmin]

    def patch(self, request, pk):
        return ok(course_file_service.submit(request.user, pk))


class CourseFileReviewView(APIView):
    permission_classes = [IsChairOrAdmin]

    def patch(self, request, pk):
        return ok(course_file_service.review(request.user, pk, request.data))


# --- Documents -------------------------------------------------------------
class DocumentDownloadView(APIView):
    def get(self, request, pk):
        path, original_name = document_service.resolve_download(request.user, pk)
        return FileResponse(open(path, 'rb'), as_attachment=True, filename=original_name)


class DocumentDetailView(APIView):
    permission_classes = [IsFacultyOrAdmin]

    def delete(self, request, pk):
        return ok(document_service.delete_document(request.user, pk))


class DocumentReviewView(APIView):
    permission_classes = [IsChairOrAdmin]

    def patch(self, request, pk):
        return ok(document_service.review_document(pk, request.data))

from django.http import FileResponse
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView

from core.permissions import IsChairOrFaculty
from core.utils.response import created, ok

from apps.fileList.services import course_file_service, document_service


class CourseFileListCreateView(APIView):
    def get(self, request):
        return ok(
            course_file_service.list_course_files(
                request.user,
                request.query_params,
            )
        )

    def post(self, request):
        return created(
            course_file_service.create_course_file(
                request.user,
                request.data,
            )
        )


class CourseFileDetailView(APIView):
    def get(self, request, pk):
        return ok(course_file_service.get_course_file(request.user, pk))


class CourseFileUploadView(APIView):
    permission_classes = [IsChairOrFaculty]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        result = document_service.upload_document(
            request.user,
            pk,
            request.FILES.get("file"),
            request.data,
        )
        return created(result)


class CourseFileSubmitView(APIView):
    permission_classes = [IsChairOrFaculty]

    def patch(self, request, pk):
        return ok(course_file_service.submit(request.user, pk))


class CourseFileReviewView(APIView):
    permission_classes = [IsChairOrFaculty]

    def patch(self, request, pk):
        return ok(course_file_service.review(request.user, pk, request.data))


class DocumentDownloadView(APIView):
    def get(self, request, pk):
        path, download_name = document_service.resolve_download(request.user, pk)
        return FileResponse(
            open(path, "rb"),
            as_attachment=True,
            filename=download_name,
        )


class DocumentDetailView(APIView):
    permission_classes = [IsChairOrFaculty]

    def delete(self, request, pk):
        return ok(document_service.delete_document(request.user, pk))


class DocumentReviewView(APIView):
    permission_classes = [IsChairOrFaculty]

    def patch(self, request, pk):
        return ok(document_service.review_document(request.user, pk, request.data))
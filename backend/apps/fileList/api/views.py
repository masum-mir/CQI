# """Thin DRF controllers for the fileList domain."""
#
# from django.http import FileResponse
# from pymongo.response import Response
# from rest_framework.views import APIView
# from rest_framework.parsers import MultiPartParser, FormParser
#
# from core.utils.response import ok, created
# from core.permissions import IsFacultyOrAdmin, IsChairOrAdmin
#
# from apps.fileList.services import course_file_service, document_service
#
#
# # --- Course files ----------------------------------------------------------
# class CourseFileListCreateView(APIView):
#     def get(self, request):
#         return ok(
#             course_file_service.list_course_files(
#                 request.user,
#                 request.query_params
#             )
#         )
#
#     def post(self, request):
#         return created(
#             course_file_service.create_course_file(
#                 request.user,
#                 request.data
#             )
#         )
#
#
# class CourseFileDetailView(APIView):
#     def get(self, request, pk):
#         try:
#             data = course_file_service.get_course_file(pk)
#             return Response({"data": data})
#         except Exception as e:
#             return Response({"message": str(e)}, status=500)
#
#
# # --- Upload Document -------------------------------------------------------
# class CourseFileUploadView(APIView):
#     permission_classes = [IsFacultyOrAdmin]
#     parser_classes = [MultiPartParser, FormParser]
#
#     def post(self, request, pk):
#         result = document_service.upload_document(
#             request.user,
#             pk,
#             request.FILES.get("file"),
#             request.data
#         )
#         return created(result)
#
#
# # --- Course File Workflow --------------------------------------------------
# class CourseFileSubmitView(APIView):
#     permission_classes = [IsFacultyOrAdmin]
#
#     def patch(self, request, pk):
#         return ok(
#             course_file_service.submit(
#                 request.user,
#                 pk
#             )
#         )
#
#
# class CourseFileReviewView(APIView):
#     permission_classes = [IsChairOrAdmin]
#
#     def patch(self, request, pk):
#         return ok(
#             course_file_service.review(
#                 request.user,
#                 pk,
#                 request.data
#             )
#         )
#
#
# # --- Documents -------------------------------------------------------------
# class DocumentDownloadView(APIView):
#     def get(self, request, pk):
#         path, original_name = document_service.resolve_download(
#             request.user,
#             pk
#         )
#         return FileResponse(
#             open(path, "rb"),
#             as_attachment=True,
#             filename=original_name
#         )
#
#
# class DocumentDetailView(APIView):
#     permission_classes = [IsFacultyOrAdmin]
#
#     def delete(self, request, pk):
#         return ok(
#             document_service.delete_document(
#                 request.user,
#                 pk
#             )
#         )
#
#
# class DocumentReviewView(APIView):
#     permission_classes = [IsChairOrAdmin]
#
#     def patch(self, request, pk):
#         return ok(
#             document_service.review_document(
#                 request.user,
#                 pk,
#                 request.data
#             )
#         )

"""Thin DRF controllers for the fileList domain."""

from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from core.utils.response import ok, created
from core.permissions import IsFacultyOrAdmin, IsChairOrAdmin

from apps.fileList.services import course_file_service, document_service


# --- Course files ----------------------------------------------------------
class CourseFileListCreateView(APIView):
    def get(self, request):
        return ok(course_file_service.list_course_files(request.user, request.query_params))

    def post(self, request):
        return created(course_file_service.create_course_file(request.user, request.data))


class CourseFileDetailView(APIView):
    def get(self, request, pk):
        # returns { courseFile, documents, completeness } via the standard envelope
        return ok(course_file_service.get_course_file(request.user, pk))


# --- Upload Document -------------------------------------------------------
class CourseFileUploadView(APIView):
    permission_classes = [IsFacultyOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        result = document_service.upload_document(
            request.user, pk, request.FILES.get("file"), request.data)
        return created(result)


# --- Course File Workflow --------------------------------------------------
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
        return FileResponse(open(path, "rb"), as_attachment=True, filename=original_name)


class DocumentDetailView(APIView):
    permission_classes = [IsFacultyOrAdmin]

    def delete(self, request, pk):
        return ok(document_service.delete_document(request.user, pk))


class DocumentReviewView(APIView):
    permission_classes = [IsChairOrAdmin]

    def patch(self, request, pk):
        return ok(document_service.review_document(request.user, pk, request.data))
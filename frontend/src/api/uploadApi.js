// import api from './axios'

// // NOTE: The backend has no generic `/uploads/` route. Uploads go through
// // `/course-files/<courseFileId>/upload`, one file per call, using the
// // field name `file` (not `files[]`), plus itemNo / subItem / isAdditional.
// // This file was rewritten to match apps/fileList/api/urls.py + course_file_service.py.

// export const uploadApi = {
//   /**
//    * Upload a single file to a course file's slot.
//    * @param {string} courseFileId - the course file (_id) this upload belongs to
//    * @param {File} file - the File object to upload
//    * @param {Object} meta
//    * @param {number|string} [meta.itemNo] - required item number (server: parse_int)
//    * @param {string} [meta.subItem] - sub item key, if the item has sub items
//    * @param {boolean} [meta.isAdditional] - true for free-form "additional work" uploads
//    * @param {function} [onProgress] - progress callback (percentage)
//    */
//   upload: (courseFileId, file, meta = {}, onProgress) => {
//     const form = new FormData()
//     form.append('file', file)

//     if (meta.itemNo != null) form.append('itemNo', meta.itemNo)
//     if (meta.subItem) form.append('subItem', meta.subItem)
//     if (meta.isAdditional) form.append('isAdditional', 'true')

//     return api.post(`/course-files/${courseFileId}/upload`, form, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//       onUploadProgress: (e) => {
//         if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total))
//       },
//     })
//   },

//   // Fetch a course file, including its documents + completeness report.
//   get: (courseFileId) => api.get(`/course-files/${courseFileId}`),

//   // List course files (optionally filtered by ?status=&semester= on the backend).
//   list: (params) => api.get('/course-files', { params }),

//   // Create (or fetch existing) course file for a given courseId.
//   create: (courseId) => api.post('/course-files', { courseId }),

//   // Submit a course file for review once all required items are fulfilled.
//   submit: (courseFileId) => api.post(`/course-files/${courseFileId}/submit`),

//   // Admin/chair review decision: 'approved' | 'rejected' | 'under_review'.
//   review: (courseFileId, decision, comment) =>
//     api.post(`/course-files/${courseFileId}/review`, { decision, comment }),
// }

import api from "./axios";

export const courseFileApi = {
  // Create or get existing course file
  create: (courseId) =>
    api.post("/course-files", { courseId }),

  // List course files
  list: (params) =>
    api.get("/course-files", { params }),

  // Get single course file + documents + summary
  get: (courseFileId) =>
    api.get(`/course-files/${courseFileId}`),

  // Upload file into a slot
  upload: (courseFileId, file, meta = {}, onProgress) => {
    const form = new FormData();

    form.append("file", file);

    // backend expects:
    // itemNo (required for normal uploads)
    if (meta.itemNo != null) {
      form.append("itemNo", meta.itemNo);
    }

    // optional (ONLY if backend supports sub items)
    if (meta.subItem) {
      form.append("subItem", meta.subItem);
    }

    // optional additional upload
    if (meta.isAdditional) {
      form.append("isAdditional", "true");
    }

    return api.post(`/course-files/${courseFileId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  // submit course file
  submit: (courseFileId) =>
    api.patch(`/course-files/${courseFileId}/submit`),

  // review course file (chair/admin)
  review: (courseFileId, decision, comment) =>
    api.patch(`/course-files/${courseFileId}/review`, {
      decision,
      comment,
    }),
};
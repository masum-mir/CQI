// import api from "./apiClient";

// export const courseFileApi = {
//   // Create or get existing course file
//   create: (courseId) => api.post("/course-files", { courseId }),

//   // List course files
//   list: (params) => api.get("/course-files", { params }),

//   // Get single course file + documents + summary
//   get: (courseFileId) => api.get(`/course-files/${courseFileId}`),

//   // Upload file into a slot
//   upload: (courseFileId, file, meta = {}, onProgress) => {
//     const form = new FormData();

//     form.append("file", file);

//     // backend expects:
//     // itemNo (required for normal uploads)
//     if (meta.itemNo != null) {
//       form.append("itemNo", meta.itemNo);
//     }

//     // optional (ONLY if backend supports sub items)
//     if (meta.subItem) {
//       form.append("subItem", meta.subItem);
//     }

//     // optional additional upload
//     if (meta.isAdditional) {
//       form.append("isAdditional", "true");
//     }

//     return api.post(`/course-files/${courseFileId}/upload`, form, {
//       headers: { "Content-Type": "multipart/form-data" },
//       onUploadProgress: (e) => {
//         if (e.total && onProgress) {
//           onProgress(Math.round((e.loaded * 100) / e.total));
//         }
//       },
//     });
//   },

//   // submit course file
//   submit: (courseFileId) => api.patch(`/course-files/${courseFileId}/submit`),

//   // review course file (chair/admin)
//   review: (courseFileId, decision, comment) =>
//     api.patch(`/course-files/${courseFileId}/review`, {
//       decision,
//       comment,
//     }),
// };

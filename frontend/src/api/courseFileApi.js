// import api from './axios'

// export const courseFileApi = {
//   list: ({ status, semester } = {}) =>
//     api.get('/course-files', { params: { status, semester } }),

//   get: (id) => api.get(`/course-files/${id}`),

//   create: (courseId) => api.post('/course-files', { courseId }),

//   // file: a File object; meta: { itemNo, isAdditional }
//   upload: (cfId, file, meta = {}) => {
//     const form = new FormData()
//     form.append('file', file)
//     if (meta.isAdditional) {
//       form.append('isAdditional', 'true')
//       if (meta.itemNo) form.append('itemNo', meta.itemNo)
//     } else {
//       form.append('itemNo', meta.itemNo)
//     }
//     return api.post(`/course-files/${cfId}/upload`, form, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     })
//   },

//   submit: (cfId) => api.patch(`/course-files/${cfId}/submit`),

//   // decision: 'approved' | 'rejected' | 'under_review'
//   review: (cfId, decision, comment) =>
//     api.patch(`/course-files/${cfId}/review`, { decision, comment }),
// }

import api from "./axios";

export const courseFileApi = {
  list: ({ status, semester } = {}) =>
    api.get("/course-files", { params: { status, semester } }),

  get: (id) =>
    api.get(`/course-files/${id}`),

  create: (courseId) =>
    api.post("/course-files", { courseId }),

  upload: (cfId, file, meta = {}) => {
    const form = new FormData();

    form.append("file", file);

    const { itemNo, isAdditional } = meta;

    // CASE 1: additional file
    if (isAdditional) {
      form.append("isAdditional", "true");
      if (itemNo != null) {
        form.append("itemNo", itemNo); // optional safety only
      }
    }

    // CASE 2: normal required slot file
    else {
      if (itemNo == null) {
        throw new Error("itemNo is required for normal upload");
      }
      form.append("itemNo", itemNo);
    }

    return api.post(`/course-files/${cfId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  submit: (cfId) =>
    api.patch(`/course-files/${cfId}/submit`),

  review: (cfId, decision, comment) =>
    api.patch(`/course-files/${cfId}/review`, {
      decision,
      comment,
    }),
};
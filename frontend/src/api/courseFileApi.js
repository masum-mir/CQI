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

let mockDocCounter = 0
const mockDocsByCfId = {}

export const courseFileApi = {
  list: () =>
    Promise.resolve({ data: { data: { courseFiles: [] } } }),

  get: (id) =>
    Promise.resolve({ data: { data: { documents: mockDocsByCfId[id] || [] } } }),

  create: (courseId) => {
    const cfId = `mock-cf-${courseId}-${Date.now()}`
    mockDocsByCfId[cfId] = []
    return Promise.resolve({ data: { data: { courseFile: { id: cfId, course: courseId } } } })
  },

  upload: (cfId, file, meta = {}) => {
    mockDocCounter++
    const doc = {
      id: `mock-doc-${mockDocCounter}`,
      itemNo: meta.itemNo,
      isAdditional: !!meta.isAdditional,
      storage: {
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        fileName: file.name,
      },
      review: { status: 'pending' },
      createdAt: new Date().toISOString(),
    }
    if (!mockDocsByCfId[cfId]) mockDocsByCfId[cfId] = []
    mockDocsByCfId[cfId].push(doc)
    return Promise.resolve({ data: { data: { document: doc } } })
  },

  submit: (cfId) =>
    Promise.resolve({ data: { message: 'Submitted' } }),

  review: (cfId, decision, comment) =>
    Promise.resolve({ data: { message: 'Reviewed' } }),
};
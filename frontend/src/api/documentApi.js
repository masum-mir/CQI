// import api from './axios'

// export const documentApi = {
//   // Authenticated download — the endpoint requires a Bearer token, so a plain
//   // <a href> won't work. Fetches as a blob and triggers a browser download.
//   download: async (id, suggestedName) => {
//     const { blob, filename } = await documentApi.fetchBlob(id, suggestedName)
//     const url = window.URL.createObjectURL(blob)
//     const link = document.createElement('a')
//     link.href = url
//     link.download = filename
//     document.body.appendChild(link)
//     link.click()
//     link.remove()
//     window.URL.revokeObjectURL(url)
//   },

//   // Same authenticated fetch, but returns the blob instead of saving it —
//   // used for inline preview (object URL fed into <img>/<Document>).
//   fetchBlob: async (id, suggestedName) => {
//     const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' })
//     const disposition = res.headers['content-disposition']
//     const match = disposition && /filename="?([^"]+)"?/.exec(disposition)
//     const filename = match?.[1] || suggestedName || 'document'
//     return { blob: res.data, filename, mime: res.data.type }
//   },

//   remove: (id) => api.delete(`/documents/${id}`),

//   // status: 'pending' | 'approved' | 'rejected'
//   review: (id, status, remark) => api.patch(`/documents/${id}/review`, { status, remark }),
// }


export const documentApi = {
  download: async (id, suggestedName) => {
    console.log('[MOCK] download', id, suggestedName)
  },

  fetchBlob: async (id) => {
    const blob = new Blob(['Mock file content'], { type: 'application/pdf' })
    return { blob, mime: 'application/pdf' }
  },

  remove: (id) =>
    Promise.resolve({ data: { message: 'Deleted' } }),

  review: (id, status, remark) =>
    Promise.resolve({ data: { message: 'Reviewed' } }),
};
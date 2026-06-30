import api from './axios'

export const importApi = {
  // file: a File object from an <input type="file">; departments: optional array of dept codes
  preview: (file, departments) => {
    const form = new FormData()
    form.append('file', file)
    if (departments?.length) form.append('departments', departments.join(','))
    return api.post('/courses/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  commit: (batchId) => api.post(`/courses/import/${batchId}/commit`),

  listBatches: () => api.get('/courses/import/batches'),
}

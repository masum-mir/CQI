import api from './axios'

export const uploadApi = {
  /**
   * Upload files with categories
   * @param {string} faculty - e.g. "CSE"
   * @param {string} semester - e.g. "Spring 2026"
   * @param {File[]} files - array of File objects
   * @param {string[]} categories - array of category strings (same length as files)
   * @param {function} onProgress - progress callback (percentage)
   */
  upload: (faculty, semester, files, categories, onProgress) => {
    const form = new FormData()
    form.append('faculty', faculty)
    form.append('semester', semester)

    files.forEach((file, index) => {
      form.append('files[]', file)
      form.append('categories[]', categories[index] || '')
    })

    return api.post('/uploads/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total))
      },
    })
  },

  list: () => api.get("/uploads/"),
  getById: (id) => api.get(`/uploads/${id}/`),
  delete: (id) => api.delete(`/uploads/${id}/`),
}
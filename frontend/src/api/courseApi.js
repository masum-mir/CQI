import api from './axios'

export const courseApi = {
  list: ({ semester, courseCode, faculty } = {}) =>
    api.get('/courses', { params: { semester, courseCode, faculty } }),

  get: (id) => api.get(`/courses/${id}`),

  create: (data) => api.post('/courses', data),

  update: (id, data) => api.patch(`/courses/${id}`, data),

  remove: (id) => api.delete(`/courses/${id}`),
}

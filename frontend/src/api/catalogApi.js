import api from './axios'

export const catalogApi = {
  list: ({ department } = {}) => api.get('/catalog', { params: { department } }),

  create: (data) => api.post('/catalog', data),

  update: (id, data) => api.patch(`/catalog/${id}`, data),

  remove: (id) => api.delete(`/catalog/${id}`),
}

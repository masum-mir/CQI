import api from './axios'

export const userApi = {
  list: ({ role, status } = {}) =>
    api.get('/users', { params: { role: role || undefined, status: status || undefined } }),

  get: (id) => api.get(`/users/${id}`),

  create: (data) => api.post('/users', data),

  update: (id, data) => api.patch(`/users/${id}`, data),

  remove: (id) => api.delete(`/users/${id}`),
}

export const roleApi = {
  list: () => api.get('/roles'),
}

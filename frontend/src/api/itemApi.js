import api from './axios'

export const itemApi = {
  list: () => api.get('/items'),

  // Admin only — POST does an upsert by itemNo (create or fully replace)
  upsert: (data) => api.post('/items', data),

  // Admin only — partial update of an existing item
  update: (itemNo, data) => api.patch(`/items/${itemNo}`, data),
}

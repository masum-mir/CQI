import api from './axios'

// export const authApi = {
//   register: (data)  => api.post('/auth/register/', data),
//   login:    (data)  => api.post('/auth/login',    data),
//   refresh:  (token) => api.post('/auth/refresh/', { refresh: token }),
//   me:       ()      => api.get('/auth/me/'),
// }


export const authApi = {
  register: ({ name, email, password, shortCode, department, designation, employeeId, profileImage }) =>
    // api.post('/api/auth/register', { name, email, password, shortCode, department, designation, employeeId, profileImage }),
    api.post('/auth/register', { name, email, password, shortCode, department, designation, employeeId, profileImage }),

  login: ({ email, password }) => api.post('/auth/login', { email, password }),

  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),

  googleAuth: (payload) => api.post('/auth/google', payload),

  verifyEmail: (token) => api.post('/auth/verify-email', { token }),

  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: ({ token, password }) => api.post('/auth/reset-password', { token, password }),

  me: () => api.get('/auth/me'),
  // login: ({ email, password }) => api.post('/api/auth/login', { email, password }),

  // refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),

  // logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),

  // googleAuth: (payload) => api.post('/api/auth/google', payload),

  // verifyEmail: (token) => api.post('/api/auth/verify-email', { token }),

  // requestPasswordReset: (email) => api.post('/api/auth/forgot-password', { email }),

  // resetPassword: ({ token, password }) => api.post('/api/auth/reset-password', { token, password }),

  // me: () => api.get('/api/auth/me'),
}

import api from "./apiClient";

export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  googleAuth: (payload) => api.post("/auth/google", payload),
  refresh: () => api.post("/auth/refresh", {}),
  logout: () => api.post("/auth/logout", {}),
  me: () => api.get("/auth/me"),

  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/auth/reset-password", { token, password }),
};

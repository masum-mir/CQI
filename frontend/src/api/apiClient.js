import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
  },
})

let isRefreshing = false
let queue = []

function flushQueue(error = null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve()
  })
  queue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (
      status !== 401 ||
      original?._retry ||
      original?.url?.includes("/auth/refresh") ||
      original?.url?.includes("/auth/login")
    ) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject })
      }).then(() => api(original))
    }

    original._retry = true
    isRefreshing = true

    try {
      await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )

      flushQueue()
      return api(original)
    } catch (refreshError) {
      flushQueue(refreshError)

      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api

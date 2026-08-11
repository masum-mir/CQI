import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const persistUser = useCallback((response) => {
    const currentUser = response.data.data.user
    setUser(currentUser)
    return currentUser
  }, [])

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password })
      return persistUser(res)
    },
    [persistUser]
  )

  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload)
      return persistUser(res)
    },
    [persistUser]
  )

  const googleLogin = useCallback(
    async (idToken) => {
      const res = await authApi.googleAuth({ idToken })
      return persistUser(res)
    },
    [persistUser]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Cookie cleanup is also performed server-side on normal logout.
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }, [])

  const hasRole = useCallback(
    (...roles) => !!user?.role && roles.includes(user.role),
    [user]
  )

  return { user, loading, login, register, googleLogin, logout, hasRole }
}
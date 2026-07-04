import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/authApi'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.data.data.user))
      .catch(() => {
        localStorage.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

const _persistSession = ({ user, accessToken, refreshToken }) => {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
  setUser(user)
  return user
}
  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    console.log("LOGIN RESPONSE:", res.data);
    return _persistSession(res.data.data)
  }, [])

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload)
    return _persistSession(res.data.data)
  }, [])

  const googleLogin = useCallback(async (idToken) => {
    const res = await authApi.googleAuth({ idToken })
    return _persistSession(res.data.data)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // logout is best-effort server-side; clear local session regardless
    } finally {
      localStorage.clear()
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

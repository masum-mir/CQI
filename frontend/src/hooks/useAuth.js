// import { useState, useEffect, useCallback } from "react";
// import { authApi } from "../api/authApi";

// export function useAuth() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const token = localStorage.getItem("access_token");
//     if (!token) {
//       setLoading(false);
//       return;
//     }
//     authApi
//       .me()
//       .then((res) => setUser(res.data))
//       .catch(() => {
//         localStorage.clear();
//         setUser(null);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const login = useCallback(async (username, password) => {
//     const res = await authApi.login({ username, password });
//     localStorage.setItem("access_token", res.data.access);
//     localStorage.setItem("refresh_token", res.data.refresh);
//     setUser(res.data.user);
//     return res.data.user;
//   }, []);

//   const register = useCallback(async (username, password, email) => {
//     const res = await authApi.register({ username, password, email });
//     localStorage.setItem("access_token", res.data.access);
//     localStorage.setItem("refresh_token", res.data.refresh);
//     setUser(res.data.user);
//     return res.data.user;
//   }, []);

//   const logout = useCallback(() => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//     setUser(null);
//     window.location.href = "/login";
//   }, []);

//   return { user, loading, login, register, logout };
// }

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

  const register = useCallback(async (name, email, password, extra = {}) => { 
    const res = await authApi.register({ name, email, password, ...extra })
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

  return { user, loading, login, register, logout, hasRole }
}

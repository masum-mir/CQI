import {
  clearSession,
  getSessionUser,
  makeError,
  makeResponse,
  mutateDb,
  newId,
  normalizeProfileImage,
  sanitizeUser,
  setSessionUser,
  readDb,
} from '@/mock/mockDb'

export const authApi = {
  register: async (payload) => {
    const email = String(payload.email || '').trim().toLowerCase()
    if (!email || !payload.password) throw makeError('Email and password are required')

    const user = mutateDb((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        throw makeError('An account with this email already exists')
      }

      const created = {
        id: newId('usr'),
        name: payload.name?.trim() || 'Faculty User',
        email,
        password: payload.password,
        role: 'faculty',
        department: payload.department || 'CSE',
        designation: payload.designation || 'Lecturer',
        employeeId: payload.employeeId || '',
        shortCode: payload.shortCode || '',
        mobile: payload.mobile || '',
        status: 'active',
        profileImage: normalizeProfileImage(payload.profileImage),
      }
      db.users.push(created)
      return created
    })

    setSessionUser(user.id)
    return makeResponse({ user: sanitizeUser(user) })
  },

  login: async ({ email, password }) => {
    const normalized = String(email || '').trim().toLowerCase()
    const db = readDb()
    const user = db.users.find((u) => u.email.toLowerCase() === normalized)

    if (!user || user.password !== password) throw makeError('Invalid email or password', 401)
    if (user.status === 'inactive') throw makeError('This account is inactive', 403)

    setSessionUser(user.id)
    return makeResponse({ user: sanitizeUser(user) })
  },

  googleAuth: async () => {
    throw makeError('Google sign-in is disabled in frontend-only demo mode')
  },

  refresh: () => makeResponse({ ok: true }),

  logout: async () => {
    clearSession()
    return makeResponse({ ok: true })
  },

  me: async () => {
    const user = getSessionUser()
    if (!user) throw makeError('Authentication required', 401)
    return makeResponse({ user })
  },

  verifyEmail: () => makeResponse({ ok: true }),
  forgotPassword: () => makeResponse({ ok: true }),
  resetPassword: () => makeResponse({ ok: true }),
}

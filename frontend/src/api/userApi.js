import {
  getSessionUser,
  makeError,
  makeResponse,
  mutateDb,
  newId,
  normalizeProfileImage,
  readDb,
  sanitizeUser,
} from '@/mock/mockDb'

function assertAdmin() {
  const current = getSessionUser()
  if (current?.role !== 'admin') throw makeError('Administrator access required', 403)
}

function matchesRole(user, role) {
  if (!role) return true
  if (Array.isArray(role)) return role.includes(user.role)
  return user.role === role
}

export const userApi = {
  list: async ({ role, status } = {}) => {
    let users = readDb().users
      .filter((u) => matchesRole(u, role))
      .filter((u) => !status || u.status === status)
      .map(sanitizeUser)
    return makeResponse({ users })
  },

  get: async (id) => {
    const user = readDb().users.find((u) => u.id === id)
    if (!user) throw makeError('User not found', 404)
    return makeResponse({ user: sanitizeUser(user) })
  },

  create: async (data) => {
    assertAdmin()
    const created = mutateDb((db) => {
      const email = String(data.email || '').trim().toLowerCase()
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        throw makeError('Email already exists')
      }
      const user = {
        id: newId('usr'),
        name: data.name || 'New User',
        email,
        password: data.password || '12345678',
        role: data.role || 'faculty',
        department: data.department || 'CSE',
        designation: data.designation || '',
        employeeId: data.employeeId || '',
        shortCode: data.shortCode || '',
        mobile: data.mobile || '',
        status: data.status || 'active',
        profileImage: normalizeProfileImage(data.profileImage),
      }
      db.users.push(user)
      return user
    })
    return makeResponse({ user: sanitizeUser(created) })
  },

  update: async (id, data) => {
    assertAdmin()
    const updated = mutateDb((db) => {
      const user = db.users.find((u) => u.id === id)
      if (!user) throw makeError('User not found', 404)
      Object.assign(user, data)
      if (data.profileImage) user.profileImage = normalizeProfileImage(data.profileImage)
      return user
    })
    return makeResponse({ user: sanitizeUser(updated) })
  },

  remove: async (id) => {
    assertAdmin()
    const current = getSessionUser()
    if (current?.id === id) throw makeError('You cannot delete your own account')
    mutateDb((db) => {
      const index = db.users.findIndex((u) => u.id === id)
      if (index < 0) throw makeError('User not found', 404)
      db.users.splice(index, 1)
    })
    return makeResponse({ ok: true })
  },

  importUsers: async (users) => {
    assertAdmin()
    const result = mutateDb((db) => {
      let created = 0
      let skipped = 0
      let failed = 0
      users.forEach((row) => {
        try {
          const email = String(row.email || '').trim().toLowerCase()
          if (!email || !row.name) {
            failed += 1
            return
          }
          if (db.users.some((u) => u.email.toLowerCase() === email)) {
            skipped += 1
            return
          }
          db.users.push({
            id: newId('usr'),
            ...row,
            email,
            password: row.password || '1234',
            role: row.role || 'faculty',
            status: row.status || 'active',
            profileImage: { url: '', provider: 'mock' },
          })
          created += 1
        } catch {
          failed += 1
        }
      })
      return { total: users.length, created, skipped, failed }
    })
    return makeResponse(result)
  },
}

export const roleApi = {
  list: () => makeResponse({ roles: ['faculty', 'chairperson', 'admin'] }),
}

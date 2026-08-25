import {
  getSessionUser,
  makeError,
  makeResponse,
  mutateDb,
  newId,
  readDb,
  withCourseComputed,
} from '@/mock/mockDb'

function canManageCourses() {
  return ['admin', 'chairperson'].includes(getSessionUser()?.role)
}

export const courseApi = {
  list: async (params = {}) => {
    const db = readDb()
    let courses = db.courses
    if (params?.semester) courses = courses.filter((c) => c.semester === params.semester)
    if (params?.facultyId) {
      const faculty = db.users.find((u) => u.id === params.facultyId)
      if (faculty?.shortCode) courses = courses.filter((c) => c.facultyCode === faculty.shortCode)
    }
    return makeResponse({ courses: courses.map((c) => withCourseComputed(c, db)) })
  },

  get: async (id) => {
    const db = readDb()
    const course = db.courses.find((c) => c.id === id)
    if (!course) throw makeError('Course not found', 404)
    return makeResponse({ course: withCourseComputed(course, db) })
  },

  create: async (data) => {
    if (!canManageCourses()) throw makeError('Course management access required', 403)
    const created = mutateDb((db) => {
      const duplicate = db.courses.some(
        (c) => c.courseCode === data.courseCode && c.section === data.section && c.semester === data.semester,
      )
      if (duplicate) throw makeError('This course offering already exists')
      const course = {
        id: newId('crs'),
        courseCode: data.courseCode,
        section: data.section,
        title: data.title || data.courseCode,
        semester: data.semester,
        type: data.type || 'theory',
        department: data.department || 'CSE',
        facultyCode: data.facultyCode || '',
        capacity: data.capacity || { total: 40, enrolled: 0 },
      }
      db.courses.push(course)
      return withCourseComputed(course, db)
    })
    return makeResponse({ course: created })
  },

  update: async (id, data) => {
    if (!canManageCourses()) throw makeError('Course management access required', 403)
    const updated = mutateDb((db) => {
      const course = db.courses.find((c) => c.id === id)
      if (!course) throw makeError('Course not found', 404)
      Object.assign(course, data)
      return withCourseComputed(course, db)
    })
    return makeResponse({ course: updated })
  },

  remove: async (id) => {
    if (getSessionUser()?.role !== 'admin') throw makeError('Administrator access required', 403)
    mutateDb((db) => {
      const cfIds = db.courseFiles.filter((cf) => cf.course === id).map((cf) => cf.id)
      db.documents = db.documents.filter((d) => !cfIds.includes(d.courseFileId))
      db.courseFiles = db.courseFiles.filter((cf) => cf.course !== id)
      db.courses = db.courses.filter((c) => c.id !== id)
    })
    return makeResponse({ ok: true })
  },
}

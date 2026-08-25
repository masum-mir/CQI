import {
  getCurrentRawUser,
  getDocumentBlob,
  getSessionUser,
  makeError,
  makeResponse,
  mutateDb,
  newId,
  readDb,
  rememberBlob,
  withCourseFileComputed,
} from '@/mock/mockDb'

function visibleCourseFiles(db) {
  const user = getCurrentRawUser(db)
  if (!user) return []
  if (user.role !== 'faculty') return db.courseFiles
  const ownCourseIds = new Set(
    db.courses.filter((c) => c.facultyCode === user.shortCode).map((c) => c.id),
  )
  return db.courseFiles.filter((cf) => ownCourseIds.has(cf.course))
}

export const courseFileApi = {
  list: async ({ status, semester } = {}) => {
    const db = readDb()
    let list = visibleCourseFiles(db)
    if (status) list = list.filter((cf) => cf.status === status)
    if (semester) list = list.filter((cf) => (cf.semester || '') === semester)
    return makeResponse({ courseFiles: list.map((cf) => withCourseFileComputed(cf, db)) })
  },

  get: async (id) => {
    const db = readDb()
    const courseFile = visibleCourseFiles(db).find((cf) => cf.id === id)
    if (!courseFile) throw makeError('Course file not found', 404)
    const documents = db.documents.filter((d) => d.courseFileId === id)
    return makeResponse({ courseFile: withCourseFileComputed(courseFile, db), documents })
  },

  create: async (courseId) => {
    const user = getSessionUser()
    if (!user) throw makeError('Authentication required', 401)

    const courseFile = mutateDb((db) => {
      const course = db.courses.find((c) => c.id === courseId)
      if (!course) throw makeError('Course not found', 404)
      if (user.role === 'faculty' && course.facultyCode !== user.shortCode) {
        throw makeError('You can only upload to your assigned courses', 403)
      }
      let existing = db.courseFiles.find((cf) => cf.course === courseId)
      if (existing) return withCourseFileComputed(existing, db)
      existing = {
        id: newId('cf'),
        course: courseId,
        semester: course.semester,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
      }
      db.courseFiles.push(existing)
      return withCourseFileComputed(existing, db)
    })
    return makeResponse({ courseFile })
  },

  upload: async (cfId, file, meta = {}) => {
    const document = mutateDb((db) => {
      const courseFile = db.courseFiles.find((cf) => cf.id === cfId)
      if (!courseFile) throw makeError('Course file not found', 404)

      if (!meta.isAdditional && meta.itemNo != null) {
        const existingIndex = db.documents.findIndex(
          (d) => d.courseFileId === cfId && !d.isAdditional && d.itemNo === Number(meta.itemNo),
        )
        if (existingIndex >= 0) db.documents.splice(existingIndex, 1)
      }

      const doc = {
        id: newId('doc'),
        courseFileId: cfId,
        itemNo: meta.itemNo != null ? Number(meta.itemNo) : null,
        isAdditional: Boolean(meta.isAdditional),
        storage: {
          originalName: file?.name || 'uploaded-file',
          fileName: file?.name || 'uploaded-file',
          size: file?.size || 0,
          mimeType: file?.type || 'application/octet-stream',
        },
        review: { status: 'pending', remark: '' },
        createdAt: new Date().toISOString(),
      }
      db.documents.push(doc)
      courseFile.status = 'in_progress'
      return doc
    })

    rememberBlob(document.id, file)
    return makeResponse({ document })
  },

  preview: async (id) => {
    const db = readDb()
    const doc = db.documents.find((d) => d.id === id)
    if (!doc) throw makeError('Document not found', 404)
    const buffer = await getDocumentBlob(doc).arrayBuffer()
    return { data: buffer }
  },

  submit: async (cfId) => {
    const updated = mutateDb((db) => {
      const cf = db.courseFiles.find((item) => item.id === cfId)
      if (!cf) throw makeError('Course file not found', 404)
      cf.status = 'submitted'
      return withCourseFileComputed(cf, db)
    })
    return makeResponse({ courseFile: updated })
  },

  review: async (cfId, decision, comment) => {
    const role = getSessionUser()?.role
    if (!['chairperson', 'admin'].includes(role)) throw makeError('Review access required', 403)
    const updated = mutateDb((db) => {
      const cf = db.courseFiles.find((item) => item.id === cfId)
      if (!cf) throw makeError('Course file not found', 404)
      cf.status = decision
      cf.reviewComment = comment || ''
      return withCourseFileComputed(cf, db)
    })
    return makeResponse({ courseFile: updated })
  },
}

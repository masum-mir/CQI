import {
  getDocumentBlob,
  getSessionUser,
  makeError,
  makeResponse,
  mutateDb,
  readDb,
} from '@/mock/mockDb'

export const documentApi = {
  download: async (id, suggestedName) => {
    const { blob, filename } = await documentApi.fetchBlob(id, suggestedName)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  fetchBlob: async (id, suggestedName) => {
    const doc = readDb().documents.find((d) => d.id === id)
    if (!doc) throw makeError('Document not found', 404)
    const blob = getDocumentBlob(doc)
    return {
      blob,
      filename: suggestedName || doc.storage?.originalName || 'document',
      mime: blob.type || doc.storage?.mimeType,
    }
  },

  remove: async (id) => {
    const current = getSessionUser()
    if (!current) throw makeError('Authentication required', 401)
    mutateDb((db) => {
      const doc = db.documents.find((d) => d.id === id)
      if (!doc) throw makeError('Document not found', 404)
      const cf = db.courseFiles.find((item) => item.id === doc.courseFileId)
      const course = db.courses.find((item) => item.id === cf?.course)
      const owns = current.role === 'faculty' && course?.facultyCode === current.shortCode
      if (!owns && current.role !== 'admin') throw makeError('You cannot delete this document', 403)
      db.documents = db.documents.filter((d) => d.id !== id)
    })
    return makeResponse({ ok: true })
  },

  review: async (id, status, remark = '') => {
    const current = getSessionUser()
    if (!['chairperson', 'admin'].includes(current?.role)) throw makeError('Review access required', 403)
    const document = mutateDb((db) => {
      const doc = db.documents.find((d) => d.id === id)
      if (!doc) throw makeError('Document not found', 404)
      doc.review = { ...(doc.review || {}), status, remark }
      return doc
    })
    return makeResponse({ document })
  },
}

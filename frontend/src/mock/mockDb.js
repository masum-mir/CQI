import seedData from '@/data/mockData.json'

const DB_KEY = 'cqi_mock_db_v2'
const SESSION_KEY = 'cqi_mock_session_v2'
const blobStore = new Map()

const clone = (value) => JSON.parse(JSON.stringify(value))

function newId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function ensureDb() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(seedData))
  }
}

export function readDb() {
  ensureDb()
  try {
    return JSON.parse(localStorage.getItem(DB_KEY))
  } catch {
    localStorage.setItem(DB_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }
}

export function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

export function mutateDb(mutator) {
  const db = readDb()
  const result = mutator(db)
  writeDb(db)
  return result
}

export function resetMockData() {
  localStorage.setItem(DB_KEY, JSON.stringify(seedData))
  localStorage.removeItem(SESSION_KEY)
  blobStore.clear()
}

export function setSessionUser(userId) {
  localStorage.setItem(SESSION_KEY, userId)
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSessionUser() {
  const id = localStorage.getItem(SESSION_KEY)
  if (!id) return null
  const user = readDb().users.find((item) => item.id === id)
  if (!user || user.status === 'inactive') return null
  return sanitizeUser(user)
}

export function sanitizeUser(user) {
  if (!user) return null
  const safe = clone(user)
  delete safe.password
  return safe
}

export function normalizeProfileImage(value) {
  if (!value) return { url: '', provider: 'mock' }
  if (typeof value === 'string') return { url: value, provider: 'local' }
  return value
}

export function makeResponse(data) {
  return Promise.resolve({ data: { data } })
}

export function makeError(message, status = 400) {
  const error = new Error(message)
  error.response = {
    status,
    data: { error: message, message, detail: message },
  }
  return error
}

export function withCourseComputed(course, db = readDb()) {
  const faculty = db.users.find(
    (u) => u.shortCode && course.facultyCode && u.shortCode.toLowerCase() === course.facultyCode.toLowerCase(),
  )
  return {
    ...clone(course),
    label: `${course.courseCode}-${course.section}`,
    facultyInfo: faculty ? sanitizeUser(faculty) : null,
  }
}

export function withCourseFileComputed(courseFile, db = readDb()) {
  const course = db.courses.find((c) => c.id === courseFile.course)
  return {
    ...clone(courseFile),
    semester: courseFile.semester || course?.semester || '',
    courseInfo: course
      ? {
          id: course.id,
          courseCode: course.courseCode,
          section: course.section,
          title: course.title,
          semester: course.semester,
          facultyCode: course.facultyCode,
          label: `${course.courseCode}-${course.section}`,
        }
      : null,
  }
}

export function getCurrentRawUser(db = readDb()) {
  const id = localStorage.getItem(SESSION_KEY)
  return db.users.find((u) => u.id === id) || null
}

export function rememberBlob(documentId, blob) {
  if (blob instanceof Blob) blobStore.set(documentId, blob)
}

function createPdfBlob(title = 'CQI Demo Document') {
  const safe = String(title).replace(/[()\\]/g, ' ')
  const content = `BT /F1 16 Tf 50 760 Td (${safe}) Tj 0 -28 Td /F1 11 Tf (Frontend-only mock preview) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((obj, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function getDocumentBlob(document) {
  const remembered = blobStore.get(document.id)
  if (remembered) return remembered

  const mime = document.storage?.mimeType || 'application/octet-stream'
  const name = document.storage?.originalName || 'document'

  if (mime === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    return createPdfBlob(name)
  }

  if (mime.startsWith('image/')) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520"><rect width="100%" height="100%" fill="#f5f3ff"/><text x="50%" y="48%" text-anchor="middle" font-family="Arial" font-size="34" fill="#5b21b6">CQI Demo File</text><text x="50%" y="57%" text-anchor="middle" font-family="Arial" font-size="20" fill="#6b7280">${name.replace(/[<>&]/g, '')}</text></svg>`
    return new Blob([svg], { type: 'image/svg+xml' })
  }

  return new Blob([`CQI demo file: ${name}\nThis file is stored only in the browser mock layer.`], {
    type: mime || 'text/plain',
  })
}

export { newId }

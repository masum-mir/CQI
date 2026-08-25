import * as XLSX from 'xlsx'
import { makeError, makeResponse, mutateDb, newId, readDb } from '@/mock/mockDb'

function normalizeKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function pick(row, candidates) {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const key = entries.find(([k]) => normalizeKey(k) === normalizeKey(candidate))?.[0]
    if (key) return row[key]
  }
  return ''
}

function fallbackOfferings(departments = []) {
  const dept = departments[0] || 'CSE'
  return [
    { course_code: `${dept}451`, section: '1', title: 'Software Engineering', faculty_code: 'MSM' },
    { course_code: `${dept}453`, section: '1', title: 'Computer Networks', faculty_code: 'FRH' },
    { course_code: `${dept}455`, section: '2', title: 'Information Security', faculty_code: 'TBA' },
  ]
}

export const courseImportApi = {
  preview: async (file, departments = []) => {
    let offerings
    let semester = 'Fall 2026'
    let note = ''

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

      offerings = rows
        .map((row) => {
          const courseCode = String(pick(row, ['Course Code', 'CourseCode', 'Code', 'course_code'])).trim()
          const section = String(pick(row, ['Section', 'Sec'])).trim() || '1'
          const title = String(pick(row, ['Course Title', 'Title', 'CourseName'])).trim()
          const faculty = String(pick(row, ['Faculty Code', 'Faculty', 'ShortName', 'FacultyCode'])).trim()
          const rowSemester = String(pick(row, ['Semester', 'Term'])).trim()
          if (rowSemester) semester = rowSemester
          return { course_code: courseCode, section, title, faculty_code: faculty }
        })
        .filter((o) => o.course_code)

      if (departments.length) {
        offerings = offerings.filter((o) => departments.some((d) => o.course_code.toUpperCase().startsWith(d.toUpperCase())))
      }
    } catch {
      offerings = []
    }

    if (!offerings.length) {
      offerings = fallbackOfferings(departments)
      note = 'The selected file did not contain recognizable course columns, so demo sample rows are shown.'
    }

    const db = readDb()
    const facultyCodes = new Set(db.users.map((u) => u.shortCode).filter(Boolean))
    const unresolved = offerings.filter((o) => o.faculty_code && !facultyCodes.has(o.faculty_code)).length

    const batch = {
      id: newId('batch'),
      fileName: file?.name || 'offered-courses.xlsx',
      semester,
      status: 'preview',
      stats: {
        offerings: offerings.length,
        facultyUnresolved: unresolved,
        created: 0,
        updated: 0,
      },
      errors: [],
      createdAt: new Date().toISOString(),
      offerings,
    }

    mutateDb((state) => {
      state.importBatches = state.importBatches.filter((b) => b.status !== 'preview')
      state.importBatches.unshift(batch)
    })

    return makeResponse({ batch, sample: offerings.slice(0, 8), note })
  },

  commit: async (batchId) => {
    const result = mutateDb((db) => {
      const batch = db.importBatches.find((b) => b.id === batchId)
      if (!batch) throw makeError('Import batch not found', 404)
      let created = 0
      let updated = 0

      for (const row of batch.offerings || []) {
        const existing = db.courses.find(
          (c) => c.courseCode === row.course_code && c.section === row.section && c.semester === batch.semester,
        )
        if (existing) {
          existing.title = row.title || existing.title
          existing.facultyCode = row.faculty_code || existing.facultyCode
          updated += 1
        } else {
          db.courses.push({
            id: newId('crs'),
            courseCode: row.course_code,
            section: row.section || '1',
            title: row.title || row.course_code,
            semester: batch.semester,
            type: 'theory',
            department: row.course_code.replace(/[^A-Za-z].*$/, '') || 'CSE',
            facultyCode: row.faculty_code || '',
            capacity: { total: 40, enrolled: 0 },
          })
          created += 1
        }
      }

      batch.status = 'committed'
      batch.stats.created = created
      batch.stats.updated = updated
      delete batch.offerings
      return batch
    })
    return makeResponse({ batch: result })
  },

  listBatches: async () => {
    const batches = readDb().importBatches
      .filter((b) => b.status === 'committed')
      .map((batch) => {
        const copy = { ...batch }
        delete copy.offerings
        return copy
      })
    return makeResponse({ batches })
  },
}

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// NOTE: adjust to match your actual C.COURSE_TYPES if it differs
const COURSE_TYPES = ['theory', 'lab', 'sessional']

const EMPTY = {
  courseCode: '',
  section: '',
  title: '',
  semester: '',
  type: 'theory',
  department: '',
  facultyCode: '',
  capacityTotal: '',
}

/**
 * Create/edit modal for a course offering. Pass `course` (the course_dict
 * shape) to edit, or omit it to create a new offering.
 *
 * Faculty is assigned by short code (e.g. "MAR") — the backend resolves it
 * to a user id server-side, same as the PDF import pipeline does.
 */
export default function CourseFormModal({ course, onClose, onSubmit, submitting }) {
  const isEdit = !!course
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (course) {
      setForm({
        courseCode: course.courseCode || '',
        section: course.section || '',
        title: course.title || '',
        semester: course.semester || '',
        type: course.type || 'theory',
        department: course.department || '',
        facultyCode: course.facultyCode || '',
        capacityTotal: course.capacity?.total ?? '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [course])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const capacity = form.capacityTotal
      ? { total: Number(form.capacityTotal), enrolled: course?.capacity?.enrolled ?? 0 }
      : undefined

    const payload = isEdit
      ? {
          title: form.title || undefined,
          semester: form.semester,
          type: form.type,
          department: form.department || undefined,
          section: form.section,
          facultyCode: form.facultyCode || undefined,
          ...(capacity ? { capacity } : {}),
        }
      : {
          courseCode: form.courseCode,
          section: form.section,
          title: form.title || undefined,
          semester: form.semester,
          type: form.type,
          department: form.department || undefined,
          facultyCode: form.facultyCode || undefined,
          ...(capacity ? { capacity } : {}),
        }

    try {
      await onSubmit(payload)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        'Something went wrong'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit course' : 'New course offering'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course code">
              <input
                type="text"
                value={form.courseCode}
                onChange={set('courseCode')}
                required
                disabled={isEdit}
                placeholder="CSE251"
                className="input disabled:bg-gray-50 disabled:text-gray-400"
              />
            </Field>
            <Field label="Section">
              <input
                type="text"
                value={form.section}
                onChange={set('section')}
                required
                placeholder="5"
                className="input"
              />
            </Field>
          </div>

          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Auto-filled from catalog if left blank"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester">
              <input
                type="text"
                value={form.semester}
                onChange={set('semester')}
                required
                placeholder="Fall 2024"
                className="input"
              />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={set('type')} className="input">
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <input
                type="text"
                value={form.department}
                onChange={set('department')}
                placeholder="Auto-detected from code"
                className="input"
              />
            </Field>
            <Field label="Faculty short code">
              <input
                type="text"
                value={form.facultyCode}
                onChange={set('facultyCode')}
                placeholder="MAR or TBA"
                className="input"
              />
            </Field>
          </div>

          <Field label="Capacity (total seats)">
            <input
              type="number"
              min="0"
              value={form.capacityTotal}
              onChange={set('capacityTotal')}
              placeholder="Optional"
              className="input"
            />
          </Field>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create course'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.5);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

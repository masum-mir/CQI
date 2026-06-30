import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const COURSE_TYPES = ['theory', 'lab', 'sessional']

const EMPTY = {
  courseCode: '',
  title: '',
  department: '',
  courseType: 'theory',
  creditHours: '',
  active: true,
}

export default function CatalogFormModal({ entry, onClose, onSubmit, submitting }) {
  const isEdit = !!entry
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setForm({
        courseCode: entry.courseCode || '',
        title: entry.title || '',
        department: entry.department || '',
        courseType: entry.courseType || 'theory',
        creditHours: entry.creditHours ?? '',
        active: entry.active ?? true,
      })
    } else {
      setForm(EMPTY)
    }
  }, [entry])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = isEdit
      ? {
          title: form.title,
          department: form.department || undefined,
          courseType: form.courseType,
          creditHours: form.creditHours ? Number(form.creditHours) : undefined,
          active: form.active,
        }
      : {
          courseCode: form.courseCode,
          title: form.title,
          department: form.department || undefined,
          courseType: form.courseType,
          creditHours: form.creditHours ? Number(form.creditHours) : undefined,
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
            {isEdit ? 'Edit catalog entry' : 'New catalog entry'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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

          <Field label="Title">
            <input type="text" value={form.title} onChange={set('title')} required className="input" />
          </Field>

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
            <Field label="Type">
              <select value={form.courseType} onChange={set('courseType')} className="input">
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Credit hours">
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.creditHours}
              onChange={set('creditHours')}
              className="input"
            />
          </Field>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          )}

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
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add to catalog'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid #e5e7eb; font-size: 0.875rem; outline: none; }
        .input:focus { box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.5); }
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

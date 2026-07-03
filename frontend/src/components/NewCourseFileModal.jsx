import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { courseApi } from '../api/courseApi'

export default function NewCourseFileModal({ onClose, onCreate, submitting }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    courseApi
      .list()
      .then((res) => setCourses(res.data.courses || []))
      .catch(() => setError('Failed to load your courses'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setError('')
    try {
      await onCreate(selected)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course file')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Start a course file</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {loading && <p className="text-sm text-gray-400">Loading your courses...</p>}

        {!loading && courses.length === 0 && (
          <p className="text-sm text-gray-400">
            You don't have any course offerings assigned yet.
          </p>
        )}

        {!loading && courses.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — {c.title} ({c.semester})
                </option>
              ))}
            </select>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !selected}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
            >
              {submitting ? 'Creating...' : 'Create course file'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

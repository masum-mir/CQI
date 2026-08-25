import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react'
import { courseApi } from '@/api/courseApi'
import { useAuthContext } from '@/context/AuthContext'
import CourseFormModal from '@/components/CourseFormModal'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'


const TYPE_BADGE = {
  theory: 'bg-sky-100 text-sky-700',
  lab: 'bg-amber-100 text-amber-700',
  sessional: 'bg-emerald-100 text-emerald-700',
}

export default function CoursesPage() {
  const { user } = useAuthContext()
  const canCreate = user?.role === 'admin' || user?.role === 'chairperson'
  const canEdit = canCreate
  const canDelete = user?.role === 'admin'

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [semesterFilter, setSemesterFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await courseApi.list({ semester: semesterFilter || undefined })
      setCourses(res.data.data.courses || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [semesterFilter])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const filtered = courses.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.label?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.facultyInfo?.name?.toLowerCase().includes(q)
    )
  })

  const { page, setPage, totalPages, paginated, pageSize } = usePagination(filtered, {
    pageSize: 10,
    resetDeps: [search, semesterFilter],
  })

  const openCreate = () => {
    setEditingCourse(null)
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditingCourse(c)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (editingCourse) {
        await courseApi.update(editingCourse.id, payload)
      } else {
        await courseApi.create(payload)
      }
      setModalOpen(false)
      await fetchCourses()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Delete ${c.label}? This cannot be undone.`)) return
    setDeletingId(c.id)
    try {
      await courseApi.remove(c.id)
      await fetchCourses()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete course')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {user?.role === 'faculty' ? 'My courses' : 'Courses'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'faculty'
              ? 'Course offerings assigned to you'
              : 'All course offerings across the department'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <Plus size={16} />
            New course
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, or faculty"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <input
          type="text"
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          placeholder="Semester (e.g. Fall 2024)"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none w-48"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Capacity</th>
              {(canEdit || canDelete) && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <BookOpen size={20} className="mx-auto mb-2 text-gray-300" />
                  No courses found
                </td>
              </tr>
            )}

            {!loading &&
              paginated.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.label}</td>
                  <td className="px-4 py-3 text-gray-500">{c.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[c.type] || 'bg-gray-100 text-gray-600'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.semester}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.facultyInfo?.name || (c.facultyCode ? `${c.facultyCode}` : 'Unassigned')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.capacity ? `${c.capacity.enrolled ?? 0}/${c.capacity.total ?? '—'}` : '—'}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        pageSize={pageSize}
      />

      {modalOpen && (
        <CourseFormModal
          course={editingCourse}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  )
}

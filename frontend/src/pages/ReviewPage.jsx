import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, XCircle, Clock, ArrowRight,
  FolderKanban, Search, Filter,
} from 'lucide-react'
import { courseFileApi } from '../api/courseFileApi'

const STATUS_BADGE = {
  submitted:    'bg-sky-100 text-sky-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved:     'bg-emerald-100 text-emerald-700',
  rejected:     'bg-red-100 text-red-700',
  draft:        'bg-gray-100 text-gray-500',
}

const STATUS_FILTERS = [
  { value: '',             label: 'All' },
  { value: 'submitted',    label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved',     label: 'Approved' },
  { value: 'rejected',     label: 'Rejected' },
]

export default function ReviewPage() {
  const navigate = useNavigate()

  const [courseFiles, setCourseFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchCourseFiles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await courseFileApi.list({ status: statusFilter || undefined })
      setCourseFiles(res.data.courseFiles || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCourseFiles()
  }, [fetchCourseFiles])

  const filtered = courseFiles.filter((cf) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      cf.courseInfo?.courseCode?.toLowerCase().includes(q) ||
      cf.courseInfo?.title?.toLowerCase().includes(q) ||
      cf.facultyInfo?.name?.toLowerCase().includes(q)
    )
  })

  // Summary counts (across unfiltered list once loaded)
  const submittedCount    = courseFiles.filter((cf) => cf.status === 'submitted').length
  const underReviewCount  = courseFiles.filter((cf) => cf.status === 'under_review').length
  const approvedCount     = courseFiles.filter((cf) => cf.status === 'approved').length
  const rejectedCount     = courseFiles.filter((cf) => cf.status === 'rejected').length

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Review queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Course file submissions waiting for your review
        </p>
      </div>

      {/* Summary tiles */}
      {!loading && courseFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryTile label="Submitted"    value={submittedCount}   color="bg-sky-50 text-sky-700"      onClick={() => setStatusFilter('submitted')}    />
          <SummaryTile label="Under review" value={underReviewCount} color="bg-amber-50 text-amber-700"  onClick={() => setStatusFilter('under_review')} />
          <SummaryTile label="Approved"     value={approvedCount}    color="bg-emerald-50 text-emerald-700" onClick={() => setStatusFilter('approved')} />
          <SummaryTile label="Rejected"     value={rejectedCount}    color="bg-red-50 text-red-600"      onClick={() => setStatusFilter('rejected')}    />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course, title or faculty…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-gray-400" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === f.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {/* List */}
      {loading && <p className="text-sm text-gray-400 text-center py-12">Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FolderKanban size={24} className="mx-auto mb-2 text-gray-300" />
          No submissions found
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Faculty</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Completeness</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cf) => {
                const pct = cf.completeness?.percent ?? 0
                const isActionable = ['submitted', 'under_review'].includes(cf.status)
                return (
                  <tr
                    key={cf.id}
                    className="border-t border-gray-50 hover:bg-gray-50/60 transition cursor-pointer"
                    onClick={() => navigate(`/cqi-plans/${cf.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {cf.courseInfo?.courseCode}-{cf.courseInfo?.section}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{cf.courseInfo?.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{cf.facultyInfo?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{cf.semester}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-violet-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[cf.status] || 'bg-gray-100 text-gray-600'}`}>
                        {cf.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                          isActionable
                            ? 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                            : 'text-gray-400'
                        }`}
                      >
                        {isActionable ? 'Review' : 'View'}
                        <ArrowRight size={12} />
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 transition text-left ${color.split(' ')[0]}`}
    >
      <span className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </button>
  )
}

// import { useState, useEffect, useCallback } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Plus, FolderKanban, Search } from 'lucide-react'
// import { courseFileApi } from '../api/courseFileApi'
// import { useAuthContext } from '../context/AuthContext'
// import NewCourseFileModal from '../components/NewCourseFileModal'

// const STATUS_BADGE = {
//   draft: 'bg-gray-100 text-gray-600',
//   submitted: 'bg-sky-100 text-sky-700',
//   under_review: 'bg-amber-100 text-amber-700',
//   approved: 'bg-emerald-100 text-emerald-700',
//   rejected: 'bg-red-100 text-red-700',
// }

// export default function CqiPlansPage() {
//   const { user } = useAuthContext()
//   const navigate = useNavigate()
//   const canCreate = user?.role === 'faculty' || user?.role === 'admin'

//   const [courseFiles, setCourseFiles] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [statusFilter, setStatusFilter] = useState('')
//   const [search, setSearch] = useState('')
//   const [modalOpen, setModalOpen] = useState(false)
//   const [creating, setCreating] = useState(false)

//   const fetchCourseFiles = useCallback(async () => {
//     setLoading(true)
//     setError('')
//     try {
//       const res = await courseFileApi.list({ status: statusFilter || undefined })
//       setCourseFiles(res.data.courseFiles || [])
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to load course files')
//     } finally {
//       setLoading(false)
//     }
//   }, [statusFilter])

//   useEffect(() => {
//     fetchCourseFiles()
//   }, [fetchCourseFiles])

//   const filtered = courseFiles.filter((cf) => {
//     if (!search) return true
//     const q = search.toLowerCase()
//     return (
//       cf.courseInfo?.courseCode?.toLowerCase().includes(q) ||
//       cf.courseInfo?.title?.toLowerCase().includes(q)
//     )
//   })

//   const handleCreate = async (courseId) => {
//     setCreating(true)
//     try {
//       const res = await courseFileApi.create(courseId)
//       setModalOpen(false)
//       navigate(`/cqi-plans/${res.data.courseFile.id}`)
//     } finally {
//       setCreating(false)
//     }
//   }

//   return (
//     <div className="max-w-4xl mx-auto py-8 px-4">

//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h1 className="text-2xl font-semibold text-gray-900">
//             {user?.role === 'faculty' ? 'My CQI plans' : 'CQI plans'}
//           </h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Course file submissions and their completeness against the required checklist
//           </p>
//         </div>
//         {canCreate && (
//           <button
//             onClick={() => setModalOpen(true)}
//             className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition"
//           >
//             <Plus size={16} />
//             New course file
//           </button>
//         )}
//       </div>

//       <div className="flex flex-wrap gap-2 mb-4">
//         <div className="relative flex-1 min-w-[180px]">
//           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search course code or title"
//             className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
//           />
//         </div>
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
//         >
//           <option value="">All statuses</option>
//           <option value="draft">Draft</option>
//           <option value="submitted">Submitted</option>
//           <option value="under_review">Under review</option>
//           <option value="approved">Approved</option>
//           <option value="rejected">Rejected</option>
//         </select>
//       </div>

//       {error && (
//         <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
//       )}

//       <div className="space-y-2">
//         {loading && <p className="text-sm text-gray-400 text-center py-8">Loading...</p>}

//         {!loading && filtered.length === 0 && (
//           <div className="text-center py-12 text-gray-400">
//             <FolderKanban size={20} className="mx-auto mb-2 text-gray-300" />
//             No course files found
//           </div>
//         )}

//         {!loading &&
//           filtered.map((cf) => (
//             <button
//               key={cf.id}
//               onClick={() => navigate(`/cqi-plans/${cf.id}`)}
//               className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all text-left"
//             >
//               <div>
//                 <p className="text-sm font-medium text-gray-800">
//                   {cf.courseInfo?.courseCode}-{cf.courseInfo?.section}
//                   <span className="text-gray-400 font-normal"> — {cf.courseInfo?.title}</span>
//                 </p>
//                 <p className="text-xs text-gray-400 mt-0.5">{cf.semester}</p>
//               </div>
//               <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[cf.status] || 'bg-gray-100 text-gray-600'}`}>
//                 {cf.status?.replace('_', ' ')}
//               </span>
//             </button>
//           ))}
//       </div>

//       {modalOpen && (
//         <NewCourseFileModal
//           onClose={() => setModalOpen(false)}
//           onCreate={handleCreate}
//           submitting={creating}
//         />
//       )}
//     </div>
//   )
// }


import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, ArrowRight, CheckCircle2, Clock,
  XCircle, FileText, AlertCircle, BookOpen,
} from 'lucide-react'
import { courseApi } from '../api/courseApi'
import { courseFileApi } from '../api/courseFileApi'
import { useAuthContext } from '../context/AuthContext'

// ─ Status config 
const CF_STATUS = {
  draft:        { label: 'Draft',        cls: 'bg-gray-100 text-gray-600',        Icon: FileText     },
  submitted:    { label: 'Submitted',    cls: 'bg-sky-100 text-sky-700',          Icon: Clock        },
  under_review: { label: 'Under review', cls: 'bg-amber-100 text-amber-700',      Icon: Clock        },
  approved:     { label: 'Approved',     cls: 'bg-emerald-100 text-emerald-700',  Icon: CheckCircle2 },
  rejected:     { label: 'Rejected',     cls: 'bg-red-100 text-red-600',          Icon: XCircle      },
  not_started:  { label: 'Not started',  cls: 'bg-gray-50 text-gray-400',         Icon: AlertCircle  },
}

const STATUS_FILTERS = [
  { value: 'all',         label: 'All'          },
  { value: 'not_started', label: 'Not started'  },
  { value: 'draft',       label: 'Draft'        },
  { value: 'submitted',   label: 'Submitted'    },
  { value: 'under_review',label: 'Under review' },
  { value: 'approved',    label: 'Approved'     },
  { value: 'rejected',    label: 'Rejected'     },
]

// ─ Course card 
function CourseCard({ course, courseFile, onClick, loading }) {
  const status = courseFile?.status || 'not_started'
  const cfg = CF_STATUS[status] || CF_STATUS.not_started
  const pct = courseFile?.completeness?.percent ?? 0

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left bg-white border border-gray-100 rounded-xl p-4
                 hover:border-violet-200 hover:shadow-sm transition-all group
                 disabled:opacity-60 disabled:cursor-wait"
    >
      {/* Top row: code + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {course.label}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5" title={course.title}>
            {course.title || '—'}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
          <cfg.Icon size={10} />
          {cfg.label}
        </span>
      </div>

      {/* Progress bar (only if file exists) */}
      {courseFile && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400">Completeness</span>
            <span className="text-[10px] text-gray-500 tabular-nums">{pct}%</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-violet-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom: type + open arrow */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-gray-400 capitalize">{course.type}</span>
        <span className="flex items-center gap-1 text-[11px] text-violet-500 opacity-0 group-hover:opacity-100 transition">
          {courseFile ? 'Open' : 'Start'} <ArrowRight size={11} />
        </span>
      </div>
    </button>
  )
}

// ─ Main page ─
export default function CqiPlansPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [courses, setCourses] = useState([])          // all faculty courses
  const [courseFiles, setCourseFiles] = useState([])  // all course files (flat)
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState(null)    // courseId being opened
  const [error, setError] = useState('')

  const [activeSemester, setActiveSemester] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  //  Load courses + course files in parallel 
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cRes, cfRes] = await Promise.all([
        courseApi.list(),
        courseFileApi.list(),
      ])

      const allCourses = cRes.data.courses || []

      // Only show courses assigned to this faculty (facultyCode === shortCode).
      // Admin bypasses the filter and sees everything.
      const myCourses =
        user?.role === 'admin'
          ? allCourses
          : allCourses.filter(
              (c) =>
                c.facultyCode &&
                user?.shortCode &&
                c.facultyCode.trim().toLowerCase() ===
                  user.shortCode.trim().toLowerCase()
            )

      setCourses(myCourses)
      setCourseFiles(cfRes.data.courseFiles || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user?.shortCode, user?.role])

  useEffect(() => { fetchAll() }, [fetchAll])

  //  Build a courseId → courseFile lookup 
  const cfByCourseId = useMemo(() => {
    const map = new Map()
    courseFiles.forEach((cf) => {
      if (cf.courseId) map.set(cf.courseId, cf)
    })
    return map
  }, [courseFiles])

  //  Unique semesters from courses, sorted newest-first 
  const semesters = useMemo(() => {
    const set = new Set(courses.map((c) => c.semester).filter(Boolean))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [courses])

  //  Auto-select the most recent semester on first load 
  useEffect(() => {
    if (semesters.length && activeSemester === 'all') {
      setActiveSemester(semesters[0])
    }
  }, [semesters, activeSemester])

  //  Filtered course list 
  const visibleCourses = useMemo(() => {
    return courses.filter((c) => {
      const semesterMatch = activeSemester === 'all' || c.semester === activeSemester
      if (!semesterMatch) return false

      if (statusFilter === 'all') return true
      const cf = cfByCourseId.get(c.id)
      const cfStatus = cf?.status || 'not_started'
      return cfStatus === statusFilter
    })
  }, [courses, activeSemester, statusFilter, cfByCourseId])

  //  Summary counts for the active semester 
  const semesterCourses = useMemo(() =>
    activeSemester === 'all' ? courses : courses.filter((c) => c.semester === activeSemester),
    [courses, activeSemester]
  )
  const summaryCount = useMemo(() => {
    const counts = { total: semesterCourses.length, not_started: 0, draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 }
    semesterCourses.forEach((c) => {
      const status = cfByCourseId.get(c.id)?.status || 'not_started'
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
  }, [semesterCourses, cfByCourseId])

  //  Open a course file (create if not exists) 
  const handleOpenCourse = async (course) => {
    setOpeningId(course.id)
    try {
      const res = await courseFileApi.create(course.id) // idempotent
      navigate(`/cqi-plans/${res.data.courseFile.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to open course file')
      setOpeningId(null)
    }
  }

  //  Render 
  if (loading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center text-gray-400">
        <BookOpen size={28} className="mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No course offerings assigned to your account yet.</p>
        <p className="text-xs mt-1 text-gray-300">Contact an admin to assign courses to your short code.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My CQI plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Course files for <span className="font-medium text-gray-700">{user?.name}</span>
          {user?.shortCode && (
            <span className="ml-1.5 text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {user.shortCode}
            </span>
          )}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {/*  Semester tabs  */}
      {semesters.length > 0 && (
        <div className="flex overflow-x-auto whitespace-nowrap gap-1 border-b border-gray-200 mb-5 pb-0">
          <SemTab
            label="All"
            active={activeSemester === 'all'}
            count={courses.length}
            onClick={() => setActiveSemester('all')}
          />
          {semesters.map((sem) => (
            <SemTab
              key={sem}
              label={sem}
              active={activeSemester === sem}
              count={courses.filter((c) => c.semester === sem).length}
              onClick={() => setActiveSemester(sem)}
            />
          ))}
        </div>
      )}

      {/*  Summary pills for active semester  */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map(({ value, label }) => {
          const count = value === 'all' ? summaryCount.total : (summaryCount[value] || 0)
          if (value !== 'all' && count === 0) return null
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                statusFilter === value
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/*  Course grid  */}
      {visibleCourses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderKanban size={22} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No courses match the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              courseFile={cfByCourseId.get(course.id) || null}
              onClick={() => handleOpenCourse(course)}
              loading={openingId === course.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SemTab({ label, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all flex-shrink-0 ${
        active
          ? 'border-violet-600 text-gray-900'
          : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
        {count}
      </span>
    </button>
  )
}
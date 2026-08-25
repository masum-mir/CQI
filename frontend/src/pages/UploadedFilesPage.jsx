import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText, FileSpreadsheet, Image as ImageIcon, Download, Trash2,
  Search, Filter, FolderOpen, Loader2, X, Eye,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { courseFileApi } from '@/api/courseFileApi'
import { documentApi } from '@/api/documentApi'
import { useAuthContext } from '@/context/AuthContext'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
 
const ITEM_NAMES = {
  1: 'Final grades (Tabulation Sheet)',
  2: 'OBE Excel Sheet',
  3: 'CO Attainment Report',
  4: 'PO Attainment Report',
  5: 'Grade Summary with CQI Improvement Plan',
  6: 'Instructor Feedback',
  7: 'Course Outline',
  8: 'Class Test — Assessment Question',
  9: 'Class Test — Sample Answer Scripts',
  10: 'Midterm — Assessment Question',
  11: 'Midterm — Sample Answer Scripts',
  12: 'Final Exam — Assessment Question',
  13: 'Final Exam — Sample Answer Scripts',
  14: 'Project / Assignment List',
  15: 'Sample Project Reports',
  16: 'List of Lab Experiments',
  17: 'Class Attendance',
  18: 'Lab Attendance',
  19: 'Midterm Exam Attendance',
  20: 'Final Exam Attendance',
  // 21: 'Capstone Project Report',
}
 
function humanSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extOf(name = '') {
  return name.split('.').pop()?.toLowerCase() || ''
}

function fileIcon(name = '', mime = '') {
  const ext = extOf(name)
  if (ext === 'pdf') return { Icon: FileText, color: 'text-violet-500' }
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { Icon: FileSpreadsheet, color: 'text-emerald-600' }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mime.startsWith('image/'))
    return { Icon: ImageIcon, color: 'text-sky-500' }
  return { Icon: FileText, color: 'text-gray-400' }
}

function labelFor(doc) {
  if (doc.isAdditional) return 'Additional material'
  return ITEM_NAMES[doc.itemNo] || `Item ${doc.itemNo ?? '—'}`
}

// Preview modal 
function PreviewModal({ preview, onClose, onDownload }) {
  if (!preview) return null
  const { doc, url, mime, loading } = preview
  const name = doc.storage?.originalName || 'document'
  const ext = extOf(name)
  const isImg = (mime || '').startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
  const isPdf = (mime || '') === 'application/pdf' || ext === 'pdf'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate" title={name}>{name}</p>
            <p className="text-[11px] text-gray-400">{labelFor(doc)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onDownload(doc)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-[300px] bg-gray-50 flex items-center justify-center overflow-auto">
          {loading ? (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={16} className="animate-spin" /> Loading preview…
            </span>
          ) : isImg ? (
            <img src={url} alt={name} className="max-w-full max-h-[70vh] object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={name} className="w-full h-[70vh] border-0" />
          ) : (
            <div className="text-center text-sm text-gray-500 p-8">
              <FileText size={28} className="mx-auto mb-2 text-gray-300" />
              Preview isn’t available for this file type.
              <div className="mt-3">
                <button
                  onClick={() => onDownload(doc)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  <Download size={14} /> Download instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UploadedFilesPage() {
  const { user } = useAuthContext()
  const canDelete = user?.role === 'faculty' || user?.role === 'admin'
  const canReview = user?.role === 'chairperson' || user?.role === 'admin'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [savingReviewId, setSavingReviewId] = useState(null)
  const [preview, setPreview] = useState(null) // { doc, url, mime, loading }

  //  multiple filters 
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [semester, setSemester] = useState('')
  const [docType, setDocType] = useState('')
  const [review, setReview] = useState('')
  const [cfStatus, setCfStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const cfRes = await courseFileApi.list()
      const cfs = cfRes.data.data?.courseFiles || cfRes.data.courseFiles || []
      const details = await Promise.all(
        cfs.map((cf) =>
          courseFileApi
            .get(cf.id)
            .then((d) => ({ cf, docs: d.data.data?.documents || d.data.documents || [] }))
            .catch(() => ({ cf, docs: [] }))
        )
      )
      const flat = []
      details.forEach(({ cf, docs }) => {
        docs.forEach((doc) => {
          flat.push({
            ...doc,
            courseFileId: cf.id,
            courseLabel: `${cf.courseInfo?.courseCode || '—'}-${cf.courseInfo?.section || ''}`,
            courseTitle: cf.courseInfo?.title,
            semester: cf.semester,
            cfStatus: cf.status,
          })
        })
      })
      flat.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setRows(flat)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load uploaded files')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // revoke any object URL on unmount
  useEffect(() => {
    return () => {
      setPreview((p) => {
        if (p?.url) URL.revokeObjectURL(p.url)
        return null
      })
    }
  }, [])

  const courseOptions = useMemo(() => [...new Set(rows.map((r) => r.courseLabel))].sort(), [rows])
  const semesterOptions = useMemo(
    () => [...new Set(rows.map((r) => r.semester).filter(Boolean))].sort((a, b) => b.localeCompare(a)),
    [rows]
  )
  const docTypeOptions = useMemo(() => {
    const present = new Set(rows.map((r) => (r.isAdditional ? 'additional' : String(r.itemNo))))
    const opts = Object.entries(ITEM_NAMES)
      .filter(([no]) => present.has(no))
      .map(([no, name]) => ({ value: no, label: `${no}. ${name}` }))
    if (present.has('additional')) opts.push({ value: 'additional', label: 'Additional material' })
    return opts
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (course && r.courseLabel !== course) return false
      if (semester && r.semester !== semester) return false
      if (review && (r.review?.status || 'pending') !== review) return false
      if (cfStatus && r.cfStatus !== cfStatus) return false
      if (docType) {
        if (docType === 'additional' ? !r.isAdditional : String(r.itemNo) !== docType) return false
      }
      if (q) {
        const hay = `${r.storage?.originalName || ''} ${r.courseLabel} ${labelFor(r)} ${r.courseTitle || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, search, course, semester, review, cfStatus, docType])

  const {
    page,
    setPage,
    totalPages,
    paginated,
    pageSize,
  } = usePagination(filtered, {
    pageSize: 10,
    resetDeps: [
      search,
      course,
      semester,
      docType,
      review,
      cfStatus,
    ],
  })

  const activeFilters = [search, course, semester, docType, review, cfStatus].filter(Boolean).length
  const clearFilters = () => {
    setSearch(''); setCourse(''); setSemester(''); setDocType(''); setReview(''); setCfStatus('')
  }

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id)
    try {
      await documentApi.download(doc.id, doc.storage?.originalName)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.storage?.originalName}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    try {
      await documentApi.remove(doc.id)
      setRows((prev) => prev.filter((r) => r.id !== doc.id))
      toast.success('File deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete file')
    } finally {
      setDeletingId(null)
    }
  }

  //  inline status update (chair/admin) 
  const handleReviewChange = async (doc, status) => {
    const prevStatus = doc.review?.status || 'pending'
    if (status === prevStatus) return
    setSavingReviewId(doc.id)
    // optimistic
    setRows((prev) => prev.map((r) => (r.id === doc.id ? { ...r, review: { ...(r.review || {}), status } } : r)))
    try {
      await documentApi.review(doc.id, status)
      toast.success(`Marked ${status}`)
    } catch (err) {
      // revert on failure
      setRows((prev) => prev.map((r) => (r.id === doc.id ? { ...r, review: { ...(r.review || {}), status: prevStatus } } : r)))
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setSavingReviewId(null)
    }
  }

  //  preview 
  const openPreview = async (doc) => {
    setPreview({ doc, url: null, mime: null, loading: true })
    try {
      const { blob, mime } = await documentApi.fetchBlob(doc.id, doc.storage?.originalName)
      const url = URL.createObjectURL(blob)
      setPreview({ doc, url, mime: mime || doc.storage?.mimeType, loading: false })
    } catch {
      toast.error('Could not load preview')
      setPreview(null)
    }
  }
  const closePreview = () => {
    setPreview((p) => {
      if (p?.url) URL.revokeObjectURL(p.url)
      return null
    })
  }

  const selectCls =
    'px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-violet-400 bg-white'

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Course files</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user?.role === 'faculty'
            ? 'Every document you’ve uploaded across your courses'
            : 'All uploaded course-file documents across the department'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file, course or document type…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <Filter size={14} className="text-gray-400" />

          <select value={course} onChange={(e) => setCourse(e.target.value)} className={selectCls}>
            <option value="">All courses</option>
            {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={semester} onChange={(e) => setSemester(e.target.value)} className={selectCls}>
            <option value="">All semesters</option>
            {semesterOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={docType} onChange={(e) => setDocType(e.target.value)} className={selectCls}>
            <option value="">All document types</option>
            {docTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* <select value={review} onChange={(e) => setReview(e.target.value)} className={selectCls}>
            <option value="">All review states</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={cfStatus} onChange={(e) => setCfStatus(e.target.value)} className={selectCls}>
            <option value="">All course-file states</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select> */}

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
            >
              <X size={13} /> Clear ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

      {loading && (
        <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading course files…
        </p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={24} className="mx-auto mb-2 text-gray-300" />
          {rows.length === 0 ? 'No uploaded files yet' : 'No files match these filters'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Document type</th>
                <th className="px-4 py-3">Size</th>
                {/* <th className="px-4 py-3">Review</th> */}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((doc) => {
                const { Icon, color } = fileIcon(doc.storage?.originalName, doc.storage?.mimeType)
                const rstatus = doc.review?.status || 'pending'
                return (
                  <tr key={doc.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openPreview(doc)}
                        className="flex items-center gap-2 min-w-0 text-left group"
                        title="Preview"
                      >
                        <Icon size={16} className={`${color} flex-shrink-0`} />
                        <span className="text-gray-700 truncate max-w-[190px] group-hover:text-violet-600 group-hover:underline">
                          {doc.storage?.originalName || '—'}
                        </span>
                        {doc.isAdditional && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 flex-shrink-0">
                            extra
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{doc.courseLabel}</p>
                      <p className="text-[11px] text-gray-400">{doc.semester}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-[220px]" title={labelFor(doc)}>
                      {labelFor(doc)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{humanSize(doc.storage?.size)}</td>
                    {/* <td className="px-4 py-3">
                      {canReview ? (
                        <select
                          value={rstatus}
                          disabled={savingReviewId === doc.id}
                          onChange={(e) => handleReviewChange(doc, e.target.value)}
                          className={`text-[11px] font-medium px-2 py-1 rounded-lg border outline-none disabled:opacity-50 ${
                            rstatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : rstatus === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className={`inline-flex text-[11px] font-medium px-2 py-1 rounded-full ${
                          rstatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rstatus === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {rstatus}
                        </span>
                      )}
                    </td> */}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openPreview(doc)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition disabled:opacity-50"
                          title="Download"
                        >
                          {downloadingId === doc.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === doc.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <p className="text-[11px] text-gray-400 mt-3">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} file{filtered.length !== 1 ? 's' : ''}
          </p>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
          />
        </>
      )}

      {/* Preview modal */}
      <PreviewModal preview={preview} onClose={closePreview} onDownload={handleDownload} />
    </div>
  )
}
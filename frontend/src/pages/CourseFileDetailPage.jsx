import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, Trash2, CheckCircle2, XCircle,
  Clock, FileText, Eye, MoreHorizontal, Send, UploadCloud, Plus,
} from 'lucide-react'
import { courseFileApi } from '../api/courseFileApi'
import { documentApi } from '../api/documentApi'
import { useAuthContext } from '../context/AuthContext'
import { FilePreviewPanel } from '../components/uploads/FilePreviewPanel'

const STATUS_BADGE = {
  draft:        'bg-gray-100 text-gray-600',
  submitted:    'bg-sky-100 text-sky-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved:     'bg-emerald-100 text-emerald-700',
  rejected:     'bg-red-100 text-red-700',
}

const DOC_STATUS_CONFIG = {
  pending:  { label: 'Pending',  cls: 'bg-gray-100 text-gray-500',       Icon: Clock         },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2  },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-600',         Icon: XCircle       },
}

//  Single document row 
function DocumentRow({
  doc, canUpload, canReview, canDelete,
  onPreview, onDownload, onDelete, onReviewChange, onReplace,
  downloading, reviewing,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const cfg = DOC_STATUS_CONFIG[doc.review?.status] || DOC_STATUS_CONFIG.pending
  const replaceRef = useRef(null)

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition group">
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
        <FileText size={15} className="text-violet-500" />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {doc.storage?.originalName}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Item {doc.itemNo}{doc.subItem ? ` · ${doc.subItem}` : ''}{doc.isAdditional ? ' · additional' : ''}
        </p>
      </div>

      {/* Review status badge */}
      <span className={`hidden sm:flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
        <cfg.Icon size={11} />
        {cfg.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Preview */}
        <button
          onClick={() => onPreview(doc)}
          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
          title="Preview"
        >
          <Eye size={14} />
        </button>

        {/* Download */}
        <button
          onClick={() => onDownload(doc)}
          disabled={downloading}
          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition disabled:opacity-40"
          title="Download"
        >
          <Download size={14} />
        </button>

        {/* Faculty: replace file */}
        {canUpload && (
          <>
            <button
              onClick={() => replaceRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
              title="Replace file"
            >
              <UploadCloud size={14} />
            </button>
            <input
              ref={replaceRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onReplace(doc, f)
                e.target.value = ''
              }}
            />
          </>
        )}

        {/* Faculty: delete own doc */}
        {canUpload && (
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* Chairperson / Admin: review status + delete via dropdown */}
        {(canReview || canDelete) && !canUpload && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  {canReview && (
                    <>
                      <button
                        onClick={() => { onReviewChange(doc.id, 'approved'); setMenuOpen(false) }}
                        disabled={reviewing || doc.review?.status === 'approved'}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 transition"
                      >
                        <CheckCircle2 size={13} /> Mark approved
                      </button>
                      <button
                        onClick={() => { onReviewChange(doc.id, 'rejected'); setMenuOpen(false) }}
                        disabled={reviewing || doc.review?.status === 'rejected'}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 transition"
                      >
                        <XCircle size={13} /> Mark rejected
                      </button>
                      <button
                        onClick={() => { onReviewChange(doc.id, 'pending'); setMenuOpen(false) }}
                        disabled={reviewing || doc.review?.status === 'pending'}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                      >
                        <Clock size={13} /> Reset to pending
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { onDelete(doc.id); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 border-t border-gray-100 transition"
                    >
                      <Trash2 size={13} /> Delete document
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

//  Empty slot — faculty can upload directly here 
function EmptySlot({ onUpload, uploading }) {
  const inputRef = useRef(null)
  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex items-center gap-2 px-4 py-3 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400
        ${uploading ? 'opacity-50 cursor-wait' : 'hover:border-violet-300 hover:text-violet-500 cursor-pointer transition'}`}
    >
      <UploadCloud size={14} />
      {uploading ? 'Uploading…' : 'Upload file'}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

//  Main page 
export default function CourseFileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const additionalRef = useRef(null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingSlot, setUploadingSlot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewingDocId, setReviewingDocId] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)

  const isFaculty = user?.role === 'faculty'
  const isChair   = user?.role === 'chairperson'
  const isAdmin   = user?.role === 'admin'

  // Faculty: upload + view + remove — always, no status lock
  const canUpload    = isFaculty || isAdmin
  const canReviewDoc = isChair || isAdmin
  const canDeleteDoc = isChair || isAdmin
  const canReviewCF  = isChair || isAdmin
  const canSubmit    = isFaculty || isAdmin

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await courseFileApi.get(id)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course file')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  //  Upload helpers 
  const uploadFile = async (file, itemNo, subItem, isAdditional = false) => {
    const slotKey = isAdditional ? 'additional' : `${itemNo}:${subItem || ''}`
    setUploadingSlot(slotKey)
    setError('')
    try {
      await courseFileApi.upload(id, file, { itemNo, subItem, isAdditional })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploadingSlot(null)
    }
  }

  // Replace = delete old then upload new (backend does this automatically on same slot)
  const handleReplace = async (doc, newFile) => {
    await uploadFile(newFile, doc.itemNo, doc.subItem, doc.isAdditional)
  }

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id)
    try {
      await documentApi.download(doc.id, doc.storage?.originalName)
    } catch {
      alert('Failed to download file')
    } finally {
      setDownloadingId(null)
    }
  }

  const handlePreview = (doc) => setPreviewItem({ kind: 'existing', doc })

  const handleDocReview = async (docId, status) => {
    setReviewingDocId(docId)
    try {
      await documentApi.review(docId, status)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update document status')
    } finally {
      setReviewingDocId(null)
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Remove this document?')) return
    try {
      await documentApi.remove(docId)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete')
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await courseFileApi.submit(id)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot submit — required items still missing')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCourseFileReview = async (decision) => {
    setReviewing(true)
    setError('')
    try {
      await courseFileApi.review(id, decision, reviewComment || undefined)
      setReviewComment('')
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setReviewing(false)
    }
  }

  //  Render guards 
  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
  if (error && !data) return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
    </div>
  )

  const { courseFile, completeness } = data
  const allDocs        = data.documents || []
  const requiredDocs   = allDocs.filter((d) => !d.isAdditional)
  const additionalDocs = allDocs.filter((d) => d.isAdditional)
  const cfStatus       = courseFile.status

  // quick slot lookup
  const docBySlot = requiredDocs.reduce((acc, d) => {
    acc[`${d.itemNo}:${d.subItem || ''}`] = d
    return acc
  }, {})

  const approvedCount = allDocs.filter((d) => d.review?.status === 'approved').length
  const rejectedCount = allDocs.filter((d) => d.review?.status === 'rejected').length
  const pendingCount  = allDocs.filter((d) => !d.review?.status || d.review.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      {/* Back */}
      <button
        onClick={() => navigate(isChair ? '/review' : '/cqi-plans')}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4"
      >
        <ArrowLeft size={13} /> {isChair ? 'Back to review queue' : 'Back to CQI plans'}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {courseFile.courseInfo?.courseCode}-{courseFile.courseInfo?.section}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {courseFile.courseInfo?.title} · {courseFile.semester}
          </p>
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[cfStatus] || 'bg-gray-100 text-gray-600'}`}>
          {cfStatus?.replace('_', ' ')}
        </span>
      </div>

      {courseFile.review?.comment && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          <Clock size={13} className="mt-0.5 flex-shrink-0" />
          <span>Reviewer comment: {courseFile.review.comment}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{error}</p>
      )}

      {/*  Completeness bar  */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Completeness</h2>
          <span className="text-xs text-gray-500">
            {completeness.completed}/{completeness.totalRequired} items ({completeness.percent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        {(isChair || isAdmin) && allDocs.length > 0 && (
          <div className="flex gap-4 mt-3">
            <Stat label="Total"    value={allDocs.length}  color="text-gray-700"    />
            <Stat label="Approved" value={approvedCount}   color="text-emerald-600" />
            <Stat label="Pending"  value={pendingCount}    color="text-gray-400"    />
            <Stat label="Rejected" value={rejectedCount}   color="text-red-500"     />
          </div>
        )}
      </div>

      {/*  Document list grouped by item  */}
      <div className="mt-5 space-y-5">
        {completeness.items.map((item) => {
          const slots = item.hasSubItems && item.subItems?.length
            ? item.subItems.map((s) => ({ key: `${item.itemNo}:${s.key}`, itemNo: item.itemNo, subItem: s.key, label: s.label }))
            : [{ key: `${item.itemNo}:`, itemNo: item.itemNo, subItem: null, label: null }]

          return (
            <div key={item.itemNo}>
              {/* Item header */}
              <div className="flex items-center gap-2 mb-2">
                {item.fulfilled
                  ? <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  : <Clock size={13} className="text-gray-300 flex-shrink-0" />
                }
                <p className="text-xs font-semibold text-gray-700">
                  {item.itemNo}. {item.name}
                </p>
              </div>

              <div className="pl-5 space-y-2">
                {slots.map((slot) => {
                  const doc = docBySlot[slot.key]
                  const isUploading = uploadingSlot === slot.key
                  return (
                    <div key={slot.key}>
                      {slot.label && (
                        <p className="text-[11px] text-gray-400 mb-1">{slot.label}</p>
                      )}
                      {doc ? (
                        <DocumentRow
                          doc={doc}
                          canUpload={canUpload}
                          canReview={canReviewDoc}
                          canDelete={canDeleteDoc}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                          onReviewChange={handleDocReview}
                          onReplace={handleReplace}
                          downloading={downloadingId === doc.id}
                          reviewing={reviewingDocId === doc.id}
                        />
                      ) : (
                        canUpload
                          ? <EmptySlot
                              onUpload={(f) => uploadFile(f, slot.itemNo, slot.subItem)}
                              uploading={isUploading}
                            />
                          : <p className="text-xs text-gray-300 py-1">No file uploaded</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Additional documents */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Additional documents</p>
          <div className="pl-5 space-y-2">
            {additionalDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                canUpload={canUpload}
                canReview={canReviewDoc}
                canDelete={canDeleteDoc}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onReviewChange={handleDocReview}
                onReplace={handleReplace}
                downloading={downloadingId === doc.id}
                reviewing={reviewingDocId === doc.id}
              />
            ))}

            {canUpload && (
              <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-violet-300 hover:text-violet-500 cursor-pointer transition">
                <Plus size={14} />
                Add additional document
                <input
                  ref={additionalRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  className="hidden"
                  disabled={uploadingSlot === 'additional'}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadFile(f, null, null, true)
                    e.target.value = ''
                  }}
                />
              </label>
            )}

            {additionalDocs.length === 0 && !canUpload && (
              <p className="text-xs text-gray-300">None</p>
            )}
          </div>
        </div>
      </div>

      {/*  Faculty: Submit  */}
      {canSubmit && (
        <div className="mt-6 flex items-center justify-end gap-3">
          {completeness.pending > 0 && (
            <span className="text-xs text-amber-600">
              {completeness.pending} required item{completeness.pending > 1 ? 's' : ''} still missing
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || completeness.pending > 0}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
          >
            <Send size={14} />
            {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      )}

      {/*  Chairperson: Course-file review panel  */}
      {canReviewCF && ['submitted', 'under_review'].includes(cfStatus) && (
        <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Final decision</h3>
          <p className="text-xs text-gray-400 mb-3">
            Approve or reject the entire course file. Rejected files go back to the faculty.
          </p>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Optional comment for the faculty…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400 mb-3 resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCourseFileReview('approved')}
              disabled={reviewing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              <CheckCircle2 size={15} /> Approve
            </button>
            <button
              onClick={() => handleCourseFileReview('rejected')}
              disabled={reviewing}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              <XCircle size={15} /> Reject
            </button>
            <button
              onClick={() => handleCourseFileReview('under_review')}
              disabled={reviewing}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm font-semibold rounded-lg transition"
            >
              <Clock size={15} /> Mark under review
            </button>
          </div>
        </div>
      )}

      {/* Preview modal */}
      <FilePreviewPanel
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onRemove={() => {}}
      />
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  )
}

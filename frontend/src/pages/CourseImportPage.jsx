import { useState, useEffect, useCallback, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2, History } from 'lucide-react'
import { courseImportApi } from '../api/courseImportApi'
import Pagination from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'

export default function CourseImportPage() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [departments, setDepartments] = useState('')

  const [previewing, setPreviewing] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [previewResult, setPreviewResult] = useState(null) // { batch, sample, note }
  const [error, setError] = useState('')

  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true)
    try {
      const res = await courseImportApi.listBatches()
      // envelope-tolerant: works whether the api returns data.batches or data.data.batches
      setBatches(res.data.data?.batches || res.data.batches || [])
    } catch {
      // non-fatal; the page still works without history
    } finally {
      setLoadingBatches(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const { page, setPage, totalPages, paginated, pageSize } = usePagination(batches, {
    pageSize: 10,
    resetDeps: [batches],
  })

  const handlePreview = async (e) => {
    console.log("file data e::", e)
    e.preventDefault()
    if (!file) return
    setError('')
    setPreviewResult(null)
    setPreviewing(true)

    try {
      const deptList = departments
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
      const res = await courseImportApi.preview(file, deptList)
      setPreviewResult(res.data.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data?.detail ||
          'Failed to parse the uploaded Excel file'
      )
    } finally {
      setPreviewing(false)
    }
  }

  const handleCommit = async () => {
    if (!previewResult?.batch?.id) return
    setCommitting(true)
    setError('')
    try {
      await courseImportApi.commit(previewResult.batch.id)
      setPreviewResult(null)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchBatches()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to commit the import')
    } finally {
      setCommitting(false)
    }
  }

  const batch = previewResult?.batch
  console.log("batch file info::: ", previewResult)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Import courses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload the offered-courses Excel file (.xls / .xlsx). Review the parsed offerings
          before committing — nothing is written until you confirm.
        </p>
      </div>

      {/* Upload form */}
      <form onSubmit={handlePreview} className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <div className="flex flex-col gap-3">
          <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1">Offered-courses Excel</span>
            <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg p-4 hover:border-violet-300 transition">
              <UploadCloud size={18} className="text-gray-400 flex-shrink-0" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.htm,.html,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-600 w-full"
              />
            </div>
            <span className="block text-[11px] text-gray-400 mt-1">
              The portal’s “.xls” export (an HTML table) and real .xlsx files are both supported.
            </span>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-600 mb-1">
              Department filter <span className="text-gray-400 font-normal">(optional, comma-separated)</span>
            </span>
            <input
              type="text"
              value={departments}
              onChange={(e) => setDepartments(e.target.value)}
              placeholder="CSE, ICE"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
          </label>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
              <AlertTriangle size={13} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || previewing}
            className="self-start px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
          >
            {previewing ? 'Parsing...' : 'Preview import'}
          </button>
        </div>
      </form>

      {/* Preview results */}
      {batch && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Preview — {batch.semester}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{batch.fileName}</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {batch.status}
            </span>
          </div>

          {previewResult.note && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              {previewResult.note}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat label="Offerings found" value={batch.stats.offerings} />
            <Stat
              label="Unresolved faculty"
              value={batch.stats.facultyUnresolved}
              warn={batch.stats.facultyUnresolved > 0}
            />
          </div>

          {batch.errors?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-1">Parse warnings</p>
              <ul className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 space-y-1">
                {batch.errors.map((e, i) => (
                  <li key={i}>{typeof e === 'string' ? e : (e.message || JSON.stringify(e))}</li>
                ))}
              </ul>
            </div>
          )}

          {previewResult.sample?.length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Sample (first {previewResult.sample.length})
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="py-1.5 pr-3">Code</th>
                    <th className="py-1.5 pr-3">Sec</th>
                    <th className="py-1.5 pr-3">Title</th>
                    <th className="py-1.5 pr-3">Faculty</th> 
                  </tr>
                </thead>
                <tbody>
                  {previewResult.sample.map((off, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5 pr-3 text-gray-700">{off.course_code}</td>
                      <td className="py-1.5 pr-3 text-gray-500">{off.section}</td>
                      <td className="py-1.5 pr-3 text-gray-500 truncate max-w-[180px]" title={off.title}>
                        {off.title || '—'}
                      </td>
                      <td className="py-1.5 pr-3 text-gray-500">{off.faculty_code || '—'}</td> 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleCommit}
            disabled={committing}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold rounded-lg transition"
          >
            <CheckCircle2 size={15} />
            {committing ? 'Committing...' : 'Commit import'}
          </button>
        </div>
      )}

      {/* Batch history */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <History size={14} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Import history</h2>
        </div>

        {loadingBatches && <p className="text-xs text-gray-400">Loading...</p>}

        {!loadingBatches && batches.length === 0 && (
          <p className="text-xs text-gray-400">No imports yet</p>
        )}

        <div className="space-y-2">
          {paginated.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={14} className="text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-gray-700">{b.fileName}</p>
                  <p className="text-[11px] text-gray-400">{b.semester}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400">
                  +{b.stats.created} created, {b.stats.updated} updated
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    b.status === 'committed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={batches.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  )
}

function Stat({ label, value, warn }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className={`text-lg font-semibold ${warn ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { catalogApi } from '../api/catalogApi'
import CatalogFormModal from '../components/CatalogFormModal'

export default function CatalogPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await catalogApi.list()
      console.log("Course Catelog: ", res);
      setItems(res.data.data.catalog || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const openCreate = () => {
    setEditingEntry(null)
    setModalOpen(true)
  }

  const openEdit = (entry) => {
    setEditingEntry(entry)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (editingEntry) {
        await catalogApi.update(editingEntry.id, payload)
      } else {
        await catalogApi.create(payload)
      }
      setModalOpen(false)
      await fetchCatalog()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (entry) => {
    if (!confirm(`Remove ${entry.courseCode} from the catalog?`)) return
    setDeletingId(entry.id)
    try {
      await catalogApi.remove(entry.id)
      await fetchCatalog()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete catalog entry')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Course catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stable course definitions used to auto-fill new offerings
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <Plus size={16} />
          Add course
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No catalog entries yet</td>
              </tr>
            )}

            {!loading &&
              items.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.courseCode}</td>
                  <td className="px-4 py-3 text-gray-500">{c.title}</td>
                  <td className="px-4 py-3 text-gray-500">{c.department}</td>
                  <td className="px-4 py-3 text-gray-500">{c.courseType}</td>
                  <td className="px-4 py-3 text-gray-500">{c.creditHours ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <CatalogFormModal
          entry={editingEntry}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  )
}

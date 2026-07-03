import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

const EMPTY = {
  itemNo: '',
  name: '',
  description: '',
  category: '',
  hasSubItems: false,
  subItems: [],
  active: true,
}

/**
 * Create/edit modal for a required-item checklist entry (items 1..17).
 * Submitting always calls upsert_item on the backend (POST /items), which
 * fully replaces the entry by itemNo — so this form sends the complete shape
 * every time, not a partial patch, when creating. PATCH is used for edits.
 */
export default function ItemFormModal({ item, onClose, onSubmit, submitting }) {
  const isEdit = !!item
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        itemNo: item.itemNo,
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        hasSubItems: item.hasSubItems || false,
        subItems: item.subItems || [],
        active: item.active ?? true,
      })
    } else {
      setForm(EMPTY)
    }
  }, [item])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const addSubItem = () =>
    setForm((f) => ({ ...f, subItems: [...f.subItems, { key: '', label: '' }] }))

  const updateSubItem = (i, k, v) =>
    setForm((f) => ({
      ...f,
      subItems: f.subItems.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)),
    }))

  const removeSubItem = (i) =>
    setForm((f) => ({ ...f, subItems: f.subItems.filter((_, idx) => idx !== i) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const subItems = form.hasSubItems
      ? form.subItems.filter((s) => s.key && s.label)
      : []

    const payload = isEdit
      ? {
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          hasSubItems: form.hasSubItems,
          subItems,
          active: form.active,
        }
      : {
          itemNo: Number(form.itemNo),
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          hasSubItems: form.hasSubItems,
          subItems,
          active: form.active,
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
            {isEdit ? `Edit item ${item.itemNo}` : 'New required item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isEdit && (
            <Field label="Item number">
              <input
                type="number"
                min="1"
                value={form.itemNo}
                onChange={set('itemNo')}
                required
                className="input"
              />
            </Field>
          )}

          <Field label="Name">
            <input type="text" value={form.name} onChange={set('name')} required className="input" />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              className="input resize-none"
            />
          </Field>

          <Field label="Category">
            <input type="text" value={form.category} onChange={set('category')} className="input" />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.hasSubItems}
              onChange={(e) => setForm((f) => ({ ...f, hasSubItems: e.target.checked }))}
            />
            Has sub-items (e.g. question / samples)
          </label>

          {form.hasSubItems && (
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              {form.subItems.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={s.key}
                    onChange={(e) => updateSubItem(i, 'key', e.target.value)}
                    placeholder="key"
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => updateSubItem(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubItem(i)}
                    className="text-gray-400 hover:text-red-500 px-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSubItem}
                className="flex items-center gap-1 text-xs text-violet-600 font-semibold"
              >
                <Plus size={13} /> Add sub-item
              </button>
            </div>
          )}

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
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create item'}
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

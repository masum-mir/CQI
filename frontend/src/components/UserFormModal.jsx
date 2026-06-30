import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const ROLES = ['faculty', 'chairperson', 'admin']
const STATUSES = ['active', 'inactive']

const EMPTY = {
  name: '',
  email: '',
  password: '',
  role: 'faculty',
  department: 'CSE',
  designation: '',
  employeeId: '',
  shortCode: '',
  status: 'active',
}

/**
 * Create/edit modal. Pass `user` (the user_dict shape from the API) to edit,
 * or omit it to create a new user.
 */
export default function UserFormModal({ user, onClose, onSubmit, submitting }) {
  const isEdit = !!user
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'faculty',
        department: user.department || 'CSE',
        designation: user.designation || '',
        employeeId: user.employeeId || '',
        shortCode: user.shortCode || '',
        status: user.status || 'active',
      })
    } else {
      setForm(EMPTY)
    }
  }, [user])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = isEdit
      ? {
          name: form.name,
          role: form.role,
          department: form.department,
          designation: form.designation || undefined,
          employeeId: form.employeeId || undefined,
          shortCode: form.shortCode || undefined,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        }
      : {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          department: form.department,
          designation: form.designation || undefined,
          employeeId: form.employeeId || undefined,
          shortCode: form.shortCode || undefined,
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
            {isEdit ? 'Edit user' : 'Create user'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Full name">
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              className="input"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              disabled={isEdit}
              className="input disabled:bg-gray-50 disabled:text-gray-400"
            />
          </Field>

          <Field label={isEdit ? 'New password (leave blank to keep current)' : 'Password'}>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required={!isEdit}
              minLength={8}
              placeholder={isEdit ? '••••••••' : undefined}
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select value={form.role} onChange={set('role')} className="input">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>

            {isEdit && (
              <Field label="Status">
                <select value={form.status} onChange={set('status')} className="input">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <input type="text" value={form.department} onChange={set('department')} className="input" />
            </Field>
            <Field label="Designation">
              <input type="text" value={form.designation} onChange={set('designation')} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Employee ID">
              <input type="text" value={form.employeeId} onChange={set('employeeId')} className="input" />
            </Field>
            <Field label="Short code">
              <input type="text" value={form.shortCode} onChange={set('shortCode')} className="input" />
            </Field>
          </div>

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
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.5);
        }
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

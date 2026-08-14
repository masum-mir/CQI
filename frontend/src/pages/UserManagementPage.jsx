import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, Upload, X, Save } from 'lucide-react'
import * as XLSX from 'xlsx'

import { userApi } from '../api/userApi'
import { useAuthContext } from '../context/AuthContext'
import UserFormModal from '../components/UserFormModal'
import Pagination from '../components/Pagination'
import { usePagination } from '../hooks/usePagination'

const ROLE_BADGE = {
  admin: 'bg-violet-100 text-violet-700',
  chairperson: 'bg-amber-100 text-amber-700',
  faculty: 'bg-sky-100 text-sky-700',
}

const STATUS_BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-500',
}

export default function AdminUserManagementPage() {
  const { user: currentUser } = useAuthContext()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Excel import state
  const importInputRef = useRef(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRows, setPreviewRows] = useState([])
  const [previewFileName, setPreviewFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const res = await userApi.list({
        role: roleFilter,
        status: statusFilter,
      })

      setUsers(res.data.data.users || [])
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to load users'
      )
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filtered = users.filter((u) => {
    if (!search) return true

    const q = search.toLowerCase()

    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  const { page, setPage, totalPages, paginated, pageSize } = usePagination(
    filtered,
    {
      pageSize: 10,
      resetDeps: [search, roleFilter, statusFilter],
    }
  )

  const openCreate = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setModalOpen(true)
  }

  const handleSubmit = async (payload) => {
    setSubmitting(true)

    try {
      if (editingUser) {
        await userApi.update(
          editingUser.id,
          payload
        )
      } else {
        await userApi.create(payload)
      }

      setModalOpen(false)
      await fetchUsers()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) return

    if (
      !confirm(
        `Delete ${u.name} (${u.email})? This cannot be undone.`
      )
    ) {
      return
    }

    setDeletingId(u.id)

    try {
      await userApi.remove(u.id)
      await fetchUsers()
    } catch (err) {
      alert(
        err.response?.data?.error ||
        'Failed to delete user'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // -------------------------------------------------------
  // Excel: choose file -> parse -> preview modal
  // -------------------------------------------------------
  const handleExcelPick = async (e) => {
    const file = e.target.files?.[0]

    // Allows selecting the same file again later.
    e.target.value = ''

    if (!file) return

    setError('')
    setImportResult(null)

    try {
      const buffer = await file.arrayBuffer()

      const workbook = XLSX.read(buffer, {
        type: 'array',
      })

      if (!workbook.SheetNames.length) {
        throw new Error(
          'The Excel file does not contain any worksheet.'
        )
      }

      const sheet =
        workbook.Sheets[workbook.SheetNames[0]]

      const rawRows =
        XLSX.utils.sheet_to_json(sheet, {
          defval: '',
          raw: false,
        })

      if (!rawRows.length) {
        throw new Error(
          'No data was found in the Excel file.'
        )
      }

      // Excel mapping:
      // ShortName                   -> shortCode
      // Email                       -> email
      // Name                        -> name
      // DesignationName             -> designation
      // Mobile                      -> mobile
      // AcademicDepartmentShortName -> department
      const rows = rawRows
        .map((row, index) => ({
          rowNumber: index + 2,
          shortCode: String(
            row.ShortName || ''
          ).trim(),
          email: String(
            row.Email || ''
          )
            .trim()
            .toLowerCase(),
          name: String(
            row.Name || ''
          ).trim(),
          designation: String(
            row.DesignationName || ''
          ).trim(),
          mobile: String(
            row.Mobile || ''
          ).trim(),
          department: String(
            row.AcademicDepartmentShortName || ''
          ).trim(),

          // Import rules
          role: 'faculty',
          status: 'active',
          password: '1234',
        }))
        .filter(
          (row) => row.name || row.email
        )

      if (!rows.length) {
        throw new Error(
          'No valid user records were found.'
        )
      }

      setPreviewFileName(file.name)
      setPreviewRows(rows)
      setPreviewOpen(true)
    } catch (err) {
      console.error(
        'Excel preview failed:',
        err
      )

      setError(
        err.message ||
        'Failed to read the Excel file'
      )
    }
  }

  const closePreview = () => {
    if (importing) return

    setPreviewOpen(false)
    setPreviewRows([])
    setPreviewFileName('')
  }

  // -------------------------------------------------------
  // Save previewed users to database
  // -------------------------------------------------------
  const handleSaveImportedUsers = async () => {
    if (!previewRows.length) return

    setImporting(true)
    setError('')

    try {
      // Do not send rowNumber. Password is also enforced
      // by backend, but included here for preview clarity.
      const payload = previewRows.map(
        ({
          rowNumber,
          ...row
        }) => ({
          ...row,
          password: '1234',
          role: 'faculty',
          status: 'active',
        })
      )

      const res =
        await userApi.importUsers(payload)

      const result =
        res.data?.data || {}

      setImportResult({
        total:
          result.total ??
          payload.length,
        created:
          result.created ?? 0,
        skipped:
          result.skipped ?? 0,
        failed:
          result.failed ?? 0,
      })

      setPreviewOpen(false)
      setPreviewRows([])
      setPreviewFileName('')

      await fetchUsers()
    } catch (err) {
      console.error(
        'User import failed:',
        err
      )

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to import users'
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Users
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage accounts and role assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelPick}
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              importInputRef.current?.click()
            }
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold rounded-lg transition"
          >
            <Upload size={16} />
            Import Users
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <Plus size={16} />
            New user
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search name or email"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value)
          }
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
        >
          <option value="">
            All roles
          </option>
          <option value="faculty">
            Faculty
          </option>
          <option value="chairperson">
            Chairperson
          </option>
          <option value="admin">
            Admin
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
        >
          <option value="">
            All statuses
          </option>
          <option value="active">
            Active
          </option>
          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
          {error}
        </p>
      )}

      {importResult && (
        <div className="text-xs px-3 py-2 rounded-lg mb-4 bg-emerald-50 text-emerald-700">
          Import finished — Total:{' '}
          {importResult.total},
          {' '}Created:{' '}
          {importResult.created},
          {' '}Skipped:{' '}
          {importResult.skipped},
          {' '}Failed:{' '}
          {importResult.failed}.
          {' '}Default password:{' '}
          <strong>1234</strong>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">
                Name
              </th>
              <th className="px-4 py-3">
                Email
              </th>
              <th className="px-4 py-3">
                Role
              </th>
              <th className="px-4 py-3">
                Status
              </th>
              <th className="px-4 py-3">
                Department
              </th>
              <th className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              )}

            {!loading &&
              paginated.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}

                    {u.id ===
                      currentUser?.id && (
                      <span className="ml-1.5 text-[10px] text-gray-400">
                        (you)
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {u.email}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        ROLE_BADGE[
                          u.role
                        ] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[
                          u.status
                        ] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {u.department ||
                      '—'}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          openEdit(u)
                        }
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition"
                        title="Edit"
                      >
                        <Pencil
                          size={14}
                        />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(u)
                        }
                        disabled={
                          u.id ===
                            currentUser?.id ||
                          deletingId ===
                            u.id
                        }
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-30 disabled:hover:bg-transparent"
                        title={
                          u.id ===
                          currentUser?.id
                            ? "You can't delete yourself"
                            : 'Delete'
                        }
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    </div>
                  </td>
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

      {/* Create/Edit User Modal */}
      {modalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={() =>
            setModalOpen(false)
          }
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* Excel Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview Imported Users
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  {previewFileName} · {previewRows.length} user(s)
                </p>
              </div>

              <button
                type="button"
                onClick={closePreview}
                disabled={importing}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rules */}
            <div className="px-5 py-3 bg-violet-50 border-b border-violet-100 text-xs text-violet-700">
              These users are not saved yet. Review the data first.
              When you click <strong>Save Users</strong>, new users will be
              created with role <strong>faculty</strong> and default password
              <strong> 1234</strong>.
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto">
              <table className="min-w-[1150px] w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-3 py-3">
                      #
                    </th>
                    <th className="px-3 py-3">
                      Short Name
                    </th>
                    <th className="px-3 py-3">
                      Name
                    </th>
                    <th className="px-3 py-3">
                      Email
                    </th>
                    <th className="px-3 py-3">
                      Designation
                    </th>
                    <th className="px-3 py-3">
                      Mobile
                    </th>
                    <th className="px-3 py-3">
                      Department
                    </th>
                    <th className="px-3 py-3">
                      Role
                    </th>
                    <th className="px-3 py-3">
                      Password
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map(
                    (row, index) => (
                      <tr
                        key={`${row.email}-${index}`}
                        className="border-b border-gray-50 hover:bg-gray-50/60"
                      >
                        <td className="px-3 py-2 text-gray-400">
                          {index + 1}
                        </td>

                        <td className="px-3 py-2 font-medium text-gray-700">
                          {row.shortCode ||
                            '—'}
                        </td>

                        <td className="px-3 py-2 text-gray-800">
                          {row.name ||
                            '—'}
                        </td>

                        <td className="px-3 py-2 text-gray-600">
                          {row.email ||
                            '—'}
                        </td>

                        <td className="px-3 py-2 text-gray-600">
                          {row.designation ||
                            '—'}
                        </td>

                        <td className="px-3 py-2 text-gray-600">
                          {row.mobile ||
                            '—'}
                        </td>

                        <td className="px-3 py-2 text-gray-600">
                          {row.department ||
                            '—'}
                        </td>

                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                            faculty
                          </span>
                        </td>

                        <td className="px-3 py-2 font-mono text-gray-600">
                          1234
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-white">
              <p className="text-xs text-gray-500">
                Total users ready to import:{' '}
                <strong className="text-gray-800">
                  {previewRows.length}
                </strong>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePreview}
                  disabled={importing}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveImportedUsers}
                  disabled={
                    importing ||
                    !previewRows.length
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:bg-violet-300 transition"
                >
                  <Save size={16} />

                  {importing
                    ? 'Saving...'
                    : 'Save Users'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
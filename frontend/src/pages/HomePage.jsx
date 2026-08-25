import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  Files,
  BookOpenCheck,
  History,
  Library,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'

const ACTIONS = [
  {
    icon: BookOpenCheck,
    title: 'My courses',
    desc: 'See courses assigned to your faculty account',
    to: '/my-courses-list',
    color: 'bg-indigo-50 text-indigo-600',
    roles: ['faculty', 'chairperson'],
  },
  {
    icon: UploadCloud,
    title: 'Course materials',
    desc: 'Upload and manage the required CQI documents',
    to: '/upload/file',
    color: 'bg-sky-50 text-sky-600',
    roles: ['faculty', 'chairperson'],
  },
  {
    icon: Files,
    title: 'Uploaded files',
    desc: 'Browse, preview, download, delete, or review files',
    to: '/upload/file/list',
    color: 'bg-emerald-50 text-emerald-600',
    roles: ['faculty', 'chairperson', 'admin'],
  },
  {
    icon: Library,
    title: 'Course list',
    desc: 'Create and manage semester course offerings',
    to: '/courses',
    color: 'bg-amber-50 text-amber-600',
    roles: ['chairperson', 'admin'],
  },
  {
    icon: History,
    title: 'Faculty history',
    desc: 'Inspect each faculty member’s course submission history',
    to: '/faculty-courses-list',
    color: 'bg-fuchsia-50 text-fuchsia-600',
    roles: ['chairperson', 'admin'],
  },
  {
    icon: ClipboardCheck,
    title: 'Faculty compliance',
    desc: 'Track missing required CQI items by faculty',
    to: '/faculty-compliance',
    color: 'bg-rose-50 text-rose-600',
    roles: ['chairperson', 'admin'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Import courses',
    desc: 'Preview and commit offered-course Excel imports',
    to: '/course/import',
    color: 'bg-cyan-50 text-cyan-600',
    roles: ['chairperson', 'admin'],
  },
  {
    icon: Users,
    title: 'Manage users',
    desc: 'Create, edit, import, deactivate, or remove accounts',
    to: '/admin/users',
    color: 'bg-violet-50 text-violet-600',
    roles: ['admin'],
  },
]

const ROLE_LABEL = {
  admin: 'Administrator',
  chairperson: 'Chairperson',
  faculty: 'Faculty',
}

export default function HomePage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const visibleActions = ACTIONS.filter((action) => action.roles.includes(user?.role))

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          {user?.role && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {ROLE_LABEL[user.role] || user.role}
            </span>
          )}
        </div>
         
      </div>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleActions.map(({ icon: Icon, title, desc, to, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
            </div>
          </button>
        ))}
      </div> */}

      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-800">Frontend-only demo is active</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            Login/session and CRUD changes are saved in this browser using localStorage. No API server or database is required.
          </p>
        </div>
      </div>
    </div>
  )
}

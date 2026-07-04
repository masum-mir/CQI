import { useNavigate } from 'react-router-dom'
import { UploadCloud, CheckSquare, ClipboardList, ListChecks, Users, Library, ShieldCheck, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth' 
import { useState } from 'react'
import { useAuthContext } from '@/context/AuthContext'

const ACTIONS = [
  {
    icon: UploadCloud,
    title: 'Upload PDFs',
    desc:  'Upload CQI documents for processing',
    to:    '/upload',
    color: 'bg-sky-50 text-sky-600',
    roles: ['chairperson', 'admin', 'faculty']
  }, 
  // {
  //   icon: ClipboardList,
  //   title: 'CQI plans',
  //   desc:  'Manage improvement action plans',
  //   to:    '/cqi-plans',
  //   color: 'bg-amber-50 text-amber-600',
  //   roles: ['chairperson', 'admin', 'faculty']
  // },
  // {
  //   icon: CheckSquare,
  //   title: 'Review submissions',
  //   desc: 'Approve or request changes on course files',
  //   to: '/review',
  //   color: 'bg-emerald-50 text-emerald-600',
  //   roles: ['chairperson', 'admin', 'faculty'],
  // },
  // {
  //   icon: Users,
  //   title: 'Manage users',
  //   desc: 'Create, edit, and assign roles to users',
  //   to: '/admin/users',
  //   color: 'bg-violet-50 text-violet-600',
  //   roles: ['chairperson', 'admin', 'faculty'],
  // },
  // {
  //   icon: BookOpen,
  //   title: 'Courses',
  //   desc: 'View course offerings',
  //   to: '/courses',
  //   color: 'bg-indigo-50 text-indigo-600',
  //   roles: ['faculty', 'chairperson', 'admin'],
  // },
  // {
  //   icon: Library,
  //   title: 'Course catalog',
  //   desc: 'Manage stable course definitions',
  //   to: '/catalog',
  //   color: 'bg-rose-50 text-rose-600',
  //   roles: ['chairperson', 'admin', 'faculty'],
  // },
  // {
  //   icon: UploadCloud,
  //   title: 'Import courses',
  //   desc: 'Import offerings from the semester PDF',
  //   to: '/courses/import',
  //   color: 'bg-cyan-50 text-cyan-600',
  //   roles: ['chairperson', 'admin', 'faculty'],
  // },
  //   {
  //   icon: ListChecks,
  //   title: 'Required items',
  //   desc: 'Manage the master CQI checklist (1–17)',
  //   to: '/admin/items',
  //   color: 'bg-teal-50 text-teal-600',
  //      roles: ['chairperson', 'admin', 'faculty'],
  // },

]

const ROLE_LABEL = {
  admin: 'Administrator',
  chairperson: 'Chairperson',
  faculty: 'Faculty',
}
 

export default function HomePage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const visibleActions = ACTIONS.filter((a) => a.roles.includes(user?.role))

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          {user?.role && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {ROLE_LABEL[user.role] || user.role}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          CQI — Continuous Quality Improvement
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleActions.map(({ icon: Icon, title, desc, to, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-start gap-3 p-4 bg-white border border-gray-100
                       rounded-xl hover:border-gray-200 hover:shadow-sm transition-all text-left"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}

        {visibleActions.length === 0 && (
          <p className="col-span-2 text-sm text-gray-400">
            No actions available for your role yet.
          </p>
        )}
      </div>

      {user?.role === 'admin' && (
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={14} />
          You have administrator access.
        </div>
      )}
    </div>
  )
}

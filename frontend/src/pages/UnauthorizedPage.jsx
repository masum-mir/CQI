import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Access denied</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your account role doesn't have permission to view this page.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition"
        >
          Back to home
        </button>
      </div>
    </div>
  )
}

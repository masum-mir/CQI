// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../hooks/useAuth'

// export default function LoginPage() {
//   const navigate = useNavigate()
//   const { login, register } = useAuth()

//   const [isRegister, setIsRegister] = useState(false)
//   const [form, setForm]     = useState({ username: '', password: '', email: '' })
//   const [error, setError]   = useState('')
//   const [loading, setLoading] = useState(false)

//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setError('')
//     setLoading(true)

//     try {
//       if (isRegister) {
//         await register(form.username, form.password, form.email)
//       } else {
//         await login(form.username, form.password)
//       }

//       navigate('/', { replace: true })
//     } catch (err) {
//       const msg =
//         err.response?.data?.error ||
//         err.response?.data?.detail ||
//         Object.values(err.response?.data || {})[0] ||
//         'Something went wrong'

//       setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100 flex items-center justify-center p-4">
//       <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3">
//             <span className="text-white text-xl font-bold">C</span>
//           </div>

//           <h1 className="text-2xl font-bold text-gray-900">CQI System</h1>

//           <p className="text-sm text-gray-500 mt-1">
//             {isRegister ? 'Create a new account' : 'Login to your account'}
//           </p>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">

//           {/* Username */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-600 mb-1">
//               Username
//             </label>
//             <input
//               type="text"
//               value={form.username}
//               onChange={set('username')}
//               required
//               autoFocus
//               placeholder="your_username"
//               className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
//             />
//           </div>

//           {/* Email */}
//           {isRegister && (
//             <div>
//               <label className="block text-xs font-semibold text-gray-600 mb-1">
//                 Email <span className="text-gray-400 font-normal">(optional)</span>
//               </label>
//               <input
//                 type="email"
//                 value={form.email}
//                 onChange={set('email')}
//                 placeholder="you@example.com"
//                 className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
//               />
//             </div>
//           )}

//           {/* Password */}
//           <div>
//             <label className="block text-xs font-semibold text-gray-600 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               value={form.password}
//               onChange={set('password')}
//               required
//               placeholder="••••••••"
//               className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
//             />
//           </div>

//           {/* Error */}
//           {error && (
//             <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
//               {error}
//             </p>
//           )}

//           {/* Submit */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
//           >
//             {loading
//               ? isRegister
//                 ? 'Creating account...'
//                 : 'Logging in...'
//               : isRegister
//               ? 'Register'
//               : 'Login'}
//           </button>
//         </form>

//         {/* Toggle */}
//         <p className="text-center text-xs text-gray-500 mt-6">
//           {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
//           <button
//             onClick={() => {
//               setIsRegister((v) => !v)
//               setError('')
//             }}
//             className="text-violet-600 font-semibold hover:underline"
//           >
//             {isRegister ? 'Login' : 'Register'}
//           </button>
//         </p>
//       </div>
//     </div>
//   )
// } 


import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Camera, Eye, EyeOff, User } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'  


const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  shortCode: '',
  designation: '',
  department: '',
  employeeId: '',
  profileImage: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuthContext()

  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = isRegister
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password)

      // Send the user back where they came from, or pick a landing page by role
      const redirectTo = location.state?.from?.pathname || roleHome(user.role)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        Object.values(err.response?.data || {})[0] ||
        'Something went wrong'

      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">C</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">CQI System</h1>

          <p className="text-sm text-gray-500 mt-1">
            {isRegister ? 'Create a new account' : 'Login to your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name (register only) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                autoFocus
                placeholder="Jane Doe"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoFocus={!isRegister}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={isRegister ? 8 : undefined}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* Note: self-registration is always created as "faculty"; admin/chairperson accounts are assigned by an admin */}
          {isRegister && (
            <p className="text-[11px] text-gray-400 -mt-2">
              New accounts are created with the Faculty role. Contact an admin for elevated access.
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-lg transition"
          >
            {loading
              ? isRegister
                ? 'Creating account...'
                : 'Logging in...'
              : isRegister
              ? 'Register'
              : 'Login'}
          </button>
        </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-[11px] text-gray-400 cqi-sans">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="flex justify-center">
            { <GoogleLogin
  onSuccess={async (credentialResponse) => {
    const res = await axios.post('/api/auth/google', {
      idToken: credentialResponse.credential
    });
    const { user, accessToken, refreshToken } = res.data.data; // check your `ok()` response shape
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    // redirect to dashboard
  }}
  onError={() => console.log('Google login failed')}
/> }
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 cqi-sans">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsRegister((v) => !v)
                setError('')
                setForm(EMPTY_FORM)
                setShowPassword(false)
              }}
              className="text-violet-600 font-semibold hover:underline"
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Default landing page per role — adjust to match your route names
function roleHome(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'chairperson':
      return '/chairperson'
    default:
      return '/'
  }
}

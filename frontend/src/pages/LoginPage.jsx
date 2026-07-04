import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Camera, Eye, EyeOff, User } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
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
  const fileInputRef = useRef(null)

  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const goHome = (user) => {
    if (!user?.role) {
      navigate('/')
      return
    }
    const redirectTo = location.state?.from?.pathname || roleHome(user.role)
    navigate(redirectTo, { replace: true })
  }

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, profileImage: reader.result }))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
console.log("user data 1: ", form);
    try {
      const user = isRegister
        ? await register({
            name: form.name,
            email: form.email,
            password: form.password,
            shortCode: form.shortCode,
            designation: form.designation,
            department: form.department,
            employeeId: form.employeeId,
            profileImage: form.profileImage,
          })
        : await login(form.email, form.password)
console.log("user data: ", user);
      goHome(user)
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
    <div className="min-h-screen flex bg-[#FBFAF7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

        .cqi-serif { font-family: 'Fraunces', ui-serif, Georgia, serif; }
        .cqi-sans { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }

        @keyframes cqiOrbit { to { transform: rotate(360deg); } }
        @keyframes cqiFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        .cqi-orbit-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: cqiOrbit 9s linear infinite;
        }
        .cqi-fade-in { animation: cqiFadeIn .3s ease both; }

        @media (prefers-reduced-motion: reduce) {
          .cqi-orbit-dot { animation: none; }
        }
      `}</style>
 
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-b from-[#131B3A] to-[#1B2748] text-white flex-col justify-between px-12 py-12 overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md border border-[#C9A227]/50 bg-white/5 flex items-center justify-center">
            <span className="cqi-serif text-[#C9A227] text-lg font-semibold">C</span>
          </div>
          <span className="cqi-sans text-sm tracking-wide text-white/70">CQI System</span>
        </div>

        <div className="flex flex-col items-center">
          <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
            <circle cx="150" cy="150" r="112" fill="none" stroke="#C9A227" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 6" />
 
            <g className="cqi-orbit-dot">
              <circle cx="150" cy="38" r="4" fill="#C9A227" />
            </g>

            {[
              { label: 'Plan', x: 150, y: 38 },
              { label: 'Do', x: 262, y: 150 },
              { label: 'Check', x: 150, y: 262 },
              { label: 'Act', x: 38, y: 150 },
            ].map((n) => (
              <g key={n.label}>
                <circle cx={n.x} cy={n.y} r="26" fill="#131B3A" stroke="#C9A227" strokeWidth="1.25" />
                <text
                  x={n.x}
                  y={n.y + 5}
                  textAnchor="middle"
                  className="cqi-sans"
                  fontSize="12"
                  fill="#F4EFE2"
                  fontWeight="500"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>

          <h1 className="cqi-serif text-[28px] leading-tight text-center mt-6 max-w-[280px]">
            Continuous quality,<br />built into every course.
          </h1>
          <p className="cqi-sans text-sm text-white/60 text-center mt-3 max-w-[280px]">
           </p>
        </div>

        <p className="cqi-sans text-xs text-white/40">
         </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile-only compact header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-11 h-11 rounded-md bg-[#131B3A] flex items-center justify-center mb-3">
              <span className="cqi-serif text-[#C9A227] text-lg font-semibold">C</span>
            </div>
            <h1 className="cqi-serif text-xl text-[#1E2433]">CQI System</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="cqi-serif text-2xl text-[#1E2433]">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="cqi-sans text-sm text-[#6B7280] mt-1">
              {isRegister
                ? 'Set up faculty access to the CQI dashboard'
                : 'Log in to continue to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="cqi-sans space-y-4">

            {isRegister && (
              <div className="cqi-fade-in space-y-4">
                {/* Avatar upload */}
                <div className="flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full group"
                    title="Upload profile photo"
                  >
                    {form.profileImage ? (
                      <img
                        src={form.profileImage}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-violet-400 transition">
                        <User size={26} className="text-gray-300" />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center border-2 border-white">
                      <Camera size={12} className="text-white" />
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarPick}
                    className="hidden"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Initial code
                    </label>
                    <input
                      type="text"
                      value={form.shortCode}
                      onChange={set('shortCode')}
                      required
                      placeholder="RDA"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={form.employeeId}
                      onChange={set('employeeId')}
                      required
                      placeholder="EMP-042"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={set('designation')}
                      required
                      placeholder="Senior Lecturer"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={set('department')}
                      required
                      placeholder="CSE"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                </div>
              </div>
            )}

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

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={isRegister ? 4 : undefined}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <p className="text-[11px] text-gray-400 -mt-2">
                New accounts are created with the Faculty role. Contact an admin for elevated access.
              </p>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

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
            {/* <GoogleLoginButton
              text={isRegister ? 'signup_with' : 'signin_with'}
              width={288}
              onSuccess={(user) => {
                setError('')
                goHome(user)
              }}
            /> */}
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
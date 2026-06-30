// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth";

// export function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div
//           className="w-6 h-6 rounded-full border-2 border-violet-600
//                         border-t-transparent animate-spin"
//         />
//       </div>
//     );
//   }

//   if (!user) return <Navigate to="/login" replace />;
//   return children;
// }

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'

/**
 * Guards a route subtree behind authentication, and optionally behind a
 * whitelist of roles.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>          // any logged-in user
 *   <Route element={<ProtectedRoute roles={['admin']} />}>   // admin only
 *   <Route element={<ProtectedRoute roles={['admin', 'chairperson']} />}>
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuthContext()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

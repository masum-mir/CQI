# Context — Auth bypass changes (REVERTED)

## Status
Auth bypass has been **reverted**. Both files restored to their original code.

## Reverted files

### 1. `frontend/src/hooks/useAuth.js`
Restored to original — checks localStorage for `access_token`, calls `authApi.me()` on mount, provides real `login`, `register`, `googleLogin`, `logout` handlers.

### 2. `frontend/src/components/layout/ProtectedRoute.jsx`
Restored to original — checks `user` and `loading` from `useAuthContext`, redirects to `/login` if unauthenticated, redirects to `/unauthorized` if role gate fails.

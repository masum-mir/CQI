# Context

## Auth bypass changes (REVERTED)
Auth bypass was **reverted**. Login now calls the real backend again. Mock data file deleted.

### Reverted files
- `frontend/src/hooks/useAuth.js` — restored to original (real API calls)
- `frontend/src/pages/UploadPage.jsx` — restored to original (API calls, not mock data)
- `frontend/src/hooks/useCourseUpload.js` — restored to original (real commit logic)
- `frontend/src/utils/mockData.js` — deleted

## API path prefix fix (2026-07-06) — login only
Frontend auth API calls were missing the `/api` path prefix, so Vite's dev proxy never forwarded them to Django. Also fixed the proxy target (doubled `/api`).

### Files changed
- `frontend/src/api/authApi.js` — `/auth/...` → `/api/auth/...`
- `frontend/src/api/axios.js` — refresh URL `/auth/refresh` → `/api/auth/refresh` + interceptor check
- `frontend/vite.config.js` — proxy target `http://localhost:8000/api` → `http://localhost:8000`

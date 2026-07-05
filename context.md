# Context — Auth bypass changes (REVERTED)

## Status
Auth bypass has been **reverted**. Login now calls the real backend again. Mock data file deleted.

## Reverted files
- `frontend/src/hooks/useAuth.js` — restored to original (real API calls)
- `frontend/src/pages/UploadPage.jsx` — restored to original (API calls, not mock data)
- `frontend/src/hooks/useCourseUpload.js` — restored to original (real commit logic)
- `frontend/src/utils/mockData.js` — deleted

# CQI Frontend — Frontend-Only Demo

This version runs the CQI workflow without a backend API or database. The initial demo records come from `src/data/mockData.json`, while changes made in the UI are persisted in the browser using `localStorage`.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

No Django, MongoDB, API server, or Google login configuration is required for this demo.

## Demo accounts

All built-in accounts use this password:

```text
12345678
```

| Role | Email |
| --- | --- |
| Admin | `admin@cqi.local` |
| Chairperson | `chairperson@cqi.local` |
| Faculty | `faculty@cqi.local` |

The login page also contains one-click buttons for these accounts.

## What works in mock mode

- Authentication and logout
- Role-protected routes
- Faculty registration
- Profile display
- User create/edit/delete and Excel user import
- Course create/edit/delete
- Course Excel preview/commit import
- Faculty course history
- CQI compliance / missing-item report
- Course material upload metadata
- Uploaded-file listing, filtering, preview/download fallback, and deletion
- Chairperson/Admin document review status
- Browser persistence after refresh
- Reset to the original fixed JSON demo data from the login page

## Data architecture

```text
src/data/mockData.json
        ↓ initial seed
src/mock/mockDb.js
        ↓
localStorage + in-memory Blob cache
        ↓
src/api/*.js mock API adapters
        ↓
Existing pages/components
```

The page components still call APIs such as `authApi`, `userApi`, `courseApi`, and `courseFileApi`, but those adapters now operate locally. This keeps the UI structure close to a future real-backend implementation.

## Important limitation

This mode is for demonstration, UI development, presentation, and testing only. It is not secure authentication: passwords and records are browser-side demo data. Uploaded file metadata persists, but large file bytes are not permanently stored; after a refresh, seeded/fallback preview content may be shown for those files.

For a real multi-user deployment, authentication, authorization, durable file storage, audit logs, and shared records must move to a backend/database.

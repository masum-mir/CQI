# UploadPage Refactor — Change Log

## Overview
Refactored UploadPage from a single 610-line file into a modular architecture with reusable components and three synchronized view modes. All existing upload logic, backend API calls, commit flow, and file state management are preserved.

---

## 1. Constants & Helpers Extracted

### `src/utils/uploadConstants.js`
- `CATEGORIES` — 11 category groups with 17 item slots
- `SLOT_MAP` — item ID → backend `{ itemNo, subItem }` mapping
- `MAX_SIZE_BYTES` — 10 MB file size limit
- `ALLOWED_TYPES` — accepted MIME types

### `src/utils/uploadHelpers.js`
- `getFileIcon(file)` — returns `{ Icon, color }` based on file extension
- `makeEntry(file, itemId)` — creates a locally-queued file entry

---

## 2. New Reusable Components

| Component | File | Purpose |
|---|---|---|
| `UploadStatusDot` | `src/components/uploads/UploadStatusDot.jsx` | Colored dot: done=green, uploading=blue, failed=red, queued=gray |
| `UploadThumbnail` | `src/components/uploads/UploadThumbnail.jsx` | Small thumbnail (image or file icon) |
| `UploadCard` | `src/components/uploads/UploadCard.jsx` | Square upload card with icon, status dot, remove button |
| `UploadCategory` | `src/components/uploads/UploadCategory.jsx` | Category section wrapper (title + divider) |
| `GroupedUploadView` | `src/components/uploads/GroupedUploadView.jsx` | The original grouped category layout |
| `FolderCard` | `src/components/uploads/FolderCard.jsx` | Windows Explorer–style folder card with thumbnails |
| `FolderUploadView` | `src/components/uploads/FolderUploadView.jsx` | Grid of folder cards |
| `ListRow` | `src/components/uploads/ListRow.jsx` | Table row with Uploaded (green) / Missing (red) status |
| `ListUploadView` | `src/components/uploads/ListUploadView.jsx` | Table of all required items with dynamic status |
| `ViewModeToggle` | `src/components/uploads/ViewModeToggle.jsx` | 3-button toggle: Grouped / Folder / List |
| `UploadToolbar` | `src/components/uploads/UploadToolbar.jsx` | Semester filter dropdown + course tabs |
| `BottomBar` | `src/components/uploads/BottomBar.jsx` | Back / file count / Commit bar |

## 3. Custom Hook

### `src/hooks/useCourseUpload.js`
Encapsulates all file upload state and handlers:
- `courseFiles` state, `committing` state
- `files`, `fileMap`, `getFileForItem`
- `handleFileAdd`, `handleRemoveFile`, `handleCommit`
- `totalItems`, `totalFiles`, `queuedCount`

All handler logic is **identical** to the original.

---

## 4. Refactored `UploadPage.jsx`

**Before:** 610 lines, all rendering inline
**After:** 185 lines, delegates to components

Responsibilities:
- Page state (active course, semester, view mode)
- Data fetching (courses, items)
- Props wiring to child components

---

## 5. Three View Modes

All three views read from the **same `getFileForItem` function** — files, not duplicated state.

### Grouped View (default)
Same as original: categories with upload cards in a responsive grid.

### Folder View
Windows Explorer–style folder cards:
- Folder icon + category name
- Up to 4 uploaded file thumbnails
- "+N" overflow badge (Google Drive style)
- "No files uploaded" fallback
- Upload progress: "X / Y uploaded"
- Click opens the category's upload slot

### List View
Full table of all 17 required items:
- Status column (Uploaded / Missing) with color-coded rows
- Document Name column
- Green rows = uploaded, red rows = missing
- Click any row to upload/preview

---

## 6. What Was NOT Changed
- `usePDFUpload` hook — untouched
- `uploadApi.js`, `courseFileApi.js` — untouched
- `axios.js` — untouched
- Backend endpoints — untouched
- `FilePreviewPanel.jsx` — untouched
- File validation logic — untouched
- Commit flow — untouched (identical code in hook)
- Upload status handling — untouched
- File removal / add logic — untouched

# Update — File thumbnails, renamed views, auth bypass reverted

## Changes kept

### View renaming
- "Grouped" view → **Compact** view (icon: `LayoutGrid`)
- "Folder" view → **Grid** view (icon: `Grid3x3`)
- Files: `GroupedUploadView.jsx` → `CompactUploadView.jsx`, `FolderUploadView.jsx` → `GridUploadView.jsx`
- Updated labels, icons, and all imports in `UploadPage.jsx` and `ViewModeToggle.jsx`

### `frontend/src/components/uploads/UploadCard.jsx`
- **Images**: Render as `object-cover` thumbnail via stored blob URL
- **PDFs**: Render first page as thumbnail using `react-pdf`
- **Other types**: Keep existing file-type icon display
- Thumbnail URL comes from `fileEntry.thumbnailUrl` (stored in state)

### `frontend/src/components/uploads/GridUploadView.jsx`
- Uses `UploadCard` (same as compact view), flat grid without category headers

### `frontend/src/utils/uploadHelpers.js`
- `makeEntry` creates a `thumbnailUrl` (blob URL) for images and PDFs

### `frontend/src/hooks/useCourseUpload.js`
- `handleRemoveFile` revokes the blob URL when a file is removed

## Reverted
- Auth bypass removed — login calls real backend
- Mock data deleted

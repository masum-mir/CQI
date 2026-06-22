import { useState, useCallback } from "react";
import { FileUploadPanel } from "./FileUploadPanel";
import { FilePreviewPanel } from "./FilePreviewPanel";
import { usePDFUpload } from "@/hooks/usePDFUpload";
import toast from "react-hot-toast";

const MAX_FILES = 7;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function FileUploader() {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const { files, addFiles, removeFile, upload, uploading } = usePDFUpload();

  const handleAddFiles = useCallback(
    (newFiles, fileType) => {
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) {
        toast.error(`Max ${MAX_FILES} files allowed.`);
        return;
      }

      const valid = [];
      const errors = [];

      newFiles.slice(0, remaining).forEach((f) => {
        if (!ALLOWED_TYPES.has(f.type))
          errors.push(`${f.name}: unsupported format`);
        else if (f.size > MAX_SIZE_BYTES)
          errors.push(`${f.name}: exceeds 10 MB`);
        else valid.push(f);
      });

      if (errors.length) toast.error(errors.join("\n"));
      if (!valid.length) return;

      addFiles(valid, fileType);
    },
    [files.length, addFiles],
  );

  const handleRemove = (idx) => {
    removeFile(idx);
    if (selectedIdx === idx) setSelectedIdx(null);
    else if (selectedIdx > idx) setSelectedIdx((prev) => prev - 1);
  };

  const selectedItem = selectedIdx !== null ? files[selectedIdx] : null;

  return (
    <>
      <div
        className="border border-gray-200 rounded-2xl overflow-hidden
                      bg-white shadow-sm"
      >
        <FileUploadPanel
          files={files}
          uploading={uploading}
          selectedIdx={selectedIdx}
          onAddFiles={handleAddFiles}
          onRemoveFile={handleRemove}
          onSelectFile={setSelectedIdx}
          onUpload={upload}
        />
      </div>

      <FilePreviewPanel
        item={selectedItem}
        onClose={() => setSelectedIdx(null)}
        onRemove={() => handleRemove(selectedIdx)}
      />
    </>
  );
}
import { useState, useCallback, useRef } from "react";
import { uploadApi } from "@/api/uploadApi";
import toast from "react-hot-toast";

export function usePDFUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const pollRefs = useRef({});

  // ─── FIX 1 & 2: accept and store fileType, remove PDF filter ───
  const addFiles = useCallback(
    (newFiles, fileType) => {
      const MAX = 20; // enough for 14 categories + buffer
      const allowedFiles = newFiles.slice(0, MAX - files.length);
      if (allowedFiles.length < newFiles.length) {
        toast.error(`Max ${MAX} files allowed.`);
      }
      setFiles((prev) => [
        ...prev,
        ...allowedFiles.map((f) => ({
          file: f,
          fileType: fileType, // store the category
          id: null,
          status: "queued",
          progress: 0,
          error: null,
        })),
      ]);
    },
    [files.length]
  );

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const pollStatus = (uploadId, idx) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await uploadApi.getStatus(uploadId);
        setFiles((prev) =>
          prev.map((f, i) =>
            i === idx
              ? { ...f, status: data.status, parsed_data: data.parsed_data }
              : f
          )
        );
        if (["done", "failed"].includes(data.status)) {
          clearInterval(interval);
          delete pollRefs.current[uploadId];
          if (data.status === "done")
            toast.success(`✓ ${data.original_name} processed`);
          if (data.status === "failed")
            toast.error(`✗ ${data.original_name} failed`);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
    pollRefs.current[uploadId] = interval;
  };

  // ─── FIX 3: upload only files matching the given fileType ───
  const upload = useCallback(
    async (fileType) => {
      // Find indices of files that belong to this category
      const indices = files
        .map((f, i) => (f.fileType === fileType ? i : -1))
        .filter((i) => i !== -1);

      if (indices.length === 0) {
        toast.info(`No files to upload for ${fileType}`);
        return;
      }

      const filesToUpload = indices.map((i) => files[i]);

      setUploading(true);
      try {
        const rawFiles = filesToUpload.map((f) => f.file);
        const { data } = await uploadApi.upload(
          fileType,
          rawFiles,
          (pct) => {
            setFiles((prev) => prev.map((f) => ({ ...f, progress: pct })));
          }
        );

        // Update status for uploaded files
        setFiles((prev) =>
          prev.map((f, i) => {
            if (indices.includes(i)) {
              const match = data.find((d, idx) => idx === indices.indexOf(i));
              if (match) {
                return { ...f, id: match.id, status: "processing" };
              }
            }
            return f;
          })
        );

        // Start polling for each uploaded file
        data.forEach((d, idx) => {
          const originalIndex = indices[idx];
          pollStatus(d.id, originalIndex);
        });

        toast.success(`${data.length} file(s) uploaded. Processing...`);
      } catch (e) {
        toast.error("Upload failed: " + (e.response?.data?.detail || e.message));
      } finally {
        setUploading(false);
      }
    },
    [files]
  );

  return { files, addFiles, removeFile, upload, uploading };
}
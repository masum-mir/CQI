import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { courseFileApi } from "@/api/courseFileApi";
import { CATEGORIES, SLOT_MAP, MAX_SIZE_BYTES, ALLOWED_TYPES } from "@/utils/uploadConstants";
import { makeEntry } from "@/utils/uploadHelpers";

export default function useCourseUpload(activeCourseId) {
  const [courseFiles, setCourseFiles] = useState({});
  const [committing, setCommitting] = useState(false);

  const files = useMemo(
    () => (activeCourseId ? courseFiles[activeCourseId] || [] : []),
    [courseFiles, activeCourseId]
  );

  const updateActiveCourseFiles = useCallback(
    (updater) => {
      if (!activeCourseId) return;
      setCourseFiles((prev) => ({
        ...prev,
        [activeCourseId]: updater(prev[activeCourseId] || []),
      }));
    },
    [activeCourseId]
  );

  const fileMap = useMemo(() => {
    const map = new Map();
    files.forEach((f) => {
      if (f.fileType) map.set(f.fileType, f);
    });
    return map;
  }, [files]);

  const getFileForItem = useCallback((itemId) => fileMap.get(itemId) || null, [fileMap]);

  const handleFileAdd = useCallback(
    (e, targetItemIdRef, selectedItem, setSelectedItem) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) {
        e.target.value = "";
        targetItemIdRef.current = null;
        return;
      }
      const itemId = targetItemIdRef.current;
      if (!itemId) {
        toast.error("No item selected. Please try again.");
        e.target.value = "";
        return;
      }
      const file = fileList[0];
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        e.target.value = "";
        targetItemIdRef.current = null;
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: exceeds 10 MB`);
        e.target.value = "";
        targetItemIdRef.current = null;
        return;
      }
      updateActiveCourseFiles((list) => [
        ...list.filter((f) => f.fileType !== itemId),
        makeEntry(file, itemId),
      ]);
      if (selectedItem?.fileType === itemId) setSelectedItem(null);
      e.target.value = "";
      targetItemIdRef.current = null;
    },
    [updateActiveCourseFiles]
  );

  const handleRemoveFile = useCallback(
    (itemId, selectedItem, setSelectedItem) => {
      updateActiveCourseFiles((list) => {
        const removed = list.find((f) => f.fileType === itemId);
        if (removed?.thumbnailUrl) URL.revokeObjectURL(removed.thumbnailUrl);
        return list.filter((f) => f.fileType !== itemId);
      });
      if (selectedItem?.fileType === itemId) setSelectedItem(null);
    },
    [updateActiveCourseFiles]
  );

  const handleCommit = useCallback(async () => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }
    const courseId = activeCourseId;
    const queued = (courseFiles[courseId] || []).filter(
      (f) => f.status === "queued" || f.status === "failed"
    );
    if (!queued.length) {
      toast("No files to upload for this course.");
      return;
    }

    const setStatus = (fileType, status) =>
      setCourseFiles((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).map((f) =>
          f.fileType === fileType ? { ...f, status } : f
        ),
      }));

    setCommitting(true);
    queued.forEach((f) => setStatus(f.fileType, "uploading"));
    try {
      const cfRes = await courseFileApi.create(courseId);
      const cfId = cfRes.data.data.courseFile.id;
      let ok = 0;
      for (const f of queued) {
        const meta = SLOT_MAP[f.fileType] || { isAdditional: true };
        try {
          await courseFileApi.upload(cfId, f.file, meta);
          setStatus(f.fileType, "done");
          ok += 1;
        } catch (err) {
          setStatus(f.fileType, "failed");
          const msg = err?.response?.data?.message || err?.message || "Unknown error";
          console.error(`Upload error for ${f.fileType}:`, err);
          toast.error(`${f.file.name}: ${msg}`);
        }
      }
      if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""} ✓`);
    } catch (err) {
      queued.forEach((f) => setStatus(f.fileType, "queued"));
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      toast.error(`Could not open course file: ${msg}`);
    } finally {
      setCommitting(false);
    }
  }, [activeCourseId, courseFiles]);

  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const totalFiles = files.length;
  const queuedCount = files.filter(
    (f) => f.status === "queued" || f.status === "failed"
  ).length;

  return {
    files,
    fileMap,
    getFileForItem,
    courseFiles,
    committing,
    handleFileAdd,
    handleRemoveFile,
    handleCommit,
    totalItems,
    totalFiles,
    queuedCount,
    updateActiveCourseFiles,
  };
}

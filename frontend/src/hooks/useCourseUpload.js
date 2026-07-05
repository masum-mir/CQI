
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { courseFileApi } from "@/api/courseFileApi";
import { documentApi } from "@/api/documentApi";

/**
 * useCourseUpload(activeCourseId)
 * -------------------------------
 * Owns the upload state for the CQI upload page:
 *  - a PER-COURSE local queue: { [courseId]: entry[] }  (files stay local until committed)
 *  - loads already-committed documents when a course opens (so they show after refresh)
 *  - commit: creates/reuses the course file, then uploads each queued slot
 *
 * Entry shape (consumed by the grid / FilePreviewPanel):
 *   { id, file, fileType, status, committed?, documentId? }
 *   status: "queued" | "uploading" | "done" | "failed"
 */

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

// Card slot id -> backend { itemNo, subItem }.
// The backend requires a subItem for every item (even single-variant ones,
// which use "1" as the default), so this stays internal/automatic — the UI
// still shows one slot per card, no user-facing "pick a sub-item" step.
export const SLOT_MAP = {
  final_grades: { itemNo: 1, subItem: "1" },
  obe_excel: { itemNo: 2, subItem: "1" },
  co_attainment: { itemNo: 3, subItem: "1" },
  po_attainment: { itemNo: 4, subItem: "1" },
  cqi_grade_summary: { itemNo: 5, subItem: "1" },
  instructor_feedback: { itemNo: 6, subItem: "1" },
  course_outline: { itemNo: 7, subItem: "1" },
  class_test_question: { itemNo: 8, subItem: "question" },
  class_test_sample: { itemNo: 8, subItem: "samples" },
  midterm_question: { itemNo: 9, subItem: "question" },
  midterm_sample: { itemNo: 9, subItem: "samples" },
  final_question: { itemNo: 10, subItem: "question" },
  final_sample: { itemNo: 10, subItem: "samples" },
  project_list: { itemNo: 11, subItem: "list" },
  project_sample: { itemNo: 11, subItem: "samples" },
  lab_experiments: { itemNo: 12, subItem: "1" },
  class_attendance: { itemNo: 13, subItem: "1" },
  lab_attendance: { itemNo: 14, subItem: "1" },
  midterm_attendance: { itemNo: 15, subItem: "1" },
  final_attendance: { itemNo: 16, subItem: "1" },
  capstone_report: { itemNo: 17, subItem: "1" },
};

// Reverse: "itemNo:subItem" -> slot id  (to place committed docs back on cards)
const REVERSE_SLOT = Object.entries(SLOT_MAP).reduce((m, [slot, meta]) => {
  m[`${meta.itemNo}:${meta.subItem}`] = slot;
  return m;
}, {});

const TOTAL_SLOTS = Object.keys(SLOT_MAP).length;

function makeEntry(file, itemId) {
  return {
    id: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileType: itemId,
    status: "queued",
  };
}

export default function useCourseUpload(activeCourseId) {
  const [courseFiles, setCourseFiles] = useState({}); // { courseId: entry[] }
  const [committing, setCommitting] = useState(false);

  const cfIdByCourse = useRef({});     // courseId -> courseFileId (once known)
  const loadedCourses = useRef(new Set());

  const files = useMemo(
    () => (activeCourseId ? courseFiles[activeCourseId] || [] : []),
    [courseFiles, activeCourseId]
  );

  const updateActive = useCallback(
    (updater) => {
      if (!activeCourseId) return;
      setCourseFiles((prev) => ({
        ...prev,
        [activeCourseId]: updater(prev[activeCourseId] || []),
      }));
    },
    [activeCourseId]
  );

  // Load committed documents for the active course (once per course).
  useEffect(() => {
    if (!activeCourseId || loadedCourses.current.has(activeCourseId)) return;
    let cancelled = false;

    (async () => {
      try {
        const listRes = await courseFileApi.list();
        const cfs = listRes.data.data?.courseFiles || listRes.data.courseFiles || [];
        const cf = cfs.find((x) => x.course === activeCourseId);
        if (!cf) {
          loadedCourses.current.add(activeCourseId);
          return;
        }
        cfIdByCourse.current[activeCourseId] = cf.id;

        const detRes = await courseFileApi.get(cf.id);
        const docs = detRes.data.data?.documents || [];
        if (cancelled) return;

        const committed = docs
          .filter((d) => !d.isAdditional)
          .map((d) => {
            const slot = REVERSE_SLOT[`${d.itemNo}:${d.subItem || "1"}`];
            if (!slot) return null;
            return {
              id: d.id,
              documentId: d.id,
              fileType: slot,
              status: "done",
              committed: true,
              // lightweight stand-in so cards can render name/size/ext
              file: {
                name: d.storage?.originalName || d.storage?.fileName || "file",
                size: d.storage?.size,
                type: d.storage?.mimeType,
              },
            };
          })
          .filter(Boolean);

        loadedCourses.current.add(activeCourseId);
        if (committed.length) {
          setCourseFiles((prev) => {
            const existing = prev[activeCourseId] || [];
            const bySlot = new Map(existing.map((e) => [e.fileType, e]));
            committed.forEach((c) => {
              if (!bySlot.has(c.fileType)) bySlot.set(c.fileType, c); // don't clobber local edits
            });
            return { ...prev, [activeCourseId]: [...bySlot.values()] };
          });
        }
      } catch {
        loadedCourses.current.add(activeCourseId); // non-fatal; page still works
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCourseId]);

  const fileMap = useMemo(() => {
    const m = new Map();
    files.forEach((f) => f.fileType && m.set(f.fileType, f));
    return m;
  }, [files]);

  const getFileForItem = useCallback((id) => fileMap.get(id) || null, [fileMap]);

  const handleFileAdd = useCallback(
    (e, targetItemIdRef, selectedItem, setSelectedItem) => {
      const list = e.target.files;
      const clear = () => {
        e.target.value = "";
        if (targetItemIdRef) targetItemIdRef.current = null;
      };
      if (!list || !list.length) return clear();

      const itemId = targetItemIdRef?.current;
      if (!itemId) {
        toast.error("No item selected. Please try again.");
        e.target.value = "";
        return;
      }

      const file = list[0];
      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        return clear();
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: exceeds 10 MB`);
        return clear();
      }

      updateActive((l) => [...l.filter((f) => f.fileType !== itemId), makeEntry(file, itemId)]);
      if (selectedItem?.fileType === itemId) setSelectedItem?.(null);
      clear();
    },
    [updateActive]
  );

  const handleRemoveFile = useCallback(
    async (itemId, selectedItem, setSelectedItem) => {
      const entry = (courseFiles[activeCourseId] || []).find((f) => f.fileType === itemId);
      // If it was already committed to the server, delete it there too.
      if (entry?.committed && entry.documentId) {
        try {
          await documentApi.remove(entry.documentId);
          toast.success("File removed");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Could not remove file");
          return;
        }
      }
      updateActive((l) => l.filter((f) => f.fileType !== itemId));
      if (selectedItem?.fileType === itemId) setSelectedItem?.(null);
    },
    [activeCourseId, courseFiles, updateActive]
  );

  const handleCommit = useCallback(async () => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }
    const courseId = activeCourseId; // capture; user may switch tabs mid-upload
    const queued = (courseFiles[courseId] || []).filter(
      (f) => f.status === "queued" || f.status === "failed"
    );
    if (!queued.length) {
      toast("No files to upload for this course.");
      return;
    }

    const setStatus = (ft, status, extra = {}) =>
      setCourseFiles((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).map((f) =>
          f.fileType === ft ? { ...f, status, ...extra } : f
        ),
      }));

    setCommitting(true);
    queued.forEach((f) => setStatus(f.fileType, "uploading"));
    try {
      let cfId = cfIdByCourse.current[courseId];
      if (!cfId) {
        const r = await courseFileApi.create(courseId);
        cfId = r.data.data.courseFile.id;
        cfIdByCourse.current[courseId] = cfId;
      }

      let ok = 0;
      for (const f of queued) {
        const meta = SLOT_MAP[f.fileType] || { isAdditional: true };
        try {
          const up = await courseFileApi.upload(cfId, f.file, meta);
          const doc = up.data.data?.document;
          setStatus(f.fileType, "done", { committed: true, documentId: doc?.id });
          ok += 1;
        } catch (err) {
          setStatus(f.fileType, "failed");
          toast.error(
            `${f.file.name}: ${err?.response?.data?.message || err?.message || "Upload failed"}`
          );
        }
      }
      if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""} ✓`);
    } catch (err) {
      queued.forEach((f) => setStatus(f.fileType, "queued"));
      toast.error(
        `Could not open course file: ${err?.response?.data?.message || err?.message || "error"}`
      );
    } finally {
      setCommitting(false);
    }
  }, [activeCourseId, courseFiles]);

  const totalItems = TOTAL_SLOTS;
  const totalFiles = files.length;
  const queuedCount = files.filter((f) => f.status === "queued" || f.status === "failed").length;

  return {
    courseFiles,
    committing,
    totalItems,
    totalFiles,
    queuedCount,
    getFileForItem,
    handleFileAdd,
    handleRemoveFile,
    handleCommit,
  };
}
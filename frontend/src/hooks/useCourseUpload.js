import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { courseFileApi } from "@/api/courseFileApi";
import { documentApi } from "@/api/documentApi";

/**
 * useCourseUpload(activeCourseId)
 * --------------------------------
 * Per-course upload queue + backend sync
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

/**
 * Slot mapping (UI -> backend itemNo)
 */
export const SLOT_MAP = {
  final_grades: { itemNo: 1 },
  obe_excel: { itemNo: 2 },
  co_attainment: { itemNo: 3 },
  po_attainment: { itemNo: 4 },
  cqi_summary: { itemNo: 5 },
  instructor_feedback: { itemNo: 6 },
  course_outline: { itemNo: 7 },

  class_test_question: { itemNo: 8 },
  class_test_sample: { itemNo: 9 },

  midterm_question: { itemNo: 10 },
  midterm_sample: { itemNo: 11 },

  final_question: { itemNo: 12 },
  final_sample: { itemNo: 13 },

  project_list: { itemNo: 14 },
  project_sample: { itemNo: 15 },

  lab_experiments: { itemNo: 16 },
  class_attendance: { itemNo: 17 },
  lab_attendance: { itemNo: 18 },
  midterm_attendance: { itemNo: 19 },
  final_attendance: { itemNo: 20 },
  capstone_report: { itemNo: 21 },
};

/**
 * Reverse lookup: itemNo -> slotId
 */
const REVERSE_SLOT = Object.entries(SLOT_MAP).reduce((acc, [slot, meta]) => {
  acc[meta.itemNo] = slot;
  return acc;
}, {});

const TOTAL_SLOTS = Object.keys(SLOT_MAP).length;

function makeEntry(file, itemId) {
  const thumbnailUrl =
    file.type?.startsWith("image/") || file.type === "application/pdf"
      ? URL.createObjectURL(file)
      : null;
  return {
    id: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileType: itemId,
    status: "queued",
    reviewStatus: null,
    thumbnailUrl,
  };
}

export function slotColorClass(entry) {
  console.log("entry:: ", entry);
  if (!entry) return "bg-gray-300";
  if (entry.reviewStatus === "rejected") return "bg-red-500";
  if (entry.status === "uploading" || entry.status === "processing") return "bg-blue-500";
  if (entry.status === "failed") return "bg-red-500";
  if (entry.reviewStatus === "approved") return "bg-emerald-500";
  if (entry.status === "done") return "bg-green-500";
  if (entry.status === "queued") return "bg-amber-400";
  return "bg-gray-300";
}

export function slotRingClass(entry) {
  if (entry?.reviewStatus === "rejected") return "ring-2 ring-red-400 border-red-300";
  if (entry?.reviewStatus === "approved") return "ring-1 ring-emerald-300";
  return "";
}
 

export default function useCourseUpload(activeCourseId) {
  const [courseFiles, setCourseFiles] = useState({});
  const [committing, setCommitting] = useState(false);

  const cfIdByCourse = useRef({});
  const loadedCourses = useRef(new Set());

  const files = useMemo(() => {
    return activeCourseId ? courseFiles[activeCourseId] || [] : [];
  }, [courseFiles, activeCourseId]);

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

  /**
   * Load already uploaded documents for course
   */
  useEffect(() => {
    if (!activeCourseId || loadedCourses.current.has(activeCourseId)) return;

    let cancelled = false;

    (async () => {
      try {
        const listRes = await courseFileApi.list();
        const cfs = listRes.data.data?.courseFiles || [];

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
            const slot = REVERSE_SLOT[d.itemNo];
            if (!slot) return null;

            return {
              id: d.id,
              documentId: d.id,
              fileType: slot,
              status: "done",
              committed: true,
              file: {
                name:
                  d.storage?.originalName ||
                  d.storage?.fileName ||
                  "file",
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
            const map = new Map(existing.map((f) => [f.fileType, f]));

            committed.forEach((c) => {
              if (!map.has(c.fileType)) map.set(c.fileType, c);
            });

            return {
              ...prev,
              [activeCourseId]: [...map.values()],
            };
          });
        }
      } catch {
        loadedCourses.current.add(activeCourseId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCourseId]);

  const fileMap = useMemo(() => {
    const map = new Map();
    files.forEach((f) => f.fileType && map.set(f.fileType, f));
    return map;
  }, [files]);

  const getFileForItem = useCallback(
    (id) => fileMap.get(id) || null,
    [fileMap]
  );

  /**
   * Add file to slot
   */
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
        toast.error("No item selected");
        return clear();
      }

      const file = list[0];

      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error("Unsupported file type");
        return clear();
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File exceeds 10MB limit");
        return clear();
      }

      updateActive((prev) => {
        const old = prev.find((f) => f.fileType === itemId);
        if (old?.thumbnailUrl) URL.revokeObjectURL(old.thumbnailUrl);
        return [
          ...prev.filter((f) => f.fileType !== itemId),
          makeEntry(file, itemId),
        ];
      });

      if (selectedItem?.fileType === itemId) {
        setSelectedItem?.(null);
      }

      clear();
    },
    [updateActive]
  );

  /**
   * Remove file (local + server if already uploaded)
   */
  const handleRemoveFile = useCallback(
    async (itemId, selectedItem, setSelectedItem) => {
      const entry = (courseFiles[activeCourseId] || []).find(
        (f) => f.fileType === itemId
      );

      if (entry?.thumbnailUrl) {
        URL.revokeObjectURL(entry.thumbnailUrl);
      }

      if (entry?.committed && entry.documentId) {
        try {
          await documentApi.remove(entry.documentId);
        } catch {
          toast.error("Delete failed");
          return;
        }
      }

      updateActive((prev) =>
        prev.filter((f) => f.fileType !== itemId)
      );

      if (selectedItem?.fileType === itemId) {
        setSelectedItem?.(null);
      }
    },
    [activeCourseId, courseFiles, updateActive]
  );

  /**
   * Commit uploads
   */
  const handleCommit = useCallback(async () => {
    if (!activeCourseId) {
      toast.error("Select a course first");
      return;
    }

    const courseId = activeCourseId;

    const queued = (courseFiles[courseId] || []).filter(
      (f) => f.status === "queued" || f.status === "failed"
    );

    if (!queued.length) {
      toast("No files to upload");
      return;
    }

    const setStatus = (ft, status, extra = {}) => {
      setCourseFiles((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).map((f) =>
          f.fileType === ft ? { ...f, status, ...extra } : f
        ),
      }));
    };

    setCommitting(true);

    queued.forEach((f) => setStatus(f.fileType, "uploading"));

    try {
      let cfId = cfIdByCourse.current[courseId];

      if (!cfId) {
        const res = await courseFileApi.create(courseId);
        cfId = res.data.data.courseFile.id;
        cfIdByCourse.current[courseId] = cfId;
      }

      let success = 0;

      for (const f of queued) {
        const meta = SLOT_MAP[f.fileType];

        if (!meta) {
          setStatus(f.fileType, "failed");
          continue;
        }

        try {
          const res = await courseFileApi.upload(cfId, f.file, {
            itemNo: meta.itemNo,
          });

          const doc = res.data.data?.document;

          setStatus(f.fileType, "done", {
            committed: true,
            documentId: doc?.id,
          });

          success++;
        } catch (err) {
          setStatus(f.fileType, "failed");
          toast.error(
            err?.response?.data?.message || "Upload failed"
          );
        }
      }

      if (success) {
        toast.success(`Uploaded ${success} file(s)`);
      }
    } catch (err) {
      queued.forEach((f) =>
        setStatus(f.fileType, "queued")
      );

      toast.error("Upload session failed");
    } finally {
      setCommitting(false);
    }
  }, [activeCourseId, courseFiles]);

  return {
    courseFiles,
    committing,
    totalItems: TOTAL_SLOTS,
    totalFiles: files.length,
    queuedCount: files.filter(
      (f) => f.status === "queued" || f.status === "failed"
    ).length,

    getFileForItem,
    handleFileAdd,
    handleRemoveFile,
    handleCommit,
  };
}
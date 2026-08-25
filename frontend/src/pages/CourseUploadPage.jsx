import {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FilePreviewPanel } from "@/components/uploads/FilePreviewPanel";
import { courseApi } from "@/api/courseApi";
import { courseFileApi } from "@/api/courseFileApi";
import { documentApi } from "@/api/documentApi";
import { useAuthContext } from "@/context/AuthContext";
import { CATEGORIES, SLOT_MAP, MAX_SIZE_BYTES, ALLOWED_TYPES } from "@/utils/uploadConstants";
import { makeEntry } from "@/utils/uploadHelpers";
import ViewModeToggle from "@/components/uploads/ViewModeToggle";
import UploadToolbar from "@/components/uploads/UploadToolbar";
import BottomBar from "@/components/uploads/BottomBar";
import CompactUploadView from "@/components/uploads/CompactUploadView";
import GridUploadView from "@/components/uploads/GridUploadView";
import ListUploadView from "@/components/uploads/ListUploadView";
  
 
const REVERSE_SLOT = Object.entries(SLOT_MAP).reduce((acc, [slot, meta]) => {
  acc[meta.itemNo] = slot;
  return acc;
}, {});
 

export function slotColorClass(entry) {
  if (!entry) return "bg-gray-300";
  if (entry.reviewStatus === "rejected") return "bg-red-500";
  if (entry.status === "uploading" || entry.status === "processing") {
    return "bg-blue-500";
  }
  if (entry.status === "failed") return "bg-red-500";
  if (entry.reviewStatus === "approved") return "bg-emerald-500";
  if (entry.status === "done") return "bg-green-500";
  if (entry.status === "queued") return "bg-amber-400";
  return "bg-gray-300";
}

export function slotRingClass(entry) {
  if (entry?.reviewStatus === "rejected") {
    return "ring-2 ring-red-400 border-red-300";
  }
  if (entry?.reviewStatus === "approved") {
    return "ring-1 ring-emerald-300";
  }
  return "";
}

export default function CourseUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const targetItemIdRef = useRef(null);
  const cfIdByCourse = useRef({});
  const loadedCourses = useRef(new Set());

  const { user } = useAuthContext();

  const [viewMode, setViewMode] = useState("compact");
  const [selectedItem, setSelectedItem] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loadingShell, setLoadingShell] = useState(true);
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [semesterMenuOpen, setSemesterMenuOpen] = useState(false);
  const [uploadFilter, setUploadFilter] = useState("all");

  const [courseFiles, setCourseFiles] = useState({});
  const [committing, setCommitting] = useState(false);

  const files = useMemo(() => {
    return activeCourseId ? courseFiles[activeCourseId] || [] : [];
  }, [courseFiles, activeCourseId]);

  const activeCourse = useMemo(
    () => allCourses.find((c) => c.id === activeCourseId) || null,
    [allCourses, activeCourseId]
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

  useEffect(() => {
    courseApi
      .list()
      .then((cRes) => {
        const all = cRes.data.data.courses || [];

        const mine = all.filter(
          (c) =>
            c.facultyCode &&
            user?.shortCode &&
            c.facultyCode.trim().toLowerCase() ===
              user.shortCode.trim().toLowerCase()
        );

        setAllCourses(mine);

        const sems = [
          ...new Set(mine.map((c) => c.semester).filter(Boolean)),
        ].sort((a, b) => b.localeCompare(a));

        if (sems.length) {
          setActiveSemester(sems[0]);
          const first = mine.find((c) => c.semester === sems[0]);
          if (first) setActiveCourseId(first.id);
        }
      })
      .catch(() => toast.error("Failed to load courses or required items"))
      .finally(() => setLoadingShell(false));
  }, [user?.shortCode, user?.role]);

  useEffect(() => {
    setSelectedItem(null);
  }, [activeCourseId]);

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
    files.forEach((f) => {
      if (f.fileType) map.set(f.fileType, f);
    });
    return map;
  }, [files]);

  const getFileForItem = useCallback(
    (id) => fileMap.get(id) || null,
    [fileMap]
  );

  const handleFileAdd = useCallback(
    (e) => {
      const list = e.target.files;

      const clear = () => {
        e.target.value = "";
        targetItemIdRef.current = null;
      };

      if (!list || !list.length) {
        clear();
        return;
      }

      const itemId = targetItemIdRef.current;

      if (!itemId) {
        toast.error("No item selected");
        clear();
        return;
      }

      const file = list[0];

      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error("Unsupported file type");
        clear();
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File exceeds 10MB limit");
        clear();
        return;
      }

      updateActive((prev) => {
        const old = prev.find((f) => f.fileType === itemId);

        if (old?.thumbnailUrl) {
          URL.revokeObjectURL(old.thumbnailUrl);
        }

        return [
          ...prev.filter((f) => f.fileType !== itemId),
          makeEntry(file, itemId),
        ];
      });

      if (selectedItem?.fileType === itemId) {
        setSelectedItem(null);
      }

      clear();
    },
    [selectedItem, updateActive]
  );

  const handleRemoveFile = useCallback(
    async (itemId) => {
      if (!activeCourseId) return;

      const entry = (courseFiles[activeCourseId] || []).find(
        (f) => f.fileType === itemId
      );

      if (entry?.committed && entry.documentId) {
        try {
          await documentApi.remove(entry.documentId);
        } catch {
          toast.error("Delete failed");
          return;
        }
      }

      if (entry?.thumbnailUrl) {
        URL.revokeObjectURL(entry.thumbnailUrl);
      }

      updateActive((prev) => prev.filter((f) => f.fileType !== itemId));

      if (selectedItem?.fileType === itemId) {
        setSelectedItem(null);
      }
    },
    [activeCourseId, courseFiles, selectedItem, updateActive]
  );

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

    const setStatus = (fileType, status, extra = {}) => {
      setCourseFiles((prev) => ({
        ...prev,
        [courseId]: (prev[courseId] || []).map((f) =>
          f.fileType === fileType ? { ...f, status, ...extra } : f
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

          success += 1;
        } catch (err) {
          setStatus(f.fileType, "failed");
          toast.error(err?.response?.data?.message || "Upload failed");
        }
      }

      if (success) {
        toast.success(`Uploaded ${success} file(s)`);
      }
    } catch {
      queued.forEach((f) => setStatus(f.fileType, "queued"));
      toast.error("Upload session failed");
    } finally {
      setCommitting(false);
    }
  }, [activeCourseId, courseFiles]);

  const semesters = useMemo(
    () =>
      [...new Set(allCourses.map((c) => c.semester).filter(Boolean))].sort(
        (a, b) => b.localeCompare(a)
      ),
    [allCourses]
  );

  const visibleCourses = useMemo(
    () =>
      allCourses.filter(
        (c) => !activeSemester || c.semester === activeSemester
      ),
    [allCourses, activeSemester]
  );

  // const baseCategories = useMemo(() => {
  //   const code = (
  //     activeCourse?.courseCode ||
  //     activeCourse?.label?.split("-")[0] ||
  //     ""
  //   ).toUpperCase();

  //   return CAPSTONE_COURSES.has(code)
  //     ? CATEGORIES
  //     : CATEGORIES.filter((cat) => cat.label !== "Capstone");
  // }, [activeCourse]);

  const baseCategories = useMemo(() => CATEGORIES, []);


  const filteredCategories = useMemo(() => {
    if (uploadFilter === "all") return baseCategories;

    return baseCategories.map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        const entry = getFileForItem(item.id);
        const isUploaded =
          entry?.status === "done" && entry?.committed === true;

        return uploadFilter === "uploaded" ? isUploaded : !isUploaded;
      }),
    })).filter((cat) => cat.items.length > 0);
  }, [getFileForItem, uploadFilter, baseCategories]);

  const visibleTotalItems = baseCategories.reduce(
    (n, cat) => n + cat.items.length,
    0
  );

  const totalFiles = files.length;

  const queuedCount = files.filter(
    (f) => f.status === "queued" || f.status === "failed"
  ).length;

  const handleSemesterSelect = (sem) => {
    setActiveSemester(sem);
    setSemesterMenuOpen(false);

    const first = allCourses.find((c) => c.semester === sem);
    setActiveCourseId(first ? first.id : null);
  };

  const onSlotClick = (itemId) => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }

    const existing = getFileForItem(itemId);

    if (existing) {
      setSelectedItem(existing);
      return;
    }

    targetItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  const onUploadClick = (itemId) => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }

    targetItemIdRef.current = itemId;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full flex flex-col px-4 py-8">
      <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex">
        <div className="flex-1 flex flex-col min-w-0">
          <UploadToolbar
            loadingShell={loadingShell}
            visibleCourses={visibleCourses}
            activeCourseId={activeCourseId}
            onCourseSelect={setActiveCourseId}
            semesters={semesters}
            activeSemester={activeSemester}
            onSemesterSelect={handleSemesterSelect}
            semesterMenuOpen={semesterMenuOpen}
            onToggleSemesterMenu={() => setSemesterMenuOpen((o) => !o)}
            onCloseSemesterMenu={() => setSemesterMenuOpen(false)}
            courseFiles={courseFiles}
          />

          <div className="flex-1 min-h-0 flex overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                    {["all", "uploaded", "missing"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setUploadFilter(f)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                          uploadFilter === f
                            ? "bg-[#534AB7] text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <ViewModeToggle
                    viewMode={viewMode}
                    onChange={setViewMode}
                  />
                </div>

                {viewMode === "compact" && (
                  <CompactUploadView
                    categories={filteredCategories}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                    onRemoveFile={handleRemoveFile}
                  />
                )}

                {viewMode === "grid" && (
                  <GridUploadView
                    categories={filteredCategories}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                    onRemoveFile={handleRemoveFile}
                  />
                )}

                {viewMode === "list" && (
                  <ListUploadView
                    categories={filteredCategories}
                    getFileForItem={getFileForItem}
                    onSlotClick={onSlotClick}
                    onRemoveFile={handleRemoveFile}
                    onUploadClick={onUploadClick}
                  />
                )}
              </div>
            </div>
          </div>

          <BottomBar
            totalFiles={totalFiles}
            totalItems={visibleTotalItems}
            queuedCount={queuedCount}
            committing={committing}
            onCommit={handleCommit}
            onBack={() => navigate(-1)}
          />
        </div>
      </div>

      <FilePreviewPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onRemove={() => {
          if (selectedItem) {
            handleRemoveFile(selectedItem.fileType);
          }
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={handleFileAdd}
      />
    </div>
  );
}
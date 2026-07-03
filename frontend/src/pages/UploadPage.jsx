import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  ClipboardList,
  Check,
  FileSpreadsheet,
  Filter,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { FilePreviewPanel } from "@/components/uploads/FilePreviewPanel";
import HelpBar from "@/components/layout/HelpBar";
// Real API modules (adjust the folder if yours differs, e.g. "@/api/courseApi")
import { courseApi } from "@/api/courseApi";
import { itemApi } from "@/api/itemApi";
import { courseFileApi } from "@/api/courseFileApi";
import { useAuth } from "@/hooks/useAuth";

//  Category structure with individual item IDs 
const CATEGORIES = [
  {
    label: "Academic Results",
    items: [
      { id: "final_grades", title: "Final grades (Tabulation Sheet)" },
      { id: "obe_excel", title: "OBE Excel Sheet" },
    ],
  },
  {
    label: "Attainment Reports",
    items: [
      { id: "co_attainment", title: "CO Attainment Report" },
      { id: "po_attainment", title: "PO Attainment Report" },
    ],
  },
  {
    label: "CQI Reports",
    items: [
      { id: "cqi_grade_summary", title: "Grade Summary with CQI Improvement Plan" },
      { id: "instructor_feedback", title: "Instructor Feedback" },
    ],
  },
  {
    label: "Course Documents",
    items: [{ id: "course_outline", title: "Course Outline" }],
  },
  {
    label: "Class Test",
    items: [
      { id: "class_test_question", title: "Assessment Question" },
      { id: "class_test_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Midterm Exam",
    items: [
      { id: "midterm_question", title: "Assessment Question" },
      { id: "midterm_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Final Exam",
    items: [
      { id: "final_question", title: "Assessment Question" },
      { id: "final_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Projects & Assignments",
    items: [
      { id: "project_list", title: "Project/Assignment List" },
      { id: "project_sample", title: "Representative Sample Project Reports" },
    ],
  },
  {
    label: "Laboratory",
    items: [{ id: "lab_experiments", title: "List of Lab Experiments" }],
  },
  {
    label: "Attendance Records",
    items: [
      { id: "class_attendance", title: "Class Attendance" },
      { id: "lab_attendance", title: "Lab Attendance" },
      { id: "midterm_attendance", title: "Midterm Exam Attendance" },
      { id: "final_attendance", title: "Final Exam Attendance" },
    ],
  },
  {
    label: "Capstone",
    items: [{ id: "capstone_report", title: "Capstone Project Report" }],
  },
];

//  Slot id → backend { itemNo, subItem } (matches required_items 1–17) 
const SLOT_MAP = {
  final_grades: { itemNo: 1 },
  obe_excel: { itemNo: 2 },
  co_attainment: { itemNo: 3 },
  po_attainment: { itemNo: 4 },
  cqi_grade_summary: { itemNo: 5 },
  instructor_feedback: { itemNo: 6 },
  course_outline: { itemNo: 7 },
  class_test_question: { itemNo: 8, subItem: "question" },
  class_test_sample: { itemNo: 8, subItem: "samples" },
  midterm_question: { itemNo: 9, subItem: "question" },
  midterm_sample: { itemNo: 9, subItem: "samples" },
  final_question: { itemNo: 10, subItem: "question" },
  final_sample: { itemNo: 10, subItem: "samples" },
  project_list: { itemNo: 11, subItem: "list" },
  project_sample: { itemNo: 11, subItem: "samples" },
  lab_experiments: { itemNo: 12 },
  class_attendance: { itemNo: 13 },
  lab_attendance: { itemNo: 14 },
  midterm_attendance: { itemNo: 15 },
  final_attendance: { itemNo: 16 },
  capstone_report: { itemNo: 17 },
};

//  Constants 
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

//  UI helpers 
function getFileIcon(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { Icon: FileText, color: "#534AB7" };
  if (["xlsx", "xls"].includes(ext)) return { Icon: FileSpreadsheet, color: "#1D9E75" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "#3B82F6" };
  return { Icon: FileText, color: "#6B7280" };
}

// One locally-queued file entry (same shape FilePreviewPanel already consumes)
function makeEntry(file, itemId) {
  return {
    id: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileType: itemId,
    status: "queued", // queued | uploading | done | failed
  };
}

//  Main component 
export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const targetItemIdRef = useRef(null);

  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  //  Dynamic courses / items / semester 
  const [items, setItems] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loadingShell, setLoadingShell] = useState(true);
  const [activeSemester, setActiveSemester] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [semesterMenuOpen, setSemesterMenuOpen] = useState(false);

  //  PER-COURSE local file store: { [courseId]: entry[] } 
  // Files live here (locally) until committed; each course keeps its own list.
  const [courseFiles, setCourseFiles] = useState({});
  const [committing, setCommitting] = useState(false);

  // Files of the ACTIVE course only — this is what the grid renders.
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

  useEffect(() => {
    Promise.all([itemApi.list(), courseApi.list()])
      .then(([iRes, cRes]) => {
        // Both endpoints use the { success, data } envelope.
        setItems(iRes.data.data.items || []);

        const all = cRes.data.data.courses || [];
        const mine = all.filter(
                (c) =>
                  c.facultyCode &&
                  user?.shortCode &&
                  c.facultyCode.trim().toLowerCase() ===
                    user.shortCode.trim().toLowerCase()
              );

        setAllCourses(mine);

        // Default to the most recent semester
        const sems = [...new Set(mine.map((c) => c.semester).filter(Boolean))].sort(
          (a, b) => b.localeCompare(a)
        );
        if (sems.length) {
          setActiveSemester(sems[0]);
          const first = mine.find((c) => c.semester === sems[0]);
          if (first) setActiveCourseId(first.id);
        }
      })
      .catch(() => toast.error("Failed to load courses or required items"))
      .finally(() => setLoadingShell(false));
  }, [user?.shortCode, user?.role]);

  // Close any open preview when the course changes (it belongs to the old course).
  useEffect(() => {
    setSelectedItem(null);
  }, [activeCourseId]);

  //  Semesters (newest first) and courses visible for the active semester 
  const semesters = useMemo(
    () =>
      [...new Set(allCourses.map((c) => c.semester).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [allCourses]
  );

  const visibleCourses = useMemo(
    () => allCourses.filter((c) => !activeSemester || c.semester === activeSemester),
    [allCourses, activeSemester]
  );

  const handleSemesterSelect = (sem) => {
    setActiveSemester(sem);
    setSemesterMenuOpen(false);
    const first = allCourses.find((c) => c.semester === sem);
    setActiveCourseId(first ? first.id : null);
  };

  //  Lookup: itemId → file entry (of the ACTIVE course) 
  const fileMap = useMemo(() => {
    const map = new Map();
    files.forEach((f) => {
      if (f.fileType) map.set(f.fileType, f);
    });
    return map;
  }, [files]);

  const getFileForItem = useCallback(
    (itemId) => fileMap.get(itemId) || null,
    [fileMap]
  );

  //  Handlers 
  const handleSlotClick = (itemId) => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }
    const existing = getFileForItem(itemId);
    if (existing) {
      setSelectedItem(existing);
    } else {
      targetItemIdRef.current = itemId;
      fileInputRef.current?.click();
    }
  };

  const handleFileAdd = useCallback(
    (e) => {
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

      // Replace any existing entry in THIS course's slot, then add the new one.
      updateActiveCourseFiles((list) => [
        ...list.filter((f) => f.fileType !== itemId),
        makeEntry(file, itemId),
      ]);
      if (selectedItem?.fileType === itemId) setSelectedItem(null);

      e.target.value = "";
      targetItemIdRef.current = null;
    },
    [updateActiveCourseFiles, selectedItem]
  );

  const handleRemoveFile = (itemId) => {
    updateActiveCourseFiles((list) => list.filter((f) => f.fileType !== itemId));
    if (selectedItem?.fileType === itemId) setSelectedItem(null);
  };

  //  Commit: uploads ONLY the active course's queued files 
  const handleCommit = async () => {
    if (!activeCourseId) {
      toast.error("Select a course first.");
      return;
    }
    const courseId = activeCourseId; // capture: user may switch tabs mid-upload
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
      // Idempotent: returns the existing course file if one already exists.
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
  };

  //  Counts (active course only) 
  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const totalFiles = files.length;
  const queuedCount = files.filter(
    (f) => f.status === "queued" || f.status === "failed"
  ).length;

  return (
    <div className="w-full h-full flex flex-col px-4 py-8">
      <h2 className="sr-only">CQI Upload Page — grouped upload cards</h2>

      <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Faculty Course Navigation.
              The filter lives OUTSIDE the scrolling strip: an overflow container
              clips absolutely-positioned children, which is why the dropdown
              wasn't opening properly before. Only the tabs scroll now. */}
          <nav className="flex items-center border-b border-gray-200 bg-white px-4 shrink-0">
            {/* Semester filter (left side, non-scrolling) */}
            <div className="relative shrink-0 flex items-center pr-3 mr-2 border-r border-gray-200">
              <button
                onClick={() => setSemesterMenuOpen((o) => !o)}
                className="flex items-center gap-1 text-xs text-gray-500 px-2.5 py-1.5 my-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Filter by semester"
              >
                <Filter size={12} />
                {activeSemester || "Semester"}
                <ChevronDown size={12} />
              </button>

              {semesterMenuOpen && (
                <>
                  {/* click-away layer */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSemesterMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full z-20 bg-white border border-gray-200 rounded-md shadow-sm min-w-[150px] py-1">
                    {semesters.length === 0 && (
                      <span className="block px-3 py-1.5 text-xs text-gray-400">
                        No semesters
                      </span>
                    )}
                    {semesters.map((sem) => (
                      <button
                        key={sem}
                        onClick={() => handleSemesterSelect(sem)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors
                          ${sem === activeSemester ? "text-gray-900 font-medium" : "text-gray-500"}`}
                      >
                        {sem}
                        {sem === activeSemester && (
                          <Check size={12} className="text-[#534AB7]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Course tabs (dynamic, scrollable) */}
            <div className="flex flex-1 min-w-0 overflow-x-auto whitespace-nowrap">
              {loadingShell ? (
                <span className="px-3.5 py-2.5 text-xs text-gray-400">Loading courses…</span>
              ) : visibleCourses.length === 0 ? (
                <span className="px-3.5 py-2.5 text-xs text-gray-400">
                  No courses{activeSemester ? ` for ${activeSemester}` : ""}
                </span>
              ) : (
                visibleCourses.map((course) => {
                  const pending = (courseFiles[course.id] || []).filter(
                    (f) => f.status === "queued" || f.status === "failed"
                  ).length;
                  return (
                    <button
                      key={course.id}
                      onClick={() => setActiveCourseId(course.id)}
                      className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0
                        ${activeCourseId === course.id
                          ? "text-gray-900 border-[#534AB7]"
                          : "text-gray-400 border-transparent hover:text-gray-500"
                        }`}
                    >
                      {course.label}
                      {pending > 0 && course.id !== activeCourseId && (
                        <span className="ml-1 text-[9px] text-[#534AB7]">•{pending}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Grouped Categories */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                {CATEGORIES.map((category) => (
                  <div key={category.label} className="mb-6 last:mb-0">
                    {/* Category Title */}
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {category.label}
                    </h3>
                    <div className="border-b border-gray-200 mb-3" />

                    {/* Items grid - max 4 columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {category.items.map((item) => {
                        const fileEntry = getFileForItem(item.id);
                        const hasFile = !!fileEntry;
                        const rawFile = hasFile ? fileEntry.file : null;
                        const { Icon, color } = rawFile ? getFileIcon(rawFile) : { Icon: null, color: null };

                        return (
                          <div key={item.id}>
                            {/* Item title */}
                            <p className="text-xs text-gray-500 mb-1 truncate text-center" title={item.title}>
                              {item.title}
                            </p>

                            {/* Upload card - square, fills column width */}
                            <div
                              onClick={() => handleSlotClick(item.id)}
                              className="bg-white border border-gray-200 rounded-lg aspect-square w-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-gray-300 transition-all"
                            >
                              {hasFile ? (
                                <>
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                    {Icon && <Icon size={24} style={{ color }} />}
                                    <span className="text-[9px] font-medium text-gray-400 uppercase mt-0.5">
                                      {rawFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                                    </span>
                                  </div>
                                  <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-gray-400 truncate px-1">
                                    {rawFile.name}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFile(item.id);
                                    }}
                                    className="absolute top-1 left-1 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[8px] hidden group-hover:flex items-center justify-center"
                                    title="Remove"
                                  >
                                    <X size={8} />
                                  </button>
                                  <div
                                    className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${fileEntry.status === "done"
                                        ? "bg-green-500"
                                        : fileEntry.status === "uploading" || fileEntry.status === "processing"
                                          ? "bg-blue-500"
                                          : fileEntry.status === "failed"
                                            ? "bg-red-500"
                                            : "bg-gray-300"
                                      }`}
                                  />
                                </>
                              ) : (
                                <>
                                  <Plus size={24} className="text-[#534AB7] mb-0.5" />
                                  <span className="text-[9px] text-center text-gray-400 px-0.5">
                                    Upload
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right help panel */}
            <div className="shrink-0">
              <HelpBar defaultOpen={!panelCollapsed} />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs text-gray-500 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>

            <span className="text-[11px] text-gray-400">
              {totalFiles} of {totalItems} files uploaded{queuedCount > 0 && ` (${queuedCount} queued)`}
            </span>

            <button
              onClick={handleCommit}
              disabled={committing || queuedCount === 0}
              className={`flex items-center gap-1.5 px-[18px] py-[7px] bg-[#534AB7] text-[#EEEDFE] rounded-md text-xs font-medium transition-colors border-none cursor-pointer
                ${committing || queuedCount === 0 ? "opacity-60 cursor-not-allowed" : "hover:bg-[#3C3489]"}`}
            >
              <Check size={14} />
              {committing ? "Uploading…" : "Commit ↗"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewPanel
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onRemove={() => {
          if (selectedItem) {
            handleRemoveFile(selectedItem.fileType);
          }
        }}
      />

      {/* Hidden file input */}
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
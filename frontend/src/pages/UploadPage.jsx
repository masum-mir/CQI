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
} from "lucide-react";
import toast from "react-hot-toast";
import { usePDFUpload } from "@/hooks/usePDFUpload";
import { FilePreviewPanel } from "@/components/uploads/FilePreviewPanel";
import HelpBar from "@/components/layout/HelpBar";

// ── Category structure with individual item IDs ──
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

// ── Constants ──
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

// ── Mock faculty courses ──
const FACULTY_COURSES = [
  { id: "c1", label: "CSE101-A", active: true },
  { id: "c2", label: "CSE101-B", active: false },
  { id: "c3", label: "CSE102-A", active: false },
  { id: "c4", label: "CSE203-LAB", active: false },
  { id: "c5", label: "CSE301-A", active: false },
];

// ── UI helpers ──
function getFileIcon(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { Icon: FileText, color: "#534AB7" };
  if (["xlsx", "xls"].includes(ext)) return { Icon: FileSpreadsheet, color: "#1D9E75" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "#3B82F6" };
  return { Icon: FileText, color: "#6B7280" };
}

// ── Main component ──
export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const targetItemIdRef = useRef(null);

  const { files, addFiles, removeFile, upload, uploading } = usePDFUpload();
  const [selectedItem, setSelectedItem] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeCourse, setActiveCourse] = useState(FACULTY_COURSES[0]?.id);

  // ── Faculty and semester (placeholders) ──
  const [faculty] = useState("CSE");
  const [semester] = useState("Spring 2026");

  // ── Build lookup map for itemId → file entry ──
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

  // ── Debug logs ──
  useEffect(() => {
    console.log("Files in hook:", files.map((f) => ({ name: f.file.name, fileType: f.fileType, status: f.status })));
  }, [files]);

  // ── Handlers ──
  const handleSlotClick = (itemId) => {
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

      const existing = getFileForItem(itemId);
      if (existing) {
        const idx = files.indexOf(existing);
        removeFile(idx);
        if (selectedItem === existing) setSelectedItem(null);
      }

      // Use itemId as fileType to store the file
      addFiles([file], itemId);

      e.target.value = "";
      targetItemIdRef.current = null;
    },
    [files, addFiles, removeFile, selectedItem, getFileForItem]
  );

  const handleRemoveFile = (itemId) => {
    const existing = getFileForItem(itemId);
    if (existing) {
      const idx = files.indexOf(existing);
      removeFile(idx);
      if (selectedItem === existing) setSelectedItem(null);
    }
  };

  const handleCommit = async () => {
    const queued = files.filter((f) => f.status === "queued");
    if (!queued.length) {
      toast.info("No files to upload.");
      return;
    }

    const grouped = new Map();
    queued.forEach((f) => {
      const key = f.fileType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(f);
    });

    for (const [cat, fileList] of grouped) {
      try {
        await upload(cat, faculty, semester);
        toast.success(`Uploaded ${cat} successfully`);
      } catch (err) {
        console.error(`Upload error for ${cat}:`, err);
        toast.error(`Upload failed for ${cat}: ${err?.message || "Unknown error"}`);
      }
    }
  };

  // ── Counts ──
  const totalItems = CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const totalFiles = files.length;
  const queuedCount = files.filter((f) => f.status === "queued").length;

  return (
    <div className="w-full h-full flex flex-col px-4 py-8">
      <h2 className="sr-only">CQI Upload Page — grouped upload cards</h2>

      <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Faculty Course Navigation */}
          <nav className="flex overflow-x-auto whitespace-nowrap border-b border-gray-200 bg-white px-4 shrink-0">
            {FACULTY_COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => setActiveCourse(course.id)}
                className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0
                  ${activeCourse === course.id
                    ? "text-gray-900 border-[#534AB7]"
                    : "text-gray-400 border-transparent hover:text-gray-500"
                  }`}
              >
                {course.label}
              </button>
            ))}
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
              disabled={uploading || queuedCount === 0}
              className={`flex items-center gap-1.5 px-[18px] py-[7px] bg-[#534AB7] text-[#EEEDFE] rounded-md text-xs font-medium transition-colors border-none cursor-pointer
                ${uploading || queuedCount === 0 ? "opacity-60 cursor-not-allowed" : "hover:bg-[#3C3489]"}`}
            >
              <Check size={14} />
              {uploading ? "Uploading…" : "Commit ↗"}
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
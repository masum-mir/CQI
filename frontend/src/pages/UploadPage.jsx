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

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const targetCategoryRef = useRef(null);

  const { files, addFiles, removeFile, upload, uploading } = usePDFUpload();
  const [selectedItem, setSelectedItem] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeCourse, setActiveCourse] = useState(FACULTY_COURSES[0]?.id);

  // --- NEW: faculty and semester (placeholders) ---
  const [faculty] = useState("CSE");          // TODO: replace with actual value from context/props
  const [semester] = useState("Spring 2026"); // TODO: replace with actual value

  // ... (rest of the code unchanged)

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
        // Pass faculty and semester along with the category
        await upload(cat, faculty, semester);
        toast.success(`Uploaded ${cat} successfully`);
      } catch (err) {
        console.error(`Upload error for ${cat}:`, err);
        toast.error(`Upload failed for ${cat}: ${err?.message || "Unknown error"}`);
      }
    }
  };

}
// ── Category definitions ──
const CATEGORIES = [
  { label: "Student Evaluation Data", fileType: "student_evaluation_data" },
  { label: "Results Excel File", fileType: "results_excel" },
  { label: "Course Outcomes", fileType: "course_outcomes" },
  { label: "Instructor Feedback", fileType: "instructor_feedback" },
  { label: "Administrative Suggestions", fileType: "admin_suggestions" },
  { label: "Previous CQI Reports", fileType: "previous_cqi_reports" },
  { label: "Assessment Data", fileType: "assessment_data" },
  { label: "Attendance Records", fileType: "attendance_records" },
  { label: "Student Academic History", fileType: "academic_history" },
  { label: "Scholarship Data", fileType: "scholarship_data" },
  { label: "Course Information", fileType: "course_info" },
  { label: "Faculty Reflection Reports", fileType: "faculty_reflections" },
  { label: "Accreditation/CQI Guidelines", fileType: "cqi_guidelines" },
  { label: "Improvement Action Plans", fileType: "action_plans" },
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
  const targetCategoryRef = useRef(null);

  const { files, addFiles, removeFile, upload, uploading } = usePDFUpload();
  const [selectedItem, setSelectedItem] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeCourse, setActiveCourse] = useState(FACULTY_COURSES[0]?.id);

  // ── Build lookup map for category → file entry ──
  const fileMap = useMemo(() => {
    const map = new Map();
    files.forEach((f) => {
      if (f.fileType) map.set(f.fileType, f);
    });
    return map;
  }, [files]);

  const getFileForCategory = useCallback(
    (fileType) => fileMap.get(fileType) || null,
    [fileMap]
  );

  // ── Debug logs ──
  useEffect(() => {
    console.log("Files in hook:", files.map((f) => ({ name: f.file.name, fileType: f.fileType, status: f.status })));
  }, [files]);

  // ── Handlers ──
  const handleSlotClick = (fileType) => {
    const existing = getFileForCategory(fileType);
    if (existing) {
      setSelectedItem(existing);
    } else {
      targetCategoryRef.current = fileType;
      fileInputRef.current?.click();
    }
  };

  const handleFileAdd = useCallback(
    (e) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) {
        e.target.value = "";
        targetCategoryRef.current = null;
        return;
      }

      const fileType = targetCategoryRef.current;
      if (!fileType) {
        toast.error("No category selected. Please try again.");
        e.target.value = "";
        return;
      }

      const file = fileList[0];

      if (!ALLOWED_TYPES.has(file.type)) {
        toast.error(`${file.name}: unsupported format`);
        e.target.value = "";
        targetCategoryRef.current = null;
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${file.name}: exceeds 10 MB`);
        e.target.value = "";
        targetCategoryRef.current = null;
        return;
      }

      const existing = getFileForCategory(fileType);
      if (existing) {
        const idx = files.indexOf(existing);
        removeFile(idx);
        if (selectedItem === existing) setSelectedItem(null);
      }

      addFiles([file], fileType);

      e.target.value = "";
      targetCategoryRef.current = null;
    },
    [files, addFiles, removeFile, selectedItem, getFileForCategory]
  );

  const handleRemoveFile = (fileType) => {
    const existing = getFileForCategory(fileType);
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
        await upload(cat);
        toast.success(`Uploaded ${cat} successfully`);
      } catch (err) {
        console.error(`Upload error for ${cat}:`, err);
        toast.error(`Upload failed for ${cat}: ${err?.message || "Unknown error"}`);
      }
    }
  };

  // ── Counts ──
  const totalFiles = files.length;
  const queuedCount = files.filter((f) => f.status === "queued").length;

  return (
    <div className="w-full h-full flex flex-col px-4 py-8">
      <h2 className="sr-only">CQI Upload Page — category file slots</h2>

      <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex">
        {/* Main content (full width, no left sidebar) */}
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
            {/* File grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const fileEntry = getFileForCategory(cat.fileType);
                  const hasFile = !!fileEntry;
                  const rawFile = hasFile ? fileEntry.file : null;
                  const { Icon, color } = rawFile ? getFileIcon(rawFile) : { Icon: null, color: null };

                  return (
                    <div
                      key={cat.fileType}
                      onClick={() => handleSlotClick(cat.fileType)}
                      className="bg-white border border-gray-200 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-gray-300 transition-all"
                    >
                      {hasFile ? (
                        <>
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                            {Icon && <Icon size={28} style={{ color }} />}
                            <span className="text-[10px] font-medium text-gray-400 uppercase mt-1">
                              {rawFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                          <span className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-gray-400 truncate px-1">
                            {rawFile.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(cat.fileType);
                            }}
                            className="absolute top-[5px] left-[5px] w-[18px] h-[18px] rounded-full bg-red-100 text-red-500 text-[10px] hidden group-hover:flex items-center justify-center"
                            title="Remove"
                          >
                            <X size={10} />
                          </button>
                          <div
                            className={`absolute top-2 right-2 w-[7px] h-[7px] rounded-full ${fileEntry.status === "done"
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
                          <Plus size={28} className="text-[#534AB7] mb-1" />
                          <span className="text-[10px] text-center text-gray-400 px-2 leading-tight">
                            {cat.label}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
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
              {totalFiles} of {CATEGORIES.length} files uploaded{queuedCount > 0 && ` (${queuedCount} queued)`}
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
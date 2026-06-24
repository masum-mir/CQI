import { useCallback, useState } from "react";
import { Upload, CloudUpload, CheckCircle, Loader2, Plus } from "lucide-react";
import { FileRow } from "./FileRow";

// Category definitions – values must match backend expectations
const CATEGORIES = [
  { value: "co_attainment", label: "Course File" },
  { value: "po_attainment", label: "Grade Sheet" },
  { value: "student_evaluation", label: "CLO Mapping" },
  { value: "instructor_feedback", label: "Assessment" },
  { value: "tavolation_sheet", label: "Tabulation Sheet" },
  { value: "summary", label: "Summary" },
];

// Course Tabs (UI only – no functional impact)
const COURSE_TABS = [
  { key: "course1", label: "Course 1" },
  { key: "course2", label: "Course 2" },
  { key: "lab", label: "Lab" },
  { key: "done", label: "Done" },
];

export function FileUploadPanel({
  files,
  uploading,
  selectedIdx,
  onAddFiles,
  onRemoveFile,
  onSelectFile,
  onUpload,
}) {
  const [activeTab, setActiveTab] = useState("course1");

  // Helper: group files by category (returns array of { file, index })
  const getCategoryFiles = (categoryValue) =>
    files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.fileType === categoryValue);

  // Helper: count files in a given status for a category
  const countStatus = (categoryValue, status) =>
    files.filter((f) => f.fileType === categoryValue && f.status === status).length;

  // Per-card drag state
  const [draggingCard, setDraggingCard] = useState(null);

  const handleDrop = useCallback(
    (e, categoryValue) => {
      e.preventDefault();
      setDraggingCard(null);
      const droppedFiles = [...e.dataTransfer.files];
      if (droppedFiles.length) {
        onAddFiles(droppedFiles, categoryValue);
      }
    },
    [onAddFiles]
  );

  const handleFileInputChange = useCallback(
    (e, categoryValue) => {
      const selectedFiles = [...e.target.files];
      if (selectedFiles.length) {
        onAddFiles(selectedFiles, categoryValue);
      }
      e.target.value = ""; // reset input
    },
    [onAddFiles]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Course Tabs */}
      <div className="flex border-b border-gray-200">
        {COURSE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => {
          const categoryFiles = getCategoryFiles(category.value);
          const fileCount = categoryFiles.length;
          const queuedCount = countStatus(category.value, "queued");
          const uploadingCount = countStatus(category.value, "uploading") +
                                 countStatus(category.value, "processing");
          const doneCount = countStatus(category.value, "done");
          const allDone = fileCount > 0 && doneCount === fileCount;
          const isUploading = uploadingCount > 0;

          return (
            <div
              key={category.value}
              className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{category.label}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {fileCount}
                </span>
              </div>

              {/* Card Body – Upload Area + File List */}
              <div className="p-3 flex-1 flex flex-col gap-3">
                {/* Upload Drop Zone */}
                <div
                  onDrop={(e) => handleDrop(e, category.value)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingCard(category.value);
                  }}
                  onDragLeave={() => setDraggingCard(null)}
                  onClick={() =>
                    document.getElementById(`file-input-${category.value}`).click()
                  }
                  className={`border-2 border-dashed rounded-lg flex flex-col items-center
                    justify-center gap-1.5 cursor-pointer transition-all select-none
                    min-h-[100px] p-4
                    ${
                      draggingCard === category.value
                        ? "border-violet-500 bg-violet-50/60"
                        : "border-gray-300 hover:border-violet-400 hover:bg-gray-50/50"
                    }`}
                >
                  <Plus size={22} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600">Drop files here</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      or click to browse
                    </p>
                  </div>
                  <input
                    id={`file-input-${category.value}`}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                    className="hidden"
                    onChange={(e) => handleFileInputChange(e, category.value)}
                  />
                </div>

                {/* File List for this category */}
                {categoryFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {categoryFiles.map(({ file, index }) => (
                      <FileRow
                        key={index}
                        item={file}
                        active={selectedIdx === index}
                        onClick={() => onSelectFile(index)}
                        onRemove={() => onRemoveFile(index)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer – Upload/Status Controls */}
              <div className="px-3 py-2.5 border-t border-gray-100 bg-gray-50/40">
                {queuedCount > 0 && !uploading && !isUploading && (
                  <button
                    onClick={() => onUpload(category.value)}
                    className="flex items-center justify-center gap-2 w-full
                               py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700
                               text-white text-xs font-medium transition-colors"
                  >
                    <Upload size={14} />
                    Upload {queuedCount} file{queuedCount > 1 ? "s" : ""}
                  </button>
                )}

                {isUploading && (
                  <div className="flex items-center justify-center gap-2 w-full py-1.5 rounded-lg bg-violet-100 text-violet-600 text-xs font-medium">
                    <Loader2 size={14} className="animate-spin" />
                    Uploading…
                  </div>
                )}

                {allDone && (
                  <div className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
                    <CheckCircle size={14} />
                    Done
                  </div>
                )}

                {!queuedCount && !isUploading && !allDone && fileCount === 0 && (
                  <div className="text-center text-[10px] text-gray-400 py-0.5">
                    No files uploaded yet
                  </div>
                )}

                {!queuedCount && !isUploading && !allDone && fileCount > 0 && (
                  <div className="text-center text-[10px] text-gray-400 py-0.5">
                    {doneCount} of {fileCount} uploaded
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
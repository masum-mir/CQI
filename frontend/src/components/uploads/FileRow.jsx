import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Eye,
} from "lucide-react";

// Map fileType value to display label (matches FILE_TYPES in FileUploadPanel)
const CATEGORY_LABELS = {
  co_attainment: "Course File",
  po_attainment: "Grade Sheet",
  student_evaluation: "CLO Mapping",
  instructor_feedback: "Assessment",
  tavolation_sheet: "Tavolation Sheet",
  summary: "Summary",
};

function MimeIcon({ mime, size = 15 }) {
  if (mime?.startsWith("image/"))
    return <Image size={size} className="text-sky-500 flex-shrink-0" />;
  if (mime?.includes("sheet") || mime?.includes("excel"))
    return (
      <FileSpreadsheet size={size} className="text-emerald-600 flex-shrink-0" />
    );
  if (mime === "application/pdf")
    return <FileText size={size} className="text-rose-500 flex-shrink-0" />;
  if (mime?.includes("word"))
    return <FileText size={size} className="text-blue-500 flex-shrink-0" />;
  return <File size={size} className="text-gray-400 flex-shrink-0" />;
}

function StatusIcon({ status }) {
  if (status === "done")
    return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
  if (status === "failed")
    return <AlertCircle size={16} className="text-red-500 flex-shrink-0" />;
  if (status === "uploading" || status === "processing")
    return (
      <Loader2 size={16} className="text-blue-500 animate-spin flex-shrink-0" />
    );
  return null;
}

function fmtSize(b) {
  return b > 1_048_576
    ? `${(b / 1_048_576).toFixed(1)} MB`
    : `${(b / 1024).toFixed(0)} KB`;
}

export function FileRow({ item, active, onClick, onRemove }) {
  const { file, status, progress, fileType } = item;
  const categoryLabel = CATEGORY_LABELS[fileType] || fileType || "Uncategorized";

  return (
    <div
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border
        transition-all duration-200 group
        hover:scale-[1.01] hover:shadow-md hover:border-violet-200
        ${
          active
            ? "border-violet-300 bg-violet-50/80 shadow-sm"
            : "border-gray-100 bg-white hover:border-violet-200"
        }`}
    >
      {/* File Icon & Main Info */}
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <MimeIcon mime={file.type} size={18} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-800 truncate leading-none max-w-[180px] md:max-w-[240px]">
              {file.name}
            </p>
            {/* Category badge – violet styling */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 border border-violet-200 flex-shrink-0">
              {categoryLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmtSize(file.size)}</p>

          {/* Progress bar */}
          {(status === "uploading" || status === "processing") &&
            progress > 0 && (
              <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
        </div>
      </button>

      {/* Right side: status + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusIcon status={status} />

        {/* Preview (Eye) – always visible, with hover effect */}
        <button
          type="button"
          onClick={onClick}
          className="p-1 rounded text-gray-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          aria-label="Preview"
        >
          <Eye size={15} />
        </button>

        {/* Remove (queued only) */}
        {status === "queued" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            aria-label="Remove file"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
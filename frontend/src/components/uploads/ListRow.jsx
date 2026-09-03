import { CheckCircle, XCircle, Clock, Loader2, Upload, Trash2, Eye } from "lucide-react";

const STATUS_CONFIG = {
  queued: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900", icon: Clock, label: "Waiting for commit" },
  uploading: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900", icon: Loader2, label: "Uploading..." },
  done: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900", icon: CheckCircle, label: "Uploaded" },
  failed: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900", icon: XCircle, label: "Failed" },
  missing: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900", icon: XCircle, label: "Missing" },
};

function ListRow({ item, fileEntry, onSlotClick, onRemoveFile, onUploadClick }) {
  const status = fileEntry?.status || "missing";
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  const Icon = cfg.icon;
  const isAnimating = status === "uploading";

  return (
    <tr className={`${cfg.bg} border-b cursor-pointer`} onClick={() => onSlotClick(item.id)}>
      <td className="px-4 py-2">
        <span className="text-xs font-medium">
          <span className="flex items-center gap-1.5">
            {fileEntry ? (
              <Icon size={14} className={`${cfg.color} ${isAnimating ? "animate-spin" : ""}`} />
            ) : (
              <XCircle size={14} className="text-red-600 dark:text-red-400" />
            )}
            <span className={cfg.color}>
              {cfg.label}
            </span>
          </span>
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{item.title}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {fileEntry ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSlotClick(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition"
              title="View file"
            >
              <Eye size={14} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onUploadClick?.(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition"
              title="Upload file"
            >
              <Upload size={14} />
            </button>
          )}
          {fileEntry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFile?.(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition"
              title="Remove file"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ListRow;

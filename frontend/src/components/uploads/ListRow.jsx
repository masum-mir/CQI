import { CheckCircle, XCircle, Clock, Loader2, Upload, Trash2, Eye } from "lucide-react";

const STATUS_CONFIG = {
  queued: { color: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: Clock, label: "Waiting for commit" },
  uploading: { color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: Loader2, label: "Uploading..." },
  done: { color: "text-green-600", bg: "bg-green-50 border-green-100", icon: CheckCircle, label: "Uploaded" },
  failed: { color: "text-red-600", bg: "bg-red-50 border-red-100", icon: XCircle, label: "Failed" },
  missing: { color: "text-red-600", bg: "bg-red-50 border-red-100", icon: XCircle, label: "Missing" },
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
              <XCircle size={14} className="text-red-600" />
            )}
            <span className={cfg.color}>
              {cfg.label}
            </span>
          </span>
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{item.title}</td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {fileEntry ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSlotClick(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition"
              title="View file"
            >
              <Eye size={14} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onUploadClick?.(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition"
              title="Upload file"
            >
              <Upload size={14} />
            </button>
          )}
          {fileEntry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFile?.(item.id) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
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

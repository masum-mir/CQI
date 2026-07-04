import { ArrowLeft, Check } from "lucide-react";

export default function BottomBar({
  totalFiles,
  totalItems,
  queuedCount,
  committing,
  onCommit,
  onBack,
}) {
  const disabled = committing || queuedCount === 0;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-gray-500 px-2.5 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={13} /> Back
      </button>
      <span className="text-[11px] text-gray-400">
        {totalFiles} of {totalItems} files uploaded
        {queuedCount > 0 && ` (${queuedCount} queued)`}
      </span>
      <button
        onClick={onCommit}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-[18px] py-[7px] bg-[#534AB7] text-[#EEEDFE] rounded-md text-xs font-medium transition-colors border-none cursor-pointer
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#3C3489]"}`}
      >
        <Check size={14} />
        {committing ? "Uploading..." : "Commit ↗"}
      </button>
    </div>
  );
}

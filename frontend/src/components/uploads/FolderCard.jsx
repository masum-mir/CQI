import { FolderOpen } from "lucide-react";
import UploadThumbnail from "./UploadThumbnail";

export default function FolderCard({ category, getFileForItem, onSlotClick }) {
  const { label, items } = category;
  const uploadedItems = items.filter((item) => getFileForItem(item.id));
  const uploadedCount = uploadedItems.length;
  const totalItems = items.length;

  const uploadedFileEntries = uploadedItems.map((item) => getFileForItem(item.id));
  const visibleThumbnails = uploadedFileEntries.slice(0, 4);
  const overflowCount = uploadedFileEntries.length - 4;

  function handleClick() {
    const firstEmpty = items.find((item) => !getFileForItem(item.id));
    const targetId = firstEmpty ? firstEmpty.id : items[items.length - 1].id;
    onSlotClick(targetId);
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen size={20} className="text-amber-500" />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>

      {uploadedCount === 0 ? (
        <p className="text-xs text-gray-400 mb-3">No files uploaded</p>
      ) : (
        <div className="flex items-center gap-1.5 mb-3">
          {visibleThumbnails.map((fileEntry, idx) => {
            if (idx === 3 && overflowCount > 0) {
              return (
                <div key={idx} className="relative">
                  <UploadThumbnail fileEntry={fileEntry} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded text-white text-[10px] font-semibold">
                    +{overflowCount}
                  </div>
                </div>
              );
            }
            return <UploadThumbnail key={idx} fileEntry={fileEntry} />;
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {uploadedCount} / {totalItems} uploaded
      </p>
    </div>
  );
}

import UploadCard from "./UploadCard";

export default function GridUploadView({ categories, getFileForItem, onSlotClick, onRemoveFile }) {
  const items = categories.flatMap((cat) => cat.items);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <UploadCard
          key={item.id}
          item={item}
          fileEntry={getFileForItem(item.id)}
          onSlotClick={onSlotClick}
          onRemoveFile={onRemoveFile}
        />
      ))}
    </div>
  );
}

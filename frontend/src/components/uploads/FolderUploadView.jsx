import FolderCard from "./FolderCard";

export default function FolderUploadView({ categories, getFileForItem, onSlotClick, onRemoveFile }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <FolderCard
          key={category.label}
          category={category}
          getFileForItem={getFileForItem}
          onSlotClick={onSlotClick}
        />
      ))}
    </div>
  );
}

import UploadCategory from './UploadCategory';
import UploadCard from './UploadCard';

export default function CompactUploadView({ categories, getFileForItem, onSlotClick, onRemoveFile }) {
  return (
    <>
      {categories.map((category) => (
        <UploadCategory key={category.label} label={category.label}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {category.items.map((item) => {
              const fileEntry = getFileForItem(item.id);
              return (
                <UploadCard
                  key={item.id}
                  item={item}
                  fileEntry={fileEntry}
                  onSlotClick={onSlotClick}
                  onRemoveFile={onRemoveFile}
                />
              );
            })}
          </div>
        </UploadCategory>
      ))}
    </>
  );
}

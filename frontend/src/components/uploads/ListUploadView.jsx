import ListRow from "./ListRow";

function ListUploadView({ categories, getFileForItem, onSlotClick, onRemoveFile, onUploadClick }) {
  const items = categories.flatMap((cat) => cat.items);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 text-left">
              Status
            </th>
            <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 text-left">
              Document Name
            </th>
            <th className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ListRow
              key={item.id}
              item={item}
              fileEntry={getFileForItem(item.id)}
              onSlotClick={onSlotClick}
              onRemoveFile={onRemoveFile}
              onUploadClick={onUploadClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListUploadView;

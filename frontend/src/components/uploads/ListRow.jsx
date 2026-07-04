import { CheckCircle, XCircle } from "lucide-react";

function ListRow({ item, fileEntry, onSlotClick }) {
  const uploaded = fileEntry != null;

  return (
    <tr
      className={
        uploaded
          ? "bg-green-50 border-b border-green-100"
          : "bg-red-50 border-b border-red-100"
      }
      onClick={() => onSlotClick(item.id)}
      style={{ cursor: "pointer" }}
    >
      <td className="px-4 py-2">
        <span className="text-xs font-medium">
          <span className="flex items-center gap-1.5">
            {uploaded ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <XCircle size={14} className="text-red-600" />
            )}
            <span className={uploaded ? "text-green-600" : "text-red-600"}>
              {uploaded ? "Uploaded" : "Missing"}
            </span>
          </span>
        </span>
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{item.title}</td>
    </tr>
  );
}

export default ListRow;

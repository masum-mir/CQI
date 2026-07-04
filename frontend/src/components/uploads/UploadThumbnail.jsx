import { getFileIcon } from "@/utils/uploadHelpers";

export default function UploadThumbnail({ fileEntry }) {
  const file = fileEntry?.file;
  if (!file) return null;

  if (file.type?.startsWith("image/")) {
    return (
      <img
        src={URL.createObjectURL(file)}
        alt=""
        className="w-10 h-10 object-cover rounded"
      />
    );
  }

  const { Icon, color } = getFileIcon(file);
  return (
    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
      <Icon size={20} color={color} />
    </div>
  );
}

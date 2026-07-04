const bgMap = {
  done: "bg-green-500",
  uploading: "bg-blue-500",
  processing: "bg-blue-500",
  failed: "bg-red-500",
};

export default function UploadStatusDot({ status }) {
  return (
    <div
      className={`w-1.5 h-1.5 rounded-full ${bgMap[status] || "bg-gray-300"}`}
    />
  );
}

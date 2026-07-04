export default function UploadCategory({ label, children }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
      <div className="border-b border-gray-200 mb-3" />
      {children}
    </div>
  );
}

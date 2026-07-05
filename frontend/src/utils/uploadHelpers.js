import { FileText, FileSpreadsheet } from "lucide-react";

export function getFileIcon(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { Icon: FileText, color: "#534AB7" };
  if (["xlsx", "xls"].includes(ext)) return { Icon: FileSpreadsheet, color: "#1D9E75" };
  if (["doc", "docx"].includes(ext)) return { Icon: FileText, color: "#3B82F6" };
  return { Icon: FileText, color: "#6B7280" };
}

export function makeEntry(file, itemId) {
  const thumbnailUrl =
    file.type.startsWith("image/") || file.type === "application/pdf"
      ? URL.createObjectURL(file)
      : null;

  return {
    id: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    fileType: itemId,
    status: "queued",
    thumbnailUrl,
  };
}

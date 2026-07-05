import { Plus, X } from "lucide-react";
import { getFileIcon } from "@/utils/uploadHelpers";
import UploadStatusDot from "./UploadStatusDot";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function UploadCard({ item, fileEntry, onSlotClick, onRemoveFile }) {
  const hasFile = !!fileEntry;
  const rawFile = hasFile ? fileEntry.file : null;
  const { Icon, color } = rawFile ? getFileIcon(rawFile) : { Icon: null, color: null };

  const isImage = rawFile?.type.startsWith("image/");
  const isPdf = rawFile?.type === "application/pdf";
  const thumbUrl = hasFile ? fileEntry.thumbnailUrl : null;

  return (
    <div key={item.id}>
      <p className="text-xs text-gray-500 mb-1 truncate text-center" title={item.title}>
        {item.title}
      </p>
      <div
        onClick={() => onSlotClick(item.id)}
        className="bg-white border border-gray-200 rounded-lg aspect-square w-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group hover:border-gray-300 transition-all"
      >
        {hasFile ? (
          <>
            {isImage && thumbUrl ? (
              <img
                src={thumbUrl}
                alt={rawFile.name}
                className="w-full h-full object-cover"
              />
            ) : isPdf && thumbUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden p-1">
                <Document
                  file={{ url: thumbUrl }}
                  loading={
                    <span className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  }
                  error={
                    <div className="flex flex-col items-center justify-center">
                      {Icon && <Icon size={24} style={{ color }} />}
                      <span className="text-[9px] font-medium text-gray-400 uppercase mt-0.5">PDF</span>
                    </div>
                  }
                >
                  <Page
                    pageNumber={1}
                    scale={0.3}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                {Icon && <Icon size={24} style={{ color }} />}
                <span className="text-[9px] font-medium text-gray-400 uppercase mt-0.5">
                  {rawFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                </span>
              </div>
            )}
            <span className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-gray-400 truncate px-1">
              {rawFile.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile(item.id);
              }}
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-red-100 text-red-500 text-[8px] hidden group-hover:flex items-center justify-center"
              title="Remove"
            >
              <X size={8} />
            </button>
            <div className="absolute top-1 right-1">
              <UploadStatusDot status={fileEntry.status} />
            </div>
          </>
        ) : (
          <>
            <Plus size={32} className="text-[#534AB7] mb-0.5" />
            <span className="text-[9px] text-center text-gray-400 px-0.5">
              Upload
            </span>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { getFileIcon } from "@/utils/uploadHelpers";
import UploadStatusDot from "./UploadStatusDot";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { courseFileApi } from "@/api/courseFileApi";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const CARD_STATUS = {
  queued: "bg-amber-50 border-amber-300",
  done: "bg-emerald-50 border-emerald-300",
};

export default function UploadCard({ item, fileEntry, onSlotClick, onRemoveFile }) {
  const hasFile = !!fileEntry;
  const rawFile = hasFile ? fileEntry.file : null;
  const { Icon, color } = rawFile ? getFileIcon(rawFile) : { Icon: null, color: null };

  const isImage = rawFile?.type.startsWith("image/");
  const isPdf = rawFile?.type === "application/pdf";

  // Three possible sources for a thumbnail, in priority order:
  // 1. fileEntry.thumbnailUrl — already provided by the upload hook
  // 2. rawFile is a real browser File/Blob (just-selected, not committed yet)
  //    → build the object URL ourselves, no network needed
  // 3. Committed file loaded from the DB (has an id, no local bytes)
  //    → fetch the bytes from the API
  const [objUrl, setObjUrl] = useState(null);
  const thumbUrl = hasFile ? fileEntry.thumbnailUrl || objUrl : null;

  useEffect(() => {
    setObjUrl(null);
    if (!hasFile || fileEntry.thumbnailUrl) return;
    if (!isImage && !isPdf) return; // no visual preview needed for excel/word/etc

    // Case 2: local, not-yet-committed file — we already have the bytes
    if (rawFile instanceof Blob) {
      const url = URL.createObjectURL(rawFile);
      setObjUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    // Case 3: committed file — fetch bytes from the server
    if (fileEntry.id) {
      let url;
      let cancelled = false;

      courseFileApi
        .preview(fileEntry.id)
        .then((res) => {
          if (cancelled) return;
          const blob = new Blob([res.data], { type: rawFile.type });
          url = URL.createObjectURL(blob);
          setObjUrl(url);
        })
        .catch((err) => console.log("Thumbnail preview error:", err));

      return () => {
        cancelled = true;
        if (url) URL.revokeObjectURL(url);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFile, fileEntry?.id, fileEntry?.thumbnailUrl, rawFile, isImage, isPdf]);

  const statusBg = !hasFile ? "bg-red-50 border-red-200" : CARD_STATUS[fileEntry.status] || "bg-white border-gray-200";

  return (
    <div key={item.id}>
      <p className="text-xs text-gray-500 mb-1 truncate text-center" title={item.title}>
        {item.title}
      </p>
      <div
        onClick={() => onSlotClick(item.id)}
        className={`rounded-lg aspect-square w-full flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all border ${statusBg} hover:brightness-95`}
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
            ) : (isImage || isPdf) && !thumbUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <span className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
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
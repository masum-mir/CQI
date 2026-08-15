import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  FileText,
  Image,
  File,
  FileSpreadsheet,
  ExternalLink,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";
import { courseFileApi } from "@/api/courseFileApi";
import * as XLSX from "xlsx";
import { documentApi } from "@/api/documentApi";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function fmtSize(b) {
  return b > 1_048_576
    ? `${(b / 1_048_576).toFixed(1)} MB`
    : `${(b / 1024).toFixed(0)} KB`;
}

function MimeIcon({ mime, size = 18 }) {
  if (mime?.startsWith("image/"))
    return <Image size={size} className="text-sky-500" />;
  if (mime?.includes("sheet") || mime?.includes("excel"))
    return <FileSpreadsheet size={size} className="text-emerald-600" />;
  if (mime === "application/pdf")
    return <FileText size={size} className="text-rose-500" />;
  if (mime?.includes("word"))
    return <FileText size={size} className="text-blue-500" />;
  return <File size={size} className="text-gray-400" />;
}

export function FilePreviewPanel({ item, onClose, onRemove }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfError, setPdfError] = useState(null);

  const [excelData, setExcelData] = useState([]);

  const [loadingBlob, setLoadingBlob] = useState(false);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!item) {
      setObjectUrl(null);
      setLoadingBlob(false);
      return;
    }

    let url;
    let cancelled = false;

    async function loadFile() {
      setLoadingBlob(true);
      try {
        // Not-yet-committed local file: we already have the real bytes in
        // the browser (item.file is an actual File/Blob) — no need to hit
        // the API, and item.id may not even exist in the DB yet.
        // Committed file: no local bytes, so fetch them from the server.
        const isLocalBlob = item.file instanceof Blob;
        const blob = isLocalBlob
          ? item.file
          : new Blob([(await courseFileApi.preview(item.id)).data], {
              type: item.file.type,
            });

        if (cancelled) return;

        url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setObjectUrl(url);

        const isExcelFile =
          item.file.type.includes("sheet") ||
          item.file.type.includes("excel") ||
          item.file.name.toLowerCase().endsWith(".xlsx") ||
          item.file.name.toLowerCase().endsWith(".xls");

        if (isExcelFile) {
          const workbook = XLSX.read(await blob.arrayBuffer(), {
            type: "array",
          });

          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
          });

          if (!cancelled) setExcelData(rows);
        }
      } catch (err) {
        console.log("Preview ERROR:", err);
      } finally {
        if (!cancelled) setLoadingBlob(false);
      }
    }

    loadFile();

    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
      setExcelData([]);
    };
  }, [item]);

  // close on Escape
  useEffect(() => {
    if (!item) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
  }, []);
  const onDocumentLoadError = useCallback((err) => {
    setPdfError(err?.message ?? "Unknown error");
  }, []);

  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages ?? 1, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));

  if (!item) return null;

  const { file, status } = item;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const ext = file.name.split(".").pop().toUpperCase();
  const isExcel =
    file.type.includes("sheet") ||
    file.type.includes("excel") ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls");

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "820px", maxWidth: "95vw", height: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <MimeIcon mime={file.type} size={17} />
          <span className="flex-1 text-sm font-medium text-gray-800 truncate min-w-0">
            {file.name}
          </span>
          <span className="text-[11px] text-gray-400 tabular-nums flex-shrink-0">
            {fmtSize(file.size)} · {ext}
          </span>

          {objectUrl && (isPdf || isImage) && (
            <a
              href={objectUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500
                         border border-gray-200 rounded-lg hover:bg-gray-50
                         transition-colors flex-shrink-0"
            >
              <ExternalLink size={12} />
              Open tab
            </a>
          )}

          {status === "queued" && (
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500
                         border border-red-100 rounded-lg hover:bg-red-50
                         transition-colors flex-shrink-0"
            >
              <Trash2 size={12} />
              Remove
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400
                       hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 flex flex-col items-center min-h-0">
          {loadingBlob ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="text-violet-500 animate-spin" />
            </div>
          ) : isPdf && objectUrl ? (
            pdfError ? (
              <div className="flex flex-col items-center gap-3 text-gray-400 py-16 text-center">
                <FileText size={40} className="text-rose-400" />
                <p className="text-sm font-medium text-gray-600">
                  Could not render PDF
                </p>
                <p className="text-[11px] text-gray-400 break-all max-w-xs">
                  {pdfError}
                </p>
                <a
                  href={objectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-600 underline underline-offset-2"
                >
                  Open in new tab ↗
                </a>
              </div>
            ) : (
              <Document
                file={{ url: objectUrl }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center py-24">
                    <span
                      className="w-6 h-6 rounded-full border-2 border-violet-500
                                   border-t-transparent animate-spin"
                    />
                  </div>
                }
                error={null}
                className="flex flex-col items-center py-6 gap-4 w-full"
              >
                {numPages ? (
                  Array.from({ length: numPages }, (_, i) => (
                    <Page
                      key={i + 1}
                      pageNumber={i + 1}
                      scale={scale}
                      renderTextLayer
                      renderAnnotationLayer
                      className="shadow-lg"
                    />
                  ))
                ) : (
                  <Page
                    pageNumber={1}
                    scale={scale}
                    renderTextLayer
                    renderAnnotationLayer
                    className="shadow-lg"
                  />
                )}
              </Document>
            )
          ) : isExcel ? (
            <div className="w-full overflow-auto p-4">
              <table className="min-w-full border border-gray-300 text-sm">
                <tbody>
                  {excelData.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className="border border-gray-300 px-3 py-2 whitespace-nowrap"
                        >
                          {cell?.toString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isImage && objectUrl ? (
            <div className="flex-1 flex items-center justify-center p-6 w-full">
              <img
                src={objectUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-16">
              <MimeIcon mime={file.type} size={48} />
              <p className="text-sm text-gray-400">Preview not available</p>
              <p className="text-[11px] text-gray-300">{ext} file</p>
            </div>
          )}
        </div>

        {isPdf && !pdfError && (
          <div
            className="flex items-center justify-between gap-4 px-5 py-2.5
                       border-t border-gray-100 bg-white flex-shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevPage}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                           disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-gray-500 tabular-nums min-w-[64px] text-center">
                {numPages ? `${pageNumber} / ${numPages}` : "…"}
              </span>
              <button
                onClick={nextPage}
                disabled={!numPages || pageNumber >= numPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                           disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                           disabled:opacity-30 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-500 tabular-nums w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                           disabled:opacity-30 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
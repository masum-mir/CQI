import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultHelpItems = [
  "Upload course documents", 
];

const defaultAiItems = ["AI Analysis", "Coming Soon"];

const MIN_WIDTH = 40; // collapsed width
const DEFAULT_WIDTH = 240; // w-60

export function HelpBar({
  title = "Help",
  helpItems = defaultHelpItems,
  aiItems = defaultAiItems,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedWidth, setExpandedWidth] = useState(() => {
    const saved = localStorage.getItem("helpbarWidth");
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("helpbarWidth", String(expandedWidth));
  }, [expandedWidth]);

  const toggle = () => setOpen((prev) => !prev);

  const startResize = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = rect.right - e.clientX;
      // No upper limit, only enforce minimum
      newWidth = Math.max(newWidth, MIN_WIDTH);
      setExpandedWidth(newWidth);
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const currentWidth = open ? expandedWidth : MIN_WIDTH;

  return (
    <aside
      ref={containerRef}
      className={`flex flex-col bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto relative h-full`}
      style={{ width: currentWidth }}
    >
      {/* Header / Toggle */}
      <div
        className={`flex items-center h-14 border-b border-gray-100
          ${open ? "justify-between px-2" : "justify-center"}`}
      >
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label={open ? "Collapse help panel" : "Expand help panel"}
        >
          {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        {open && (
          <span className="text-sm font-semibold text-gray-700 pr-2">{title}</span>
        )}
      </div>

      {/* Content */}
      {open && (
        <div className="flex-1 p-4 text-sm text-gray-600 overflow-y-auto space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Help
            </p>
            <ul className="space-y-0.5 text-xs">
              {helpItems.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              AI Assistant
            </p>
            <ul className="space-y-0.5 text-xs">
              {aiItems.map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Resize handle – only when expanded */}
      {open && (
        <div
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-violet-400 transition-colors group"
          onMouseDown={startResize}
          style={{ touchAction: "none" }}
        >
          <div className="w-full h-full opacity-0 group-hover:opacity-100 bg-violet-400" />
        </div>
      )}
    </aside>
  );
}
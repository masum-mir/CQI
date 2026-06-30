import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, FileText, Menu, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

const NAV_MAIN = [
  { to: "/", icon: Home, label: "Home", exact: true },
  { to: "/upload", icon: FileText, label: "Course Materials", exact: false },
  { to: "/courses", icon: FileText, label: "Course List", exact: false },
  { to: "/admin/users", icon: FileText, label: "Users List", exact: false },
  { to: "/catalog", icon: FileText, label: "catalog", exact: false },
  { to: "/courses/import", icon: FileText, label: "Course import", exact: false },

  ];

const MIN_WIDTH = 64; // collapsed width
const DEFAULT_WIDTH = 224; // w-56

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
         transition-colors mx-2
         ${isActive
          ? "bg-violet-50 text-violet-700 font-medium"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      <Icon size={15} className="flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [expandedWidth, setExpandedWidth] = useState(() => {
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Save expanded width on change
  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(expandedWidth));
  }, [expandedWidth]);

  const startResize = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
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

  // Determine current width: if open, use expandedWidth; else collapsed width
  const currentWidth = sidebarOpen ? expandedWidth : MIN_WIDTH;

  return (
    <aside
      ref={containerRef}
      className={`flex flex-col bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto relative`}
      style={{ width: currentWidth }}
    >
      {/* Header with toggle */}
      <div
        className={`flex items-center h-14 border-b border-gray-100
          ${sidebarOpen ? "justify-between px-3" : "justify-center"}`}
      >
        {sidebarOpen && (
          <span className="text-sm font-semibold text-gray-700">CQI</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation */}
      {sidebarOpen && (
        <div className="py-3 flex-1">
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 mb-1">
              Main
            </p>
            {NAV_MAIN.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400">CQI Module</p>
        </div>
      )}

      {/* Resize handle – only when expanded */}
      {sidebarOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-violet-400 transition-colors group"
          onMouseDown={startResize}
          style={{ touchAction: "none" }}
        >
          <div className="w-full h-full opacity-0 group-hover:opacity-100 bg-violet-400" />
        </div>
      )}
    </aside>
  );
}
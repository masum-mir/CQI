import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { HelpBar } from "./HelpBar";

import { useUIStore } from "@/store/uiStore";
import { useLocation } from "react-router-dom";
import { HELP_BY_PATH } from "@/utils/helpContent";

export function AppLayout({ children }) {
  const {
    sidebarOpen,
    toggleSidebar,
  } = useUIStore();

  const location = useLocation();

  const help =
    HELP_BY_PATH[location.pathname] ||
    HELP_BY_PATH["/"];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* Navbar */}
      <Navbar />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="
              fixed
              inset-0
              top-14
              bg-black/30
              z-30
              lg:hidden
            "
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>

        {/* Help Bar */}
        <div className="shrink-0">
          <HelpBar
            title={help.title}
            helpItems={help.helpItems}
          />
        </div>

      </div>
    </div>
  );
}
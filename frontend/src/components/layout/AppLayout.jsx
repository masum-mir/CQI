import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { HelpBar } from "./HelpBar";
import { useUIStore } from "@/store/uiStore";
import { useLocation } from "react-router-dom";
import { HELP_BY_PATH } from "@/config/helpContent";

export function AppLayout({ children }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const location = useLocation();
  const help = HELP_BY_PATH[location.pathname] || HELP_BY_PATH["/"];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        <div className="shrink-0">
          <HelpBar title={help.title} helpItems={help.helpItems} /> 
        </div>
      </div>
    </div>
  );
}

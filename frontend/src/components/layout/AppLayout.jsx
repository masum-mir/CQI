import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { HelpBar } from "./HelpBar";
import { useUIStore } from "@/store/uiStore";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const HELP_BY_PATH = {
  "/": {
    title: "Home",
    helpItems: ["Upload course documents"],
  },
  "/upload/file": {
    title: "Course Materials",
    helpItems: [
      "Select a course and semester from the top bar",
      "Click a slot to upload a document for that item",
      "Supported files: PDF, images, Word, Excel (max 10MB)",
      "Click 'Upload' at the bottom to commit changes",
      "Queued items show amber — commit to turn them green",
    ],
  },
  "/upload/file/list": {
    title: "Uploaded Files",
    helpItems: [
      "Browse all uploaded documents across courses",
      "Use filters to narrow by course, semester, or type",
      "Click a file to preview, download, or delete",
      "Chairpersons can mark documents as approved or rejected",
    ],
  },
  "/courses": {
    title: "Course List",
    helpItems: [
      "View all course offerings across semesters",
      "Search by code, title, or faculty name",
      "Create, edit, or delete courses",
    ],
  },
  "/course/import": {
    title: "Import Courses",
    helpItems: [
      "Upload an Excel file (.xls/.xlsx) with course offerings",
      "Preview parsed data before committing",
      "Faculty short codes must match existing users",
    ],
  },
  "/admin/users": {
    title: "Users",
    helpItems: [
      "Manage user accounts and role assignments",
      "Roles: admin, chairperson, faculty",
      "You cannot delete your own account",
    ],
  },
};

export function AppLayout({ children }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const [panelCollapsed, setPanelCollapsed] = useState(false);
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
          <HelpBar title={help.title} helpItems={help.helpItems} defaultOpen={!panelCollapsed} /> 
        </div>
      </div>
    </div>
  );
}

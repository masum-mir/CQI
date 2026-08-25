import { NavLink } from "react-router-dom";
import {
  Home,
  FolderKanban,
  Files,
  BookOpenCheck,
  History,
  Library,
  Users,
  FileSpreadsheet,
} from "lucide-react";

import { useUIStore } from "@/store/uiStore";
import { useAuthContext } from "@/context/AuthContext";

const NAV_MAIN = [
  {
    to: "/",
    icon: Home,
    label: "Home",
    exact: true,
    roles: ["admin", "chairperson", "faculty"],
  },
  {
    to: "/upload/file",
    icon: FolderKanban,
    label: "Course Materials",
    exact: true,
    roles: ["faculty", "chairperson"],
  },
  {
    to: "/upload/file/list",
    icon: Files,
    label: "Uploaded Files",
    exact: false,
    roles: ["chairperson", "faculty", "admin"],
  },
  {
    to: "/my-courses-list",
    icon: BookOpenCheck,
    label: "My Course",
    exact: false,
    roles: ["chairperson", "faculty"],
  },
  {
    to: "/faculty-courses-list",
    icon: History,
    label: "Faculty Course History",
    exact: false,
    roles: ["chairperson", "admin"],
  },
  {
    to: "/faculty-compliance",
    icon: History,
    label: "Faculty Compliance",
    exact: false,
    roles: ["chairperson", "admin"],
  },
  {
    to: "/courses",
    icon: Library,
    label: "Course List",
    exact: false,
    roles: ["chairperson", "admin"],
  },
  {
    to: "/admin/users",
    icon: Users,
    label: "Users List",
    exact: false,
    roles: ["admin"],
  },
  {
    to: "/course/import",
    icon: FileSpreadsheet,
    label: "Course Import",
    exact: false,
    roles: ["admin", "chairperson"],
  },
];

function NavItem({ to, icon: Icon, label, exact, onClick }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
         transition-colors mx-2
         ${
           isActive
             ? "bg-violet-50 text-violet-700 font-medium"
             : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
         }`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthContext();

  const navItems = NAV_MAIN.filter(
    (item) =>
      !item.roles ||
      (user?.role && item.roles.includes(user.role))
  );

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <aside
      className={`
        bg-white
        border-r
        border-gray-200
        w-56
        flex-shrink-0
        flex-col
        overflow-y-auto

        fixed
        top-14
        bottom-0
        left-0
        z-40

        transition-transform
        duration-300
        ease-in-out

        lg:static
        lg:flex
        lg:translate-x-0

        ${
          sidebarOpen
            ? "flex translate-x-0"
            : "flex -translate-x-full"
        }
      `}
    >
      {/* Mobile close button */}
      {/* <div className="flex justify-end px-3 py-2 border-b border-gray-100 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div> */}

      {/* Navigation */}
      <div className="py-3 flex-1">
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 mb-1">
            Main
          </p>

          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={handleNavClick}
            />
          ))}
        </div>
      </div>

      {/* User role */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase">
          {user?.role || ""}
        </p>
      </div>
    </aside>
  );
}
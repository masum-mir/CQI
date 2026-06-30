import { LogOut, Menu, GraduationCap } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthContext } from "@/context/AuthContext";

export function Navbar() {
  const auth = useAuthContext();
  console.log(auth);

  const { toggleSidebar } = useUIStore();
  const { logout } = useAuthContext();

  return (
    <header
      className="h-14 bg-white border-b border-gray-200 flex items-center
                       justify-between px-4 flex-shrink-0 z-10"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500
                     transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={15} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">CQI</span>
        </div>
      </div>

      {/* Right — bell + user */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500
                       transition-colors ml-1"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

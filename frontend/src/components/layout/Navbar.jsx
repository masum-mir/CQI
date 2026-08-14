import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  GraduationCap,
  User,
  ChevronDown,
} from "lucide-react";

import { useUIStore } from "@/store/uiStore";
import { useAuthContext } from "@/context/AuthContext";

export function Navbar() {
  const navigate = useNavigate();

  const { toggleSidebar } = useUIStore();
  const { user, logout } = useAuthContext();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Actual backend structure:
  // profileImage: { url: "...", provider: "google" }
  const profileImage = user?.profileImage?.url || "";

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const handleViewProfile = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <header
      className="
        h-14
        bg-white
        border-b
        border-gray-200
        flex
        items-center
        justify-between
        px-4
        flex-shrink-0
        relative
        z-50
      "
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={toggleSidebar}
          className="
            p-1.5
            rounded-lg
            hover:bg-gray-100
            text-gray-500
            transition-colors
            lg:hidden
          "
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="
              w-8
              h-8
              bg-violet-600
              rounded-lg
              flex
              items-center
              justify-center
              shadow-sm
            "
          >
            <GraduationCap
              size={17}
              className="text-white"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              CQI
            </p>

            <p className="hidden sm:block text-[10px] text-gray-400 leading-tight">
              Course Quality Improvement
            </p>
          </div>
        </div>
      </div>

      {/* Right */}
      {user && (
        <div
          ref={profileRef}
          className="relative"
        >
          {/* Profile Trigger */}
          <button
            type="button"
            onClick={() =>
              setProfileOpen((prev) => !prev)
            }
            className="
              flex
              items-center
              gap-2.5
              px-2
              py-1.5
              rounded-xl
              hover:bg-gray-50
              transition-colors
            "
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            {/* User text */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700 leading-tight max-w-[180px] truncate">
                {user?.name || "User"}
              </p>

              <p className="text-[11px] text-gray-400 capitalize leading-tight">
                {user?.role || ""}
              </p>
            </div>

            {/* Profile Image */}
            <div
              className="
                w-9
                h-9
                rounded-full
                overflow-hidden
                bg-violet-100
                ring-2
                ring-violet-100
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={user?.name || "Profile"}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="
                    w-full
                    h-full
                    flex
                    items-center
                    justify-center
                    bg-gradient-to-br
                    from-violet-500
                    to-indigo-600
                    text-white
                    text-xs
                    font-semibold
                  "
                >
                  {initials}
                </div>
              )}
            </div>

            <ChevronDown
              size={15}
              className={`
                hidden
                sm:block
                text-gray-400
                transition-transform
                duration-200
                ${
                  profileOpen
                    ? "rotate-180"
                    : ""
                }
              `}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div
              className="
                absolute
                right-0
                top-full
                mt-2
                w-72
                bg-white
                border
                border-gray-100
                rounded-2xl
                shadow-xl
                shadow-gray-200/60
                overflow-hidden
                z-[100]
              "
            >
              {/* Profile Summary */}
              <div
                className="
                  px-4
                  py-4
                  bg-gradient-to-br
                  from-violet-50
                  to-white
                  border-b
                  border-gray-100
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-12
                      h-12
                      rounded-full
                      overflow-hidden
                      bg-violet-100
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={user?.name || "Profile"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="
                          w-full
                          h-full
                          flex
                          items-center
                          justify-center
                          bg-gradient-to-br
                          from-violet-500
                          to-indigo-600
                          text-white
                          text-sm
                          font-semibold
                        "
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.name || "User"}
                    </p>

                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {user?.email || ""}
                    </p>

                    {user?.role && (
                      <span
                        className="
                          inline-flex
                          mt-1.5
                          px-2
                          py-0.5
                          rounded-full
                          bg-violet-100
                          text-violet-700
                          text-[10px]
                          font-medium
                          capitalize
                        "
                      >
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Profile */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-xl
                    text-left
                    text-gray-700
                    hover:bg-violet-50
                    hover:text-violet-700
                    transition-colors
                  "
                >
                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      bg-gray-100
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                  >
                    <User size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      View Profile
                    </p>
 
                  </div>
                </button>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-xl
                    text-left
                    text-red-500
                    hover:bg-red-50
                    transition-colors
                  "
                >
                  <div
                    className="
                      w-8
                      h-8
                      rounded-lg
                      bg-red-50
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                  >
                    <LogOut size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Sign Out
                    </p>
 
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
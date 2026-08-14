import {
  Mail,
  Building2,
  BriefcaseBusiness,
  IdCard,
  Phone,
  UserRound,
} from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuthContext();

  const profileImage = user?.profileImage?.url || "";

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">

          {/* ================= LEFT ================= */}
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50/60 p-8">
            <div className="flex flex-col items-center text-center">
              
              {/* Photo */}
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={user?.name || "Profile"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name */}
              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                {user?.name || "—"}
              </h2>

              {/* Email */}
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-gray-500 max-w-full">
                <Mail size={14} className="flex-shrink-0" />
                <span className="break-all">
                  {user?.email || "—"}
                </span>
              </div>

              {/* Department badge */}
              {user?.department && (
                <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium">
                  {user.department}
                </span>
              )}
            </div>
          </div>

          {/* ================= RIGHT ================= */}
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900">
                Profile Details
              </h3> 
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InfoBox
                icon={UserRound}
                label="Full Name"
                value={user?.name}
              />

              <InfoBox
                icon={Building2}
                label="Department"
                value={user?.department}
              />

              <InfoBox
                icon={BriefcaseBusiness}
                label="Designation"
                value={user?.designation}
              />

              <InfoBox
                icon={IdCard}
                label="Employee ID"
                value={user?.employeeId}
              />

              <InfoBox
                icon={Phone}
                label="Mobile Number"
                value={user?.mobile}
              />

              <InfoBox
                icon={Mail}
                label="Email Address"
                value={user?.email}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-4
        transition
        hover:border-violet-200
        hover:shadow-sm
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            w-10
            h-10
            rounded-lg
            bg-violet-50
            text-violet-600
            flex
            items-center
            justify-center
            flex-shrink-0
          "
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            {label}
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-800 break-words">
            {value || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}
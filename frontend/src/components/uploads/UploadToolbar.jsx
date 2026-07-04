import { Filter, Check, ChevronDown } from "lucide-react";

export default function UploadToolbar({
  loadingShell,
  visibleCourses,
  activeCourseId,
  onCourseSelect,
  semesters,
  activeSemester,
  onSemesterSelect,
  semesterMenuOpen,
  onToggleSemesterMenu,
  onCloseSemesterMenu,
  courseFiles,
}) {
  return (
    <nav className="flex items-center border-b border-gray-200 bg-white px-4 shrink-0">
      <div className="relative shrink-0 flex items-center pr-3 mr-2 border-r border-gray-200">
        <button
          onClick={onToggleSemesterMenu}
          className="flex items-center gap-1 text-xs text-gray-500 px-2.5 py-1.5 my-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          title="Filter by semester"
        >
          <Filter size={12} />
          {activeSemester || "Semester"}
          <ChevronDown size={12} />
        </button>

        {semesterMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={onCloseSemesterMenu} />
            <div className="absolute left-0 top-full z-20 bg-white border border-gray-200 rounded-md shadow-sm min-w-[150px] py-1">
              {semesters.length === 0 && (
                <span className="block px-3 py-1.5 text-xs text-gray-400">
                  No semesters
                </span>
              )}
              {semesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    onSemesterSelect(sem);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors
                    ${sem === activeSemester ? "text-gray-900 font-medium" : "text-gray-500"}`}
                >
                  {sem}
                  {sem === activeSemester && (
                    <Check size={12} className="text-[#534AB7]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 min-w-0 overflow-x-auto whitespace-nowrap">
        {loadingShell ? (
          <span className="px-3.5 py-2.5 text-xs text-gray-400">Loading courses...</span>
        ) : visibleCourses.length === 0 ? (
          <span className="px-3.5 py-2.5 text-xs text-gray-400">
            No courses{activeSemester ? ` for ${activeSemester}` : ""}
          </span>
        ) : (
          visibleCourses.map((course) => {
            const pending = (courseFiles?.[course.id] || []).filter(
              (f) => f.status === "queued" || f.status === "failed"
            ).length;
            return (
              <button
                key={course.id}
                onClick={() => onCourseSelect(course.id)}
                className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0
                  ${activeCourseId === course.id
                    ? "text-gray-900 border-[#534AB7]"
                    : "text-gray-400 border-transparent hover:text-gray-500"
                  }`}
              >
                {course.label}
                {pending > 0 && course.id !== activeCourseId && (
                  <span className="ml-1 text-[9px] text-[#534AB7]">•{pending}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}

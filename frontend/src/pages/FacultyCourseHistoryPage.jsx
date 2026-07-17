import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, ChevronDown, Search } from "lucide-react";
import { courseApi } from "@/api/courseApi";
import { userApi } from "@/api/userApi";
import { useAuthContext } from "@/context/AuthContext";

function groupBySemester(courses) {
  const map = new Map();
  for (const c of courses) {
    const key = c.semester || "Unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([semester, courses]) => ({ semester, courses }));
}

export default function FacultyCourseHistoryPage() {
  const { user } = useAuthContext();

  const [facultyList, setFacultyList] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const [groups, setGroups] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    userApi
      .list({ role: ["faculty", "chairperson"] })
      .then((res) => {
        const data = res.data?.data?.users || res.data || [];

        console.log("EXTRACTED DATA:", data);

        setFacultyList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log("FACULTY ERROR:", err);
        setFacultyList([]);
      })
      .finally(() => setFacultyLoading(false));
  }, []);

  const filteredFaculty = useMemo(() => {
    const list = Array.isArray(facultyList) ? facultyList : [];

    // console.log("list faculty:", list)

    if (!query.trim()) return list;

    const q = query.toLowerCase();

    return list.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.shortCode?.toLowerCase().includes(q),
    );
  }, [facultyList, query]);

  // console.log("Filtered faculty: ", filteredFaculty);

  useEffect(() => {
    if (!selectedFaculty?.id) return;
    let active = true;
    setCoursesLoading(true);
    setError(null);
    setGroups([]);
    setActiveSemester(null);
    console.log("selectedFaculty: ", selectedFaculty);
    courseApi
      .list({ facultyId: selectedFaculty.id })
      .then((res) => {
        if (!active) return;
        const data = res.data?.data?.courses || res.data || [];
        const filteredCourses = data.filter(
          (course) => course.facultyCode === selectedFaculty.shortCode,
        );

        console.log("filtered courses:", filteredCourses);
        const grouped = groupBySemester(filteredCourses);
        setGroups(grouped);
        setActiveSemester(grouped[0]?.semester || null);
      })
      .catch(
        (err) =>
          active &&
          setError(
            err?.response?.data?.message ||
              "Couldn't load courses for this faculty.",
          ),
      )
      .finally(() => active && setCoursesLoading(false));

    return () => {
      active = false;
    };
  }, [selectedFaculty?.id]);

  const activeCourses = useMemo(
    () => groups.find((g) => g.semester === activeSemester)?.courses || [],
    [groups, activeSemester],
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={18} className="text-indigo-500" />
        <h1 className="text-lg font-semibold text-gray-900">
          Faculty course history
        </h1>
      </div>

      {/* faculty picker */}
      <div className="relative mb-6">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-colors"
        >
          <span
            className={
              selectedFaculty ? "text-gray-800 font-medium" : "text-gray-400"
            }
          >
            {selectedFaculty ? selectedFaculty.name : "Select a faculty member"}
          </span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute z-10 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search size={14} className="text-gray-300" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or short code..."
                className="w-full text-sm outline-none placeholder:text-gray-300"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              {facultyLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 px-3.5 py-3">
                  <Loader2 size={14} className="animate-spin" /> Loading
                  faculty...
                </div>
              )}

              {!facultyLoading && filteredFaculty.length === 0 && (
                <p className="text-sm text-gray-400 px-3.5 py-3">
                  No faculty found.
                </p>
              )}

              {!facultyLoading &&
                filteredFaculty.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFaculty(f);
                      setDropdownOpen(false);
                      setQuery("");
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm hover:bg-gray-50 text-left"
                  >
                    <span className="text-gray-800">{f.name}</span>
                    {f.shortCode && (
                      <span className="text-xs text-gray-400">
                        {f.shortCode}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* empty state before any faculty picked */}
      {!selectedFaculty && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-600">
            Pick a faculty member
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Their teaching load will show up here, grouped by semester.
          </p>
        </div>
      )}

      {selectedFaculty && coursesLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading courses...
        </div>
      )}

      {selectedFaculty && !coursesLoading && error && (
        <p className="text-sm text-rose-500 py-6">{error}</p>
      )}

      {selectedFaculty && !coursesLoading && !error && groups.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-600">No courses found</p>
          <p className="text-xs text-gray-400 mt-1">
            {selectedFaculty.name} hasn't been assigned any course yet.
          </p>
        </div>
      )}

      {selectedFaculty && !coursesLoading && !error && groups.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
            {groups.map(({ semester, courses }) => (
              <button
                key={semester}
                onClick={() => setActiveSemester(semester)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeSemester === semester
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {semester}
                <span
                  className={`ml-1.5 ${activeSemester === semester ? "text-indigo-200" : "text-gray-300"}`}
                >
                  {courses.length}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {activeCourses.map((c) => {
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">
                        {c.courseCode}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {c.title}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-1 `}
                  >
                    Section - {c.section}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

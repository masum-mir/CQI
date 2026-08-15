import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { courseApi } from "@/api/courseApi";
import { authApi } from "@/api/authApi";
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
    .map(([semester, courses]) => ({
      semester,
      courses,
    }));
}

export default function MyCoursesPage() {
  const { user } = useAuthContext();

  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [error, setError] = useState(null);

    useEffect(() => {
    authApi
      .me()
      .then((res) => {
        console.log("RES DATA:", res);
        const data = res.data?.data?.user || res.data || [];

        // console.log("EXTRACTED DATA:", data);

        setSelectedFaculty(data ? data : []);
      })
      .catch((err) => {
        console.log("FACULTY ERROR:", err); 
      }) 
  }, []);
 
  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    setCoursesLoading(true);
    setError(null);

    courseApi
      .list({ facultyId: user.id })
      .then((res) => {
        if (!active) return;

        const courses = res.data?.data?.courses || [];

        console.log("My courses:", courses);
        const filteredCourses = courses.filter(
          (course) => course.facultyCode === selectedFaculty.shortCode,
        );

        const grouped = groupBySemester(filteredCourses);

        setGroups(grouped);
        setActiveSemester(grouped[0]?.semester || null);
      })
      .catch((err) => {
        console.log(err);

        setError(
          err?.response?.data?.message ||
            "Couldn't load your courses"
        );
      })
      .finally(() => {
        if (active) setCoursesLoading(false);
      });

    return () => {
      active = false;
    };
}, [user?.id, selectedFaculty?.shortCode]);


  const activeCourses = useMemo(
    () =>
      groups.find((g) => g.semester === activeSemester)?.courses || [],
    [groups, activeSemester]
  );


  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      <div className="flex items-center gap-2 mb-6">
        {/* <BookOpen size={18} className="text-indigo-500" /> */}

        <h1 className="text-lg font-semibold text-gray-900">
          My Course History
        </h1>
      </div>


      {coursesLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading courses...
        </div>
      )}


      {!coursesLoading && error && (
        <p className="text-sm text-rose-500 py-6">
          {error}
        </p>
      )}


      {!coursesLoading && !error && groups.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
          <p className="text-sm font-medium text-gray-600">
            No courses assigned
          </p>

          <p className="text-xs text-gray-400 mt-1">
            You don't have any assigned courses yet.
          </p>
        </div>
      )}


      {groups.length > 0 && (
        <>
          {/* Semester tabs */}
          <div className="flex gap-2 overflow-x-auto mb-4">
            {groups.map(({ semester, courses }) => (
              <button
                key={semester}
                onClick={() => setActiveSemester(semester)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  activeSemester === semester
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-500"
                }`}
              >
                {semester} ({courses.length})
              </button>
            ))}
          </div>


          {/* Courses */}
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
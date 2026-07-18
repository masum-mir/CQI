import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Search, Download } from "lucide-react";
import * as XLSX from "xlsx";
import useFacultyCompliance from "@/hooks/useFacultyCompliance";

export default function FacultyCompliancePage() {
  const { rows, loading, error, semesters } = useFacultyCompliance();
  const [semester, setSemester] = useState(null);
  const [nameQuery, setNameQuery] = useState("");

  useEffect(() => {
    if (!semester && semesters.length) setSemester(semesters[0]);
  }, [semesters, semester]);

  // Group by faculty (not per-course): one row per faculty, with their
  // missing items summed across all their courses for the selected semester.
  const displayRows = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();

    const scoped = rows
      .filter((r) => r.hasAccount) // only faculty with a registered account
      .filter((r) => {
        if (semester && r.semester !== semester) return false;
        if (q && !r.facultyName?.toLowerCase().includes(q)) return false;
        return true;
      });

    const byFaculty = new Map();
    scoped.forEach((r) => {
      const key = r.facultyCode;
      if (!byFaculty.has(key)) {
        byFaculty.set(key, {
          facultyCode: key,
          facultyName: r.facultyName,
          facultyEmail: r.facultyEmail,
          missingCount: 0,
          courseCount: 0,
        });
      }
      const entry = byFaculty.get(key);
      entry.missingCount += r.missingCount;
      entry.courseCount += 1;
    });

    return [...byFaculty.values()]
      .filter((f) => f.missingCount > 0) // only faculty with at least 1 missing item
      .sort((a, b) => b.missingCount - a.missingCount);
  }, [rows, semester, nameQuery]);

  const handleDownloadExcel = () => {
    const data = displayRows.map((f) => ({
      Name: f.facultyName,
      Email: f.facultyEmail || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [{ wch: 28 }, { wch: 32 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Missing Faculty");

    const semesterPart = semester ? `_${semester.replace(/\s+/g, "-")}` : "";
    XLSX.writeFile(workbook, `faculty-missing-submissions${semesterPart}.xlsx`);
  };

  return (
    <div className="w-full h-full flex flex-col px-4 py-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              Faculty Submission Compliance
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Registered faculty members who still have missing course-file items.
            </p>
          </div>

          {displayRows.length > 0 && (
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg
                         bg-[#534AB7] text-white hover:bg-[#453d9c] transition-colors flex-shrink-0"
            >
              <Download size={14} />
              Download Excel
            </button>
          )}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            placeholder="Search faculty by name…"
            className="w-full sm:w-72 pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg
                       text-gray-700 placeholder:text-gray-400 focus:outline-none
                       focus:ring-2 focus:ring-[#534AB7]/30 focus:border-[#534AB7]"
          />
        </div>

        {semesters.length > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg flex-wrap w-fit">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => setSemester(sem)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  semester === sem
                    ? "bg-[#534AB7] text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {sem}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading compliance data…
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">
            Could not load compliance data. Please try again.
          </div>
        ) : displayRows.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Every registered faculty member has submitted all required items for this semester.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">Faculty</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Missing</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((f) => (
                  <tr
                    key={f.facultyCode}
                    className="border-t border-gray-100 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {f.facultyName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {f.facultyEmail || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                        <AlertCircle size={12} />
                        {f.missingCount} item{f.missingCount > 1 ? "s" : ""} missing
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
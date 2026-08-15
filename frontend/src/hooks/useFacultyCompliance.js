import { useState, useEffect, useMemo } from "react";
import { courseApi } from "@/api/courseApi";
import { courseFileApi } from "@/api/courseFileApi";
import { userApi } from "@/api/userApi";
import { SLOT_ITEM_NO, ITEM_NO_TO_SLOT, TOTAL_SLOTS, SLOT_META } from "@/utils/uploadConstants";

export default function useFacultyCompliance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [coursesRes, usersRes, cfListRes] = await Promise.all([
          courseApi.list(), 
          userApi.list(),
          courseFileApi.list(),
        ]);

        const courses = coursesRes.data.data?.courses || [];
        const facultyUsers = usersRes.data.data?.users || usersRes.data.data || [];
        const courseFilesList = cfListRes.data.data?.courseFiles || [];

        const facultyByCode = new Map(
          facultyUsers
            .filter((u) => u.shortCode)
            .map((u) => [u.shortCode.trim().toLowerCase(), u])
        );
        const cfByCourse = new Map(courseFilesList.map((cf) => [cf.course, cf]));

        // For every course that already has a course-file record, fetch its
        // uploaded documents. Courses with no record yet are treated as
        // "nothing uploaded" without a network call.
        // NOTE: this is one request per existing course-file (N+1) — fine
        // for a moderate number of courses, but worth caching/batching if
        // the course list grows large.
        const detailEntries = await Promise.all(
          courses.map(async (course) => {
            const cf = cfByCourse.get(course.id);
            if (!cf) return [course.id, []];
            try {
              const detRes = await courseFileApi.get(cf.id);
              return [course.id, detRes.data.data?.documents || []];
            } catch {
              return [course.id, []];
            }
          })
        );
        const docsByCourse = new Map(detailEntries);

        if (cancelled) return;

        const builtRows = courses.map((course) => {
          const docs = docsByCourse.get(course.id) || [];
          const uploadedSlots = new Set(
            docs
              .filter((d) => !d.isAdditional)
              .map((d) => ITEM_NO_TO_SLOT[d.itemNo])
              .filter(Boolean)
          );

          const missingSlots = Object.keys(SLOT_ITEM_NO).filter(
            (slot) => !uploadedSlots.has(slot)
          );

          const facultyUser = facultyByCode.get(
            course.facultyCode?.trim().toLowerCase()
          );

          return {
            courseId: course.id,
            courseLabel: course.label,
            semester: course.semester,
            facultyCode: course.facultyCode || "unassigned",
            facultyName: facultyUser?.name || course.facultyCode || "Unassigned",
            facultyEmail: facultyUser?.email || null,
            // true only if this course's facultyCode matched a real,
            // registered faculty user account (not just an assigned code)
            hasAccount: !!facultyUser,
            uploadedCount: uploadedSlots.size,
            totalCount: TOTAL_SLOTS,
            missingCount: missingSlots.length,
            missingTitles: missingSlots.map((s) => SLOT_META[s]?.title || s),
          };
        });

        setRows(builtRows);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const semesters = useMemo(
    () =>
      [...new Set(rows.map((r) => r.semester).filter(Boolean))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [rows]
  );

  return { rows, loading, error, semesters };
}
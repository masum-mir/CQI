import { CATEGORIES } from "./uploadConstants";

/**
 * Mirrors the itemNo <-> slot mapping actually used at upload/commit time in
 * useCourseUpload.js — that's the mapping the backend agrees with (it has
 * diverged slightly from the older SLOT_MAP in uploadConstants.js, e.g.
 * cqi_summary vs cqi_grade_summary). Keep this the single source of truth
 * for "what's required and what number does the backend expect".
 */
export const SLOT_ITEM_NO = {
  final_grades: 1,
  obe_excel: 2,
  co_attainment: 3,
  po_attainment: 4,
  cqi_grade_summary: 5,
  instructor_feedback: 6,
  course_outline: 7,
  class_test_question: 8,
  class_test_sample: 9,
  midterm_question: 10,
  midterm_sample: 11,
  final_question: 12,
  final_sample: 13,
  project_list: 14,
  project_sample: 15,
  lab_experiments: 16,
  class_attendance: 17,
  lab_attendance: 18,
  midterm_attendance: 19,
  final_attendance: 20,
  // capstone_report: 21,
};

export const ITEM_NO_TO_SLOT = Object.entries(SLOT_ITEM_NO).reduce(
  (acc, [slot, itemNo]) => {
    acc[itemNo] = slot;
    return acc;
  },
  {}
);

export const TOTAL_SLOTS = Object.keys(SLOT_ITEM_NO).length;

// slot id -> { title, category } for display, sourced from CATEGORIES
export const SLOT_META = CATEGORIES.flatMap((cat) =>
  cat.items.map((item) => ({ ...item, category: cat.label }))
).reduce((acc, item) => {
  acc[item.id] = { title: item.title, category: item.category };
  return acc;
}, {});

/**
 * Given the raw `documents` array from courseFileApi.get(cfId).data.data.documents,
 * returns the full required checklist for a course, grouped by category, each
 * item flagged uploaded/missing.
 */
export function buildCourseChecklist(documents = []) {
  const uploadedSlots = new Set(
    documents
      .filter((d) => !d.isAdditional)
      .map((d) => ITEM_NO_TO_SLOT[d.itemNo])
      .filter(Boolean)
  );

  return CATEGORIES.map((cat) => ({
    label: cat.label,
    items: cat.items.map((item) => ({
      id: item.id,
      title: item.title,
      uploaded: uploadedSlots.has(item.id),
    })),
  }));
}

/** Convenience: just the missing item titles (flat), for compact summaries. */
export function getMissingTitles(documents = []) {
  const uploadedSlots = new Set(
    documents
      .filter((d) => !d.isAdditional)
      .map((d) => ITEM_NO_TO_SLOT[d.itemNo])
      .filter(Boolean)
  );
  return Object.keys(SLOT_ITEM_NO)
    .filter((slot) => !uploadedSlots.has(slot))
    .map((slot) => SLOT_META[slot]?.title || slot);
}

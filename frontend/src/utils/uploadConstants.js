export const CATEGORIES = [
  {
    label: "Academic Results",
    items: [
      { id: "final_grades", title: "Final grades (Tabulation Sheet)" },
      { id: "obe_excel", title: "OBE Excel Sheet" },
    ],
  },
  {
    label: "Attainment Reports",
    items: [
      { id: "co_attainment", title: "CO Attainment Report" },
      { id: "po_attainment", title: "PO Attainment Report" },
    ],
  },
  {
    label: "CQI Reports",
    items: [
      { id: "cqi_grade_summary", title: "Grade Summary with CQI Improvement Plan" },
      { id: "instructor_feedback", title: "Instructor Feedback" },
    ],
  },
  {
    label: "Course Documents",
    items: [{ id: "course_outline", title: "Course Outline" }],
  },
  {
    label: "Class Test",
    items: [
      { id: "class_test_question", title: "Assessment Question" },
      { id: "class_test_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Midterm Exam",
    items: [
      { id: "midterm_question", title: "Assessment Question" },
      { id: "midterm_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Final Exam",
    items: [
      { id: "final_question", title: "Assessment Question" },
      { id: "final_sample", title: "Representative Sample Answer Scripts" },
    ],
  },
  {
    label: "Projects & Assignments",
    items: [
      { id: "project_list", title: "Project/Assignment List" },
      { id: "project_sample", title: "Representative Sample Project Reports" },
    ],
  },
  {
    label: "Laboratory",
    items: [{ id: "lab_experiments", title: "List of Lab Experiments" }],
  },
  {
    label: "Attendance Records",
    items: [
      { id: "class_attendance", title: "Class Attendance" },
      { id: "lab_attendance", title: "Lab Attendance" },
      { id: "midterm_attendance", title: "Midterm Exam Attendance" },
      { id: "final_attendance", title: "Final Exam Attendance" },
    ],
  },
  // {
  //   label: "Capstone",
  //   items: [{ id: "capstone_report", title: "Capstone Project Report" }],
  // },
];

export const SLOT_MAP = {
  final_grades: { itemNo: 1 },
  obe_excel: { itemNo: 2 },
  co_attainment: { itemNo: 3 },
  po_attainment: { itemNo: 4 },
  cqi_grade_summary: { itemNo: 5 },
  instructor_feedback: { itemNo: 6 },
  course_outline: { itemNo: 7 },

  class_test_question: { itemNo: 8 },
  class_test_sample: { itemNo: 9 },

  midterm_question: { itemNo: 10 },
  midterm_sample: { itemNo: 11 },

  final_question: { itemNo: 12 },
  final_sample: { itemNo: 13 },

  project_list: { itemNo: 14 },
  project_sample: { itemNo: 15 },

  lab_experiments: { itemNo: 16 },
  class_attendance: { itemNo: 17 },
  lab_attendance: { itemNo: 18 },
  midterm_attendance: { itemNo: 19 },
  final_attendance: { itemNo: 20 },
  // capstone_report: { itemNo: 21 },
};

export const MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
 
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

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
  class_test_question: { itemNo: 8, subItem: "question" },
  class_test_sample: { itemNo: 8, subItem: "samples" },
  midterm_question: { itemNo: 9, subItem: "question" },
  midterm_sample: { itemNo: 9, subItem: "samples" },
  final_question: { itemNo: 10, subItem: "question" },
  final_sample: { itemNo: 10, subItem: "samples" },
  project_list: { itemNo: 11, subItem: "list" },
  project_sample: { itemNo: 11, subItem: "samples" },
  lab_experiments: { itemNo: 12 },
  class_attendance: { itemNo: 13 },
  lab_attendance: { itemNo: 14 },
  midterm_attendance: { itemNo: 15 },
  final_attendance: { itemNo: 16 },
  // capstone_report: { itemNo: 17 },
};

export const MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

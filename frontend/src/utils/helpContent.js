export const HELP_BY_PATH = {
  "/": {
    title: "Home",
    helpItems: [
      "Overview of the CQI system with quick access to key tasks.",
      "Tip: Use the sidebar to navigate between modules.",
      "Note: Your role determines which pages you can access.",
    ],
  },
  "/upload/file": {
    title: "Course Materials",
    helpItems: [
      "Upload and manage CQI documents for each course slot item by item.",
      "Tip: Select a course and semester from the top bar first.",
      "Tip: Click any empty slot to pick a file (PDF, image, Word, Excel; max 10MB).",
      "Tip: Files stay amber (queued) until you click 'Upload' to commit them.",
      "Note: Each slot holds one file — uploading a new file replaces the old one.",
    ],
  },
  "/upload/file/list": {
    title: "Uploaded Files",
    helpItems: [
      "Browse every uploaded document across all your courses in one place.",
      "Tip: Use the search bar and filters to narrow by course, semester, or type.",
      "Tip: Click a file row to preview or download it.",
      "Note: Chairpersons can approve or reject documents inline from this page.",
    ],
  },
  "/my-courses-list": {
    title: "My Course",
    helpItems: [
      "View the courses assigned to you for the current semester.",
      "Tip: Switch semesters to browse offerings from previous terms.",
      "Note: Only courses where you are listed as faculty appear here.",
    ],
  },
  "/faculty-courses-list": {
    title: "Faculty Course History",
    helpItems: [
      "Browse the full teaching history of faculty members across semesters.",
      "Tip: Use filters to narrow by faculty, semester, or course.",
      "Note: Chairpersons and admins can view any faculty member's history.",
    ],
  },
  "/courses": {
    title: "Course List",
    helpItems: [
      "View and manage all course offerings across semesters.",
      "Tip: Search by course code, title, or faculty name.",
      "Tip: Use the semester filter to focus on a specific term.",
      "Note: Only admins and chairpersons can create, edit, or delete courses.",
    ],
  },
  "/course/import": {
    title: "Import Courses",
    helpItems: [
      "Bulk-import course offerings from the EWU offered-courses Excel export.",
      "Tip: Upload the .xls/.xlsx file, then review the parsed preview first.",
      "Tip: Optionally enter a comma-separated department filter (e.g. CSE, ICE).",
      "Note: Faculty short codes in the file must match existing system users.",
      "Note: Nothing is saved to browser demo data until you click 'Commit import'.",
    ],
  },
  "/admin/users": {
    title: "Users",
    helpItems: [
      "Manage user accounts, roles, and access permissions.",
      "Tip: Filter by role (admin, chairperson, faculty) or status.",
      "Tip: Use the search bar to find users by name or email quickly.",
      "Note: You cannot delete your own account. Roles control sidebar visibility.",
    ],
  },
};

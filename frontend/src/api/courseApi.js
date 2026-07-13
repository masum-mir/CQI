const MOCK_COURSES = [
  { id: 'course-1', courseCode: 'CSE101', section: 'A', title: 'Introduction to Programming', semester: 'Spring 2025', type: 'theory', department: 'CSE', facultyCode: 'MAR', facultyInfo: { name: 'Dr. Mock User', shortCode: 'MAR' }, label: 'CSE101-A', capacity: { enrolled: 45, total: 50 } },
  { id: 'course-2', courseCode: 'CSE201', section: 'B', title: 'Data Structures', semester: 'Spring 2025', type: 'theory', department: 'CSE', facultyCode: 'MAR', facultyInfo: { name: 'Dr. Mock User', shortCode: 'MAR' }, label: 'CSE201-B', capacity: { enrolled: 40, total: 45 } },
  { id: 'course-3', courseCode: 'CSE301', section: 'A', title: 'Algorithms Lab', semester: 'Fall 2024', type: 'lab', department: 'CSE', facultyCode: 'MAR', facultyInfo: { name: 'Dr. Mock User', shortCode: 'MAR' }, label: 'CSE301-A', capacity: { enrolled: 30, total: 30 } },
  { id: 'course-4', courseCode: 'EEE101', section: 'A', title: 'Basic Electrical Engineering', semester: 'Fall 2024', type: 'theory', department: 'EEE', facultyCode: 'MAR', facultyInfo: { name: 'Dr. Mock User', shortCode: 'MAR' }, label: 'EEE101-A', capacity: { enrolled: 50, total: 60 } },
]

export const courseApi = {
  list: () => Promise.resolve({ data: { data: { courses: MOCK_COURSES } } }),

  get: (id) => {
    const course = MOCK_COURSES.find(c => c.id === id)
    return Promise.resolve({ data: { data: { course } } })
  },

  create: (data) => Promise.resolve({ data: { data: { course: { id: 'course-new', ...data } } } }),

  update: (id, data) => Promise.resolve({ data: { data: { course: { id, ...data } } } }),

  remove: () => Promise.resolve({ data: { message: 'Deleted' } }),
}

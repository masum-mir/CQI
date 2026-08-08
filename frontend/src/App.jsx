import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout"; 
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import UploadPage from "@/pages/UploadPage";
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import UsersPage from '@/pages/UsersPage' 
import ImportCoursesPage from '@/pages/ImportCoursesPage'
import CoursesPage from '@/pages/CoursesPage' 
import CourseFilesPage from '@/pages/CourseFilesPage' 
import MyCourseList from '@/pages/MyCourseList'
import FacultyCourseHistoryPage from '@/pages/FacultyCourseHistoryPage'
import FacultyCompliancePage from '@/pages/FacultyCompliancePage'

 
export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "13px" } }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={ <AppLayout> <HomePage /> </AppLayout>} />
          </Route>
 
          <Route element={<ProtectedRoute roles={['faculty', 'chairperson', 'admin']} />}>
            <Route path="/upload/file" element={<AppLayout> <UploadPage /> </AppLayout>} />
            <Route path="/upload/file/list" element={<AppLayout> <CourseFilesPage /> </AppLayout>} /> 
            <Route path="/my-courses-list" element={<AppLayout> <MyCourseList /> </AppLayout>} /> 
          </Route>
 
          <Route element={<ProtectedRoute roles={['chairperson','admin']} />}> 
            <Route path="/courses" element={ <AppLayout> <CoursesPage /> </AppLayout>} />
            <Route path="/course/import" element={<AppLayout> <ImportCoursesPage /> </AppLayout>} /> 
            <Route path="/faculty-courses-list" element={<AppLayout> <FacultyCourseHistoryPage /> </AppLayout>} />
            <Route path="/faculty-compliance" element={<AppLayout> <FacultyCompliancePage /> </AppLayout>} />
          </Route>
 
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/users" element={<AppLayout> <UsersPage /> </AppLayout>} /> 
          </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

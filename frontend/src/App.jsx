import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout"; 
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import CourseUploadPage from "@/pages/CourseUploadPage";
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import UserManagementPage from '@/pages/UserManagementPage' 
import CourseImportPage from '@/pages/CourseImportPage'
import CourseManagementPage from '@/pages/CourseManagementPage' 
import UploadedFilesPage from '@/pages/UploadedFilesPage' 
import MyCoursesPage from '@/pages/MyCoursesPage'
import FacultyCourseHistoryPage from '@/pages/FacultyCourseHistoryPage'
import FacultyCompliancePage from '@/pages/FacultyCompliancePage'
import ProfilePage from "@/pages/ProfilePage"; 

 
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
            <Route path="/profile" element={<AppLayout> <ProfilePage /> </AppLayout>} /> 
          </Route>
 
          <Route element={<ProtectedRoute roles={['faculty', 'chairperson', 'admin']} />}>
            <Route path="/upload/file" element={<AppLayout> <CourseUploadPage /> </AppLayout>} />
            <Route path="/upload/file/list" element={<AppLayout> <UploadedFilesPage /> </AppLayout>} /> 
            <Route path="/my-courses-list" element={<AppLayout> <MyCoursesPage /> </AppLayout>} /> 
          </Route>
 
          <Route element={<ProtectedRoute roles={['chairperson','admin']} />}> 
            <Route path="/courses" element={ <AppLayout> <CourseManagementPage /> </AppLayout>} />
            <Route path="/course/import" element={<AppLayout> <CourseImportPage /> </AppLayout>} /> 
            <Route path="/faculty-courses-list" element={<AppLayout> <FacultyCourseHistoryPage /> </AppLayout>} />
            <Route path="/faculty-compliance" element={<AppLayout> <FacultyCompliancePage /> </AppLayout>} />
          </Route>
 
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/users" element={<AppLayout> <UserManagementPage /> </AppLayout>} /> 
          </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout"; 
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import UploadPage from "@/pages/UploadPage";
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import AdminUsersPage from '@/pages/AdminUsersPage'
import CatalogPage from '@/pages/CatalogPage'
import ImportCoursesPage from '@/pages/ImportCoursesPage'
import CoursesPage from '@/pages/CoursesPage'
 
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
            <Route path="/courses" element={ <AppLayout> <CoursesPage /> </AppLayout>} />
            {/* <Route path="/cqi-plans" element={<CqiPlansPage />} /> */}
          </Route>
 
          <Route element={<ProtectedRoute roles={['faculty', 'admin', 'chairperson']} />}>
            <Route path="/upload" element={<AppLayout> <UploadPage /> </AppLayout>} />
          </Route>
 
          <Route element={<ProtectedRoute roles={['chairperson', 'admin', 'faculty']} />}>
            {/* <Route path="/review" element={<ReviewPage />} /> */}
          </Route>
 
          <Route element={<ProtectedRoute roles={['chairperson', 'admin', 'faculty']} />}>
            <Route path="/admin/users" element={<AppLayout> <AdminUsersPage /> </AppLayout>} />
            <Route path="/catalog" element={<AppLayout> <CatalogPage /> </AppLayout>} />
            <Route path="/courses/import" element={<AppLayout> <ImportCoursesPage /> </AppLayout>} />
          </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

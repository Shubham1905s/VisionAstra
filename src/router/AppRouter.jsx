import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../layouts/AuthLayout";
import StudentRegisterPage from "../pages/auth/StudentRegister";
import StudentLoginPage from "../pages/auth/StudentLogin";
import AdminLoginPage from "../pages/auth/AdminLogin";
import StudentDashboardPage from "../pages/student/Dashboard";
import AdminDashboardPage from "../pages/admin/Dashboard";
import NotFoundPage from "../pages/shared/NotFound";

function ProtectedRoute({ children, role }) {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady) return null;
  if (!user) return <Navigate to={role === "admin" ? "/admin/login" : "/student/login"} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student/login" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/student/register" element={<StudentRegisterPage />} />
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


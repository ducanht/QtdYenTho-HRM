import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrustEvaluation from './pages/TrustEvaluation';
import KpiEvaluation from './pages/KpiEvaluation';
import PlanningVote from './pages/PlanningVote';
import Employees from './pages/Employees';
import NotFound from './pages/NotFound';

// Component điều hướng thông minh tại trang chủ "/"
const RootRedirect = () => {
  const { currentUser, role, canAccessDashboard, loading } = useAuth();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;

  if (canAccessDashboard) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/trust-evaluation" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Route công khai: Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* Routes được bảo vệ bên trong MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />

        {/* Dashboard: Chỉ cho phép manager và chairman */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager', 'chairman']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Module A: Đánh giá tín nhiệm */}
        <Route path="trust-evaluation" element={<TrustEvaluation />} />

        {/* Module B: Chấm điểm KPI */}
        <Route path="kpi-evaluation" element={<KpiEvaluation />} />

        {/* Module C: Bỏ phiếu quy hoạch */}
        <Route path="planning-vote" element={<PlanningVote />} />

        {/* Danh bạ nhân sự */}
        <Route path="employees" element={<Employees />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

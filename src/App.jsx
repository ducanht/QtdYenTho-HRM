import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Spinner from './components/common/Spinner';

// Pages - Code Splitting (Lazy Loading) để tối ưu dung lượng Bundle & Tốc độ tải
const Login = lazy(() => import('./pages/Login'));
const PortalLauncher = lazy(() => import('./pages/PortalLauncher'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TrustEvaluation = lazy(() => import('./pages/TrustEvaluation'));
const KpiEvaluation = lazy(() => import('./pages/KpiEvaluation'));
const PlanningVote = lazy(() => import('./pages/PlanningVote'));
const Employees = lazy(() => import('./pages/Employees'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading Fallback Component
const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <Spinner size="lg" />
    <span className="text-xs text-slate-500 font-medium">Đang tải phân hệ...</span>
  </div>
);

// Component điều hướng thông minh tại trang chủ "/"
// Sau khi đăng nhập luôn đưa người dùng về Cổng Phân Hệ Ô Lưới (/portal)
const RootRedirect = () => {
  const { currentUser, loading } = useAuth();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;

  return <Navigate to="/portal" replace />;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
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

          {/* Cổng Phân Hệ Ô Lưới (Application Grid Hub) - Màn hình chính sau đăng nhập */}
          <Route path="portal" element={<PortalLauncher />} />

          {/* Module A: Đánh giá tín nhiệm 10 tiêu chí (Trọng tâm) */}
          <Route path="trust-evaluation" element={<TrustEvaluation />} />

          {/* Module B: Chấm điểm KPI 3 cấp */}
          <Route path="kpi-evaluation" element={<KpiEvaluation />} />

          {/* Module C: Bỏ phiếu quy hoạch cán bộ */}
          <Route path="planning-vote" element={<PlanningVote />} />

          {/* Module D: Danh bạ & Quá trình luân chuyển cán bộ */}
          <Route path="employees" element={<Employees />} />

          {/* Module E: Dashboard & Giám sát (Chỉ cho phép manager và chairman) */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager', 'chairman']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
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

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Cơ chế Phục hồi Tự động Chunk Loading SPA khi deploy phiên bản mới (Zero Stale Chunk Crash)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return;
      }
      throw error;
    }
  });

// Pages - Code Splitting (Lazy Loading) kèm cơ chế tự phục hồi Chunk
const Login = lazyWithRetry(() => import('./pages/Login'));
const PortalLauncher = lazyWithRetry(() => import('./pages/PortalLauncher'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const TrustEvaluation = lazyWithRetry(() => import('./pages/TrustEvaluation'));
const KpiEvaluation = lazyWithRetry(() => import('./pages/KpiEvaluation'));
const PlanningVote = lazyWithRetry(() => import('./pages/PlanningVote'));
const Employees = lazyWithRetry(() => import('./pages/Employees'));
const AdminSettings = lazyWithRetry(() => import('./pages/AdminSettings'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

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

          {/* Module A: Đánh giá tín nhiệm 10 tiêu chí (Trọng tâm) - Hỗ trợ cả /trust và /trust-evaluation */}
          <Route
            path="trust"
            element={
              <ProtectedRoute moduleCode="MODULE_TRUST">
                <TrustEvaluation />
              </ProtectedRoute>
            }
          />
          <Route
            path="trust-evaluation"
            element={
              <ProtectedRoute moduleCode="MODULE_TRUST">
                <TrustEvaluation />
              </ProtectedRoute>
            }
          />

          {/* Module B: Chấm điểm KPI 3 cấp - Hỗ trợ cả /kpi và /kpi-evaluation */}
          <Route
            path="kpi"
            element={
              <ProtectedRoute moduleCode="MODULE_KPI">
                <KpiEvaluation />
              </ProtectedRoute>
            }
          />
          <Route
            path="kpi-evaluation"
            element={
              <ProtectedRoute moduleCode="MODULE_KPI">
                <KpiEvaluation />
              </ProtectedRoute>
            }
          />

          {/* Module C: Bỏ phiếu quy hoạch cán bộ - Hỗ trợ cả /planning và /planning-vote */}
          <Route
            path="planning"
            element={
              <ProtectedRoute moduleCode="MODULE_PLANNING">
                <PlanningVote />
              </ProtectedRoute>
            }
          />
          <Route
            path="planning-vote"
            element={
              <ProtectedRoute moduleCode="MODULE_PLANNING">
                <PlanningVote />
              </ProtectedRoute>
            }
          />

          {/* Module D: Danh bạ & Quá trình luân chuyển cán bộ - Hỗ trợ cả /employees và /hr */}
          <Route
            path="employees"
            element={
              <ProtectedRoute moduleCode="MODULE_HR">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr"
            element={
              <ProtectedRoute moduleCode="MODULE_HR">
                <Employees />
              </ProtectedRoute>
            }
          />

          {/* Module E: Dashboard & Giám sát */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute 
                allowedRoles={['superadmin', 'admin', 'chairman', 'manager', 'supervisor', 'board_member']} 
                moduleCode="MODULE_DASHBOARD"
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Module F: Cấu hình & Quản trị Hệ thống - Hỗ trợ cả /admin-settings và /settings */}
          <Route
            path="admin-settings"
            element={
              <ProtectedRoute 
                allowedRoles={['superadmin', 'admin', 'chairman', 'manager']} 
                moduleCode="MODULE_SETTINGS"
              >
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute 
                allowedRoles={['superadmin', 'admin', 'chairman', 'manager']} 
                moduleCode="MODULE_SETTINGS"
              >
                <AdminSettings />
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
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

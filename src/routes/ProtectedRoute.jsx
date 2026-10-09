import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeUserRole, canAccessModule } from '../lib/permissions';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const ProtectedRoute = ({ children, allowedRoles = null, moduleCode = null }) => {
  const { currentUser, role, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" text="Đang xác thực thông tin tài khoản..." />
      </div>
    );
  }

  // Chưa đăng nhập -> chuyển hướng về trang Login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. SuperAdmin luôn có quyền truy cập toàn diện hệ thống
  if (isSuperAdmin) {
    return children;
  }

  // 2. Kiểm tra quyền truy cập theo Phân hệ nghiệp vụ (moduleCode)
  if (moduleCode) {
    const hasModuleAccess = canAccessModule(currentUser, moduleCode);
    if (!hasModuleAccess) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 border-rose-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Phân Hệ Chưa Được Cấp Quyền
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Tài khoản của đồng chí chưa được phân quyền truy cập vào phân hệ này. Vui lòng liên hệ Ban Lãnh đạo Quỹ để được cấp phép!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/portal">
                <Button variant="primary" icon={ArrowLeft}>
                  Về Cổng Phân Hệ
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }
  }

  // 3. Kiểm tra theo Danh sách Vai trò được phép (allowedRoles)
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedRole = normalizeUserRole(currentUser, role);
    const isAllowed = allowedRoles.some((r) => {
      const rLower = (r || '').toLowerCase();
      return rLower === normalizedRole.toLowerCase() || rLower === (role || '').toLowerCase();
    });

    if (!isAllowed) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 border-rose-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Không Có Quyền Truy Cập
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Trang này chỉ dành cho vai trò{' '}
              <span className="font-semibold text-rose-700">
                {allowedRoles.join(' hoặc ')}
              </span>
              . Vai trò hiện tại của bạn là{' '}
              <span className="font-semibold text-slate-800">
                {role || 'Chưa xác định'}
              </span>
              .
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/portal">
                <Button variant="primary" icon={ArrowLeft}>
                  Về Cổng Phân Hệ
                </Button>
              </Link>
              <Link to="/trust">
                <Button variant="outline">
                  Phân Hệ Đánh Giá
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

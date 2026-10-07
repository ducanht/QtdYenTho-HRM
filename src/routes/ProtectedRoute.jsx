import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { currentUser, role, loading } = useAuth();
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

  // Đã đăng nhập nhưng không đủ quyền truy cập (RBAC)
  if (allowedRoles && !allowedRoles.includes(role)) {
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
          <div className="flex justify-center gap-3">
            <Link to="/trust-evaluation">
              <Button variant="primary" icon={ArrowLeft}>
                Về trang Đánh giá
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

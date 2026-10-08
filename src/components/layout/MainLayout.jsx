import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ForceChangePasswordModal from '../auth/ForceChangePasswordModal';
import FloatingTrustEvaluationReminder from '../common/FloatingTrustEvaluationReminder';
import { autoSyncDatabaseSchema } from '../../lib/autoInitDb';

/**
 * MainLayout - Kiến trúc Cổng Phân Hệ Cô Lập (Modular Isolated Portal)
 * Đã loại bỏ hoàn toàn Menu Sidebar để mở rộng tối đa không gian làm việc.
 * Mỗi phân hệ hiển thị độc lập, có nút "Về Cổng Phân Hệ" tại Header để chuyển đổi.
 */
const MainLayout = () => {
  // Tự động kiểm tra & đồng bộ CSDL Firebase ngầm (Self-healing & Auto-provisioning)
  useEffect(() => {
    autoSyncDatabaseSchema().catch((err) => {
      console.warn('Lỗi kiểm tra đồng bộ CSDL tự động:', err);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Module-Aware trên cùng */}
      <Navbar />

      {/* Vùng nội dung nghiệp vụ mở rộng tối đa (Full width workspace) */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Modal Bắt buộc thay đổi mật khẩu lần đầu (nếu tài khoản mới) */}
      <ForceChangePasswordModal />

      {/* Thông báo nổi nhắc nhở hoàn thành đánh giá tín nhiệm (nếu chưa nộp) */}
      <FloatingTrustEvaluationReminder />
    </div>
  );
};

export default MainLayout;

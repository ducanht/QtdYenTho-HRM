import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Vote, 
  LayoutDashboard, 
  Settings,
  ArrowLeft,
  LayoutGrid,
  Database,
  UserCheck,
  LogOut,
  Building2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE_LABELS } from '../../lib/constants';
import AutoInitDbModal from '../common/AutoInitDbModal';

// Cấu hình thông tin Header từng phân hệ
const TRUST_HEADER_CONFIG = {
  code: 'MODULE_TRUST',
  title: 'Phân hệ Đánh giá Tín nhiệm Cán bộ',
  short: 'Tín nhiệm Cán bộ',
  badge: '10 Tiêu chí chuẩn NHNN',
  icon: ShieldCheck,
  iconColor: 'text-[#047857]',
  badgeBg: 'bg-emerald-50 text-[#047857] border-emerald-200',
};

const HR_HEADER_CONFIG = {
  code: 'MODULE_HR',
  title: 'Phân hệ Hồ sơ Cán bộ & Luân chuyển Công tác',
  short: 'Hồ sơ & Luân chuyển',
  badge: 'Quy định Luân chuyển 3 năm',
  icon: Users,
  iconColor: 'text-[#0f766e]',
  badgeBg: 'bg-teal-50 text-[#0f766e] border-teal-200',
};

const KPI_HEADER_CONFIG = {
  code: 'MODULE_KPI',
  title: 'Phân hệ Chấm điểm KPI 3 Cấp (40-30-30)',
  short: 'Chấm điểm KPI',
  badge: 'Quy trình 3 Cấp Phê duyệt',
  icon: TrendingUp,
  iconColor: 'text-blue-700',
  badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
};

const PLANNING_HEADER_CONFIG = {
  code: 'MODULE_PLANNING',
  title: 'Phân hệ Bỏ phiếu Quy hoạch Cán bộ Nguồn',
  short: 'Quy hoạch Cán bộ',
  badge: 'Lấy phiếu Tín nhiệm Lãnh đạo',
  icon: Vote,
  iconColor: 'text-purple-700',
  badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
};

const DASHBOARD_HEADER_CONFIG = {
  code: 'MODULE_DASHBOARD',
  title: 'Phân hệ Báo cáo & Điều hành Giám sát',
  short: 'Báo cáo Điều hành',
  badge: 'Giám sát Lãnh đạo',
  icon: LayoutDashboard,
  iconColor: 'text-amber-700',
  badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
};

const SETTINGS_HEADER_CONFIG = {
  code: 'MODULE_SETTINGS',
  title: 'Phân hệ Cấu hình & Quản trị Hệ thống',
  short: 'Cấu hình Quản trị',
  badge: 'Ban Quản trị Quỹ',
  icon: Settings,
  iconColor: 'text-slate-800',
  badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
};

// Danh mục thông tin hiển thị Header cho từng phân hệ cụ thể (hỗ trợ cả route ngắn và route dài)
const MODULE_HEADER_MAP = {
  '/trust': TRUST_HEADER_CONFIG,
  '/trust-evaluation': TRUST_HEADER_CONFIG,
  '/employees': HR_HEADER_CONFIG,
  '/hr': HR_HEADER_CONFIG,
  '/kpi': KPI_HEADER_CONFIG,
  '/kpi-evaluation': KPI_HEADER_CONFIG,
  '/planning': PLANNING_HEADER_CONFIG,
  '/planning-vote': PLANNING_HEADER_CONFIG,
  '/dashboard': DASHBOARD_HEADER_CONFIG,
  '/admin-settings': SETTINGS_HEADER_CONFIG,
  '/settings': SETTINGS_HEADER_CONFIG,
};

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const toast = useToast();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const pathname = location.pathname;
  const isPortal = pathname === '/portal' || pathname === '/';

  // Tìm phân hệ hiện tại tương ứng
  const currentModule = Object.entries(MODULE_HEADER_MAP).find(([route]) => 
    pathname === route || pathname.startsWith(`${route}/`)
  )?.[1] || null;

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Đã đăng xuất an toàn khỏi hệ thống!');
      navigate('/login');
    } catch {
      toast.error('Lỗi khi đăng xuất.');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* ============================================================ */}
        {/* PHẦN TRÁI: ĐIỀU HƯỚNG CÔ LẬP PHÂN HỆ HOẶC LOGO CỔNG PHÂN HỆ */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isPortal && currentModule ? (
            /* Khi đang ở trong phân hệ cụ thể: CHỈ HIỂN THỊ NÚT VỀ CỔNG & TÊN PHÂN HỆ HIỆN TẠI */
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Nút Về Cổng Phân Hệ - Trọng tâm thiết kế */}
              <button
                type="button"
                onClick={() => navigate('/portal')}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 text-[#064e3b] font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0"
                title="Quay lại Cổng Phân Hệ để lựa chọn phân hệ nghiệp vụ khác"
              >
                <ArrowLeft className="w-4 h-4 text-[#047857] group-hover:-translate-x-0.5 transition-transform" />
                <LayoutGrid className="w-3.5 h-3.5 text-[#047857]" />
                <span className="hidden xs:inline font-bold">Về Cổng Phân Hệ</span>
              </button>

              {/* Ngăn cách dọc */}
              <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

              {/* Tên & Huy hiệu của Phân hệ đang mở (Cô lập hoàn toàn) */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${currentModule.badgeBg}`}>
                  <currentModule.icon className={`w-4 h-4 ${currentModule.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden md:inline">
                      {currentModule.badge}
                    </span>
                    <span className="text-slate-300 hidden md:inline">•</span>
                    <span className="text-[10px] font-semibold text-[#047857] truncate hidden sm:inline">
                      QTDND Yên Thọ
                    </span>
                  </div>
                  <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 leading-tight truncate">
                    {currentModule.title}
                  </h1>
                </div>
              </div>
            </div>
          ) : (
            /* Khi đang ở Cổng phân hệ (/portal): Hiển thị Logo Quỹ & Tiêu đề Cổng */
            <Link to="/portal" className="group flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white p-0.5 shadow-xs border border-amber-300/80 overflow-hidden shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="Logo Quỹ TDND Yên Thọ" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#047857] uppercase tracking-wider group-hover:underline">
                    Quỹ Tín Dụng Nhân Dân Yên Thọ
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">HRM Portal 2026</span>
                </div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight group-hover:text-[#047857] transition-colors truncate">
                  Cổng Nghiệp Vụ & Quản Trị Nhân Sự
                </h1>
              </div>
            </Link>
          )}
        </div>

        {/* ============================================================ */}
        {/* PHẦN PHẢI: USER PROFILE, VAI TRÒ & THAO TÁC HỆ THỐNG        */}
        {/* ============================================================ */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Nút Tự động CSDL (chỉ hiện khi ở portal hoặc admin) */}
          {isPortal && (
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-[#0f766e] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Khởi tạo & Đồng bộ CSDL tự động 100% Firestore"
            >
              <Database className="w-3.5 h-3.5 text-[#0f766e]" />
              <span>Tự động CSDL</span>
            </button>
          )}

          {/* Vai trò cán bộ hiện tại */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5 text-[#047857]" />
            <span className="font-bold">{ROLE_LABELS[role] || 'Cán bộ'}</span>
          </div>

          {/* User Avatar & Name */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
              <div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#064e3b] to-[#047857] text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0"
                title={`${currentUser.name} - ${currentUser.position} (${currentUser.department})`}
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.name?.charAt(0) || 'C'
                )}
              </div>
              <div className="hidden sm:block text-left max-w-[140px] truncate">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser.position || currentUser.department}
                </div>
              </div>
            </div>
          )}

          {/* Nút Đăng Xuất An Toàn */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Tự động Khởi tạo & Cập nhật CSDL */}
      <AutoInitDbModal 
        isOpen={isDbModalOpen} 
        onClose={() => setIsDbModalOpen(false)} 
      />
    </header>
  );
};

export default Navbar;

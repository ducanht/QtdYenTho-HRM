import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  UserCheck, 
  ChevronDown, 
  Shield, 
  Building, 
  Award,
  RefreshCw,
  Database,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import Badge from '../common/Badge';
import AutoInitDbModal from '../common/AutoInitDbModal';

const Navbar = ({ onToggleSidebar }) => {
  const { currentUser, role } = useAuth();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger & Header Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/portal" className="group text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#047857] uppercase tracking-wider hidden sm:inline group-hover:underline">
                Quỹ Tín Dụng Nhân Dân Yên Thọ
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs text-slate-500 font-medium">HRM Portal 2026</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight group-hover:text-[#047857] transition-colors">
              Cổng Đánh Giá Tín Nhiệm & Quản Trị Nhân Sự
            </h1>
          </Link>
        </div>

        {/* Right: Cổng Phân Hệ + Tự động CSDL + Quick Switch Role + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Cổng Phân Hệ Ô Lưới */}
          <Link
            to="/portal"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-[#047857] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Về Trang Cổng Phân Hệ Ô Lưới"
          >
            <Layers className="w-3.5 h-3.5 text-[#047857]" />
            <span className="hidden md:inline">Cổng Phân Hệ</span>
          </Link>

          {/* Nút Khởi tạo & Cập nhật CSDL Tự Động */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/60 text-slate-700 hover:text-[#0f766e] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Khởi tạo & Cập nhật toàn bộ 9 bảng CSDL tự động"
          >
            <Database className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="hidden sm:inline">Tự động CSDL</span>
          </button>

          {/* Vai trò cán bộ hiện tại */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 text-[#0f766e] text-xs font-semibold shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="font-bold">{ROLE_LABELS[role] || 'Cán bộ Quỹ'}</span>
          </div>

          {/* User Avatar Circle */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.department}
                </div>
              </div>
            </div>
          )}
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

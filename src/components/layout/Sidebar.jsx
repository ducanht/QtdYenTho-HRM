import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  TrendingUp, 
  Vote, 
  Users, 
  Building2, 
  LogOut, 
  ChevronRight,
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/constants';
import Badge from '../common/Badge';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, role, isStaff, isManager, isChairman, canAccessDashboard, logout } = useAuth();
  const location = useLocation();

  // Danh sách các mục điều hướng dựa theo Role
  const navItems = [
    // 0. Cổng phân hệ Ô lưới (Hub) - Luôn hiển thị cho mọi vai trò
    {
      path: '/portal',
      label: 'Cổng Phân Hệ (Hub)',
      icon: Layers,
      desc: 'Danh mục Ô lưới',
      badge: 'Chính',
      roles: ['staff', 'manager', 'chairman'],
    },

    // 1. Dashboard: Chỉ dành cho manager & chairman
    ...(canAccessDashboard
      ? [
          {
            path: '/dashboard',
            label: 'Báo cáo & Tổng quan',
            icon: LayoutDashboard,
            badge: 'Live',
            roles: ['manager', 'chairman'],
          },
        ]
      : []),

    // 2. Module A: Đánh giá tín nhiệm (Trọng tâm)
    {
      path: '/trust-evaluation',
      label: 'Đánh giá tín nhiệm',
      icon: ShieldCheck,
      desc: '10 tiêu chí chuẩn',
      roles: ['staff', 'manager', 'chairman'],
    },

    // 3. Module B: Chấm điểm KPI
    {
      path: '/kpi-evaluation',
      label: 'Chấm điểm KPI',
      icon: TrendingUp,
      desc: '3 cấp duyệt 40-30-30',
      roles: ['staff', 'manager', 'chairman'],
    },

    // 4. Module C: Bỏ phiếu quy hoạch
    {
      path: '/planning-vote',
      label: 'Bỏ phiếu quy hoạch',
      icon: Vote,
      desc: 'Quy hoạch cán bộ nguồn',
      roles: ['staff', 'manager', 'chairman'],
    },

    // 5. Danh bạ nhân sự
    {
      path: '/employees',
      label: 'Danh bạ cán bộ',
      icon: Users,
      desc: 'QTDND Yên Thọ',
      roles: ['staff', 'manager', 'chairman'],
    },
  ];

  const getRoleBadgeVariant = (r) => {
    if (r === 'chairman') return 'danger';
    if (r === 'manager') return 'primary';
    return 'default';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-0'
        } border-r border-slate-800 shadow-xl lg:shadow-none`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#14b8a6] flex items-center justify-center text-white shadow-md shadow-[#0f766e]/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white tracking-wide truncate">
                QTDND YÊN THỌ
              </div>
              <p className="text-[11px] text-teal-400 font-medium tracking-tight">
                CỔNG QUẢN TRỊ NHÂN SỰ
              </p>
            </div>
          </div>
        </div>

        {/* Current User Quick Glance */}
        {currentUser && (
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0f766e]/40 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0 overflow-hidden">
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
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser.position || currentUser.department}
                </div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Vai trò:</span>
              <Badge variant={getRoleBadgeVariant(role)} size="sm">
                {ROLE_LABELS[role] || role}
              </Badge>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Phân hệ nghiệp vụ
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0f766e] text-white shadow-sm shadow-[#0f766e]/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-teal-200' : 'text-slate-400 group-hover:text-teal-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.label}</div>
                    {item.desc && !isActive && (
                      <div className="text-[10px] text-slate-400 truncate font-normal">
                        {item.desc}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {item.badge}
                  </span>
                )}
                {!item.badge && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-teal-200" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất hệ thống</span>
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            Quỹ TDND Yên Thọ • Thanh Hoá
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

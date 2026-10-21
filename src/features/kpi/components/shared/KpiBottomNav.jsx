import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  UserCheck, 
  History, 
  Settings2 
} from 'lucide-react';

/**
 * Bottom Navigation Cố Định Dưới Đáy Màn Hình Di Động
 * Đảm bảo: Touch target >= 44px, Responsive Grid, Zero Horizontal Scroll
 */
const KpiBottomNav = ({
  activeTab,
  setActiveTab,
  isManager = false,
  isChairman = false,
  isAdmin = false,
  pendingCounts = { self: 0, manager: 0, chairman: 0, appeals: 0 },
}) => {
  const canAccessOverview = isChairman || isManager || isAdmin;
  const canAccessSettings = isChairman || isAdmin;

  const items = [
    ...(canAccessOverview ? [{
      id: 'OVERVIEW',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: (pendingCounts.chairman + pendingCounts.appeals) > 0 ? (pendingCounts.chairman + pendingCounts.appeals) : null,
    }] : []),
    {
      id: 'SCORING',
      label: isChairman ? 'Duyệt' : (isManager ? 'Thẩm định' : 'Tự chấm'),
      icon: ClipboardCheck,
      badge: isChairman 
        ? pendingCounts.chairman 
        : (isManager ? pendingCounts.manager : (pendingCounts.self > 0 ? 1 : null)),
    },
    {
      id: 'MY_RESULTS',
      label: 'Cá nhân',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'HISTORY',
      label: 'Lịch sử',
      icon: History,
      badge: null,
    },
    ...(canAccessSettings ? [{
      id: 'SETTINGS',
      label: 'Tiêu chí',
      icon: Settings2,
      badge: null,
    }] : []),
  ];

  const gridColsClass = items.length === 5 
    ? 'grid-cols-5' 
    : (items.length === 4 ? 'grid-cols-4' : 'grid-cols-3');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className={`grid ${gridColsClass} h-16`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center relative min-h-[48px] px-1 py-1 transition-colors select-none ${
                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 scale-110' : 'text-slate-500'} transition-transform`} />
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center font-numeric">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KpiBottomNav;

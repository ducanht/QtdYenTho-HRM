import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  UserCheck, 
  History, 
  Settings2
} from 'lucide-react';

/**
 * Thanh Tabs Điều Hướng Module KPI (Desktop / Tablet)
 */
const KpiModuleTabsNav = ({
  activeTab,
  setActiveTab,
  isManager = false,
  isChairman = false,
  isAdmin = false,
  pendingCounts = { self: 0, manager: 0, chairman: 0, appeals: 0 },
  className = ''
}) => {
  const canAccessOverview = isChairman || isManager || isAdmin;
  const canAccessSettings = isChairman || isAdmin;

  const tabs = [
    ...(canAccessOverview ? [{
      id: 'OVERVIEW',
      label: 'Tổng Quan HĐQT',
      icon: LayoutDashboard,
      badge: (pendingCounts.chairman + pendingCounts.appeals) > 0 ? (pendingCounts.chairman + pendingCounts.appeals) : null,
      badgeColor: pendingCounts.appeals > 0 ? 'bg-rose-500' : 'bg-amber-500'
    }] : []),
    {
      id: 'SCORING',
      label: isChairman ? 'HĐQT Phê Duyệt' : (isManager ? 'Thẩm Định BĐH' : 'Tự Chấm Điểm'),
      icon: ClipboardCheck,
      badge: isChairman 
        ? pendingCounts.chairman 
        : (isManager ? pendingCounts.manager : (pendingCounts.self > 0 ? 1 : null)),
      badgeColor: 'bg-emerald-600'
    },
    {
      id: 'MY_RESULTS',
      label: 'Kết Quả Cá Nhân',
      icon: UserCheck,
      badge: null
    },
    {
      id: 'HISTORY',
      label: 'Lịch Sử Đa Kỳ',
      icon: History,
      badge: null
    },
    ...(canAccessSettings ? [{
      id: 'SETTINGS',
      label: 'Cấu Hình & Tiêu Chí',
      icon: Settings2,
      badge: null
    }] : [])
  ];

  return (
    <div className={`bg-white border-b border-slate-200 px-4 sm:px-6 ${className}`}>
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white rounded-full ${tab.badgeColor || 'bg-emerald-600'} font-numeric`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default KpiModuleTabsNav;

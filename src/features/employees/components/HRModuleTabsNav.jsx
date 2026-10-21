import React from 'react';
import { 
  Building2,
  Users,
  UserCheck, 
  Sliders 
} from 'lucide-react';

/**
 * HRModuleTabsNav: Thanh Menu Tab cấp Quản Trị Phân Hệ trên Desktop / iPad
 * Tách biệt rõ ràng Menu Quản Trị Cấp Toàn Quỹ với Menu Hồ Sơ Chi Tiết Cán Bộ
 */
const HRModuleTabsNav = ({
  activeTab,
  onChangeTab,
  canManage = false,
}) => {
  const tabs = [
    { id: 'OVERVIEW', label: 'Tổng quan nhân sự', icon: Building2, show: true },
    { id: 'DIRECTORY', label: 'Danh bạ cán bộ', icon: Users, show: true },
    { id: 'PROFILE', label: 'Hồ sơ cán bộ', icon: UserCheck, show: true },
    { id: 'SETTINGS', label: 'Cấu hình & Phân quyền', icon: Sliders, show: canManage },
  ].filter((t) => t.show);

  // Xử lý active tab bao gồm cả các alias tương thích ngược (CONTRACTS, TRAINING -> PROFILE)
  const isTabActive = (tabId) => {
    if (activeTab === tabId) return true;
    if (tabId === 'PROFILE' && (activeTab === 'CONTRACTS' || activeTab === 'TRAINING' || activeTab === 'TRANSFERS')) {
      return true;
    }
    return false;
  };

  return (
    <div className="hidden md:flex flex-wrap items-center gap-2 pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = isTabActive(tab.id);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(HRModuleTabsNav);

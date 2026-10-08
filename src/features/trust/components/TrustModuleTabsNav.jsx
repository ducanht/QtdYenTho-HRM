import React from 'react';
import { 
  CheckSquare, 
  History, 
  User, 
  BarChart3, 
  Settings, 
  ShieldAlert 
} from 'lucide-react';

/**
 * TrustModuleTabsNav: Thanh Tab chuyển nhanh phân hệ con trên Desktop/iPad
 * Thiết kế tinh gọn, hiện đại, không chiếm diện tích màn hình
 */
const TrustModuleTabsNav = ({
  activeTab,
  onChangeTab,
  canVote = true,
  canViewSubmitted = true,
  canViewOwnResults = true,
  canViewOverview = true,
  canManageCriteria = false,
  canManagePeriods = false,
}) => {
  const tabs = [
    { id: 'SCORING', label: 'Đánh giá', icon: CheckSquare, show: canVote },
    { id: 'MY_VOTES', label: 'Lịch sử', icon: History, show: canViewSubmitted },
    { id: 'MY_RESULTS', label: 'Cá nhân', icon: User, show: canViewOwnResults },
    { id: 'OVERVIEW', label: 'Tổng quan', icon: BarChart3, show: canViewOverview },
    { id: 'CRITERIA_SETTINGS', label: 'Cấu hình', icon: Settings, show: canManageCriteria || canManagePeriods },
    { id: 'PERMISSIONS_SETTINGS', label: 'Phân quyền', icon: ShieldAlert, show: canManageCriteria || canManagePeriods },
  ].filter((t) => t.show);

  return (
    <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
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

export default React.memo(TrustModuleTabsNav);

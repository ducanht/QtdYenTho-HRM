import React from 'react';
import { 
  ClipboardCheck, 
  History, 
  UserCheck, 
  BarChart3, 
  Sliders, 
  ShieldCheck 
} from 'lucide-react';

/**
 * TrustBottomNav: Thanh điều hướng cố định dưới đáy màn hình trên Di động (Bottom Navigation Menu)
 * - Tối ưu thao tác 1 chạm bằng ngón tay cái khi dùng điện thoại
 * - Tự động ẩn trên màn hình máy tính (chỉ kích hoạt ở Mobile & Tablet: block md:hidden)
 */
const TrustBottomNav = ({
  activeTab = 'SCORING',
  onChangeTab,
  canVote = true,
  canViewSubmitted = true,
  canViewOwnResults = true,
  canViewOverview = true,
  canManageCriteria = false,
  canManagePeriods = false,
}) => {
  const navItems = [
    {
      id: 'SCORING',
      label: 'Đánh giá',
      icon: ClipboardCheck,
      visible: canVote,
    },
    {
      id: 'MY_VOTES',
      label: 'Lịch sử',
      icon: History,
      visible: canViewSubmitted,
    },
    {
      id: 'MY_RESULTS',
      label: 'Cá nhân',
      icon: UserCheck,
      visible: canViewOwnResults,
    },
    {
      id: 'OVERVIEW',
      label: 'Tổng quan',
      icon: BarChart3,
      visible: canViewOverview,
    },
    {
      id: 'CRITERIA_SETTINGS',
      label: 'Cấu hình',
      icon: Sliders,
      visible: canManageCriteria,
    },
    {
      id: 'PERMISSIONS_SETTINGS',
      label: 'Phân quyền',
      icon: ShieldCheck,
      visible: canManageCriteria || canManagePeriods,
    },
  ].filter((item) => item.visible);

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1 py-1 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`
                flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all cursor-pointer select-none
                ${
                  isActive
                    ? 'text-[#0f766e] font-black'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }
              `}
              title={item.label}
            >
              <div
                className={`
                  p-1 rounded-lg transition-all flex items-center justify-center
                  ${isActive ? 'bg-teal-50 text-[#0f766e] scale-110' : 'text-slate-500'}
                `}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(TrustBottomNav);

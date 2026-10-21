import React from 'react';
import { 
  Building2,
  Users,
  UserCheck, 
  Sliders 
} from 'lucide-react';

/**
 * HRBottomNav: Thanh điều hướng cấp Quản trị cố định dưới đáy màn hình trên Di động
 * Tối ưu thao tác 1 chạm ngón tay cái, khử hoàn toàn trùng lặp với menu chi tiết hồ sơ
 */
const HRBottomNav = ({
  activeTab = 'OVERVIEW',
  onChangeTab,
  canManage = false,
}) => {
  const navItems = [
    { id: 'OVERVIEW', label: 'Tổng quan', icon: Building2, visible: true },
    { id: 'DIRECTORY', label: 'Danh bạ', icon: Users, visible: true },
    { id: 'PROFILE', label: 'Hồ sơ', icon: UserCheck, visible: true },
    { id: 'SETTINGS', label: 'Cấu hình', icon: Sliders, visible: canManage },
  ].filter((item) => item.visible);

  const isItemActive = (id) => {
    if (activeTab === id) return true;
    if (id === 'PROFILE' && (activeTab === 'CONTRACTS' || activeTab === 'TRAINING' || activeTab === 'TRANSFERS')) {
      return true;
    }
    return false;
  };

  return (
    <div 
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1 py-1 safe-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = isItemActive(item.id);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`
                flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all cursor-pointer select-none touch-manipulation active:scale-95
                ${
                  isActive
                    ? 'text-emerald-800 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }
              `}
              title={item.label}
            >
              <div
                className={`
                  p-1 rounded-lg transition-all flex items-center justify-center
                  ${isActive ? 'bg-emerald-50 text-emerald-800 scale-110' : 'text-slate-500'}
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

export default React.memo(HRBottomNav);

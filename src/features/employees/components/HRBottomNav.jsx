import React from 'react';
import { 
  UserCheck, 
  ArrowRightLeft, 
  GraduationCap, 
  BarChart3, 
  Sliders 
} from 'lucide-react';

/**
 * HRBottomNav: Thanh điều hướng cố định dưới đáy màn hình trên Di động
 * Tối ưu thao tác 1 chạm bằng ngón tay cái, tự động ẩn trên Desktop/iPad
 */
const HRBottomNav = ({
  activeTab = 'PROFILE',
  onChangeTab,
  canManage = false,
}) => {
  const navItems = [
    { id: 'PROFILE', label: 'Hồ sơ', icon: UserCheck, visible: true },
    { id: 'TRANSFERS', label: 'Luân chuyển', icon: ArrowRightLeft, visible: true },
    { id: 'TRAINING', label: 'Đào tạo', icon: GraduationCap, visible: true },
    { id: 'ANALYTICS', label: 'Cơ cấu', icon: BarChart3, visible: true },
    { id: 'SETTINGS', label: 'Cấu hình', icon: Sliders, visible: canManage },
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

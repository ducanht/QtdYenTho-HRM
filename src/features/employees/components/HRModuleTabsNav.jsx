import React from 'react';
import { 
  UserCheck, 
  ArrowRightLeft, 
  GraduationCap, 
  BarChart3, 
  Sliders 
} from 'lucide-react';

/**
 * HRModuleTabsNav: Thanh Menu Tab chuyển nhanh phân hệ Quản trị Nhân sự trên Desktop / iPad
 * Kế thừa phong cách thiết kế tinh gọn của Phân hệ Đánh giá Tín nhiệm
 */
const HRModuleTabsNav = ({
  activeTab,
  onChangeTab,
  canManage = false,
}) => {
  const tabs = [
    { id: 'PROFILE', label: 'Hồ sơ trích ngang', icon: UserCheck, show: true },
    { id: 'TRANSFERS', label: 'Luân chuyển công tác', icon: ArrowRightLeft, show: true },
    { id: 'TRAINING', label: 'Đào tạo & Chứng chỉ', icon: GraduationCap, show: true },
    { id: 'ANALYTICS', label: 'Cơ cấu & Thống kê', icon: BarChart3, show: true },
    { id: 'SETTINGS', label: 'Cấu hình & Phân quyền', icon: Sliders, show: canManage },
  ].filter((t) => t.show);

  return (
    <div className="hidden md:flex flex-wrap items-center gap-2 pb-1">
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

export default React.memo(HRModuleTabsNav);

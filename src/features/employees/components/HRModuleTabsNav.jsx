import React from 'react';
import { 
  Building2,
  UserCheck, 
  FileText, 
  GraduationCap, 
  Sliders 
} from 'lucide-react';

/**
 * HRModuleTabsNav: Thanh Menu Tab chuyển nhanh phân hệ Quản trị Nhân sự trên Desktop / iPad
 * Chuẩn hóa 5 phân khu chức năng mạch lạc theo nghiệp vụ Quỹ tín dụng nhân dân
 */
const HRModuleTabsNav = ({
  activeTab,
  onChangeTab,
  canManage = false,
}) => {
  const tabs = [
    { id: 'OVERVIEW', label: 'Tổng quan nhân sự', icon: Building2, show: true },
    { id: 'PROFILE', label: 'Thông tin nhân sự', icon: UserCheck, show: true },
    { id: 'CONTRACTS', label: 'Hợp đồng & Luân chuyển', icon: FileText, show: true },
    { id: 'TRAINING', label: 'Đào tạo & Chứng chỉ', icon: GraduationCap, show: true },
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

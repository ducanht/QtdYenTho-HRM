import React from 'react';
import {
  Building2,
  Users,
  Layers,
  ShieldCheck,
  TrendingUp,
  Vote,
  Clock,
  DollarSign,
  Award
} from 'lucide-react';

/**
 * Thanh điều hướng tabs theo 2 Khu Vực Cấu Hình
 */
const SettingsTabsNav = ({
  activeGroup,
  activeTab,
  onTabChange,
  departmentsCount = 0,
  positionsCount = 0
}) => {
  if (activeGroup === 'GLOBAL') {
    return (
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onTabChange('GENERAL_LEGAL')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_LEGAL'
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>1. Thông Tin Pháp Nhân Quỹ</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('GENERAL_ORG')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_ORG'
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>2. Danh Mục Phòng Ban & Chức Danh Dùng Chung</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {departmentsCount} PB / {positionsCount} CV
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('GENERAL_MODULES')}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_MODULES'
              ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>3. Cổng Phân Hệ (Registry & Bật/Tắt)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            Feature Flags
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <span>Phân hệ đang vận hành:</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onTabChange('SUB_TRUST')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_TRUST'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>1. Tín Nhiệm (10 Tiêu Chí)</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SUB_HR')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_HR'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Nhân Sự & Luân Chuyển</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SUB_KPI')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_KPI'
              ? 'bg-blue-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>3. KPI (3 Cấp 40-30-30)</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SUB_PLANNING')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_PLANNING'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50/50'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>4. Quy Hoạch Nguồn</span>
        </button>
      </div>

      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2">
        <span>Phân hệ đang triển khai (Sắp ra mắt):</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onTabChange('SUB_ATTENDANCE')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_ATTENDANCE'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>5. Chấm Công & Ca Trực Kho</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SUB_PAYROLL')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_PAYROLL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>6. Tiền Lương & Đãi Ngộ</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SUB_AWARDS')}
          className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SUB_AWARDS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 text-yellow-500" />
          <span>7. Thi Đua Khen Thưởng</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsTabsNav;

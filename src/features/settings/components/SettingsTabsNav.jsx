import React from 'react';
import {
  Building2,
  Users,
  Layers,
  ShieldCheck,
  Database,
} from 'lucide-react';

/**
 * Thanh điều hướng Tab Cấu hình Chung Toàn Hệ Thống (Global Settings)
 * Tự động ẩn các tab nhạy cảm (Kích hoạt module, Phân quyền, CSDL) đối với tài khoản không có quyền
 */
const SettingsTabsNav = ({
  activeTab,
  onTabChange,
  departmentsCount = 0,
  positionsCount = 0,
  canToggleModules = false,
  canConfigureWebapp = false,
  canManageDatabase = false,
  isSuperAdmin = false,
}) => {
  return (
    <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onTabChange('GENERAL_LEGAL')}
        className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'GENERAL_LEGAL'
            ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
            : 'text-slate-600 hover:bg-white/60'
        }`}
      >
        <Building2 className="w-4 h-4 text-teal-600" />
        <span>1. Thông Tin Pháp Nhân & Địa Bàn</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('GENERAL_ORG')}
        className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
          activeTab === 'GENERAL_ORG'
            ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
            : 'text-slate-600 hover:bg-white/60'
        }`}
      >
        <Users className="w-4 h-4 text-teal-600" />
        <span>2. Phòng Ban & Chức Danh</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
          {departmentsCount} PB / {positionsCount} CV
        </span>
      </button>

      {/* Tab 3: Kích hoạt module - Chỉ hiển thị khi có quyền Bật/Tắt module */}
      {canToggleModules && (
        <button
          type="button"
          onClick={() => onTabChange('GENERAL_MODULES')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_MODULES'
              ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          <span>3. Kích Hoạt Phân Hệ Nghiệp Vụ</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
            Bật/Tắt
          </span>
        </button>
      )}

      {/* Tab 4: Phân quyền vai trò - Chỉ hiển thị với SuperAdmin hoặc quyền cấu hình cao */}
      {(isSuperAdmin || canConfigureWebapp) && (
        <button
          type="button"
          onClick={() => onTabChange('GENERAL_PERMISSIONS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_PERMISSIONS'
              ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
          <span>4. Phân Quyền Vai Trò Toàn Hệ Thống</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
            RBAC Chung
          </span>
        </button>
      )}

      {/* Tab 5: Cơ sở dữ liệu - Chỉ hiển thị với Admin & SuperAdmin */}
      {canManageDatabase && (
        <button
          type="button"
          onClick={() => onTabChange('GENERAL_DATABASE')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL_DATABASE'
              ? 'bg-white text-teal-950 shadow-xs border border-teal-300'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <Database className="w-4 h-4 text-[#047857]" />
          <span>5. Cơ Sở Dữ Liệu & Khởi Tạo Bảng</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            CSDL
          </span>
        </button>
      )}
    </div>
  );
};

export default SettingsTabsNav;

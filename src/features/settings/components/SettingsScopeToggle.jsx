import React from 'react';
import { Globe, Settings2 } from 'lucide-react';

/**
 * Thanh tác vụ chọn Phạm vi cấu hình: Khu Vực 1 (Chung toàn Quỹ) vs Khu Vực 2 (Từng phân hệ)
 * Tinh gọn, hiển thị rõ ràng, không lặp tiêu đề phân hệ
 */
const SettingsScopeToggle = ({ activeGroup, onGroupChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className="font-bold text-slate-900">Phạm vi cấu hình:</span>
        <span className="text-[#0f766e] bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200 font-bold">
          {activeGroup === 'GLOBAL'
            ? 'Khu Vực 1: Cấu hình chung toàn Quỹ'
            : 'Khu Vực 2: Cấu hình chuyên sâu từng phân hệ'}
        </span>
      </div>

      {/* Nút chuyển đổi nhanh 2 Khu Vực Cấu Hình */}
      <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onGroupChange('GLOBAL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeGroup === 'GLOBAL'
              ? 'bg-white text-teal-800 shadow-xs border border-teal-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>Khu Vực 1: Cấu Hình Chung</span>
        </button>

        <button
          type="button"
          onClick={() => onGroupChange('SUBSYSTEM')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeGroup === 'SUBSYSTEM'
              ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Khu Vực 2: Cấu Hình Từng Phân Hệ</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
            7 Phân hệ
          </span>
        </button>
      </div>
    </div>
  );
};

export default SettingsScopeToggle;

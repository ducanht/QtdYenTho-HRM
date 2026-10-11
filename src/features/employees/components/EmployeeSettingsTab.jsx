import React from 'react';
import { Sliders, Building2, Briefcase, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DEFAULT_POSITIONS } from '../../../lib/systemDefaults';

/**
 * EmployeeSettingsTab: Cột Phải cho Tab SETTINGS
 * Quản lý danh mục Phòng ban và 11 Chức vụ chuẩn mực của Quỹ tín dụng nhân dân Yên Thọ
 */
const EmployeeSettingsTab = ({
  departments = [],
  positions = DEFAULT_POSITIONS,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Danh Mục Phòng Ban */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Danh Mục Phòng Ban Hoạt Động ({departments.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {departments.map((dept, idx) => (
            <div key={dept} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="font-bold text-slate-800">{dept}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Danh Mục 11 Chức Vụ Chuẩn & Vị Trí Nhạy Cảm NHNN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Danh Mục Chức Vụ & Vị Trí Công Tác Chuẩn ({positions.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bao gồm chức danh Kiểm soát nội bộ (Kiểm soát viên chuyên trách) theo quy định của NHNN
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Mã vị trí</th>
                <th className="py-2.5 px-3">Mã Code</th>
                <th className="py-2.5 px-3">Tên chức vụ chính quyền</th>
                <th className="py-2.5 px-3">Phòng ban trực thuộc</th>
                <th className="py-2.5 px-3 text-right">Phân loại NHNN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos) => {
                const p = (pos.name || '').toLowerCase();
                const isSensitive =
                  p.includes('tín dụng') ||
                  p.includes('kế toán') ||
                  p.includes('thủ quỹ') ||
                  p.includes('kiểm soát');

                return (
                  <tr key={pos.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {pos.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-900">
                      {pos.code}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {pos.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {pos.department}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isSensitive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Luân chuyển 3 năm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          Theo nhiệm kỳ / HĐLĐ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeSettingsTab);

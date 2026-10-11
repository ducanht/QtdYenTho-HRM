import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  ShieldAlert, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  Save, 
  Lock, 
  Eye, 
  Users 
} from 'lucide-react';
import { DEFAULT_POSITIONS } from '../../../lib/systemDefaults';
import { saveSubsystemConfig } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeSettingsTab: Cột Phải cho Tab SETTINGS
 * - Quản lý Cấu hình & Phân quyền truy cập thông tin nhân sự (Xem toàn Quỹ vs Xem cá nhân)
 * - Quản lý Tham số chu kỳ luân chuyển theo quy định NHNN
 * - Quản lý Danh mục Phòng ban và Danh mục Chức vụ chuẩn mực của Quỹ TDND Yên Thọ
 * - Tuân thủ: Ẩn toàn bộ mã vị trí, mã code, font-mono.
 */
const EmployeeSettingsTab = ({
  departments = [],
  positions = DEFAULT_POSITIONS,
  hrConfig = null,
  canManage = false,
}) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Form Cấu hình Phân hệ
  const [allowStaffViewDirectory, setAllowStaffViewDirectory] = useState(true);
  const [canStaffUploadTraining, setCanStaffUploadTraining] = useState(true);
  const [transferMaxMonths, setTransferMaxMonths] = useState(36);
  const [transferWarningMonths, setTransferWarningMonths] = useState(6);

  useEffect(() => {
    if (hrConfig) {
      if (hrConfig.allowStaffViewDirectory !== undefined) {
        setAllowStaffViewDirectory(Boolean(hrConfig.allowStaffViewDirectory));
      }
      if (hrConfig.canStaffUploadTraining !== undefined) {
        setCanStaffUploadTraining(Boolean(hrConfig.canStaffUploadTraining));
      }
      if (hrConfig.transferMaxMonths !== undefined) {
        setTransferMaxMonths(Number(hrConfig.transferMaxMonths) || 36);
      }
      if (hrConfig.transferWarningMonths !== undefined) {
        setTransferWarningMonths(Number(hrConfig.transferWarningMonths) || 6);
      }
    }
  }, [hrConfig]);

  const handleSaveConfig = async (e) => {
    e?.preventDefault?.();
    if (!canManage) {
      toast?.showError?.('Chỉ Quản trị viên và Ban Lãnh đạo mới có quyền lưu cấu hình');
      return;
    }

    setSaving(true);
    try {
      await saveSubsystemConfig('hr', {
        allowStaffViewDirectory,
        canStaffUploadTraining,
        transferMaxMonths: Number(transferMaxMonths) || 36,
        transferWarningMonths: Number(transferWarningMonths) || 6,
      });
      toast?.showSuccess?.('Đã lưu cấu hình và phân quyền phân hệ thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Phân Quyền Truy Cập & Hiển Thị Thông Tin Nhân Sự */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Cấu Hình &amp; Phân Quyền Truy Cập Phân Hệ Nhân Sự</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập phạm vi xem danh bạ, quyền sửa hồ sơ và chu kỳ luân chuyển
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cấu hình 1: Chế độ hiển thị danh bạ */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-900">Phạm Vi Xem Danh Bạ Cán Bộ</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="allowStaffViewDirectory"
                  checked={allowStaffViewDirectory === true}
                  onChange={() => setAllowStaffViewDirectory(true)}
                  disabled={!canManage}
                  className="mt-0.5 text-emerald-700 focus:ring-emerald-700"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Xem toàn Quỹ (Mặc định)</span>
                  <span className="text-[11px] text-slate-500">
                    Mọi cán bộ đều có thể tra cứu thông tin cơ bản của đồng nghiệp trong Quỹ.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="allowStaffViewDirectory"
                  checked={allowStaffViewDirectory === false}
                  onChange={() => setAllowStaffViewDirectory(false)}
                  disabled={!canManage}
                  className="mt-0.5 text-emerald-700 focus:ring-emerald-700"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Bảo mật cá nhân (Chỉ xem hồ sơ của mình)</span>
                  <span className="text-[11px] text-slate-500">
                    Cán bộ chỉ xem hồ sơ của bản thân. Ban Lãnh đạo, BKS và Quản trị viên xem toàn bộ.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Cấu hình 2: Quyền quản lý chứng chỉ & Tham số luân chuyển */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-900">Tham Số Giám Sát Luân Chuyển (NHNN)</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Chu kỳ luân chuyển tối đa (tháng):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="12"
                    max="60"
                    value={transferMaxMonths}
                    onChange={(e) => setTransferMaxMonths(e.target.value)}
                    disabled={!canManage}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                  />
                  <span className="text-slate-500 text-[11px]">tháng (Mặc định: 36 tháng / 3 năm)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Thời gian cảnh báo trước hạn (tháng):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={transferWarningMonths}
                    onChange={(e) => setTransferWarningMonths(e.target.value)}
                    disabled={!canManage}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                  />
                  <span className="text-slate-500 text-[11px]">tháng (Mặc định: 6 tháng trước hạn)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canStaffUploadTraining}
                    onChange={(e) => setCanStaffUploadTraining(e.target.checked)}
                    disabled={!canManage}
                    className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
                  />
                  <span className="text-slate-800 font-bold">
                    Cho phép cán bộ tự cập nhật văn bằng, chứng chỉ của mình
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Danh Mục Phòng Ban */}
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
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                {idx + 1}
              </span>
              <span className="font-bold text-slate-800">{dept}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Danh Mục 11 Chức Vụ Chuẩn & Vị Trí Nhạy Cảm NHNN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>Danh Mục Chức Vụ &amp; Vị Trí Công Tác Chuẩn ({positions.length})</span>
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
                <th className="py-2.5 px-3 text-center w-12">STT</th>
                <th className="py-2.5 px-3">Tên chức vụ chính quyền</th>
                <th className="py-2.5 px-3">Phòng ban trực thuộc</th>
                <th className="py-2.5 px-3 text-right">Phân loại theo dõi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {positions.map((pos, idx) => {
                const p = (pos.name || '').toLowerCase();
                const isSensitive =
                  p.includes('tín dụng') ||
                  p.includes('kế toán') ||
                  p.includes('thủ quỹ') ||
                  p.includes('kiểm soát');

                return (
                  <tr key={pos.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 tabular-nums">
                      {idx + 1}
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

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  Save, 
  Eye,
  MapPin,
  CalendarClock,
  Clock,
  AlertCircle
} from 'lucide-react';
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
  positions = [],
  hrConfig = null,
  canManage = false,
}) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  // Form Cấu hình Phân hệ
  const [allowStaffViewDirectory, setAllowStaffViewDirectory] = useState(true);
  const [canStaffUploadTraining, setCanStaffUploadTraining] = useState(true);
  const [creditRotationMonths, setCreditRotationMonths] = useState(36);
  const [creditWarningMonths, setCreditWarningMonths] = useState(6);

  useEffect(() => {
    if (hrConfig) {
      if (hrConfig.allowStaffViewDirectory !== undefined) {
        setAllowStaffViewDirectory(Boolean(hrConfig.allowStaffViewDirectory));
      }
      if (hrConfig.canStaffUploadTraining !== undefined) {
        setCanStaffUploadTraining(Boolean(hrConfig.canStaffUploadTraining));
      }
      const rotMonths = hrConfig.creditRotationMonths ?? hrConfig.transferMaxMonths ?? hrConfig.transferCycleMonths ?? 36;
      const warnMonths = hrConfig.creditWarningMonths ?? hrConfig.transferWarningMonths ?? hrConfig.warningMonths ?? 6;
      setCreditRotationMonths(Number(rotMonths) || 36);
      setCreditWarningMonths(Number(warnMonths) || 6);
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
      const rotMonths = Number(creditRotationMonths) || 36;
      const warnMonths = Number(creditWarningMonths) || 6;

      await saveSubsystemConfig('hr', {
        allowStaffViewDirectory,
        canStaffUploadTraining,
        creditRotationMonths: rotMonths,
        creditWarningMonths: warnMonths,
        // Giữ các trường tương thích ngược 100%
        transferMaxMonths: rotMonths,
        transferWarningMonths: warnMonths,
        transferCycleMonths: rotMonths,
        warningMonths: warnMonths,
        transferRules: [
          { positionName: 'Cán bộ tín dụng', requiresTransfer: true, maxMonths: rotMonths, warningMonths: warnMonths },
        ],
      });
      toast?.showSuccess?.('Đã lưu cấu hình phân hệ và thời hạn luân chuyển địa bàn CBTD thành công!');
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

          {/* Cấu hình 2: Quyền cập nhật văn bằng & chứng chỉ */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-900">Quyền Cập Nhật Văn Bằng &amp; Chứng Chỉ</h4>
            </div>

            <div className="p-2 rounded-lg hover:bg-white transition-colors">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canStaffUploadTraining}
                  onChange={(e) => setCanStaffUploadTraining(e.target.checked)}
                  disabled={!canManage}
                  className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
                />
                <div>
                  <span className="text-slate-800 font-bold block">
                    Cho phép cán bộ tự cập nhật văn bằng, chứng chỉ đào tạo
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Khi bật, cán bộ nhân viên có thể chủ động bổ sung các chứng chỉ tập huấn, bồi dưỡng nghiệp vụ vào hồ sơ cá nhân.
                  </span>
                </div>
              </label>
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

      {/* 3. Cấu Hình Luân Chuyển Địa Bàn Cán Bộ Tín Dụng (CBTD) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Cấu Hình Luân Chuyển Địa Bàn Cán Bộ Tín Dụng (CBTD)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập chu kỳ luân chuyển địa bàn quản lý định kỳ và thời hạn phát cảnh báo theo quy định phòng ngừa rủi ro tín dụng của NHNN
            </p>
          </div>

          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
            Áp dụng chuyên biệt cho CBTD
          </span>
        </div>

        {/* 2 Ô Cấu hình tham số */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Tham số 1: Chu kỳ luân chuyển địa bàn */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900">Chu Kỳ Luân Chuyển Địa Bàn</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Mặc định 36 tháng</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Thời gian tối đa một Cán bộ tín dụng phụ trách một địa bàn (thôn/cụm/xã) trước khi thực hiện luân chuyển sang địa bàn khác.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-[160px]">
                <input
                  type="number"
                  min="6"
                  max="60"
                  step="1"
                  value={creditRotationMonths}
                  onChange={(e) => setCreditRotationMonths(Math.max(6, Math.min(60, Number(e.target.value) || 36)))}
                  disabled={!canManage}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100"
                />
              </div>
              <span className="text-xs font-bold text-slate-700">tháng</span>
              <span className="text-[11px] text-slate-400">
                ({Math.round((creditRotationMonths / 12) * 10) / 10} năm)
              </span>
            </div>
          </div>

          {/* Tham số 2: Thời hạn cảnh báo trước */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900">Thời Gian Cảnh Báo Trước</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Mặc định 6 tháng</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hệ thống phát thông báo cảnh báo sớm trước khi đến hạn để Ban Điều hành chuẩn bị nhân sự và phương án bàn giao nợ tín dụng.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-[160px]">
                <input
                  type="number"
                  min="1"
                  max="12"
                  step="1"
                  value={creditWarningMonths}
                  onChange={(e) => setCreditWarningMonths(Math.max(1, Math.min(12, Number(e.target.value) || 6)))}
                  disabled={!canManage}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100"
                />
              </div>
              <span className="text-xs font-bold text-slate-700">tháng</span>
              <span className="text-[11px] text-slate-400">
                (từ tháng thứ {Math.max(1, creditRotationMonths - creditWarningMonths)})
              </span>
            </div>
          </div>
        </div>

        {/* Khối Ghi chú nghiệp vụ rõ ràng */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">Quy định nghiệp vụ Quỹ tín dụng nhân dân:</p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Quy định luân chuyển định kỳ địa bàn quản lý chỉ áp dụng bắt buộc đối với vị trí <strong>Cán bộ tín dụng (CBTD)</strong> nhằm phòng ngừa rủi ro tín dụng và rủi ro đạo đức theo quy định của Ngân hàng Nhà nước. Các chức danh thuộc <strong>Hội đồng quản trị, Ban Kiểm soát, Ban Điều hành</strong> hoạt động theo nhiệm kỳ bầu cử và phê chuẩn của NHNN; các vị trí <strong>Kế toán, Thủ quỹ</strong> hoạt động theo phân công nhiệm vụ nội bộ của Ban Giám đốc, không áp dụng luân chuyển địa bàn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeSettingsTab);

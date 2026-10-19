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
  Sliders
} from 'lucide-react';
import { saveSubsystemConfig } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_MODULE_HR_SETTINGS } from '../../../lib/systemDefaults';

/**
 * EmployeeSettingsTab: Cột Phải cho Tab SETTINGS
 * - Quản lý Cấu hình & Phân quyền truy cập thông tin nhân sự
 * - Quản lý Chu kỳ luân chuyển địa bàn Cán bộ tín dụng (CBTD)
 * - Quản lý Danh mục Phòng ban hoạt động của Quỹ TDND Yên Thọ
 * - Tuân thủ: Ẩn mã vị trí, mã code, font-mono. Chuẩn hóa nhãn nghiệp vụ cơ quan tín dụng.
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

  const workLocations = hrConfig?.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || [
    'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
    'Phòng Giao dịch số 1 (Yên Thọ)',
    'Điểm giao dịch lưu động',
  ];

  const creditAreas = hrConfig?.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || [
    'Thôn Tân Lộc (xã Yên Thọ)',
    'Thôn Tân Hưng (xã Yên Thọ)',
    'Cụm Thôn 1, 2, 3 (xã Yên Thọ)',
    'Cụm Thôn 4, 5, 6 (xã Yên Thọ)',
    'Cụm Thôn 7, 8 (xã Quý Lộc)',
    'Địa bàn xã Quý Lộc',
    'Địa bàn xã Yên Thọ',
    'Địa bàn liên xã mở rộng',
  ];

  // Cấu hình hiển thị màn hình Tổng quan
  const [showKpis, setShowKpis] = useState(true);
  const [showContractStructure, setShowContractStructure] = useState(true);
  const [showEducationStructure, setShowEducationStructure] = useState(true);
  const [showCreditRotationMonitoring, setShowCreditRotationMonitoring] = useState(true);
  const [showDepartmentDistribution, setShowDepartmentDistribution] = useState(true);

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
      setCreditRotationMonths(rotMonths);
      setCreditWarningMonths(warnMonths);

      const ovConfig = hrConfig.overviewDisplayConfig || {};
      setShowKpis(ovConfig.showKpis !== false);
      setShowContractStructure(ovConfig.showContractStructure !== false);
      setShowEducationStructure(ovConfig.showEducationStructure !== false);
      setShowCreditRotationMonitoring(ovConfig.showCreditRotationMonitoring !== false);
      setShowDepartmentDistribution(ovConfig.showDepartmentDistribution !== false);
    }
  }, [hrConfig]);

  const handleSaveConfig = async (e) => {
    e?.preventDefault?.();
    if (!canManage) {
      const msg = 'Chỉ Quản trị viên và Ban Lãnh đạo mới có quyền lưu cấu hình';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }

    setSaving(true);
    try {
      const rotMonths = parseInt(creditRotationMonths, 10) || 36;
      const warnMonths = parseInt(creditWarningMonths, 10) || 6;

      const payload = {
        allowStaffViewDirectory,
        canStaffUploadTraining,
        creditRotationMonths: rotMonths,
        creditWarningMonths: warnMonths,
        overviewDisplayConfig: {
          showKpis,
          showContractStructure,
          showEducationStructure,
          showCreditRotationMonitoring,
          showDepartmentDistribution,
        },
        // Tương thích ngược các bảng liên quan
        transferMaxMonths: rotMonths,
        transferWarningMonths: warnMonths,
        transferCycleMonths: rotMonths,
        warningMonths: warnMonths,
        transferRules: [
          { positionName: 'Cán bộ tín dụng', requiresTransfer: true, maxMonths: rotMonths, warningMonths: warnMonths },
        ],
      };

      await saveSubsystemConfig('hr', payload);

      // Lưu đệm localStorage để cập nhật tức thì
      try {
        localStorage.setItem('qtd_hr_subsystem_config', JSON.stringify(payload));
      } catch {
        // bỏ qua lỗi storage nếu có
      }

      const successMsg = 'Đã lưu cấu hình phân hệ và thời hạn luân chuyển địa bàn CBTD thành công!';
      if (toast?.success) toast.success(successMsg);
      else if (toast?.showSuccess) toast.showSuccess(successMsg);
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình:', err);
      const errorMsg = err.message || 'Lỗi khi lưu cấu hình';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const parsedRotMonths = parseInt(creditRotationMonths, 10) || 36;
  const parsedWarnMonths = parseInt(creditWarningMonths, 10) || 6;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Phân Quyền Truy Cập Phân Hệ Nhân Sự */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Cấu Hình &amp; Phân Quyền Truy Cập Phân Hệ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phạm vi xem danh bạ và quyền cập nhật văn bằng chứng chỉ
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
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="allowStaffViewDirectory"
                  checked={allowStaffViewDirectory === true}
                  onChange={() => setAllowStaffViewDirectory(true)}
                  disabled={!canManage}
                  className="text-emerald-700 focus:ring-emerald-700"
                />
                <span className="font-bold text-slate-800">Xem toàn Quỹ</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="allowStaffViewDirectory"
                  checked={allowStaffViewDirectory === false}
                  onChange={() => setAllowStaffViewDirectory(false)}
                  disabled={!canManage}
                  className="text-emerald-700 focus:ring-emerald-700"
                />
                <span className="font-bold text-slate-800">Chỉ xem hồ sơ cá nhân</span>
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
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canStaffUploadTraining}
                  onChange={(e) => setCanStaffUploadTraining(e.target.checked)}
                  disabled={!canManage}
                  className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
                />
                <span className="text-slate-800 font-bold">
                  Cho phép cán bộ tự cập nhật văn bằng, chứng chỉ đào tạo
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cấu Hình Hiển Thị Dashboard Tổng Quan Nhân Lực */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Cấu Hình Hiển Thị Dashboard Tổng Quan Nhân Lực</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bật hoặc tắt các khối widget báo cáo hiển thị trên màn hình Tổng quan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showKpis}
              onChange={(e) => setShowKpis(e.target.checked)}
              disabled={!canManage}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Thẻ chỉ số nhân lực KPI</span>
              <span className="text-[11px] text-slate-500 block">Tổng CBNV, Đảng viên, Giới tính, Hạn CBTD</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showContractStructure}
              onChange={(e) => setShowContractStructure(e.target.checked)}
              disabled={!canManage}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Cơ cấu Hợp đồng lao động</span>
              <span className="text-[11px] text-slate-500 block">Tỷ lệ các loại HĐ &amp; cảnh báo tái ký</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showEducationStructure}
              onChange={(e) => setShowEducationStructure(e.target.checked)}
              disabled={!canManage}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Cơ cấu Trình độ chuyên môn</span>
              <span className="text-[11px] text-slate-500 block">Văn bằng cao nhất theo chuẩn NHNN</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showCreditRotationMonitoring}
              onChange={(e) => setShowCreditRotationMonitoring(e.target.checked)}
              disabled={!canManage}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Bảng giám sát luân chuyển CBTD</span>
              <span className="text-[11px] text-slate-500 block">Thời gian phụ trách địa bàn tín dụng</span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={showDepartmentDistribution}
              onChange={(e) => setShowDepartmentDistribution(e.target.checked)}
              disabled={!canManage}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Phân bổ nhân sự theo Bộ phận</span>
              <span className="text-[11px] text-slate-500 block">Tỷ lệ cơ cấu phòng ban hoạt động</span>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Danh Mục Phòng Ban */}
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
              Chu kỳ luân chuyển và thời hạn phát cảnh báo
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
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Thời hạn
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-[160px]">
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={creditRotationMonths}
                  onChange={(e) => setCreditRotationMonths(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(creditRotationMonths, 10);
                    setCreditRotationMonths(!isNaN(v) && v > 0 ? v : 36);
                  }}
                  disabled={!canManage}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100"
                />
              </div>
              <span className="text-xs font-bold text-slate-700">tháng</span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({Math.round((parsedRotMonths / 12) * 10) / 10} năm)
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
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Thời hạn
              </span>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-[160px]">
                <input
                  type="number"
                  min="1"
                  max="36"
                  step="1"
                  value={creditWarningMonths}
                  onChange={(e) => setCreditWarningMonths(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(creditWarningMonths, 10);
                    setCreditWarningMonths(!isNaN(v) && v > 0 ? v : 6);
                  }}
                  disabled={!canManage}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:bg-slate-100"
                />
              </div>
              <span className="text-xs font-bold text-slate-700">tháng</span>
              <span className="text-[11px] text-slate-500 font-medium">
                (từ tháng thứ {Math.max(1, parsedRotMonths - parsedWarnMonths)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Danh Mục Nơi Làm Việc & Địa Bàn Tín Dụng Hoạt Động */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Nơi Làm Việc &amp; Địa Bàn Tín Dụng Hoạt Động</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Địa điểm làm việc chung toàn cơ quan và danh mục địa bàn phân công Cán bộ Tín dụng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Cột 1: Nơi làm việc / Điểm giao dịch */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Điểm Làm Việc &amp; Trụ Sở Hoạt Động ({workLocations.length})</span>
            </h4>
            <div className="space-y-2">
              {workLocations.map((loc, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cột 2: Địa bàn tín dụng */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Địa Bàn Quản Lý Tín Dụng (CBTD) ({creditAreas.length})</span>
            </h4>
            <div className="space-y-2">
              {creditAreas.map((area, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeSettingsTab);

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
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Users,
  UserCheck
} from 'lucide-react';
import { 
  saveSubsystemConfig, 
  updateEmployeeProfile,
  subscribeWorkLocations,
  saveWorkLocation,
  deleteWorkLocation,
  subscribeCreditAreas,
  saveCreditArea,
  deleteCreditArea
} from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_MODULE_HR_SETTINGS } from '../../../lib/systemDefaults';
import { isCreditOfficerRole } from '../../../lib/evaluationUtils';

/**
 * EmployeeSettingsTab: Cột Phải cho Tab SETTINGS
 * - Quản lý Cấu hình & Phân quyền truy cập thông tin nhân sự
 * - Quản lý Chu kỳ luân chuyển địa bàn Cán bộ tín dụng (CBTD)
 * - Quản lý Danh mục Phòng ban hoạt động của Quỹ TDND Yên Thọ
 * - Quản lý & Kết nối CSDL Nơi Làm Việc & Địa Bàn Tín Dụng Hoạt Động (CBTD)
 * - Tuân thủ: Ẩn mã vị trí, mã code, font-mono. Chuẩn hóa nhãn nghiệp vụ cơ quan tín dụng.
 */
const EmployeeSettingsTab = ({
  employees = [],
  departments = [],
  positions = [],
  hrConfig = null,
  canManage = false,
}) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);

  // Form Cấu hình Phân hệ
  const [allowStaffViewDirectory, setAllowStaffViewDirectory] = useState(true);
  const [canStaffUploadTraining, setCanStaffUploadTraining] = useState(true);
  const [creditRotationMonths, setCreditRotationMonths] = useState(36);
  const [creditWarningMonths, setCreditWarningMonths] = useState(6);

  // Danh mục Nơi làm việc & Địa bàn tín dụng (Động trong CSDL)
  const [workLocations, setWorkLocations] = useState(() => 
    hrConfig?.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || [
      'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
      'Phòng Giao dịch số 1 (Yên Thọ)',
      'Điểm giao dịch lưu động',
    ]
  );

  const [creditAreas, setCreditAreas] = useState(() => 
    hrConfig?.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || [
      'Thôn Tân Lộc (xã Yên Thọ)',
      'Thôn Tân Hưng (xã Yên Thọ)',
      'Cụm Thôn 1, 2, 3 (xã Yên Thọ)',
      'Cụm Thôn 4, 5, 6 (xã Yên Thọ)',
      'Cụm Thôn 7, 8 (xã Quý Lộc)',
      'Địa bàn xã Quý Lộc',
      'Địa bàn xã Yên Thọ',
      'Địa bàn liên xã mở rộng',
    ]
  );

  // Danh sách chi tiết kèm ID từ CSDL Firestore
  const [workLocationsList, setWorkLocationsList] = useState([]);
  const [creditAreasList, setCreditAreasList] = useState([]);

  useEffect(() => {
    const unsubLoc = subscribeWorkLocations((list) => {
      if (list && list.length > 0) {
        setWorkLocationsList(list);
        setWorkLocations(list.map((l) => l.name));
      }
    });
    const unsubArea = subscribeCreditAreas((list) => {
      if (list && list.length > 0) {
        setCreditAreasList(list);
        setCreditAreas(list.map((a) => a.name));
      }
    });
    return () => {
      unsubLoc();
      unsubArea();
    };
  }, []);

    // State thêm mới & chỉnh sửa trực tiếp
  const [newWorkLocation, setNewWorkLocation] = useState('');
  const [newCreditArea, setNewCreditArea] = useState('');
  const [editingWorkLocIndex, setEditingWorkLocIndex] = useState(null);
  const [editingWorkLocValue, setEditingWorkLocValue] = useState('');
  const [editingCreditAreaIndex, setEditingCreditAreaIndex] = useState(null);
  const [editingCreditAreaValue, setEditingCreditAreaValue] = useState('');

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

      if (Array.isArray(hrConfig.workLocations) && hrConfig.workLocations.length > 0) {
        setWorkLocations(hrConfig.workLocations);
      }
      if (Array.isArray(hrConfig.creditAreas) && hrConfig.creditAreas.length > 0) {
        setCreditAreas(hrConfig.creditAreas);
      }

      const ovConfig = hrConfig.overviewDisplayConfig || {};
      setShowKpis(ovConfig.showKpis !== false);
      setShowContractStructure(ovConfig.showContractStructure !== false);
      setShowEducationStructure(ovConfig.showEducationStructure !== false);
      setShowCreditRotationMonitoring(ovConfig.showCreditRotationMonitoring !== false);
      setShowDepartmentDistribution(ovConfig.showDepartmentDistribution !== false);
    }
  }, [hrConfig]);

  // Lưu toàn bộ cấu hình phân hệ vào Firestore
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
      const cleanLocations = workLocations.map((s) => s.trim()).filter(Boolean);
      const cleanAreas = creditAreas.map((s) => s.trim()).filter(Boolean);

      const payload = {
        allowStaffViewDirectory,
        canStaffUploadTraining,
        creditRotationMonths: rotMonths,
        creditWarningMonths: warnMonths,
        workLocations: cleanLocations,
        creditAreas: cleanAreas,
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

      const successMsg = 'Đã lưu cấu hình phân hệ, nơi làm việc và địa bàn tín dụng thành công!';
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

  // Lưu riêng danh mục Nơi làm việc & Địa bàn tín dụng trực tiếp
  const handleSaveLocationsAndAreas = async () => {
    if (!canManage) return;
    setSavingLocations(true);
    try {
      const cleanLocations = workLocations.map((s) => s.trim()).filter(Boolean);
      const cleanAreas = creditAreas.map((s) => s.trim()).filter(Boolean);

      await saveSubsystemConfig('hr', {
        workLocations: cleanLocations,
        creditAreas: cleanAreas,
      });

      try {
        const cached = JSON.parse(localStorage.getItem('qtd_hr_subsystem_config') || '{}');
        localStorage.setItem('qtd_hr_subsystem_config', JSON.stringify({
          ...cached,
          workLocations: cleanLocations,
          creditAreas: cleanAreas,
        }));
      } catch {
        // ignore
      }

      const msg = 'Đã lưu danh mục Điểm làm việc & Địa bàn tín dụng vào CSDL thành công!';
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi lưu danh mục:', err);
      const msg = err.message || 'Lỗi khi lưu danh mục';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
    } finally {
      setSavingLocations(false);
    }
  };

  // --- THAO TÁC NƠI LÀM VIỆC (WORK LOCATIONS) ---
  const handleAddWorkLocation = async (e) => {
    e?.preventDefault?.();
    const val = newWorkLocation.trim();
    if (!val) return;
    if (workLocations.some((l) => l.toLowerCase() === val.toLowerCase())) {
      alert('Điểm làm việc này đã tồn tại trong danh mục!');
      return;
    }
    try {
      await saveWorkLocation({
        name: val,
        order: workLocations.length + 1,
      });
      setWorkLocations((prev) => [...prev, val]);
      setNewWorkLocation('');
      const msg = `Đã thêm điểm làm việc "${val}" vào CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi thêm điểm làm việc:', err);
      alert('Lỗi thêm điểm làm việc: ' + err.message);
    }
  };

  const handleStartEditWorkLoc = (idx, loc) => {
    setEditingWorkLocIndex(idx);
    setEditingWorkLocValue(loc);
  };

  const handleSaveEditWorkLoc = async (idx) => {
    const newVal = editingWorkLocValue.trim();
    const oldVal = workLocations[idx];
    if (!newVal || newVal === oldVal) {
      setEditingWorkLocIndex(null);
      return;
    }
    if (workLocations.some((l, i) => i !== idx && l.toLowerCase() === newVal.toLowerCase())) {
      alert('Tên điểm làm việc này đã trùng với một điểm khác trong danh mục!');
      return;
    }

    const existingItem = workLocationsList.find((l) => l.name === oldVal) || {};
    try {
      await saveWorkLocation({
        ...existingItem,
        name: newVal,
      }, oldVal);

      setWorkLocations((prev) => {
        const next = [...prev];
        next[idx] = newVal;
        return next;
      });
      setEditingWorkLocIndex(null);
      const msg = `Đã cập nhật điểm làm việc "${newVal}" vào CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi lưu điểm làm việc:', err);
      alert('Lỗi lưu điểm làm việc: ' + err.message);
    }
  };

  const handleDeleteWorkLoc = async (idx, locToDelete) => {
    if (workLocations.length <= 1) {
      alert('Cần duy trì ít nhất một điểm làm việc trong danh mục!');
      return;
    }
    const affectedEmps = employees.filter((e) => (e.workLocation || '').trim().toLowerCase() === locToDelete.trim().toLowerCase());
    if (affectedEmps.length > 0) {
      const proceed = window.confirm(
        `CẢNH BÁO: Hiện có ${affectedEmps.length} cán bộ đang làm việc tại "${locToDelete}" (${affectedEmps.map((e) => e.name).slice(0, 3).join(', ')}...). Bạn có chắc chắn muốn xóa không?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa điểm làm việc "${locToDelete}" khỏi danh mục không?`)) return;
    }

    const existingItem = workLocationsList.find((l) => l.name === locToDelete);
    try {
      if (existingItem?.id) {
        await deleteWorkLocation(existingItem.id, locToDelete);
      } else {
        const next = workLocations.filter((_, i) => i !== idx);
        await saveSubsystemConfig('hr', { workLocations: next });
      }
      setWorkLocations((prev) => prev.filter((_, i) => i !== idx));
      const msg = `Đã xóa điểm làm việc "${locToDelete}" khỏi CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi xóa điểm làm việc:', err);
      alert('Lỗi xóa điểm làm việc: ' + err.message);
    }
  };

  // --- THAO TÁC ĐỊA BÀN TÍN DỤNG (CREDIT AREAS) ---
  const handleAddCreditArea = async (e) => {
    e?.preventDefault?.();
    const val = newCreditArea.trim();
    if (!val) return;
    if (creditAreas.some((a) => a.toLowerCase() === val.toLowerCase())) {
      alert('Địa bàn tín dụng này đã tồn tại trong danh mục!');
      return;
    }
    try {
      await saveCreditArea({
        name: val,
        order: creditAreas.length + 1,
      });
      setCreditAreas((prev) => [...prev, val]);
      setNewCreditArea('');
      const msg = `Đã thêm địa bàn tín dụng "${val}" vào CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi thêm địa bàn:', err);
      alert('Lỗi thêm địa bàn: ' + err.message);
    }
  };

  const handleStartEditCreditArea = (idx, area) => {
    setEditingCreditAreaIndex(idx);
    setEditingCreditAreaValue(area);
  };

  const handleSaveEditCreditArea = async (idx) => {
    const newVal = editingCreditAreaValue.trim();
    const oldVal = creditAreas[idx];
    if (!newVal || newVal === oldVal) {
      setEditingCreditAreaIndex(null);
      return;
    }
    if (creditAreas.some((a, i) => i !== idx && a.toLowerCase() === newVal.toLowerCase())) {
      alert('Tên địa bàn này đã trùng với một địa bàn khác trong danh mục!');
      return;
    }

    const existingItem = creditAreasList.find((a) => a.name === oldVal) || {};
    try {
      await saveCreditArea({
        ...existingItem,
        name: newVal,
      }, oldVal);

      setCreditAreas((prev) => {
        const next = [...prev];
        next[idx] = newVal;
        return next;
      });
      setEditingCreditAreaIndex(null);
      const msg = `Đã cập nhật địa bàn tín dụng "${newVal}" vào CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi lưu địa bàn:', err);
      alert('Lỗi lưu địa bàn: ' + err.message);
    }
  };

  const handleDeleteCreditArea = async (idx, areaToDelete) => {
    if (creditAreas.length <= 1) {
      alert('Cần duy trì ít nhất một địa bàn tín dụng trong danh mục!');
      return;
    }
    const affectedOfficers = employees.filter(
      (e) => isCreditOfficerRole(e.position, e.department) && (e.assignedArea || '').trim().toLowerCase() === areaToDelete.trim().toLowerCase()
    );
    if (affectedOfficers.length > 0) {
      const officerNames = affectedOfficers.map((o) => o.name).join(', ');
      const proceed = window.confirm(
        `CẢNH BÁO: Địa bàn "${areaToDelete}" hiện đang được phân công cho CBTD [${officerNames}]. Bạn có chắc chắn muốn xóa khỏi danh mục không?`
      );
      if (!proceed) return;
    } else {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa địa bàn "${areaToDelete}" khỏi danh mục không?`)) return;
    }

    const existingItem = creditAreasList.find((a) => a.name === areaToDelete);
    try {
      if (existingItem?.id) {
        await deleteCreditArea(existingItem.id, areaToDelete);
      } else {
        const next = creditAreas.filter((_, i) => i !== idx);
        await saveSubsystemConfig('hr', { creditAreas: next });
      }
      setCreditAreas((prev) => prev.filter((_, i) => i !== idx));
      const msg = `Đã xóa địa bàn tín dụng "${areaToDelete}" khỏi CSDL thành công!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);
    } catch (err) {
      console.error('Lỗi xóa địa bàn:', err);
      alert('Lỗi xóa địa bàn: ' + err.message);
    }
  };

  // Khôi phục mặc định
  const handleResetLocationsAndAreas = () => {
    if (!window.confirm('Đồng chí có chắc chắn muốn khôi phục danh mục Nơi làm việc và Địa bàn tín dụng về chuẩn mặc định?')) return;
    setWorkLocations(DEFAULT_MODULE_HR_SETTINGS.workLocations);
    setCreditAreas(DEFAULT_MODULE_HR_SETTINGS.creditAreas);
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

      {/* 4. Cấu Hình Luân Chuyển Địa Bàn Cán Bộ Tín Dụng (CBTD) */}
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

      {/* 5. Danh Mục Nơi Làm Việc & Địa Bàn Tín Dụng Hoạt Động (Cho phép Chỉnh sửa & Kết nối Quan hệ CSDL) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Nơi Làm Việc &amp; Địa Bàn Tín Dụng Hoạt Động</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản trị danh mục trụ sở, địa bàn hoạt động và đồng bộ quan hệ phân công cán bộ trong CSDL
            </p>
          </div>

          {canManage && (
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleResetLocationsAndAreas}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="Khôi phục danh mục về chuẩn mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mặc định</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLocationsAndAreas}
                disabled={savingLocations}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                title="Lưu các thay đổi danh mục vào CSDL Firestore"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingLocations ? 'Đang lưu...' : 'Lưu danh mục'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* CỘT 1: Điểm Làm Việc & Trụ Sở Hoạt Động */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>Điểm Làm Việc &amp; Trụ Sở Hoạt Động ({workLocations.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  Chung toàn Quỹ
                </span>
              </div>

              {/* Danh sách các Điểm làm việc */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                {workLocations.map((loc, idx) => {
                  const assignedEmps = employees.filter(
                    (e) => (e.workLocation || '').trim().toLowerCase() === loc.trim().toLowerCase()
                  );
                  const isEditing = editingWorkLocIndex === idx;

                  if (isEditing) {
                    return (
                      <div key={idx} className="p-2 rounded-xl bg-white border-2 border-emerald-600 shadow-xs flex items-center gap-2">
                        <input
                          type="text"
                          value={editingWorkLocValue}
                          onChange={(e) => setEditingWorkLocValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditWorkLoc(idx);
                            if (e.key === 'Escape') setEditingWorkLocIndex(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                          placeholder="Nhập tên điểm làm việc..."
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditWorkLoc(idx)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                          title="Lưu thay đổi"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingWorkLocIndex(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Hủy bỏ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-2 shadow-2xs group"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 leading-snug break-words">
                            {loc}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {assignedEmps.length > 0 ? (
                              <span 
                                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 cursor-default"
                                title={`Cán bộ: ${assignedEmps.map((e) => e.name).join(', ')}`}
                              >
                                {assignedEmps.length} cán bộ đang công tác
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Chưa có cán bộ phân công
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEditWorkLoc(idx, loc)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa tên điểm làm việc"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkLoc(idx, loc)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa điểm làm việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ô Thêm điểm làm việc mới */}
            {canManage && (
              <form onSubmit={handleAddWorkLocation} className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                <input
                  type="text"
                  value={newWorkLocation}
                  onChange={(e) => setNewWorkLocation(e.target.value)}
                  placeholder="Thêm điểm làm việc / trụ sở mới..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
                <button
                  type="submit"
                  disabled={!newWorkLocation.trim()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </form>
            )}
          </div>

          {/* CỘT 2: Địa Bàn Quản Lý Tín Dụng (CBTD) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>Địa Bàn Quản Lý Tín Dụng (CBTD) ({creditAreas.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                  Chuyên biệt CBTD
                </span>
              </div>

              {/* Danh sách các Địa bàn tín dụng */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
                {creditAreas.map((area, idx) => {
                  const assignedOfficers = employees.filter(
                    (e) => isCreditOfficerRole(e.position, e.department) && (e.assignedArea || '').trim().toLowerCase() === area.trim().toLowerCase()
                  );
                  const isEditing = editingCreditAreaIndex === idx;

                  if (isEditing) {
                    return (
                      <div key={idx} className="p-2 rounded-xl bg-white border-2 border-teal-600 shadow-xs flex items-center gap-2">
                        <input
                          type="text"
                          value={editingCreditAreaValue}
                          onChange={(e) => setEditingCreditAreaValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditCreditArea(idx);
                            if (e.key === 'Escape') setEditingCreditAreaIndex(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:bg-white"
                          placeholder="Nhập tên thôn/xã địa bàn tín dụng..."
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCreditArea(idx)}
                          className="p-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg transition-colors cursor-pointer"
                          title="Lưu thay đổi"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCreditAreaIndex(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="Hủy bỏ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-2 shadow-2xs group"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 leading-snug break-words">
                            {area}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {assignedOfficers.length > 0 ? (
                              <span 
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/80 cursor-default"
                                title={`Thời gian nhận địa bàn: ${assignedOfficers[0].areaStartDate || 'Chưa cập nhật'}`}
                              >
                                <UserCheck className="w-3 h-3 text-teal-600" />
                                <span>Phụ trách: {assignedOfficers.map((o) => o.name).join(', ')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                <span>Chưa phân công CBTD</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEditCreditArea(idx, area)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa tên địa bàn tín dụng"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCreditArea(idx, area)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Xóa địa bàn tín dụng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ô Thêm địa bàn tín dụng mới */}
            {canManage && (
              <form onSubmit={handleAddCreditArea} className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                <input
                  type="text"
                  value={newCreditArea}
                  onChange={(e) => setNewCreditArea(e.target.value)}
                  placeholder="Thêm địa bàn tín dụng (thôn/xã) mới..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
                <button
                  type="submit"
                  disabled={!newCreditArea.trim()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeSettingsTab);

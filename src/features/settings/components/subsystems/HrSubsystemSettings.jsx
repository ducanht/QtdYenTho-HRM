import React, { useState } from 'react';
import { Save, MapPin, Building2, Plus, X, RotateCcw } from 'lucide-react';
import Card from '../../../../components/common/Card';
import Button from '../../../../components/common/Button';
import { DEFAULT_MODULE_HR_SETTINGS } from '../../../../lib/systemDefaults';

/**
 * Cấu hình chuyên sâu Phân hệ Nhân Sự & Luân Chuyển Cán Bộ (Quy chế NHNN)
 * Hỗ trợ cấu hình động:
 * - Chu kỳ luân chuyển cán bộ tín dụng
 * - Danh mục Địa bàn Tín dụng (thôn/xã/cụm)
 * - Danh mục Nơi làm việc / Địa bàn hoạt động (Trụ sở chính, Phòng giao dịch...)
 */
const HrSubsystemSettings = ({ hrConfig = {}, setHrConfig, onSaveConfig, isSaving }) => {
  const [newCreditArea, setNewCreditArea] = useState('');
  const [newWorkLocation, setNewWorkLocation] = useState('');

  const creditAreas = hrConfig.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || [];
  const workLocations = hrConfig.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || [];

  // Thêm địa bàn tín dụng mới
  const handleAddCreditArea = (e) => {
    e.preventDefault();
    const val = newCreditArea.trim();
    if (!val) return;
    if (creditAreas.includes(val)) {
      alert('Địa bàn tín dụng này đã tồn tại trong danh mục!');
      return;
    }
    setHrConfig((prev) => ({
      ...prev,
      creditAreas: [...creditAreas, val],
    }));
    setNewCreditArea('');
  };

  // Xóa địa bàn tín dụng
  const handleRemoveCreditArea = (areaToRemove) => {
    if (creditAreas.length <= 1) {
      alert('Cần duy trì ít nhất một địa bàn tín dụng trong danh mục!');
      return;
    }
    setHrConfig((prev) => ({
      ...prev,
      creditAreas: creditAreas.filter((a) => a !== areaToRemove),
    }));
  };

  // Thêm nơi làm việc mới
  const handleAddWorkLocation = (e) => {
    e.preventDefault();
    const val = newWorkLocation.trim();
    if (!val) return;
    if (workLocations.includes(val)) {
      alert('Nơi làm việc này đã tồn tại trong danh mục!');
      return;
    }
    setHrConfig((prev) => ({
      ...prev,
      workLocations: [...workLocations, val],
    }));
    setNewWorkLocation('');
  };

  // Xóa nơi làm việc
  const handleRemoveWorkLocation = (locToRemove) => {
    if (workLocations.length <= 1) {
      alert('Cần duy trì ít nhất một nơi làm việc / địa bàn hoạt động trong danh mục!');
      return;
    }
    setHrConfig((prev) => ({
      ...prev,
      workLocations: workLocations.filter((l) => l !== locToRemove),
    }));
  };

  // Đặt lại mặc định
  const handleResetDefaults = () => {
    if (!window.confirm('Đồng chí có chắc chắn muốn khôi phục danh mục địa bàn và nơi làm việc về chuẩn mặc định?')) return;
    setHrConfig((prev) => ({
      ...prev,
      creditAreas: DEFAULT_MODULE_HR_SETTINGS.creditAreas,
      workLocations: DEFAULT_MODULE_HR_SETTINGS.workLocations,
    }));
  };

  return (
    <Card
      title="Cấu Hình Chuyên Sâu: Phân Hệ Nhân Sự & Luân Chuyển Cán Bộ (Quy chế NHNN)"
      headerRight={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetDefaults}
            className="text-xs"
            title="Khôi phục danh mục địa bàn mặc định"
          >
            Mặc định
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            isLoading={isSaving}
            onClick={() => onSaveConfig(hrConfig)}
            className="font-bold text-xs"
          >
            Lưu cấu hình Nhân Sự
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Khối 1: Chu kỳ & Cảnh báo luân chuyển CBTD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
            <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
              Chu Kỳ Luân Chuyển Bắt Buộc Địa Bàn Tín Dụng
            </span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hrConfig.transferCycleMonths ?? 36}
                onChange={(e) =>
                  setHrConfig((prev) => ({ ...prev, transferCycleMonths: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-teal-300 rounded-xl text-center tabular-nums"
              />
              <span className="text-xs font-bold text-teal-900">
                tháng (tương đương 3 năm theo chỉ đạo NHNN)
              </span>
            </div>
            <p className="text-[11px] text-teal-700">
              Chỉ áp dụng bắt buộc đối với Cán bộ Tín dụng (CBTD). Cán bộ phụ trách địa bàn sau thời hạn này bắt buộc phải điều chuyển sang cụm thôn/xã khác để phòng ngừa rủi ro đạo đức.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Thời Gian Cảnh Báo Sắp Đến Hạn Luân Chuyển
            </span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={hrConfig.warningDaysBefore ?? 90}
                onChange={(e) =>
                  setHrConfig((prev) => ({ ...prev, warningDaysBefore: Number(e.target.value) }))
                }
                className="w-20 p-2 text-sm font-bold bg-white border border-amber-300 rounded-xl text-center tabular-nums"
              />
              <span className="text-xs font-bold text-amber-900">ngày trước khi hết chu kỳ</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Hệ thống tự động phát cảnh báo màu vàng tại trang Nhân sự để Ban Lãnh đạo chủ động xây dựng phương án nhân sự.
            </p>
          </div>
        </div>

        {/* Khối 2: Danh mục Địa bàn Tín dụng (Chuyên biệt cho Cán bộ Tín dụng) */}
        <div className="p-4.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Danh Mục Địa Bàn Tín Dụng ({creditAreas.length} địa bàn)
              </span>
            </div>
            <span className="text-[11px] font-medium text-emerald-800">
              Áp dụng phân công và theo dõi luân chuyển riêng cho Cán bộ Tín dụng
            </span>
          </div>

          {/* Danh sách thẻ địa bàn tín dụng */}
          <div className="flex flex-wrap gap-2 pt-1">
            {creditAreas.map((area, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl shadow-2xs group"
              >
                <span>{area}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCreditArea(area)}
                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title={`Xóa địa bàn ${area}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Form thêm địa bàn tín dụng mới */}
          <form onSubmit={handleAddCreditArea} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={newCreditArea}
              onChange={(e) => setNewCreditArea(e.target.value)}
              placeholder="Nhập tên địa bàn tín dụng mới (VD: Thôn 5, Thôn 6 Quý Lộc)..."
              className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              icon={Plus}
              className="font-bold text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
            >
              Thêm địa bàn
            </Button>
          </form>
        </div>

        {/* Khối 3: Danh mục Nơi làm việc / Địa bàn hoạt động (Áp dụng chung toàn đơn vị) */}
        <div className="p-4.5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Danh Mục Nơi Làm Việc &amp; Địa Bàn Hoạt Động ({workLocations.length} địa điểm)
              </span>
            </div>
            <span className="text-[11px] font-medium text-blue-800">
              Nơi làm việc thực tế của toàn thể cán bộ, thành viên HĐQT, Ban Kiểm soát
            </span>
          </div>

          {/* Danh sách thẻ nơi làm việc */}
          <div className="flex flex-wrap gap-2 pt-1">
            {workLocations.map((loc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-900 text-xs font-bold rounded-xl shadow-2xs group"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWorkLocation(loc)}
                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title={`Xóa nơi làm việc ${loc}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Form thêm nơi làm việc mới */}
          <form onSubmit={handleAddWorkLocation} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={newWorkLocation}
              onChange={(e) => setNewWorkLocation(e.target.value)}
              placeholder="Nhập nơi làm việc mới (VD: Phòng Giao dịch Quý Lộc, Điểm giao dịch số 2)..."
              className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-700/20"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              icon={Plus}
              className="font-bold text-xs bg-white text-blue-800 border-blue-300 hover:bg-blue-50"
            >
              Thêm nơi làm việc
            </Button>
          </form>
        </div>

        {/* Khối 4: Quy định biên bản bàn giao nợ */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Quy Định Biên Bản Bàn Giao Dư Nợ &amp; Hồ Sơ Thế Chấp (Áp dụng khi điều chuyển CBTD)
          </span>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 select-none">
            <input
              type="checkbox"
              checked={hrConfig.requireDebtHandover ?? true}
              onChange={(e) =>
                setHrConfig((prev) => ({ ...prev, requireDebtHandover: e.target.checked }))
              }
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Bắt buộc có biên bản bàn giao dư nợ đầy đủ trước khi cấp quyền trên địa bàn tín dụng mới</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Đảm bảo không phát sinh tranh chấp hoặc thất thoát hồ sơ vay vốn giữa cán bộ cũ và cán bộ mới tiếp nhận.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HrSubsystemSettings;

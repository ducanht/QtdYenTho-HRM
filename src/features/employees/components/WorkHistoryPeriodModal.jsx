import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  Calendar, 
  Briefcase, 
  MapPin, 
  Building2, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';
import { saveWorkHistory } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_DEPARTMENTS, DEFAULT_POSITIONS } from '../../../lib/systemDefaults';

const TRANSFER_TYPES = [
  { value: 'LUAN_CHUYEN_DINH_KY', label: 'Luân chuyển định kỳ địa bàn / vị trí' },
  { value: 'BO_NHIEM', label: 'Bổ nhiệm chức danh mới' },
  { value: 'THAY_DOI_DIA_BAN', label: 'Thay đổi phân công địa bàn tín dụng' },
  { value: 'DIEU_DONG_NOI_BO', label: 'Điều động công tác nội bộ' },
  { value: 'CONG_TAC_BAN_DAU', label: 'Tiếp nhận công tác ban đầu' },
  { value: 'KHAC', label: 'Quyết định điều động khác' },
];

const AREA_SUGGESTIONS = [
  'Địa bàn xã Quý Lộc (Cụm Thôn 1, 2, 3)',
  'Địa bàn xã Quý Lộc (Cụm Thôn 4, 5, 6)',
  'Địa bàn xã Quý Lộc (Cụm Thôn 7, 8)',
  'Toàn địa bàn xã Yên Thọ',
  'Địa bàn xã Yên Thọ (Thôn 1, 2, 3)',
  'Địa bàn xã Yên Thọ (Thôn Tân Lộc, Tân Hưng)',
  'Bộ phận Thẩm định tài sản & Hồ sơ vay vốn',
  'Phụ trách toàn diện Kế toán & Ngân quỹ',
  'Quản lý kho quỹ, tiền mặt & thu chi tại quầy',
];

/**
 * WorkHistoryPeriodModal: Modal Thêm / Chỉnh Sửa Mốc Quá Trình Công Tác & Luân Chuyển
 * Quản lý cấu trúc Timeline chi tiết: Thời gian, Chức vụ, Phòng ban, Địa bàn quản lý
 */
const WorkHistoryPeriodModal = ({
  isOpen,
  onClose,
  emp,
  initialData = null,
  departments = DEFAULT_DEPARTMENTS,
  positions = DEFAULT_POSITIONS,
  onSuccess,
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialData?.id);

  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [transferType, setTransferType] = useState('LUAN_CHUYEN_DINH_KY');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [signer, setSigner] = useState('Trịnh Đức Anh (Chủ tịch HĐQT)');
  const [handoverStatus, setHandoverStatus] = useState('DA_BAN_GIAO');
  const [notes, setNotes] = useState('');
  const [syncToProfile, setSyncToProfile] = useState(true);

  // Điền dữ liệu khi mở modal hoặc thay đổi initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setStartDate(initialData.startDate || initialData.effectiveDate || '');
        setEndDate(initialData.endDate || '');
        setIsCurrent(initialData.isCurrent !== undefined ? Boolean(initialData.isCurrent) : !initialData.endDate);
        setDepartment(initialData.department || initialData.toDepartment || emp?.department || '');
        setPosition(initialData.position || initialData.toPosition || emp?.position || '');
        setAssignedArea(initialData.assignedArea || initialData.toAssignedArea || emp?.assignedArea || '');
        setTransferType(initialData.transferType || 'LUAN_CHUYEN_DINH_KY');
        setDecisionNumber(initialData.decisionNumber || '');
        setDecisionDate(initialData.decisionDate || '');
        setSigner(initialData.signer || 'Trịnh Đức Anh (Chủ tịch HĐQT)');
        setHandoverStatus(initialData.handoverStatus || 'DA_BAN_GIAO');
        setNotes(initialData.notes || initialData.reason || '');
        setSyncToProfile(Boolean(initialData.isCurrent));
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
        setEndDate('');
        setIsCurrent(false);
        setDepartment(emp?.department || (departments[0]?.name || 'Phòng Tín dụng'));
        setPosition(emp?.position || (positions[0]?.name || 'Cán bộ tín dụng'));
        setAssignedArea(emp?.assignedArea || '');
        setTransferType('LUAN_CHUYEN_DINH_KY');
        setDecisionNumber('');
        setDecisionDate(today);
        setSigner('Trịnh Đức Anh (Chủ tịch HĐQT)');
        setHandoverStatus('DA_BAN_GIAO');
        setNotes('');
        setSyncToProfile(true);
      }
    }
  }, [isOpen, initialData, emp, departments, positions]);

  // Kiểm tra nếu là cán bộ tín dụng để làm nổi bật địa bàn
  const isCreditDept = useMemo(() => {
    const d = (department || '').toLowerCase();
    const p = (position || '').toLowerCase();
    return d.includes('tín dụng') || p.includes('tín dụng') || p.includes('thẩm định');
  }, [department, position]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emp) {
      toast?.showError?.('Không tìm thấy thông tin cán bộ.');
      return;
    }
    if (!startDate) {
      toast?.showError?.('Vui lòng chọn ngày bắt đầu mốc công tác.');
      return;
    }
    if (!isCurrent && endDate && startDate > endDate) {
      toast?.showError?.('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
      return;
    }
    if (!position.trim()) {
      toast?.showError?.('Vui lòng chọn hoặc nhập chức danh công tác.');
      return;
    }
    if (!department.trim()) {
      toast?.showError?.('Vui lòng chọn phòng ban công tác.');
      return;
    }

    setSubmitting(true);
    try {
      const typeLabel = TRANSFER_TYPES.find((t) => t.value === transferType)?.label || 'Điều động công tác';
      const payload = {
        id: initialData?.id || undefined,
        employeeId: emp.id,
        employeeCode: emp.code || '',
        employeeName: emp.name || '',
        startDate,
        endDate: isCurrent ? '' : endDate,
        isCurrent: Boolean(isCurrent),
        position: position.trim(),
        department: department.trim(),
        assignedArea: assignedArea.trim(),
        transferType,
        transferTypeLabel: typeLabel,
        decisionNumber: decisionNumber.trim(),
        decisionDate: decisionDate || startDate,
        effectiveDate: startDate,
        toPosition: position.trim(),
        toDepartment: department.trim(),
        toAssignedArea: assignedArea.trim(),
        fromPosition: initialData?.fromPosition || emp.position || '',
        fromDepartment: initialData?.fromDepartment || emp.department || '',
        fromAssignedArea: initialData?.fromAssignedArea || emp.assignedArea || '',
        signer: signer.trim(),
        handoverStatus,
        notes: notes.trim(),
        reason: notes.trim(),
        syncToProfile: Boolean(syncToProfile && isCurrent),
      };

      await saveWorkHistory(payload);
      toast?.showSuccess?.(isEditing ? 'Cập nhật mốc công tác thành công' : 'Đã thêm mốc quá trình công tác mới');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi lưu thông tin mốc công tác');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh Sửa Mốc Quá Trình Công Tác' : 'Thêm Mốc Quá Trình Công Tác'}
      subtitle={emp ? `Cán bộ: ${emp.name} • ${emp.position || ''}` : ''}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* 1. Thời Gian Công Tác & Trạng Thái Hiện Tại */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Thời Gian Công Tác</span>
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => {
                  setIsCurrent(e.target.checked);
                  if (e.target.checked) setEndDate('');
                }}
                className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600"
              />
              <span className="font-bold text-slate-800 text-[11px]">Đang đảm nhiệm mốc này</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Từ Ngày (Bắt đầu) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Đến Ngày (Kết thúc)
              </label>
              {isCurrent ? (
                <div className="w-full px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Đang công tác hiện tại (Đến nay)</span>
                </div>
              ) : (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans tabular-nums"
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. Chức Danh & Phòng Ban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Phòng Ban / Bộ Phận <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
              >
                {departments.map((d) => (
                  <option key={d.id || d.code || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Chức Danh / Vị Trí Công Tác <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="position-datalist"
              required
              placeholder="Chọn hoặc nhập chức danh"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            />
            <datalist id="position-datalist">
              {positions.map((p) => (
                <option key={p.id || p.code || p.name} value={p.name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* 3. Địa Bàn Quản Lý (Nổi Bật Với Cán Bộ Tín Dụng) */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isCreditDept 
            ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className={`w-4 h-4 ${isCreditDept ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>Địa Bàn Quản Lý / Phụ Trách Nghiệp Vụ</span>
              {isCreditDept && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Phục vụ tính thâm niên địa bàn
                </span>
              )}
            </label>
          </div>

          <input
            type="text"
            placeholder="Ví dụ: Địa bàn xã Quý Lộc (Cụm Thôn 1, 2, 3), Toàn xã Yên Thọ..."
            value={assignedArea}
            onChange={(e) => setAssignedArea(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
          />

          {/* Gợi ý chọn nhanh địa bàn chuẩn */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-medium">Gợi ý nhanh:</span>
            {AREA_SUGGESTIONS.map((area) => (
              <button
                type="button"
                key={area}
                onClick={() => setAssignedArea(area)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  assignedArea === area 
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Loại Điều Động & Quyết Định Phê Chuẩn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Hình Thức Điều Động
            </label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            >
              {TRANSFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Số Quyết Định (Nếu có)
            </label>
            <input
              type="text"
              placeholder="VD: 24/QĐ-HĐQT-2022"
              value={decisionNumber}
              onChange={(e) => setDecisionNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ngày Ban Hành QĐ
            </label>
            <input
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans tabular-nums"
            />
          </div>
        </div>

        {/* 5. Người Ký & Trạng Thái Bàn Giao */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Người Ký / Thẩm Quyền Phê Duyệt
            </label>
            <input
              type="text"
              placeholder="Chủ tịch HĐQT hoặc Giám đốc"
              value={signer}
              onChange={(e) => setSigner(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Tình Trạng Bàn Giao Hồ Sơ / Tài Sản
            </label>
            <select
              value={handoverStatus}
              onChange={(e) => setHandoverStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
            >
              <option value="DA_BAN_GIAO">Đã hoàn tất bàn giao đầy đủ</option>
              <option value="DANG_BAN_GIAO">Đang tiến hành kiểm kê bàn giao</option>
              <option value="CHUA_BAN_GIAO">Chưa bàn giao hồ sơ</option>
            </select>
          </div>
        </div>

        {/* 6. Nhiệm Vụ Trọng Tâm / Ghi Chú */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Nhiệm Vụ Trọng Tâm & Ghi Chú Mốc Công Tác
          </label>
          <textarea
            rows={2}
            placeholder="Mô tả công việc phụ trách, căn cứ luân chuyển, bàn giao tài sản bảo đảm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans"
          />
        </div>

        {/* 7. Đồng Bộ Sang Hồ Sơ Hiện Tại */}
        {isCurrent && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  Đồng bộ mốc này vào thông tin hồ sơ hiện tại
                </p>
                <p className="text-[11px] text-slate-600">
                  Tự động cập nhật Chức vụ, Phòng ban, Địa bàn và Ngày nhận vị trí vào hồ sơ cán bộ.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncToProfile}
              onChange={(e) => setSyncToProfile(e.target.checked)}
              className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy Bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
          >
            {submitting ? 'Đang lưu...' : (isEditing ? 'Lưu Thay Đổi' : 'Tạo Mốc Công Tác')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(WorkHistoryPeriodModal);

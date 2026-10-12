import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Building2, 
  UserCheck, 
  Briefcase 
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { saveWorkHistory } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { DEFAULT_DEPARTMENTS, DEFAULT_POSITIONS } from '../../../lib/systemDefaults';

export const TRANSFER_TYPES = [
  { value: 'LUAN_CHUYEN_DINH_KY', label: 'Luân chuyển định kỳ' },
  { value: 'BO_NHIEM', label: 'Bổ nhiệm chức vụ' },
  { value: 'THAY_DOI_DIA_BAN', label: 'Thay đổi địa bàn tín dụng' },
  { value: 'DIEU_DONG_NOI_BO', label: 'Điều động nội bộ' },
  { value: 'CONG_TAC_BAN_DAU', label: 'Tiếp nhận / Công tác ban đầu' },
];

/**
 * WorkHistoryPeriodModal: Modal Thêm Mới & Chỉnh Sửa Mốc Quá Trình Công Tác (Timeline)
 * Phục vụ theo dõi thâm niên vị trí, địa bàn tín dụng và giám sát luân chuyển theo quy định NHNN
 */
const WorkHistoryPeriodModal = ({
  isOpen,
  onClose,
  selectedEmp,
  editingRecord = null,
  departments = [],
  positions = [],
  onSuccess,
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Chuẩn hóa danh sách phòng ban & chức vụ
  const deptList = useMemo(() => {
    if (Array.isArray(departments) && departments.length > 0) {
      return departments.map((d) => (typeof d === 'string' ? d : d.name || d.title || ''));
    }
    return DEFAULT_DEPARTMENTS.map((d) => d.name);
  }, [departments]);

  const posList = useMemo(() => {
    if (Array.isArray(positions) && positions.length > 0) {
      return positions.map((p) => (typeof p === 'string' ? p : p.name || p.title || ''));
    }
    return DEFAULT_POSITIONS.map((p) => p.name);
  }, [positions]);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [transferType, setTransferType] = useState('LUAN_CHUYEN_DINH_KY');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [signer, setSigner] = useState('Trịnh Đức Anh - Chủ tịch HĐQT');
  const [notes, setNotes] = useState('');
  const [syncToProfile, setSyncToProfile] = useState(true);

  // Nhận diện Cán bộ Tín dụng để làm nổi bật địa bàn
  const isCreditOfficer = useMemo(() => {
    const dept = (department || '').toLowerCase();
    const pos = (position || '').toLowerCase();
    return dept.includes('tín dụng') || pos.includes('tín dụng') || Boolean(assignedArea);
  }, [department, position, assignedArea]);

  // Khởi tạo và đồng bộ dữ liệu form khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setStartDate(editingRecord.startDate || editingRecord.effectiveDate || '');
        setEndDate(editingRecord.endDate || '');
        setIsCurrent(editingRecord.isCurrent !== undefined ? Boolean(editingRecord.isCurrent) : !editingRecord.endDate);
        setPosition(editingRecord.position || editingRecord.toPosition || '');
        setDepartment(editingRecord.department || editingRecord.toDepartment || deptList[0] || 'Phòng Tín dụng');
        setAssignedArea(editingRecord.assignedArea || editingRecord.toAssignedArea || '');
        setTransferType(editingRecord.transferType || 'LUAN_CHUYEN_DINH_KY');
        setDecisionNumber(editingRecord.decisionNumber || '');
        setDecisionDate(editingRecord.decisionDate || '');
        setSigner(editingRecord.signer || 'Trịnh Đức Anh - Chủ tịch HĐQT');
        setNotes(editingRecord.notes || editingRecord.reason || '');
        setSyncToProfile(Boolean(editingRecord.isCurrent));
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(selectedEmp?.positionStartDate || selectedEmp?.joinDate || today);
        setEndDate('');
        setIsCurrent(true);
        setPosition(selectedEmp?.position || '');
        setDepartment(selectedEmp?.department || deptList[0] || 'Phòng Tín dụng');
        setAssignedArea(selectedEmp?.assignedArea || '');
        setTransferType('LUAN_CHUYEN_DINH_KY');
        setDecisionNumber('');
        setDecisionDate('');
        setSigner('Trịnh Đức Anh - Chủ tịch HĐQT');
        setNotes('');
        setSyncToProfile(true);
      }
    }
  }, [isOpen, editingRecord, selectedEmp, deptList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) {
      toast?.showError?.('Vui lòng chọn cán bộ thực hiện');
      return;
    }
    if (!position.trim()) {
      toast?.showError?.('Vui lòng nhập hoặc chọn chức danh công tác');
      return;
    }
    if (!department.trim()) {
      toast?.showError?.('Vui lòng chọn phòng ban công tác');
      return;
    }
    if (!startDate) {
      toast?.showError?.('Vui lòng chọn ngày bắt đầu mốc công tác');
      return;
    }
    if (!isCurrent && !endDate) {
      toast?.showError?.('Vui lòng nhập ngày kết thúc đối với mốc công tác trong quá khứ');
      return;
    }
    if (!isCurrent && endDate && startDate && endDate < startDate) {
      toast?.showError?.('Ngày kết thúc không được trước ngày bắt đầu');
      return;
    }
    if (isCreditOfficer && !assignedArea.trim()) {
      toast?.showError?.('Vui lòng nhập địa bàn quản lý đối với chức vụ Cán bộ Tín dụng');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...(editingRecord?.id ? { id: editingRecord.id } : {}),
        employeeId: selectedEmp.id,
        employeeUuid: selectedEmp.uuid || selectedEmp.id,
        employeeCode: selectedEmp.code || '',
        employeeName: selectedEmp.name || '',
        startDate,
        endDate: isCurrent ? '' : endDate,
        isCurrent: Boolean(isCurrent),
        effectiveDate: startDate,
        position: position.trim(),
        department: department.trim(),
        assignedArea: assignedArea.trim(),
        toPosition: position.trim(),
        toDepartment: department.trim(),
        toAssignedArea: assignedArea.trim(),
        transferType,
        transferTypeLabel: TRANSFER_TYPES.find((t) => t.value === transferType)?.label || transferType,
        decisionNumber: decisionNumber.trim(),
        decisionDate: decisionDate || '',
        signer: signer.trim(),
        notes: notes.trim(),
        reason: notes.trim(),
        syncToProfile: Boolean(isCurrent && syncToProfile),
      };

      await saveWorkHistory(payload);
      toast?.showSuccess?.(
        editingRecord 
          ? 'Đã cập nhật mốc công tác thành công' 
          : 'Đã thêm mốc quá trình công tác mới thành công'
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu mốc quá trình công tác');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? 'Chỉnh Sửa Mốc Quá Trình Công Tác' : 'Thêm Mốc Quá Trình Công Tác Mới'}
      subtitle={selectedEmp ? `Cán bộ: ${selectedEmp.name} • Quỹ TDND Yên Thọ` : 'Quỹ TDND Yên Thọ'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Khối 1: Khoảng thời gian & Trạng thái đảm nhiệm */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thời Gian Công Tác</span>
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsCurrent(checked);
                  if (checked) {
                    setEndDate('');
                  }
                }}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span>Đang đảm nhiệm (Mốc hiện tại)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Từ ngày (Bắt đầu): <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Đến ngày (Kết thúc): {!isCurrent && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="date"
                disabled={isCurrent}
                required={!isCurrent}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder={isCurrent ? 'Đang công tác (Đến nay)' : ''}
                className={`w-full px-3 py-2 border rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 ${
                  isCurrent 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed italic' 
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>
          </div>

          {isCurrent && (
            <div className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-300 flex items-start gap-2">
              <input
                type="checkbox"
                id="sync-profile-checkbox"
                checked={syncToProfile}
                onChange={(e) => setSyncToProfile(e.target.checked)}
                className="mt-0.5 rounded border-emerald-400 text-emerald-700 focus:ring-emerald-600"
              />
              <label htmlFor="sync-profile-checkbox" className="text-[11px] text-emerald-950 font-medium leading-snug cursor-pointer select-none">
                <span className="font-extrabold text-emerald-900">Đồng bộ sang Hồ sơ cán bộ:</span> Tự động cập nhật chức vụ, phòng ban và địa bàn quản lý này thành thông tin công tác hiện tại trong hồ sơ của cán bộ.
              </label>
            </div>
          )}
        </div>

        {/* Khối 2: Chức vụ & Phòng ban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Phòng ban đảm nhiệm: <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              {deptList.map((d, idx) => (
                <option key={idx} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Chức vụ / Vị trí công tác: <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              list="work-history-positions"
              required
              placeholder="VD: Cán bộ tín dụng / Kế toán viên"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="work-history-positions">
              {posList.map((pos, idx) => (
                <option key={idx} value={pos} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Khối 3: Địa bàn quản lý tín dụng (Bắt buộc và nổi bật với CBTD) */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isCreditOfficer 
            ? 'bg-emerald-50/70 border-emerald-300' 
            : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className={`w-4 h-4 ${isCreditOfficer ? 'text-emerald-700' : 'text-slate-500'}`} />
              <span>Địa bàn quản lý tín dụng:</span>
              {isCreditOfficer && <span className="text-rose-500">*</span>}
            </label>
            {isCreditOfficer && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Theo dõi luân chuyển NHNN (36 tháng)
              </span>
            )}
          </div>
          <input
            type="text"
            required={isCreditOfficer}
            placeholder="VD: Thôn Tân Lộc, Thôn 1 Quý Lộc / Toàn xã Yên Thọ"
            value={assignedArea}
            onChange={(e) => setAssignedArea(e.target.value)}
            className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 ${
              isCreditOfficer ? 'border-emerald-300 font-bold' : 'border-slate-200'
            }`}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {isCreditOfficer
              ? '* Bắt buộc phân công địa bàn quản lý (thôn/xã) đối với Cán bộ Tín dụng để tính chu kỳ luân chuyển định kỳ.'
              : 'Phạm vi công việc hoặc cơ sở phụ trách (nếu có).'}
          </p>
        </div>

        {/* Khối 4: Hình thức điều chuyển, Quyết định & Người ký */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Hình thức công tác:</label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              {TRANSFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Số Quyết định (nếu có):</span>
            </label>
            <input
              type="text"
              placeholder="VD: 18/QĐ-HĐQT-2026"
              value={decisionNumber}
              onChange={(e) => setDecisionNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Ngày ký quyết định:</label>
            <input
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Khối 5: Người ký & Ghi chú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Người ký quyết định:</span>
            </label>
            <input
              type="text"
              placeholder="Trịnh Đức Anh - Chủ tịch HĐQT"
              value={signer}
              onChange={(e) => setSigner(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Ghi chú / Căn cứ công tác:</label>
            <input
              type="text"
              placeholder="Ghi chú thêm về mốc quá trình công tác..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Nút hành động */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            icon={CheckCircle2}
          >
            {editingRecord ? 'Cập nhật mốc công tác' : 'Lưu mốc công tác'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(WorkHistoryPeriodModal);

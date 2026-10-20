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
import DatePicker from '../../../components/common/DatePicker';
import { saveWorkHistory, updateEmployeeProfile } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { isCreditOfficerRole } from '../../../lib/evaluationUtils';
import { 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_POSITIONS, 
  DEFAULT_MODULE_HR_SETTINGS 
} from '../../../lib/systemDefaults';

export const TRANSFER_TYPES = [
  { value: 'LUAN_CHUYEN_DINH_KY', label: 'Luân chuyển định kỳ' },
  { value: 'BO_NHIEM', label: 'Bổ nhiệm chức vụ' },
  { value: 'THAY_DOI_DIA_BAN', label: 'Thay đổi địa bàn tín dụng' },
  { value: 'DIEU_DONG_NOI_BO', label: 'Điều động nội bộ' },
  { value: 'CONG_TAC_BAN_DAU', label: 'Tiếp nhận / Công tác ban đầu' },
];

/**
 * WorkHistoryPeriodModal: Modal Thêm Mới & Chỉnh Sửa Mốc Quá Trình Công Tác (Timeline)
 * Phục vụ theo dõi thâm niên vị trí, nơi làm việc, địa bàn tín dụng và giám sát luân chuyển theo quy định NHNN
 */
const WorkHistoryPeriodModal = ({
  isOpen,
  onClose,
  selectedEmp: propSelectedEmp,
  emp,
  editingRecord: propEditingRecord,
  record,
  departments = [],
  positions = [],
  hrConfig = null,
  onSuccess,
  zIndex = 'z-50',
}) => {
  const selectedEmp = propSelectedEmp || emp;
  const editingRecord = propEditingRecord || record || null;
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

  // Danh mục nơi làm việc & địa bàn tín dụng từ cấu hình phân hệ
  const workLocationList = useMemo(() => {
    return hrConfig?.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || [
      'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
      'Phòng Giao dịch số 1 (Yên Thọ)',
      'Điểm giao dịch lưu động',
    ];
  }, [hrConfig]);

  const creditAreaList = useMemo(() => {
    return hrConfig?.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || [
      'Thôn Tân Lộc (xã Yên Thọ)',
      'Thôn Tân Hưng (xã Yên Thọ)',
      'Cụm Thôn 1, 2, 3 (xã Yên Thọ)',
      'Cụm Thôn 4, 5, 6 (xã Yên Thọ)',
      'Cụm Thôn 7, 8 (xã Quý Lộc)',
      'Địa bàn xã Quý Lộc',
      'Địa bàn xã Yên Thọ',
      'Địa bàn liên xã mở rộng',
    ];
  }, [hrConfig]);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(true);
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [assignedArea, setAssignedArea] = useState('');
  const [transferType, setTransferType] = useState('LUAN_CHUYEN_DINH_KY');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [signer, setSigner] = useState('Trịnh Đức Anh - Chủ tịch HĐQT');
  const [notes, setNotes] = useState('');
  const [syncToProfile, setSyncToProfile] = useState(true);

  // Nhận diện Cán bộ Tín dụng theo chức danh:
  // CHỈ CBTD mới có địa bàn quản lý tín dụng. Các chức danh HĐQT, BKS, Giám đốc, Kế toán... KHÔNG có địa bàn.
  const isCreditOfficer = useMemo(() => {
    return isCreditOfficerRole(position, department);
  }, [position, department]);

  // Khởi tạo và đồng bộ dữ liệu form khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        setStartDate(editingRecord.startDate || editingRecord.effectiveDate || '');
        setEndDate(editingRecord.endDate || '');
        setIsCurrent(editingRecord.isCurrent !== undefined ? Boolean(editingRecord.isCurrent) : !editingRecord.endDate);
        setPosition(editingRecord.position || editingRecord.toPosition || '');
        setDepartment(editingRecord.department || editingRecord.toDepartment || deptList[0] || 'Phòng Tín dụng');
        setWorkLocation(editingRecord.workLocation || selectedEmp?.workLocation || workLocationList[0]);
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
        setWorkLocation(selectedEmp?.workLocation || workLocationList[0]);
        setAssignedArea(selectedEmp?.assignedArea || '');
        setTransferType('LUAN_CHUYEN_DINH_KY');
        setDecisionNumber('');
        setDecisionDate('');
        setSigner('Trịnh Đức Anh - Chủ tịch HĐQT');
        setNotes('');
        setSyncToProfile(true);
      }
    }
  }, [isOpen, editingRecord, selectedEmp, deptList, workLocationList]);

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
    if (!workLocation.trim()) {
      toast?.showError?.('Vui lòng nhập hoặc chọn nơi làm việc / địa bàn hoạt động');
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
      toast?.showError?.('Vui lòng chọn hoặc nhập địa bàn quản lý đối với chức danh Cán bộ Tín dụng');
      return;
    }

    setSubmitting(true);
    try {
      const cleanAssignedArea = isCreditOfficer ? assignedArea.trim() : '';

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
        workLocation: workLocation.trim(),
        assignedArea: cleanAssignedArea,
        toPosition: position.trim(),
        toDepartment: department.trim(),
        toWorkLocation: workLocation.trim(),
        toAssignedArea: cleanAssignedArea,
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

      // Đồng bộ thông tin hiện tại sang hồ sơ cán bộ nếu checkbox được chọn
      if (isCurrent && syncToProfile) {
        const updateData = {
          position: position.trim(),
          department: department.trim(),
          positionStartDate: startDate,
          workLocation: workLocation.trim(),
          assignedArea: cleanAssignedArea,
        };
        if (isCreditOfficer && cleanAssignedArea) {
          updateData.areaStartDate = startDate;
        }
        await updateEmployeeProfile(selectedEmp.id, updateData).catch((err) => {
          console.warn('Lỗi đồng bộ hồ sơ cán bộ:', err);
        });
      }

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
      subtitle={`Cán bộ: ${selectedEmp?.name || '—'} • Quỹ Tín Dụng Nhân Dân Yên Thọ`}
      maxWidth="max-w-2xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Khối 1: Thời gian công tác */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời Gian Công Tác</span>
            </h4>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsCurrent(val);
                  if (val) setEndDate('');
                }}
                className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700"
              />
              <span className="font-bold text-slate-800">Đang đảm nhiệm (Mốc hiện tại)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DatePicker
              label="Từ ngày (Bắt đầu)"
              required
              value={startDate}
              onChange={(val) => setStartDate(typeof val === 'string' ? val : val?.target?.value || '')}
              placeholder="Chọn ngày bắt đầu"
            />

            <DatePicker
              label="Đến ngày (Kết thúc)"
              disabled={isCurrent}
              required={!isCurrent}
              value={endDate}
              onChange={(val) => setEndDate(typeof val === 'string' ? val : val?.target?.value || '')}
              placeholder={isCurrent ? 'Đang công tác (Đến nay)' : 'Chọn ngày kết thúc'}
            />
          </div>

          {isCurrent && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncToProfile}
                onChange={(e) => setSyncToProfile(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span className="font-medium">Đồng bộ chức vụ, nơi làm việc và địa bàn vào hồ sơ cán bộ</span>
            </label>
          )}
        </div>

        {/* Khối 2: Chức vụ & Phòng ban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Phòng ban: <span className="text-rose-500">*</span></span>
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
              <span>Chức vụ: <span className="text-rose-500">*</span></span>
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

        {/* Khối 3: Nơi làm việc / Địa bàn hoạt động (Áp dụng chung cho TẤT CẢ chức danh) */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Nơi làm việc / Địa bàn hoạt động: <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            list="work-history-locations"
            required
            placeholder="VD: Trụ sở chính - Quỹ TDND Yên Thọ / Phòng Giao dịch số 1"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
          <datalist id="work-history-locations">
            {workLocationList.map((loc, idx) => (
              <option key={idx} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Khối 4: Địa bàn quản lý tín dụng (CHỈ áp dụng đối với Cán bộ Tín dụng. Các chức danh HĐQT, BKS, Kế toán... KHÔNG hiển thị) */}
        {isCreditOfficer && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5">
            <label className="block text-slate-900 font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Địa bàn quản lý tín dụng: <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              list="credit-area-suggestions"
              required={isCreditOfficer}
              placeholder="Chọn hoặc nhập địa bàn tín dụng phụ trách (thôn/xã)..."
              value={assignedArea}
              onChange={(e) => setAssignedArea(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="credit-area-suggestions">
              {creditAreaList.map((area, idx) => (
                <option key={idx} value={area} />
              ))}
            </datalist>
            <p className="text-[11px] text-emerald-800">
              * Áp dụng bắt buộc phân công địa bàn chuyên trách và giám sát chu kỳ luân chuyển định kỳ đối với Cán bộ Tín dụng.
            </p>
          </div>
        )}

        {/* Khối 5: Hình thức điều chuyển, Quyết định & Người ký */}
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

          <DatePicker
            label="Ngày ký quyết định"
            value={decisionDate}
            onChange={(val) => setDecisionDate(typeof val === 'string' ? val : val?.target?.value || '')}
            placeholder="Chọn ngày ký quyết định"
          />
        </div>

        {/* Khối 6: Người ký & Ghi chú */}
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

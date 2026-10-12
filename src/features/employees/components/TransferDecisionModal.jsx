import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { saveWorkHistory } from '../../../lib/services';
import { isCreditOfficerRole } from '../../../lib/evaluationUtils';
import { DEFAULT_MODULE_HR_SETTINGS } from '../../../lib/systemDefaults';
import { useToast } from '../../../context/ToastContext';

/**
 * TransferDecisionModal: Modal lập Quyết định Điều động & Luân chuyển cán bộ
 * Lưu vào collection riêng `work_history` và đồng bộ chức vụ/địa bàn hiện tại
 */
const TransferDecisionModal = ({
  isOpen,
  onClose,
  selectedEmp,
  employees = [],
  departments = [],
  positions = [],
  hrConfig = null,
  onSuccess,
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetEmpId, setTargetEmpId] = useState(selectedEmp?.id || '');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [decisionDate, setDecisionDate] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferType, setTransferType] = useState('LUAN_CHUYEN_DINH_KY');
  const [toDepartment, setToDepartment] = useState('');
  const [toPosition, setToPosition] = useState('');
  const [toWorkLocation, setToWorkLocation] = useState('');
  const [toAssignedArea, setToAssignedArea] = useState('');
  const [signer, setSigner] = useState('Trịnh Đức Anh - Chủ tịch HĐQT');
  const [handoverStatus, setHandoverStatus] = useState('DANG_BAN_GIAO');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [syncToProfile, setSyncToProfile] = useState(true);

  // Cập nhật khi selectedEmp thay đổi
  useEffect(() => {
    if (selectedEmp) {
      setTargetEmpId(selectedEmp.id);
      setToDepartment(selectedEmp.department || '');
      setToPosition(selectedEmp.position || '');
      setToWorkLocation(selectedEmp.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
      setToAssignedArea(selectedEmp.assignedArea || '');
    }
  }, [selectedEmp]);

  const currentTargetEmp = employees.find((e) => e.id === targetEmpId) || selectedEmp;
  const isTargetCreditOfficer = isCreditOfficerRole(toPosition, toDepartment);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTargetEmp) {
      toast?.showError?.('Vui lòng chọn cán bộ thực hiện điều động');
      return;
    }
    if (!decisionNumber.trim()) {
      toast?.showError?.('Vui lòng nhập số quyết định');
      return;
    }
    if (!toPosition.trim()) {
      toast?.showError?.('Vui lòng chọn hoặc nhập chức vụ mới');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: currentTargetEmp.id,
        employeeUuid: currentTargetEmp.uuid || currentTargetEmp.id,
        employeeCode: currentTargetEmp.code || '',
        employeeName: currentTargetEmp.name || '',
        decisionNumber: decisionNumber.trim(),
        decisionDate,
        effectiveDate,
        transferType,
        fromDepartment: currentTargetEmp.department || '',
        toDepartment: toDepartment || currentTargetEmp.department || '',
        fromPosition: currentTargetEmp.position || '',
        toPosition: toPosition.trim(),
        fromWorkLocation: currentTargetEmp.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
        toWorkLocation: toWorkLocation.trim() || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
        workLocation: toWorkLocation.trim() || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
        fromAssignedArea: currentTargetEmp.assignedArea || '',
        toAssignedArea: isTargetCreditOfficer ? toAssignedArea.trim() : '',
        assignedArea: isTargetCreditOfficer ? toAssignedArea.trim() : '',
        signer,
        handoverStatus,
        reason: reason.trim(),
        notes: notes.trim(),
        syncToProfile,
      };

      await saveWorkHistory(payload);
      toast?.showSuccess?.(`Đã lưu quyết định luân chuyển số ${decisionNumber} thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu quyết định điều động');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lập Quyết Định Điều Động & Luân Chuyển Cán Bộ"
      subtitle="Quỹ Tín Dụng Nhân Dân Yên Thọ • Theo quy định Thống đốc NHNN"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Chọn cán bộ */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Cán bộ điều động / luân chuyển:
          </label>
          <select
            value={targetEmpId}
            onChange={(e) => {
              const newId = e.target.value;
              setTargetEmpId(newId);
              const found = employees.find((emp) => emp.id === newId);
              if (found) {
                setToDepartment(found.department || '');
                setToPosition(found.position || '');
                setToWorkLocation(found.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
                setToAssignedArea(found.assignedArea || '');
              }
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.position} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        {/* Số QĐ & Ngày ký & Ngày hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Số Quyết định:</label>
            <input
              type="text"
              placeholder="VD: 18/QĐ-HĐQT-2026"
              value={decisionNumber}
              onChange={(e) => setDecisionNumber(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Ngày ký quyết định:</label>
            <input
              type="date"
              value={decisionDate}
              onChange={(e) => setDecisionDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Ngày có hiệu lực:</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Hình thức luân chuyển & Người ký */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Hình thức điều động:</label>
            <select
              value={transferType}
              onChange={(e) => setTransferType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="LUAN_CHUYEN_DINH_KY">Luân chuyển định kỳ địa bàn tín dụng</option>
              <option value="BO_NHIEM">Bổ nhiệm chức vụ mới</option>
              <option value="THAY_DOI_DIA_BAN">Thay đổi địa bàn phụ trách tín dụng</option>
              <option value="DIEU_DONG">Điều động nội bộ phòng ban</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Người ký quyết định:</label>
            <input
              type="text"
              value={signer}
              onChange={(e) => setSigner(e.target.value)}
              placeholder="VD: Trịnh Đức Anh - Chủ tịch HĐQT"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Phòng ban mới & Chức vụ mới */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Phòng ban tiếp nhận mới:</label>
            <select
              value={toDepartment}
              onChange={(e) => setToDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Chức vụ mới được bổ nhiệm:</label>
            <input
              type="text"
              value={toPosition}
              onChange={(e) => setToPosition(e.target.value)}
              placeholder="VD: Cán bộ tín dụng / Kế toán viên"
              required
              list="transfer-positions-list"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="transfer-positions-list">
              {positions.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Nơi làm việc mới (Địa bàn hoạt động) */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Nơi làm việc tiếp nhận mới (Địa bàn hoạt động):
          </label>
          <input
            type="text"
            list="transfer-work-locations-list"
            value={toWorkLocation}
            onChange={(e) => setToWorkLocation(e.target.value)}
            placeholder="VD: Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)"
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
          <datalist id="transfer-work-locations-list">
            {(hrConfig?.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || []).map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Địa bàn mới & Tình trạng bàn giao */}
        <div className={`grid grid-cols-1 ${isTargetCreditOfficer ? 'sm:grid-cols-2' : ''} gap-3`}>
          {isTargetCreditOfficer && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Địa bàn phụ trách tín dụng mới:</label>
              <input
                type="text"
                list="transfer-credit-areas-list"
                value={toAssignedArea}
                onChange={(e) => setToAssignedArea(e.target.value)}
                placeholder="VD: Xã Quý Lộc / Cụm 3 thôn xã Yên Thọ"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
              <datalist id="transfer-credit-areas-list">
                {(hrConfig?.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || []).map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>
          )}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tình trạng bàn giao hồ sơ & sổ sách:</label>
            <select
              value={handoverStatus}
              onChange={(e) => setHandoverStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="DANG_BAN_GIAO">Đang tiến hành bàn giao hồ sơ</option>
              <option value="DA_BAN_GIAO">Đã hoàn tất bàn giao đầy đủ</option>
              <option value="CHUA_BAN_GIAO">Chưa tiến hành bàn giao</option>
            </select>
          </div>
        </div>

        {/* Căn cứ điều động & Ghi chú */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Căn cứ & Lý do điều động:</label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Căn cứ Nghị quyết Hội đồng Quản trị và Kế hoạch luân chuyển phòng ngừa rủi ro định kỳ theo quy định của Ngân hàng Nhà nước..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Tùy chọn đồng bộ */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2">
          <input
            type="checkbox"
            id="syncProfileCheck"
            checked={syncToProfile}
            onChange={(e) => setSyncToProfile(e.target.checked)}
            className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-700"
          />
          <label htmlFor="syncProfileCheck" className="text-slate-800 font-bold cursor-pointer select-none">
            Tự động cập nhật chức vụ, phòng ban và địa bàn mới vào Hồ sơ hiện tại của cán bộ
          </label>
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu quyết định...' : 'Ban hành quyết định'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(TransferDecisionModal);

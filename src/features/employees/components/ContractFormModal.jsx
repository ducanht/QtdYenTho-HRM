import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  FileText, 
  Calendar, 
  Briefcase, 
  Building2, 
  MapPin, 
  UserCheck, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { saveEmployeeContract } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

export const CONTRACT_TYPES = [
  'Không xác định thời hạn',
  'Xác định thời hạn 36 tháng',
  'Xác định thời hạn 24 tháng',
  'Xác định thời hạn 12 tháng',
  'Hợp đồng thử việc',
  'Hợp đồng khoán việc',
];

const ContractFormModal = ({
  isOpen,
  onClose,
  emp,
  contract = null,
  onSuccess,
}) => {
  const toast = useToast();
  const isEdit = Boolean(contract?.id);

  const [contractNumber, setContractNumber] = useState('');
  const [contractType, setContractType] = useState('Không xác định thời hạn');
  const [signDate, setSignDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [wageType, setWageType] = useState('Lương theo ngạch bậc & chức danh');
  const [baseSalary, setBaseSalary] = useState('');
  const [signerName, setSignerName] = useState('Nguyễn Văn Sơn');
  const [signerPosition, setSignerPosition] = useState('Giám đốc');
  const [isCurrent, setIsCurrent] = useState(true);
  const [status, setStatus] = useState('ACTIVE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (contract) {
        setContractNumber(contract.contractNumber || '');
        setContractType(contract.contractType || 'Không xác định thời hạn');
        setSignDate(contract.signDate || '');
        setEffectiveDate(contract.effectiveDate || contract.signDate || '');
        setExpirationDate(contract.expirationDate || '');
        setJobTitle(contract.jobTitle || emp?.position || '');
        setDepartment(contract.department || emp?.department || '');
        setWorkLocation(contract.workLocation || emp?.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
        setWageType(contract.wageType || 'Lương theo ngạch bậc & chức danh');
        setBaseSalary(contract.baseSalary || '');
        setSignerName(contract.signerName || 'Nguyễn Văn Sơn');
        setSignerPosition(contract.signerPosition || 'Giám đốc');
        setIsCurrent(contract.isCurrent !== false);
        setStatus(contract.status || 'ACTIVE');
        setNotes(contract.notes || '');
      } else {
        // Khởi tạo mới theo thông tin cán bộ
        const currentYear = new Date().getFullYear();
        const codeNum = emp?.code ? emp.code.replace(/\D/g, '') : '01';
        setContractNumber(`${codeNum}/${currentYear}/HĐLĐ-QTD`);
        setContractType(emp?.contractType || 'Không xác định thời hạn');
        setSignDate(emp?.joinDate || new Date().toISOString().split('T')[0]);
        setEffectiveDate(emp?.joinDate || new Date().toISOString().split('T')[0]);
        setExpirationDate('');
        setJobTitle(emp?.position || 'Cán bộ');
        setDepartment(emp?.department || 'Bộ phận Kế toán - Ngân quỹ');
        setWorkLocation(emp?.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
        setWageType('Lương theo ngạch bậc & chức danh');
        setBaseSalary('');
        setSignerName('Nguyễn Văn Sơn');
        setSignerPosition('Giám đốc');
        setIsCurrent(true);
        setStatus('ACTIVE');
        setNotes('');
      }
    }
  }, [isOpen, contract, emp]);

  // Tự động gợi ý ngày hết hạn khi chọn loại hợp đồng có thời hạn
  const handleTypeChange = (newType) => {
    setContractType(newType);
    if (!effectiveDate) return;
    try {
      const eff = new Date(effectiveDate);
      if (isNaN(eff.getTime())) return;
      if (newType.includes('36 tháng')) {
        eff.setFullYear(eff.getFullYear() + 3);
        setExpirationDate(eff.toISOString().split('T')[0]);
      } else if (newType.includes('24 tháng')) {
        eff.setFullYear(eff.getFullYear() + 2);
        setExpirationDate(eff.toISOString().split('T')[0]);
      } else if (newType.includes('12 tháng')) {
        eff.setFullYear(eff.getFullYear() + 1);
        setExpirationDate(eff.toISOString().split('T')[0]);
      } else if (newType.includes('thử việc')) {
        eff.setMonth(eff.getMonth() + 2); // 2 tháng thử việc
        setExpirationDate(eff.toISOString().split('T')[0]);
      } else {
        setExpirationDate('');
      }
    } catch {
      // bỏ qua lỗi tính ngày
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractNumber.trim()) {
      const msg = 'Vui lòng nhập số hợp đồng lao động';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }
    if (!signDate) {
      const msg = 'Vui lòng chọn ngày ký hợp đồng';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...(contract?.id ? { id: contract.id } : {}),
        employeeId: emp?.id,
        employeeCode: emp?.code || '',
        employeeName: emp?.name || '',
        contractNumber: contractNumber.trim(),
        contractType,
        signDate,
        effectiveDate: effectiveDate || signDate,
        expirationDate: expirationDate || '',
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        workLocation: workLocation.trim(),
        wageType: wageType.trim(),
        baseSalary: baseSalary.trim(),
        signerName: signerName.trim(),
        signerPosition: signerPosition.trim(),
        isCurrent: Boolean(isCurrent),
        status,
        notes: notes.trim(),
      };

      const res = await saveEmployeeContract(payload);
      const msg = isEdit 
        ? `Đã cập nhật hợp đồng số ${payload.contractNumber} thành công!`
        : `Đã lưu hợp đồng số ${payload.contractNumber} cho cán bộ ${emp?.name}!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);

      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu hợp đồng lao động:', err);
      const errorMsg = err.message || 'Lỗi khi lưu hợp đồng';
      if (toast?.error) toast.error(errorMsg);
      else if (toast?.showError) toast.showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Hợp Đồng Lao Động' : 'Thêm Mới Hợp Đồng Lao Động'}
      subtitle={`Cán bộ: ${emp?.name || '—'} • Quỹ Tín Dụng Nhân Dân Yên Thọ`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Hàng 1: Số HĐ & Loại HĐ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Số Hợp đồng lao động (*):</span>
            </label>
            <input
              type="text"
              required
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="VD: 03/2021/HĐLĐ-QTD"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
              <span>Loại hợp đồng (*):</span>
            </label>
            <select
              value={contractType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              {CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hàng 2: Ngày ký, Ngày hiệu lực, Ngày hết hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày ký kết (*):</span>
            </label>
            <input
              type="date"
              required
              value={signDate}
              onChange={(e) => setSignDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày có hiệu lực:</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày hết hạn (nếu có):</span>
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Hàng 3: Chức danh & Phòng ban */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
              <span>Vị trí / Chức danh công việc:</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="VD: Cán bộ tín dụng"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Phòng ban ký kết:</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="VD: Phòng Tín dụng"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Hàng 4: Nơi làm việc theo HĐ */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>Nơi làm việc theo hợp đồng:</span>
          </label>
          <input
            type="text"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            placeholder="VD: Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Hàng 5: Tiền lương & Hệ số */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              <span>Hình thức tiền lương:</span>
            </label>
            <input
              type="text"
              value={wageType}
              onChange={(e) => setWageType(e.target.value)}
              placeholder="VD: Lương theo ngạch bậc & chức danh"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mức lương / Bậc lương ký kết:</span>
            </label>
            <input
              type="text"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="VD: Bậc 2 / Hệ số 3.0"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Hàng 6: Người ký đại diện Quỹ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Người ký đại diện Quỹ:</span>
            </label>
            <input
              type="text"
              list="signer-names-list"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="VD: Nguyễn Văn Sơn"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="signer-names-list">
              <option value="Trịnh Đức Anh" />
              <option value="Nguyễn Văn Sơn" />
            </datalist>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chức vụ người ký:</span>
            </label>
            <input
              type="text"
              list="signer-pos-list"
              value={signerPosition}
              onChange={(e) => setSignerPosition(e.target.value)}
              placeholder="VD: Giám đốc"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="signer-pos-list">
              <option value="Chủ tịch Hội đồng Quản trị" />
              <option value="Giám đốc" />
            </datalist>
          </div>
        </div>

        {/* Hàng 7: Cờ HĐ hiện tại & Trạng thái */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="w-4 h-4 text-emerald-700 rounded-md border-slate-300 focus:ring-emerald-700"
            />
            <div>
              <span className="font-bold text-slate-800 block">Hợp đồng hiện hành đang áp dụng</span>
              <span className="text-[11px] text-slate-500 block">Tự động đồng bộ loại HĐ vào hồ sơ cán bộ</span>
            </div>
          </label>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 shrink-0">Trạng thái:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
            >
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="RENEWED">Đã tái ký HĐ mới</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="TERMINATED">Đã chấm dứt HĐ</option>
            </select>
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Ghi chú hợp đồng (nếu có):
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm về điều khoản, thỏa thuận hoặc số quyết định tuyển dụng..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
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
            {isEdit ? 'Lưu thay đổi HĐLĐ' : 'Tạo hợp đồng lao động'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(ContractFormModal);

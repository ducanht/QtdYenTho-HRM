import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  FileText, 
  Calendar, 
  Tag, 
  AlignLeft, 
  UserCheck, 
  CheckCircle2 
} from 'lucide-react';
import { saveContractAnnex } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

export const ANNEX_TYPES = [
  { code: 'CHUC_DANH', label: 'Điều chỉnh chức danh, vị trí & công việc' },
  { code: 'TIEU_LUONG', label: 'Điều chỉnh tiền lương, hệ số & phụ cấp' },
  { code: 'GIA_HAN', label: 'Gia hạn thời hạn hợp đồng lao động' },
  { code: 'NOI_LAM_VIEC', label: 'Điều chỉnh nơi làm việc / địa bàn công tác' },
  { code: 'DIEU_KHOAN_KHAC', label: 'Sửa đổi điều khoản khác' },
];

const ContractAnnexModal = ({
  isOpen,
  onClose,
  contract,
  emp,
  annex = null,
  onSuccess,
}) => {
  const toast = useToast();
  const isEdit = Boolean(annex?.id);

  const [annexNumber, setAnnexNumber] = useState('');
  const [signDate, setSignDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [annexType, setAnnexType] = useState('CHUC_DANH');
  const [content, setContent] = useState('');
  const [signerName, setSignerName] = useState('Nguyễn Văn Sơn');
  const [signerPosition, setSignerPosition] = useState('Giám đốc');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (annex) {
        setAnnexNumber(annex.annexNumber || '');
        setSignDate(annex.signDate || '');
        setEffectiveDate(annex.effectiveDate || annex.signDate || '');
        setAnnexType(annex.annexType || 'CHUC_DANH');
        setContent(annex.content || '');
        setSignerName(annex.signerName || 'Nguyễn Văn Sơn');
        setSignerPosition(annex.signerPosition || 'Giám đốc');
        setNotes(annex.notes || '');
      } else {
        const currentYear = new Date().getFullYear();
        setAnnexNumber(`PL01/${currentYear}/HĐLĐ-QTD`);
        setSignDate(new Date().toISOString().split('T')[0]);
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setAnnexType('CHUC_DANH');
        setContent('');
        setSignerName('Nguyễn Văn Sơn');
        setSignerPosition('Giám đốc');
        setNotes('');
      }
    }
  }, [isOpen, annex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!annexNumber.trim()) {
      const msg = 'Vui lòng nhập số phụ lục hợp đồng';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }
    if (!content.trim()) {
      const msg = 'Vui lòng nhập nội dung sửa đổi, bổ sung của phụ lục';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }

    const typeObj = ANNEX_TYPES.find((t) => t.code === annexType);

    setSubmitting(true);
    try {
      const payload = {
        ...(annex?.id ? { id: annex.id } : {}),
        contractId: contract?.id || '',
        contractNumber: contract?.contractNumber || '',
        employeeId: emp?.id || contract?.employeeId,
        employeeName: emp?.name || contract?.employeeName || '',
        annexNumber: annexNumber.trim(),
        signDate,
        effectiveDate: effectiveDate || signDate,
        annexType,
        annexTypeLabel: typeObj ? typeObj.label : 'Sửa đổi bổ sung HĐLĐ',
        content: content.trim(),
        signerName: signerName.trim(),
        signerPosition: signerPosition.trim(),
        notes: notes.trim(),
      };

      const res = await saveContractAnnex(payload);
      const msg = isEdit
        ? `Đã cập nhật phụ lục ${payload.annexNumber} thành công!`
        : `Đã tạo phụ lục ${payload.annexNumber} cho hợp đồng ${contract?.contractNumber || ''}!`;
      if (toast?.success) toast.success(msg);
      else if (toast?.showSuccess) toast.showSuccess(msg);

      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu phụ lục HĐLĐ:', err);
      const errorMsg = err.message || 'Lỗi khi lưu phụ lục hợp đồng';
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
      title={isEdit ? 'Chỉnh Sửa Phụ Lục Hợp Đồng Lao Động' : 'Thêm Phụ Lục Sửa Đổi Bổ Sung HĐLĐ'}
      subtitle={`HĐ gốc: ${contract?.contractNumber || '—'} • Cán bộ: ${emp?.name || '—'}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Số phụ lục & Loại sửa đổi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Số Phụ lục HĐLĐ (*):</span>
            </label>
            <input
              type="text"
              required
              value={annexNumber}
              onChange={(e) => setAnnexNumber(e.target.value)}
              placeholder="VD: PL01/2024/HĐLĐ-QTD"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Phân loại sửa đổi (*):</span>
            </label>
            <select
              value={annexType}
              onChange={(e) => setAnnexType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              {ANNEX_TYPES.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ngày ký & Ngày hiệu lực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ngày ký phụ lục (*):</span>
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
        </div>

        {/* Nội dung chi tiết sửa đổi, bổ sung */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>Nội dung sửa đổi, bổ sung chi tiết (*):</span>
          </label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ghi rõ nội dung thay đổi: điều chỉnh mức lương bậc 3, điều động chuyển phụ trách cụm thôn 4, 5, 6..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 leading-relaxed"
          />
        </div>

        {/* Người ký đại diện Quỹ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Người ký đại diện Quỹ:</span>
            </label>
            <input
              type="text"
              list="annex-signers-list"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="VD: Nguyễn Văn Sơn"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="annex-signers-list">
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
              list="annex-pos-list"
              value={signerPosition}
              onChange={(e) => setSignerPosition(e.target.value)}
              placeholder="VD: Giám đốc"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
            <datalist id="annex-pos-list">
              <option value="Chủ tịch Hội đồng Quản trị" />
              <option value="Giám đốc" />
            </datalist>
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Ghi chú phụ lục (nếu có):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Căn cứ Quyết định điều động số 12/QĐ-HĐQT..."
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
            {isEdit ? 'Lưu thay đổi phụ lục' : 'Lưu phụ lục hợp đồng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(ContractAnnexModal);

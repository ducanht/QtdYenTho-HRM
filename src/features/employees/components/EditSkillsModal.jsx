import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  Laptop, 
  Languages, 
  PhoneCall, 
  GraduationCap, 
  CheckCircle2 
} from 'lucide-react';
import { updateEmployeeProfile } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';

export const IT_LEVEL_OPTIONS = [
  'Ứng dụng CNTT cơ bản',
  'Ứng dụng CNTT nâng cao',
  'Chứng chỉ MOS (Tin học văn phòng quốc tế)',
  'Trung cấp Tin học ứng dụng',
  'Cử nhân Công nghệ thông tin',
  'Kỹ sư Hệ thống thông tin',
  'Khác',
];

export const LANGUAGE_OPTIONS = [
  'Tiếng Anh',
  'Tiếng Anh (Bậc 3 / B1 Khung Châu Âu)',
  'Tiếng Anh (Bậc 4 / B2 Khung Châu Âu)',
  'Tiếng Anh Giao tiếp thương mại',
  'Cử nhân Ngôn ngữ Anh',
  'Tiếng Pháp',
  'Tiếng Trung Quốc',
  'Khác',
];

const EditSkillsModal = ({
  isOpen,
  onClose,
  emp,
  onSuccess,
}) => {
  const toast = useToast();
  const [itLevel, setItLevel] = useState('');
  const [foreignLanguage, setForeignLanguage] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [education, setEducation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && emp) {
      setItLevel(emp.itLevel || '');
      setForeignLanguage(emp.foreignLanguage || '');
      setSecondaryPhone(emp.secondaryPhone || emp.phone2 || '');
      setEducation(emp.education || '');
    }
  }, [isOpen, emp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emp?.id) {
      const msg = 'Không tìm thấy thông tin cán bộ';
      if (toast?.error) toast.error(msg);
      else if (toast?.showError) toast.showError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        itLevel: itLevel.trim(),
        foreignLanguage: foreignLanguage.trim(),
        secondaryPhone: secondaryPhone.trim(),
        education: education.trim(),
      };

      await updateEmployeeProfile(emp.id, payload);

      const successMsg = `Đã cập nhật kỹ năng & liên hệ cho cán bộ ${emp.name} thành công!`;
      if (toast?.success) toast.success(successMsg);
      else if (toast?.showSuccess) toast.showSuccess(successMsg);

      onSuccess?.(payload);
      onClose();
    } catch (err) {
      console.error('Lỗi cập nhật kỹ năng & ngoại ngữ:', err);
      const errorMsg = err.message || 'Lỗi khi cập nhật dữ liệu';
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
      title="Cập Nhật Trình Độ Kỹ Năng & Liên Hệ"
      subtitle={`Cán bộ: ${emp?.name || '—'} • Quỹ Tín Dụng Nhân Dân Yên Thọ`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* 1. Trình độ Tin học */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-emerald-700" />
            <span>Trình độ Tin học (Không bắt buộc):</span>
          </label>
          <input
            type="text"
            list="it-level-suggestions"
            value={itLevel}
            onChange={(e) => setItLevel(e.target.value)}
            placeholder="VD: Ứng dụng CNTT cơ bản"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
          <datalist id="it-level-suggestions">
            {IT_LEVEL_OPTIONS.map((opt, i) => (
              <option key={i} value={opt} />
            ))}
          </datalist>
        </div>

        {/* 2. Trình độ Ngoại ngữ */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-emerald-700" />
            <span>Trình độ Ngoại ngữ (Không bắt buộc):</span>
          </label>
          <input
            type="text"
            list="language-suggestions"
            value={foreignLanguage}
            onChange={(e) => setForeignLanguage(e.target.value)}
            placeholder="VD: Tiếng Anh / B1"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
          <datalist id="language-suggestions">
            {LANGUAGE_OPTIONS.map((opt, i) => (
              <option key={i} value={opt} />
            ))}
          </datalist>
        </div>

        {/* 3. Số điện thoại phụ / Số thứ 2 */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
            <span>Số điện thoại phụ / Liên hệ 2 (nếu có):</span>
          </label>
          <input
            type="tel"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            placeholder="VD: 0912345678"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* 4. Trình độ đào tạo / Học vị tóm tắt */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>Chuyên môn đào tạo / Trình độ chuyên môn:</span>
          </label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="VD: Đại học chuyên ngành Tài chính - Ngân hàng"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Nút tác vụ */}
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
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(EditSkillsModal);

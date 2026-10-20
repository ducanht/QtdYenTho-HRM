import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  GraduationCap, 
  Building2, 
  Award, 
  Calendar, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon,
  Trash2,
  BookOpen
} from 'lucide-react';
import { saveEmployeeDegree } from '../../../lib/services';
import { compressImage } from '../../../lib/imageUtils';
import { useToast } from '../../../context/ToastContext';

export const DEGREE_LEVEL_OPTIONS = [
  { value: 'Tiến sĩ', label: 'Tiến sĩ' },
  { value: 'Thạc sĩ', label: 'Thạc sĩ' },
  { value: 'Đại học', label: 'Đại học / Cử nhân / Kỹ sư' },
  { value: 'Cao đẳng', label: 'Cao đẳng' },
  { value: 'Trung cấp', label: 'Trung cấp chuyên nghiệp' },
  { value: 'Phó Giáo sư', label: 'Phó Giáo sư' },
  { value: 'Giáo sư', label: 'Giáo sư' },
  { value: 'Khác', label: 'Chứng chỉ chuyên ngành / Khác' },
];

export const TRAINING_TYPE_OPTIONS = [
  { value: 'Chính quy', label: 'Chính quy' },
  { value: 'Vừa làm vừa học', label: 'Vừa làm vừa học (Tại chức)' },
  { value: 'Liên thông', label: 'Liên thông' },
  { value: 'Văn bằng 2', label: 'Văn bằng 2' },
  { value: 'Từ xa / Trực tuyến', label: 'Từ xa / Trực tuyến' },
];

export const CLASSIFICATION_OPTIONS = [
  { value: 'Xuất sắc', label: 'Xuất sắc' },
  { value: 'Giỏi', label: 'Giỏi' },
  { value: 'Khá', label: 'Khá' },
  { value: 'Trung bình khá', label: 'Trung bình khá' },
  { value: 'Trung bình', label: 'Trung bình' },
];

export const MAJOR_SUGGESTIONS = [
  'Tài chính - Ngân hàng',
  'Kế toán - Kiểm toán',
  'Quản trị Kinh doanh',
  'Luật Kinh tế',
  'Kinh tế Nông nghiệp & Phát triển Nông thôn',
  'Hệ thống Thông tin Quản lý',
  'Công nghệ Thông tin',
];

export const INSTITUTION_SUGGESTIONS = [
  'Học viện Ngân hàng',
  'Đại học Kinh tế Quốc dân',
  'Đại học Thương mại',
  'Học viện Tài chính',
  'Đại học Luật Hà Nội',
  'Đại học Hồng Đức (Thanh Hóa)',
  'Cao đẳng Kinh tế - Kỹ thuật Công thương',
];

/**
 * AddDegreeModal: Modal thêm và chỉnh sửa văn bằng chuyên môn đa cấp của CBNV
 * Hỗ trợ lưu trữ thông tin bằng cấp chuẩn mực kèm ảnh scan bằng chứng thực
 */
const AddDegreeModal = ({
  isOpen,
  onClose,
  emp,
  initialData = null,
  existingDegreesCount = 0,
  onSuccess,
  zIndex = 'z-50',
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isEditing = Boolean(initialData?.id);

  // Form states
  const [degreeLevel, setDegreeLevel] = useState('Đại học');
  const [major, setMajor] = useState('');
  const [institution, setInstitution] = useState('');
  const [trainingType, setTrainingType] = useState('Chính quy');
  const [graduationYear, setGraduationYear] = useState('');
  const [classification, setClassification] = useState('Khá');
  const [degreeNumber, setDegreeNumber] = useState('');
  const [isHighest, setIsHighest] = useState(false);
  const [degreeImage, setDegreeImage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDegreeLevel(initialData.degreeLevel || 'Đại học');
        setMajor(initialData.major || '');
        setInstitution(initialData.institution || '');
        setTrainingType(initialData.trainingType || 'Chính quy');
        setGraduationYear(initialData.graduationYear ? String(initialData.graduationYear) : '');
        setClassification(initialData.classification || 'Khá');
        setDegreeNumber(initialData.degreeNumber || initialData.degreeNo || '');
        setIsHighest(Boolean(initialData.isHighest));
        setDegreeImage(initialData.degreeImage || '');
        setNotes(initialData.notes || '');
      } else {
        setDegreeLevel('Đại học');
        setMajor('');
        setInstitution('');
        setTrainingType('Chính quy');
        setGraduationYear(String(new Date().getFullYear()));
        setClassification('Khá');
        setDegreeNumber('');
        // Nếu chưa có bằng nào thì tự động đặt là bằng cao nhất
        setIsHighest(existingDegreesCount === 0);
        setDegreeImage('');
        setNotes('');
      }
    }
  }, [isOpen, initialData, existingDegreesCount]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      // Nén ảnh văn bằng độ phân giải tối ưu < 50KB
      const compressed = await compressImage(file, 900, 900, 0.7);
      setDegreeImage(compressed.dataUrl);
      toast?.showSuccess?.('Tải ảnh văn bằng thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi nén và tải ảnh văn bằng');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emp?.id) {
      toast?.showError?.('Không tìm thấy thông tin cán bộ');
      return;
    }

    if (!major.trim()) {
      toast?.showError?.('Vui lòng nhập chuyên ngành đào tạo');
      return;
    }

    if (!institution.trim()) {
      toast?.showError?.('Vui lòng nhập cơ sở hoặc trường đào tạo');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        id: initialData?.id || undefined,
        employeeId: emp.id,
        employeeUuid: emp.id,
        degreeLevel,
        major: major.trim(),
        institution: institution.trim(),
        trainingType,
        graduationYear: graduationYear ? Number(graduationYear) || graduationYear : '',
        classification,
        degreeNumber: degreeNumber.trim(),
        isHighest: Boolean(isHighest),
        degreeImage,
        notes: notes.trim(),
      };

      await saveEmployeeDegree(payload);

      toast?.showSuccess?.(
        isEditing
          ? 'Cập nhật văn bằng chuyên môn thành công!'
          : 'Thêm mới văn bằng chuyên môn thành công!'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi lưu văn bằng chuyên môn:', err);
      toast?.showError?.(err.message || 'Lỗi khi lưu văn bằng chuyên môn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      title={isEditing ? 'Chỉnh Sửa Văn Bằng Chuyên Môn' : 'Thêm Mới Văn Bằng Chuyên Môn'}
      subtitle={`Cán bộ: ${emp?.name || ''} • ${emp?.position || ''} - ${emp?.department || ''}`}
      maxWidth="max-w-2xl"
      zIndex={zIndex}
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Cấp bậc văn bằng */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cấp bậc / Trình độ đào tạo <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={degreeLevel}
              onChange={(e) => setDegreeLevel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-semibold text-slate-900 cursor-pointer shadow-2xs"
            >
              {DEGREE_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hình thức đào tạo */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>Hình thức đào tạo <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={trainingType}
              onChange={(e) => setTrainingType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium text-slate-900 cursor-pointer shadow-2xs"
            >
              {TRAINING_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chuyên ngành đào tạo */}
          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chuyên ngành đào tạo <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">VD: Tài chính - Ngân hàng, Kế toán...</span>
            </label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Nhập chuyên ngành ghi trên văn bằng..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-semibold text-slate-900 shadow-2xs"
            />
          </div>

          {/* Cơ sở / Trường đào tạo */}
          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                <span>Cơ sở / Trường đào tạo cấp bằng <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Ghi rõ tên trường đại học / học viện</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Nhập tên trường đào tạo (VD: Học viện Ngân hàng)..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium text-slate-900 shadow-2xs"
            />
          </div>

          {/* Năm tốt nghiệp */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>Năm tốt nghiệp / Năm cấp bằng</span>
            </label>
            <input
              type="number"
              min="1970"
              max="2035"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="VD: 2020"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-semibold tabular-nums text-slate-900 shadow-2xs"
            />
          </div>

          {/* Xếp loại tốt nghiệp */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Xếp loại tốt nghiệp</span>
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium text-slate-900 cursor-pointer shadow-2xs"
            >
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Số hiệu văn bằng */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Số hiệu văn bằng / Số vào sổ cấp bằng</span>
            </label>
            <input
              type="text"
              value={degreeNumber}
              onChange={(e) => setDegreeNumber(e.target.value)}
              placeholder="VD: B123456 / Số 45/QĐ-ĐH"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs font-medium tabular-nums text-slate-900 shadow-2xs"
            />
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Ghi chú thêm (nếu có)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Đạt giải NCKH, Học bổng xuất sắc..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-xs text-slate-900 shadow-2xs"
            />
          </div>

          {/* Đánh dấu bằng cấp cao nhất / chuyên môn chính */}
          <div className="sm:col-span-2 p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="isHighestCheckbox"
              checked={isHighest}
              onChange={(e) => setIsHighest(e.target.checked)}
              className="mt-0.5 rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isHighestCheckbox" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-emerald-950 block">
                Đánh dấu là văn bằng cao nhất / chuyên môn chính của cán bộ
              </span>
              <span className="text-slate-600 block text-[11px] mt-0.5">
                Hệ thống sẽ tự động cập nhật dòng tóm tắt trình độ vào hồ sơ trích ngang 2C/TCTD và biểu đồ thống kê cơ cấu trình độ Quỹ.
              </span>
            </label>
          </div>

          {/* Tải lên ảnh scan / ảnh chụp văn bằng */}
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-slate-700 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>Bản scan / Ảnh chụp văn bằng chứng thực</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Tự động nén ảnh WebP an toàn</span>
            </label>

            {degreeImage ? (
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={degreeImage}
                  alt="Văn bằng scan"
                  className="w-20 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã đính kèm ảnh văn bằng</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ảnh đã được nén tối ưu hiển thị nhanh và lưu trữ an toàn.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDegreeImage('')}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  title="Xóa ảnh văn bằng"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  {uploadingImage ? 'Đang xử lý nén ảnh...' : 'Nhấp để tải ảnh scan hoặc ảnh chụp văn bằng'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Định dạng PNG, JPG, JPEG (Hệ thống tự động nén dung lượng tối ưu)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
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
            disabled={submitting}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
          >
            {submitting ? 'Đang lưu...' : isEditing ? 'Cập Nhật Văn Bằng' : 'Lưu Văn Bằng Chuyên Môn'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDegreeModal;

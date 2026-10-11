import React, { useState } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { compressImage } from '../../../lib/imageUtils';
import { saveEmployeeTraining } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

/**
 * AddTrainingModal: Modal thêm mới Văn bằng / Chứng chỉ đào tạo
 * Tự động nén ảnh scan chứng chỉ qua Canvas WebP < 45KB lưu Firestore, 100% không tốn chi phí Storage
 */
const AddTrainingModal = ({
  isOpen,
  onClose,
  selectedEmp,
  onSuccess,
}) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [compressingImg, setCompressingImg] = useState(false);

  // Form State
  const [courseName, setCourseName] = useState('');
  const [institution, setInstitution] = useState('Học viện Ngân hàng');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expireDate, setExpireDate] = useState('');
  const [type, setType] = useState('CHUYEN_MON');
  const [grade, setGrade] = useState('Giỏi');
  const [notes, setNotes] = useState('');
  const [certificateImage, setCertificateImage] = useState('');
  const [imageSizeKb, setImageSizeKb] = useState(0);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressingImg(true);
      const compressed = await compressImage(file, 800, 800, 0.75);
      setCertificateImage(compressed.dataUrl);
      setImageSizeKb(compressed.sizeInKb);
      toast?.showSuccess?.(`Đã nén ảnh scan chứng chỉ: ${compressed.sizeInKb} KB (chuẩn WebP)!`);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi nén ảnh chứng chỉ');
    } finally {
      setCompressingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) {
      toast?.showError?.('Vui lòng nhập tên văn bằng / chứng chỉ');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmp.id,
        employeeUuid: selectedEmp.uuid || selectedEmp.id,
        employeeCode: selectedEmp.code || '',
        employeeName: selectedEmp.name || '',
        courseName: courseName.trim(),
        institution: institution.trim(),
        certificateNumber: certificateNumber.trim(),
        issueDate,
        expireDate: expireDate || '',
        type,
        grade,
        notes: notes.trim(),
        certificateImage: certificateImage || '',
      };

      await saveEmployeeTraining(payload);
      toast?.showSuccess?.(`Đã lưu chứng chỉ "${courseName}" thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu chứng chỉ đào tạo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Văn Bằng / Chứng Chỉ Đào Tạo"
      subtitle={`Cán bộ: ${selectedEmp?.name || ''} (${selectedEmp?.code || ''})`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Tên chứng chỉ */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Tên văn bằng / Khóa bồi dưỡng nghiệp vụ:
          </label>
          <input
            type="text"
            placeholder="VD: Nghiệp vụ Quỹ Tín Dụng Nhân Dân / Chứng chỉ Giám đốc QTDND..."
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Cơ sở đào tạo & Số hiệu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Cơ sở cấp / Đào tạo:</label>
            <input
              type="text"
              placeholder="VD: Học viện Ngân hàng / Hiệp hội QTDND"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Số hiệu văn bằng / chứng chỉ:</label>
            <input
              type="text"
              placeholder="VD: HVNH-2024/089"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Ngày cấp & Ngày hết hạn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Ngày cấp chứng chỉ:</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Ngày hết hạn hiệu lực: <span className="font-normal text-slate-400">(Trống nếu vô thời hạn)</span>
            </label>
            <input
              type="date"
              value={expireDate}
              onChange={(e) => setExpireDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Phân loại & Xếp loại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Phân loại chứng chỉ:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="CHUYEN_MON">Chuyên môn nghiệp vụ tín dụng / ngân hàng</option>
              <option value="CHUNG_CHI_HANH_NGHE">Chứng chỉ hành nghề bắt buộc (GD, BKS, KTT)</option>
              <option value="LY_LUAN_CHINH_TRI">Lý luận chính trị</option>
              <option value="KHAC">Văn bằng / Chứng chỉ khác</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Kết quả / Xếp loại:</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            >
              <option value="Xuất sắc">Xuất sắc</option>
              <option value="Giỏi">Giỏi</option>
              <option value="Khá">Khá</option>
              <option value="Hoàn thành">Đạt / Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Tải lên ảnh scan chứng chỉ (Canvas nén tự động) */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Ảnh chụp / scan chứng chỉ:
          </label>
          {certificateImage ? (
            <div className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={certificateImage}
                  alt="Chứng chỉ"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Đã đính kèm ảnh</span>
                  <span className="text-[11px] text-slate-500">Dung lượng nén: {imageSizeKb} KB</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCertificateImage('');
                  setImageSizeKb(0);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-200 hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700">
                {compressingImg ? 'Đang nén ảnh qua Canvas WebP...' : 'Bấm để chọn ảnh scan chứng chỉ'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Tự động nén WebP &lt; 45 KB lưu trực tiếp Firestore
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={compressingImg}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">Ghi chú bổ sung:</label>
          <input
            type="text"
            placeholder="Số quyết định cử đi học, thời gian tập huấn..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
          />
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || compressingImg}>
            {submitting ? 'Đang lưu chứng chỉ...' : 'Lưu chứng chỉ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(AddTrainingModal);

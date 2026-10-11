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
  const [organizer, setOrganizer] = useState('Hiệp hội QTDND Việt Nam');
  const [decisionNo, setDecisionNo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('TP. Thanh Hóa');
  const [content, setContent] = useState('');
  const [hasCertificate, setHasCertificate] = useState(true);
  const [certificateName, setCertificateName] = useState('');
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
      toast?.showSuccess?.('Đã tải ảnh scan chứng chỉ thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi nén ảnh chứng chỉ');
    } finally {
      setCompressingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) {
      toast?.showError?.('Vui lòng nhập tên khóa đào tạo nghiệp vụ');
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
        organizer: organizer.trim(),
        institution: organizer.trim(),
        decisionNo: decisionNo.trim(),
        startDate,
        endDate,
        location: location.trim(),
        content: content.trim(),
        hasCertificate,
        certificateName: (certificateName.trim() || courseName.trim()),
        certificateNumber: certificateNumber.trim(),
        certificateNo: certificateNumber.trim(),
        issueDate: hasCertificate ? issueDate : '',
        expireDate: hasCertificate ? (expireDate || '') : '',
        type,
        grade,
        notes: notes.trim(),
        certificateImage: certificateImage || '',
      };

      await saveEmployeeTraining(payload);
      toast?.showSuccess?.(`Đã lưu khóa đào tạo "${courseName}" thành công!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu thông tin đào tạo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ghi Nhận Khóa Đào Tạo Nghiệp Vụ & Chứng Chỉ"
      subtitle={`Cán bộ: ${selectedEmp?.name || ''}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Phần 1: Thông tin Khóa Đào Tạo */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <span>1. Thông Tin Khóa Bồi Dưỡng / Đào Tạo Nghiệp Vụ</span>
          </h4>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Tên khóa đào tạo / bồi dưỡng nghiệp vụ:
            </label>
            <input
              type="text"
              placeholder="VD: Nghiệp vụ Quỹ Tín Dụng Nhân Dân / Thẩm định TSĐB & Phòng ngừa rủi ro..."
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Đơn vị tổ chức đào tạo:</label>
              <input
                type="text"
                placeholder="VD: NHNN / Hiệp hội QTDND / Học viện Ngân hàng"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Quyết định / Kế hoạch cử đi học:</label>
              <input
                type="text"
                placeholder="VD: QĐ số 18/QĐ-HĐQT hoặc KH số 05/KH-QTD"
                value={decisionNo}
                onChange={(e) => setDecisionNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Từ ngày:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Đến ngày:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Địa điểm tổ chức:</label>
              <input
                type="text"
                placeholder="VD: Hà Nội / Thanh Hóa / Trực tuyến"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nội dung đào tạo tóm tắt:</label>
            <textarea
              rows="2"
              placeholder="VD: Quy trình nghiệp vụ tín dụng mới theo Thông tư NHNN, thẩm định pháp lý hồ sơ vay vốn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Phần 2: Văn Bằng / Chứng Chỉ Được Cấp */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <span>2. Văn Bằng & Chứng Chỉ Được Cấp Sau Đào Tạo</span>
            </h4>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCertificate}
                onChange={(e) => setHasCertificate(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 border-slate-300 focus:ring-emerald-700/20"
              />
              <span className="font-bold text-slate-700 text-xs">Khóa học có cấp văn bằng / chứng chỉ</span>
            </label>
          </div>

          {hasCertificate ? (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tên chứng chỉ / văn bằng được cấp:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Chứng chỉ Bồi dưỡng Nghiệp vụ QTDND / Thẩm định TSĐB..."
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Số hiệu văn bằng / chứng chỉ:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: CC-2026/089 hoặc Số vào sổ cấp bằng..."
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
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
                    required={hasCertificate}
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
                  <label className="block text-slate-700 font-bold mb-1">Kết quả / Xếp loại tốt nghiệp:</label>
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
            </div>
          ) : (
            <div className="py-2 text-slate-500 text-xs italic">
              Khóa tập huấn / bồi dưỡng ngắn hạn không cấp chứng chỉ hoặc đang chờ cấp bằng. Kết quả đào tạo sẽ ghi nhận hoàn thành khóa học.
            </div>
          )}
        </div>

        {/* Phần 3: Hồ Sơ Đính Kèm & Ghi Chú */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <span>3. Hồ Sơ Đính Kèm & Ghi Chú Bổ Sung</span>
          </h4>

          {/* Tải lên ảnh scan chứng chỉ */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Ảnh chụp / scan chứng chỉ:
            </label>
            {certificateImage ? (
              <div className="relative p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={certificateImage}
                    alt="Chứng chỉ"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Đã đính kèm ảnh scan</span>
                    <span className="text-[11px] text-slate-500">Dung lượng: {imageSizeKb} KB</span>
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
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/30">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  {compressingImg ? 'Đang xử lý ảnh...' : 'Bấm để chọn ảnh scan chứng chỉ'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Định dạng JPG, PNG hoặc ảnh scan tài liệu
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
              placeholder="Ghi chú thêm về khóa đào tạo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>
        </div>

        {/* Nút thao tác */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || compressingImg}>
            {submitting ? 'Đang lưu khóa đào tạo...' : 'Lưu khóa đào tạo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default React.memo(AddTrainingModal);

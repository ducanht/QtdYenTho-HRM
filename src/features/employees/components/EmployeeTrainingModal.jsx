import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Eye,
  Sparkles
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { subscribeEmployeeTraining, saveEmployeeTraining, deleteEmployeeTraining } from '../../../lib/services';
import { compressImage } from '../../../lib/imageUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { useToast } from '../../../context/ToastContext';

const TRAINING_TYPES = [
  { code: 'CHUYEN_MON', label: 'Nghiệp vụ Chuyên môn QTDND' },
  { code: 'CHUNG_CHI_HANH_NGHE', label: 'Chứng chỉ Hành nghề / Quản trị điều hành' },
  { code: 'LY_LUAN_CHINH_TRI', label: 'Lý luận Chính trị & Đảng viên' },
  { code: 'TIN_HOC_NGOAI_NGU', label: 'Tin học & Ngoại ngữ' },
  { code: 'AN_TOAN_KHO_QUY', label: 'An toàn Kho quỹ & Phòng cháy' },
  { code: 'KHAC', label: 'Khóa bồi dưỡng khác' },
];

const EmployeeTrainingModal = ({ selectedEmp, onClose }) => {
  const toast = useToast();
  const [trainingList, setTrainingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LIST'); // 'LIST' | 'CREATE'
  
  // State form tạo mới
  const [formData, setFormData] = useState({
    courseName: '',
    institution: '',
    certificateNo: '',
    type: 'CHUYEN_MON',
    issueDate: '',
    expireDate: '',
    grade: 'Giỏi',
    notes: '',
    certificateImage: '',
    imageSizeKb: 0,
  });

  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!selectedEmp?.id) return;
    setLoading(true);
    const unsub = subscribeEmployeeTraining(selectedEmp.id, (list) => {
      setTrainingList(list || []);
      setLoading(false);
    });
    return () => unsub();
  }, [selectedEmp]);

  if (!selectedEmp) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const compressed = await compressImage(file, 800, 800, 0.75);
      setFormData((prev) => ({
        ...prev,
        certificateImage: compressed.dataUrl,
        imageSizeKb: compressed.sizeInKb,
      }));
      toast?.showSuccess?.(
        `Nén ảnh thành công: từ ${compressed.originalSizeInKb} KB xuống ${compressed.sizeInKb} KB (bảo toàn dung lượng CSDL)!`
      );
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xử lý hình ảnh chứng chỉ');
    } finally {
      setCompressing(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      courseName: '',
      institution: '',
      certificateNo: '',
      type: 'CHUYEN_MON',
      issueDate: '',
      expireDate: '',
      grade: 'Giỏi',
      notes: '',
      certificateImage: '',
      imageSizeKb: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseName.trim()) {
      toast?.showError?.('Vui lòng nhập tên khóa học hoặc văn bằng chứng chỉ');
      return;
    }
    if (!formData.institution.trim()) {
      toast?.showError?.('Vui lòng nhập cơ sở / đơn vị đào tạo cấp chứng chỉ');
      return;
    }

    try {
      setSubmitting(true);
      await saveEmployeeTraining({
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        employeeCode: selectedEmp.code,
        ...formData,
      });

      toast?.showSuccess?.('Đã lưu thông tin chứng chỉ đào tạo vào CSDL Cloud Firestore!');
      handleResetForm();
      setActiveTab('LIST');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu dữ liệu chứng chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xác nhận xóa chứng chỉ: "${item.courseName}" khỏi hồ sơ cán bộ?`)) {
      return;
    }
    try {
      await deleteEmployeeTraining(item.id);
      toast?.showSuccess?.('Đã xóa chứng chỉ đào tạo thành công');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa chứng chỉ');
    }
  };

  return (
    <Modal isOpen={Boolean(selectedEmp)} onClose={onClose} size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6 text-[#0f766e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Hồ Sơ Đào Tạo & Chứng Chỉ Chuyên Môn</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-100 text-[#0f766e]">
                  {trainingList.length} chứng chỉ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cán bộ: <span className="font-bold text-slate-800">{selectedEmp.name}</span> ({selectedEmp.code}) • {selectedEmp.position} - {selectedEmp.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'LIST'
                  ? 'border-[#0f766e] text-[#0f766e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Danh Sách Đã Đạt ({trainingList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CREATE')}
              className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                activeTab === 'CREATE'
                  ? 'border-[#0f766e] text-[#0f766e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khóa Đào Tạo / Chứng Chỉ</span>
            </button>
          </div>
        </div>

        {/* Content Tab 1: Danh sách chứng chỉ */}
        {activeTab === 'LIST' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Đang tải dữ liệu đào tạo từ Cloud Firestore...
              </div>
            ) : trainingList.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Chưa có chứng chỉ hoặc khóa đào tạo nào được lưu</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Hãy nhấn tab "Thêm Khóa Đào Tạo / Chứng Chỉ" để cập nhật các bằng cấp chuyên môn, chứng chỉ NHNN của cán bộ.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('CREATE')}
                  className="mt-4 px-4 py-2 bg-[#0f766e] text-white text-xs font-bold rounded-xl hover:bg-teal-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm chứng chỉ ngay</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {trainingList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0f766e] border border-teal-200">
                            {TRAINING_TYPES.find((t) => t.code === item.type)?.label || item.type}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{item.courseName}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa chứng chỉ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">{item.institution}</span>
                        </div>
                        {item.certificateNo && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Số hiệu: <strong className="font-mono text-slate-700">{item.certificateNo}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Ngày cấp: <strong>{item.issueDate ? formatDateVN(item.issueDate) : '—'}</strong>
                            {item.expireDate ? ` (Hết hạn: ${formatDateVN(item.expireDate)})` : ''}
                          </span>
                        </div>
                        {item.grade && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Xếp loại: <strong className="text-emerald-700">{item.grade}</strong></span>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Hình ảnh chứng chỉ */}
                    {item.certificateImage && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Hình ảnh scan chứng chỉ:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.certificateImage)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0f766e] bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem ảnh</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Tab 2: Thêm mới */}
        {activeTab === 'CREATE' && (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Tên khóa học / Chứng chỉ nghiệp vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chứng chỉ Nghiệp vụ Quản trị Điều hành Quỹ Tín dụng Nhân dân"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cơ sở / Đơn vị cấp chứng chỉ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trường Cán bộ Ngân hàng / Hiệp hội QTDND"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phân loại chứng chỉ</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                >
                  {TRAINING_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Số hiệu văn bằng / chứng chỉ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: CC-2024/QTD-08"
                  value={formData.certificateNo}
                  onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Xếp loại / Đánh giá</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                >
                  <option value="Xuất sắc">Xuất sắc</option>
                  <option value="Giỏi">Giỏi</option>
                  <option value="Khá">Khá</option>
                  <option value="Trung bình khá">Trung bình khá</option>
                  <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ngày cấp chứng chỉ</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ngày hết hạn (nếu có)</label>
                <input
                  type="date"
                  value={formData.expireDate}
                  onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">Ghi chú bổ sung</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú về thời lượng học, điểm thi hoặc thông tin bổ sung..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              {/* Upload & Nén ảnh chứng chỉ qua Canvas */}
              <div className="space-y-2 md:col-span-2 p-4 rounded-xl border border-teal-200 bg-teal-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0f766e]" />
                    <label className="text-xs font-bold text-slate-800">
                      Hình ảnh bản scan / chụp giấy chứng nhận (Tự động nén qua Canvas)
                    </label>
                  </div>
                  {formData.imageSizeKb > 0 && (
                    <span className="text-[11px] font-bold text-[#0f766e] bg-teal-100 px-2 py-0.5 rounded-full">
                      Dung lượng nén: {formData.imageSizeKb} KB (Chuẩn Free Tier)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="px-4 py-2 border border-teal-300 rounded-xl bg-white text-xs font-bold text-[#0f766e] hover:bg-teal-50 cursor-pointer inline-flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{compressing ? 'Đang nén ảnh...' : 'Chọn file ảnh chứng chỉ'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={compressing}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Hệ thống tự động nén kích thước &lt; 50 KB bảo toàn trọn vẹn dung lượng Firestore miễn phí.
                  </p>
                </div>

                {formData.certificateImage && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={formData.certificateImage}
                      alt="Chứng chỉ nén"
                      className="w-16 h-16 object-cover rounded-lg border border-teal-300 shadow-xs"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">Ảnh đã được nén sẵn sàng lưu vào CSDL</p>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, certificateImage: '', imageSizeKb: 0 }))}
                        className="text-red-600 hover:underline text-[11px] mt-0.5 cursor-pointer"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('LIST')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || compressing}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0f766e] text-white hover:bg-teal-800 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Đang lưu CSDL...' : 'Lưu chứng chỉ vào CSDL'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal phóng to ảnh */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Chứng chỉ phóng to"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default React.memo(EmployeeTrainingModal);

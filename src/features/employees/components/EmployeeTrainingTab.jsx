import React, { useState } from 'react';
import { 
  GraduationCap, 
  PlusCircle, 
  Award, 
  Calendar, 
  Building2, 
  FileText, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { formatDateVN } from '../../../lib/dateUtils';
import { deleteEmployeeTraining } from '../../../lib/services';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../../components/common/Modal';

/**
 * EmployeeTrainingTab: Cột Phải cho Tab TRAINING
 * Quản lý văn bằng, chứng chỉ bắt buộc và các khóa bồi dưỡng nghiệp vụ của cán bộ
 */
const EmployeeTrainingTab = ({
  emp,
  trainings = [],
  onOpenAddTraining,
  canManage = false,
}) => {
  const toast = useToast();
  const [viewingImage, setViewingImage] = useState(null);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh sách bên trái để quản lý chứng chỉ đào tạo.
      </div>
    );
  }

  // Lọc danh sách chứng chỉ của cán bộ đang chọn
  const empTrainings = trainings.filter(
    (t) => t.employeeId === emp.id || (t.employeeCode && t.employeeCode === emp.code)
  );

  const handleDelete = async (trainingId, name) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa chứng chỉ "${name || trainingId}" không?`)) {
      return;
    }
    try {
      await deleteEmployeeTraining(trainingId);
      toast?.showSuccess?.('Đã xóa chứng chỉ đào tạo thành công');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa chứng chỉ');
    }
  };

  // Tính trạng thái hiệu lực của chứng chỉ
  const getValidityStatus = (expireDate) => {
    if (!expireDate) return { label: 'Vô thời hạn', color: 'text-slate-600 bg-slate-100', icon: CheckCircle2 };
    try {
      const exp = new Date(expireDate);
      const now = new Date();
      if (isNaN(exp.getTime())) return { label: 'Vô thời hạn', color: 'text-slate-600 bg-slate-100', icon: CheckCircle2 };
      
      const diffMonths = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
      if (diffMonths < 0) {
        return { label: 'Đã hết hạn', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertTriangle };
      }
      if (diffMonths <= 6) {
        return { label: 'Sắp hết hạn', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock };
      }
      return { label: 'Còn hiệu lực', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
    } catch {
      return { label: 'Còn hiệu lực', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>Hồ Sơ Đào Tạo & Chứng Chỉ Chuyên Môn</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {emp.name}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng số văn bằng, chứng chỉ đã ghi nhận: <span className="font-bold text-slate-800">{empTrainings.length}</span>
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => onOpenAddTraining(emp)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm chứng chỉ</span>
            </button>
          )}
        </div>

        {/* Khung Thông Tin Tiêu Chuẩn Chức Danh NHNN */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            Hệ thống quản lý chứng chỉ theo đúng tiêu chuẩn chức danh của Thống đốc NHNN quy định đối với Quỹ tín dụng nhân dân.
          </span>
          <span className="font-bold text-emerald-800 shrink-0">
            {emp.education || 'Đại học chuyên ngành'}
          </span>
        </div>
      </div>

      {/* Danh sách Chứng Chỉ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Danh Mục Văn Bằng & Chứng Chỉ Đã Cấp ({empTrainings.length})</span>
          </h3>
        </div>

        {empTrainings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có chứng chỉ hoặc khóa đào tạo nào được cập nhật cho cán bộ này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {empTrainings.map((cert) => {
              const status = getValidityStatus(cert.expireDate);
              const StatusIcon = status.icon;

              return (
                <div
                  key={cert.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all text-xs space-y-3 bg-white flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{status.label}</span>
                      </span>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cert.id, cert.courseName)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Xóa chứng chỉ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {cert.courseName}
                    </h4>

                    <div className="space-y-1 text-slate-500 text-[11px]">
                      <p className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{cert.institution}</span>
                      </p>
                      {cert.certificateNumber && (
                        <p className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Số hiệu: {cert.certificateNumber}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Cấp ngày: {formatDateVN(cert.issueDate)}</span>
                        {cert.expireDate && (
                          <span> • Hết hạn: {formatDateVN(cert.expireDate)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Ảnh đính kèm & Chi tiết */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Xếp loại: <span className="text-slate-700">{cert.grade || 'Đạt'}</span>
                    </span>

                    {cert.certificateImage && (
                      <button
                        type="button"
                        onClick={() => setViewingImage(cert.certificateImage)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem ảnh scan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Xem Ảnh Scan Chứng Chỉ Phóng To */}
      {viewingImage && (
        <Modal
          isOpen={Boolean(viewingImage)}
          onClose={() => setViewingImage(null)}
          title="Bản Scan Chứng Chỉ Đào Tạo"
          subtitle="Quỹ Tín Dụng Nhân Dân Yên Thọ • Hồ sơ chứng chỉ số hóa"
          maxWidth="max-w-3xl"
        >
          <div className="p-2 flex flex-col items-center justify-center space-y-3">
            <img
              src={viewingImage}
              alt="Scan chứng chỉ"
              className="max-h-[70vh] w-auto rounded-xl object-contain border border-slate-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(EmployeeTrainingTab);

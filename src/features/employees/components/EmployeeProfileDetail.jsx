import React, { useState } from 'react';
import { 
  Camera, 
  Edit3, 
  Printer, 
  User, 
  Briefcase, 
  Award, 
  GraduationCap,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { calculatePositionTenure } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { compressImage } from '../../../lib/imageUtils';
import { updateEmployeeProfile } from '../../../lib/services';
import { exportEmployeeProfileToDocx, exportEmployeeProfileToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';

/**
 * EmployeeProfileDetail: Cột Phải cho Tab PROFILE
 * Hiển thị chi tiết Sơ yếu lý lịch Trích ngang 2C/TCTD chuẩn mực của Cán bộ Quỹ Tín Dụng Nhân Dân Yên Thọ
 * Tuân thủ: Ẩn toàn bộ UUID, mã code, mã chức vụ, phân quyền hệ thống. Không dùng font mono. Không dùng nhãn AI.
 */
const EmployeeProfileDetail = ({
  emp,
  onOpenEdit,
  onOpenPrint,
  workHistory = [],
  trainings = [],
  canManage = false,
}) => {
  const toast = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh sách bên trái để xem hồ sơ chi tiết.
      </div>
    );
  }

  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);

  // Xử lý cập nhật ảnh đại diện
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const compressed = await compressImage(file, 400, 400, 0.75);
      await updateEmployeeProfile(emp.id, {
        avatar: compressed.dataUrl,
      });

      toast?.showSuccess?.('Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setExportingWord(true);
      await exportEmployeeProfileToDocx(emp, workHistory, trainings);
      toast?.showSuccess?.('Đã xuất file Word (.docx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất file Word');
    } finally {
      setExportingWord(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportEmployeeProfileToExcel(emp, workHistory, trainings);
      toast?.showSuccess?.('Đã xuất file Excel (.xlsx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất file Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Card: Định Danh & Tác Vụ Chính */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar kèm nút đổi ảnh */}
            <div className="relative group shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border-2 border-emerald-200 text-emerald-800 font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-xs">
                {emp.avatar ? (
                  <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                ) : (
                  emp.name.charAt(0)
                )}
              </div>

              <label 
                className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                title="Thay đổi ảnh chân dung"
              >
                <Camera className="w-5 h-5 mb-1" />
                <span>{uploadingAvatar ? '...' : 'Đổi ảnh'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            {/* Thông tin cốt lõi */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {emp.department}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {emp.status === 'ACTIVE' ? 'Đang công tác' : 'Nghỉ việc'}
                </span>
                {emp.partyMember && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    Đảng viên ĐCSVN
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {emp.name}
              </h1>

              <p className="text-xs sm:text-sm font-bold text-emerald-800">
                {emp.position || 'Cán bộ'}
              </p>
            </div>
          </div>

          {/* Nhóm nút thao tác */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
            <button
              type="button"
              onClick={handleExportWord}
              disabled={exportingWord}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Xuất sơ yếu lý lịch sang Microsoft Word (.docx)"
            >
              <FileText className="w-4 h-4 text-blue-700" />
              <span>{exportingWord ? 'Đang tạo...' : 'Xuất Word'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Xuất sơ yếu lý lịch sang Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{exportingExcel ? 'Đang tạo...' : 'Xuất Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPrint(emp)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In trích ngang A4</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => onOpenEdit(emp)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Lưới 4 Phân Khu Thông Tin Chuẩn Nghiệp Vụ 2C/TCTD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Phân khu 1: Thông tin Cá nhân & Liên hệ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              1. Thông Tin Cá Nhân & Liên Hệ
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Số Thẻ CCCD:</span>
              <span className="font-bold text-slate-900 tabular-nums">{emp.cccd || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Giới tính:</span>
              <span className="font-bold text-slate-800">{emp.gender || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ngày sinh:</span>
              <span className="font-bold text-slate-800 tabular-nums">
                {emp.birthDate ? formatDateVN(emp.birthDate) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Số điện thoại liên hệ:</span>
              <span className="font-bold text-emerald-800 tabular-nums">{emp.phone || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px] mb-0.5">Hộp thư điện tử (Email):</span>
              <span className="font-medium text-slate-800">{emp.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Phân khu 2: Quá trình Công tác & Địa bàn */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              2. Công Tác & Thâm Niên
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Phòng ban:</span>
              <span className="font-bold text-slate-800">{emp.department || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Chức danh hiện tại:</span>
              <span className="font-bold text-emerald-900">{emp.position || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ngày đảm nhiệm chức vụ:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {emp.positionStartDate ? formatDateVN(emp.positionStartDate) : (emp.joinDate ? formatDateVN(emp.joinDate) : '—')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Thâm niên giữ chức vụ:</span>
              <span className="font-bold text-emerald-800">{tenureText}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ngày vào Quỹ công tác:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {emp.joinDate ? formatDateVN(emp.joinDate) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Tổng thâm niên tại Quỹ:</span>
              <span className="font-bold text-slate-700">{totalTenureText}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px] mb-0.5">Loại hợp đồng lao động:</span>
              <span className="font-medium text-slate-800">{emp.contractType || 'Không xác định thời hạn'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px] mb-0.5">Địa bàn phụ trách tín dụng:</span>
              <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg block border border-slate-100">
                {emp.assignedArea || 'Chưa phân công địa bàn'}
              </span>
            </div>
          </div>
        </div>

        {/* Phân khu 3: Chính trị & Đảng - Đoàn thể */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              3. Chính Trị & Đảng - Đoàn Thể
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Đảng viên ĐCSVN:</span>
              <span className={`font-bold ${emp.partyMember ? 'text-amber-800' : 'text-slate-500'}`}>
                {emp.partyMember ? 'Đảng viên chính thức' : 'Chưa kết nạp'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Chức vụ Chi bộ:</span>
              <span className="font-semibold text-slate-800">{emp.politicalRole || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ngày vào Đảng dự bị:</span>
              <span className="font-medium text-slate-800 tabular-nums">
                {emp.partyDate ? formatDateVN(emp.partyDate) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Ngày chính thức:</span>
              <span className="font-medium text-slate-800 tabular-nums">
                {emp.partyOfficialDate ? formatDateVN(emp.partyOfficialDate) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Phân khu 4: Trình độ & Chuyên môn Đào tạo */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              4. Trình Độ & Chuyên Môn
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px] mb-0.5">Chuyên môn đào tạo / Học vị:</span>
              <span className="font-bold text-slate-900 bg-slate-50 p-2 rounded-lg block border border-slate-100">
                {emp.education || 'Chưa cập nhật văn bằng'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Tin học:</span>
              <span className="font-medium text-slate-800">Ứng dụng CNTT cơ bản</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Ngoại ngữ:</span>
              <span className="font-medium text-slate-800">Tiếng Anh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeProfileDetail);

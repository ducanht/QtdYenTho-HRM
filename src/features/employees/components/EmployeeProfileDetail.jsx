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
  FileText,
  Trash2,
  AlertTriangle,
  MapPin,
  Plus,
  Share2,
  ExternalLink,
  Edit2,
  Eye,
  BookOpen
} from 'lucide-react';
import { calculatePositionTenure, calculateAreaTenureAndDueDate } from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { compressImage } from '../../../lib/imageUtils';
import { 
  updateEmployeeProfile, 
  deleteEmployeeProfile, 
  deleteEmployeeDegree 
} from '../../../lib/services';
import { exportEmployeeProfileToDocx, exportEmployeeProfileToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import AddDegreeModal from './AddDegreeModal';
import ManageSocialsModal, { SOCIAL_PLATFORMS } from './ManageSocialsModal';

/**
 * EmployeeProfileDetail: Cột Phải cho Tab PROFILE
 * Hiển thị chi tiết Sơ yếu lý lịch Trích ngang 2C/TCTD chuẩn mực của Cán bộ Quỹ Tín Dụng Nhân Dân Yên Thọ
 * Tuân thủ: Ẩn toàn bộ UUID, mã code, mã chức vụ, phân quyền hệ thống. Không dùng font mono. Không dùng nhãn AI.
 */
const EmployeeProfileDetail = ({
  emp,
  onOpenEdit,
  onOpenPrint,
  onDeleteSuccess,
  workHistory = [],
  trainings = [],
  degrees = [],
  socials = [],
  canManage = false,
}) => {
  const toast = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal văn bằng & mạng xã hội
  const [isAddDegreeModalOpen, setIsAddDegreeModalOpen] = useState(false);
  const [editingDegree, setEditingDegree] = useState(null);
  const [isManageSocialsModalOpen, setIsManageSocialsModalOpen] = useState(false);
  const [viewingScanImage, setViewingScanImage] = useState(null);

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

  const isCreditOfficer = (emp.department || '').includes('Tín dụng') || 
    (emp.position || '').toLowerCase().includes('tín dụng') || 
    Boolean(emp.assignedArea);

  const areaInfo = isCreditOfficer ? calculateAreaTenureAndDueDate(emp.areaStartDate || effectiveStart) : null;

  const empDegrees = degrees.filter(
    (d) => d.employeeId === emp?.id || d.employeeUuid === emp?.id
  );
  const empSocials = socials.filter(
    (s) => s.employeeId === emp?.id || s.employeeUuid === emp?.id
  );

  const handleDeleteDegree = async (degreeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa văn bằng chuyên môn này khỏi hồ sơ?')) return;
    try {
      await deleteEmployeeDegree(degreeId);
      toast?.showSuccess?.('Đã xóa văn bằng chuyên môn thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa văn bằng chuyên môn');
    }
  };

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
      await exportEmployeeProfileToDocx(emp, workHistory, trainings, degrees, socials);
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
      await exportEmployeeProfileToExcel(emp, workHistory, trainings, degrees, socials);
      toast?.showSuccess?.('Đã xuất file Excel (.xlsx) thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xuất file Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!emp?.id) return;
    try {
      setDeleting(true);
      await deleteEmployeeProfile(emp.id, true);
      toast?.showSuccess?.(`Đã xóa hồ sơ cán bộ ${emp.name} thành công.`);
      setIsDeleteModalOpen(false);
      onDeleteSuccess?.(emp.id);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa hồ sơ cán bộ');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Card: Định Danh & Tác Vụ Chính */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        {/* Phần 1: Khối Định Danh Cán Bộ (Avatar + Họ Tên + Chức Vụ + Badge Nhỏ Gọn) */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          {/* Avatar kèm nút đổi ảnh */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-teal-50 border-2 border-emerald-200 text-emerald-800 font-extrabold text-xl sm:text-2xl flex items-center justify-center overflow-hidden shadow-2xs">
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
              <Camera className="w-4 h-4 mb-0.5" />
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
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {emp.name}
              </h1>

              {/* Các thông tin Đảng viên, Đang công tác chỉ hiển thị badge nhỏ */}
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>{emp.status === 'ACTIVE' ? 'Đang công tác' : 'Nghỉ việc'}</span>
              </span>

              {emp.partyMember && (
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1 shrink-0">
                  <span>Đảng viên</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="font-bold text-emerald-900">
                {emp.position || 'Cán bộ'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">
                {emp.department}
              </span>
            </div>
          </div>
        </div>

        {/* Phần 2: Hàng Nút Chức Năng Riêng Biệt (Xuất Báo Cáo, In Ấn & Quản Trị) */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Nhóm Xuất Báo Cáo & In Ấn */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportWord}
              disabled={exportingWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Xuất sơ yếu lý lịch sang Microsoft Word (.docx)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              <span>{exportingWord ? 'Đang tạo...' : 'Xuất Word'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Xuất sơ yếu lý lịch sang Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{exportingExcel ? 'Đang tạo...' : 'Xuất Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPrint(emp)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In trích ngang A4</span>
            </button>
          </div>

          {/* Nhóm Quản Trị Cán Bộ */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenEdit(emp)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Xóa hồ sơ cán bộ khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa cán bộ</span>
              </button>
            </div>
          )}
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

            {/* Khối Kênh Liên Lạc & Mạng Xã Hội */}
            <div className="col-span-2 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Kênh Liên Lạc & Mạng Xã Hội</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsManageSocialsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>Cập nhật ({empSocials.length})</span>
                </button>
              </div>

              {empSocials.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {empSocials.map((soc) => {
                    const plat = SOCIAL_PLATFORMS.find((p) => p.value === soc.platform) || {
                      color: 'bg-slate-700 text-white',
                    };
                    return soc.url ? (
                      <a
                        key={soc.id}
                        href={soc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-800 transition-all shadow-2xs group"
                        title={`Mở kênh ${soc.platform} của cán bộ`}
                      >
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${plat.color}`}>
                          {soc.platform}
                        </span>
                        <span className="font-semibold text-[11px] group-hover:text-blue-700">
                          {soc.accountName || soc.username || soc.platform}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
                      </a>
                    ) : (
                      <div
                        key={soc.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      >
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${plat.color}`}>
                          {soc.platform}
                        </span>
                        <span className="font-semibold text-[11px]">
                          {soc.accountName || soc.username || soc.platform}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>Chưa thiết lập kênh mạng xã hội</span>
                  <button
                    type="button"
                    onClick={() => setIsManageSocialsModalOpen(true)}
                    className="text-emerald-700 font-bold hover:underline not-italic cursor-pointer"
                  >
                    + Thêm ngay
                  </button>
                </div>
              )}
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

            {isCreditOfficer && areaInfo ? (
              <div className="col-span-2 p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Theo Dõi Quản Lý Địa Bàn & Luân Chuyển Định Kỳ</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    areaInfo.statusVariant === 'danger'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : areaInfo.statusVariant === 'warning'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {areaInfo.statusText}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Địa bàn đang quản lý:</span>
                    <strong className="text-emerald-950 font-bold">{emp.assignedArea || 'Chưa phân công địa bàn'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Ngày bắt đầu nhận địa bàn:</span>
                    <strong className="text-slate-800 tabular-nums">
                      {emp.areaStartDate ? formatDateVN(emp.areaStartDate) : (effectiveStart ? formatDateVN(effectiveStart) : 'Chưa cập nhật')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Thâm niên quản lý địa bàn:</span>
                    <strong className="text-emerald-900 font-black">{areaInfo.tenureText}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Thời điểm luân chuyển định kỳ:</span>
                    <strong className={`tabular-nums ${areaInfo.isDue ? 'text-rose-700 font-black' : areaInfo.isNear ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                      {areaInfo.dueDateText} (Chu kỳ 36 tháng)
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px] mb-0.5">Địa bàn phụ trách:</span>
                <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg block border border-slate-100">
                  {emp.assignedArea || 'Chưa phân công địa bàn'}
                </span>
              </div>
            )}
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                4. Trình Độ & Văn Bằng Chuyên Môn
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingDegree(null);
                setIsAddDegreeModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm văn bằng</span>
            </button>
          </div>

          {/* Danh sách các văn bằng chuyên môn đa cấp */}
          <div className="space-y-3">
            {empDegrees.length > 0 ? (
              <div className="space-y-2.5">
                {empDegrees.map((deg) => {
                  const isHigh = Boolean(deg.isHighest);
                  return (
                    <div
                      key={deg.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isHigh
                          ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-800 text-white shadow-2xs">
                              {deg.degreeLevel || 'Đại học'}
                            </span>
                            {isHigh && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                Chuyên môn chính
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">
                              • {deg.trainingType || 'Chính quy'}
                            </span>
                            {deg.graduationYear && (
                              <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                                • Năm {deg.graduationYear}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-900">
                            {deg.major}
                          </div>

                          <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span>{deg.institution}</span>
                            {deg.classification && (
                              <span className="text-slate-400">• Loại: <strong className="text-slate-700 font-semibold">{deg.classification}</strong></span>
                            )}
                            {deg.degreeNumber && (
                              <span className="text-slate-400">• Số hiệu: <strong className="text-slate-700 font-semibold tabular-nums">{deg.degreeNumber}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Nút tác vụ cho từng văn bằng */}
                        <div className="flex items-center gap-1 shrink-0">
                          {deg.degreeImage && (
                            <button
                              type="button"
                              onClick={() => setViewingScanImage(deg.degreeImage)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                              title="Xem bản scan văn bằng"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDegree(deg);
                              setIsAddDegreeModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin văn bằng"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDegree(deg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa văn bằng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="text-slate-400 text-[11px]">Chuyên môn đào tạo / Học vị (Tóm tắt):</div>
                <div className="font-bold text-slate-800">
                  {emp.education || 'Chưa cập nhật văn bằng'}
                </div>
                <div className="text-[11px] text-emerald-800 pt-1">
                  Nhấp <strong>"Thêm văn bằng"</strong> phía trên để lưu chi tiết các cấp bậc văn bằng (Cử nhân, Thạc sĩ...) kèm hình thức và bản scan.
                </div>
              </div>
            )}

            {/* Trình độ Tin học & Ngoại ngữ */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
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

      {/* Modal Xác Nhận Xóa Cán Bộ */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !deleting && setIsDeleteModalOpen(false)}
          title="Xác Nhận Xóa Hồ Sơ Cán Bộ"
          subtitle="Quỹ Tín Dụng Nhân Dân Yên Thọ • Quản lý nhân sự"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900">Cảnh báo xóa vĩnh viễn</h4>
                <p className="text-rose-700 leading-relaxed">
                  Đồng chí có chắc chắn muốn xóa hồ sơ cán bộ <strong className="font-bold text-rose-950">{emp.name}</strong> ({emp.position || 'Cán bộ'} - {emp.department}) khỏi hệ thống không?
                </p>
                <p className="text-slate-600 text-[11px] pt-1">
                  Thao tác này sẽ xóa hồ sơ danh bạ và tài khoản đăng nhập tương ứng. Dữ liệu đánh giá tín nhiệm lịch sử trước đây vẫn được lưu trữ đối soát theo quy định.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
              >
                Hủy bỏ
              </Button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={deleting}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Thêm / Chỉnh Sửa Văn Bằng Chuyên Môn */}
      {isAddDegreeModalOpen && (
        <AddDegreeModal
          isOpen={isAddDegreeModalOpen}
          onClose={() => {
            setIsAddDegreeModalOpen(false);
            setEditingDegree(null);
          }}
          emp={emp}
          initialData={editingDegree}
          existingDegreesCount={empDegrees.length}
          onSuccess={() => {}}
        />
      )}

      {/* Modal Quản Lý Mạng Xã Hội */}
      {isManageSocialsModalOpen && (
        <ManageSocialsModal
          isOpen={isManageSocialsModalOpen}
          onClose={() => setIsManageSocialsModalOpen(false)}
          emp={emp}
          socials={socials}
          onSuccess={() => {}}
        />
      )}

      {/* Modal Xem Bản Scan Văn Bằng */}
      {viewingScanImage && (
        <Modal
          isOpen={Boolean(viewingScanImage)}
          onClose={() => setViewingScanImage(null)}
          title="Bản Scan / Ảnh Chụp Văn Bằng Chứng Thực"
          subtitle={`Cán bộ: ${emp?.name || ''} • ${emp?.position || ''}`}
          maxWidth="max-w-2xl"
        >
          <div className="p-4 space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={viewingScanImage}
                alt="Bản scan văn bằng"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setViewingScanImage(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(EmployeeProfileDetail);

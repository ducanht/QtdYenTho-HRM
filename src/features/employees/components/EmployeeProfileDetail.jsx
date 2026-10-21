import React, { useState, useEffect, useMemo } from 'react';
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
  MoreHorizontal,
  Save,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Shield
} from 'lucide-react';
import { 
  calculatePositionTenure, 
  calculateAreaTenureAndDueDate, 
  isCreditOfficerRole 
} from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { compressImage } from '../../../lib/imageUtils';
import { 
  updateEmployeeProfile, 
  deleteEmployeeProfile, 
  deleteEmployeeDegree,
  deleteWorkHistory
} from '../../../lib/services';
import { exportEmployeeProfileToDocx, exportEmployeeProfileToExcel } from '../../../lib/exportUtils';
import { useToast } from '../../../context/ToastContext';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Tooltip from '../../../components/common/Tooltip';
import DropdownMenu from '../../../components/common/DropdownMenu';
import AddDegreeModal, { 
  DEGREE_LEVEL_OPTIONS, 
  TRAINING_TYPE_OPTIONS 
} from './AddDegreeModal';
import ManageSocialsModal, { SOCIAL_PLATFORMS } from './ManageSocialsModal';
import WorkHistoryPeriodModal from './WorkHistoryPeriodModal';
import { 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_POSITIONS, 
  DEFAULT_MODULE_HR_SETTINGS 
} from '../../../lib/systemDefaults';

// Danh mục định chuẩn nghiệp vụ Quỹ TDND
const CONTRACT_TYPES = [
  'Không xác định thời hạn',
  'Hợp đồng có thời hạn (12 - 36 tháng)',
  'Hợp đồng thử việc',
  'Hợp đồng thời vụ / khoán việc',
];

const POLITICAL_THEORY_OPTIONS = [
  'Cử nhân',
  'Cao cấp',
  'Trung cấp',
  'Sơ cấp',
  'Chưa qua đào tạo',
];

const IT_LEVEL_OPTIONS = [
  'Ứng dụng CNTT cơ bản',
  'Ứng dụng CNTT nâng cao',
  'Cử nhân / Kỹ sư CNTT',
  'Chứng chỉ quốc tế (MOS/IC3)',
  'Chưa qua đào tạo',
];

const FOREIGN_LANGUAGE_OPTIONS = [
  'Tiếng Anh B1 / Bậc 3',
  'Tiếng Anh B2 / Bậc 4',
  'Tiếng Anh C1 / Bậc 5',
  'Tiếng Anh (Khung 6 bậc VN)',
  'Cử nhân Ngôn ngữ Anh',
  'Chưa qua đào tạo',
];

const STATE_MGMT_OPTIONS = [
  'Chuyên viên chính',
  'Chuyên viên',
  'Chứng chỉ QLNN',
  'Chưa qua đào tạo',
];

const SUB_TABS = [
  { 
    id: 'PERSONAL', 
    label: '1. THÔNG TIN CÁ NHÂN & LIÊN HỆ', 
    shortLabel: 'Lý Lịch & Liên Hệ',
    heading: 'HỒ SƠ LÝ LỊCH & KÊNH LIÊN HỆ CỦA CÁN BỘ',
    icon: User 
  },
  { 
    id: 'WORK', 
    label: '2. CÔNG TÁC & THÂM NIÊN', 
    shortLabel: 'Công Tác & Thâm Niên',
    heading: 'QUÁ TRÌNH CÔNG TÁC & ĐỊA BÀN PHỤ TRÁCH',
    icon: Briefcase 
  },
  { 
    id: 'POLITICS', 
    label: '3. CHÍNH TRỊ & ĐOÀN THỂ', 
    shortLabel: 'Chính Trị & Đoàn Thể',
    heading: 'HỒ SƠ CHÍNH TRỊ & ĐẢNG - ĐOÀN THỂ',
    icon: Award 
  },
  { 
    id: 'EDUCATION', 
    label: '4. TRÌNH ĐỘ & VĂN BẰNG', 
    shortLabel: 'Trình Độ & Văn Bằng',
    heading: 'TRÌNH ĐỘ ĐÀO TẠO & VĂN BẰNG CHUYÊN MÔN',
    icon: GraduationCap 
  },
];

/**
 * Trích xuất form data sạch từ đối tượng cán bộ
 */
const extractFormData = (e) => ({
  // Tab 1: Cá nhân & Liên hệ
  name: e?.name || e?.fullName || '',
  gender: e?.gender || 'Nam',
  cccd: e?.cccd || '',
  birthDate: e?.birthDate || e?.dateOfBirth || '',
  hometown: e?.hometown || '',
  permanentAddress: e?.permanentAddress || '',
  phone: e?.phone || '',
  secondaryPhone: e?.secondaryPhone || '',
  email: e?.email || '',

  // Tab 2: Công tác & Thâm niên
  department: e?.department || 'Phòng Tín dụng',
  position: e?.position || 'Cán bộ',
  joinDate: e?.joinDate || '',
  positionStartDate: e?.positionStartDate || '',
  workLocation: e?.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
  contractType: e?.contractType || 'Không xác định thời hạn',
  assignedArea: e?.assignedArea || '',
  areaStartDate: e?.areaStartDate || '',

  // Tab 3: Chính trị - Đoàn thể
  partyMember: Boolean(e?.partyMember),
  politicalRole: e?.politicalRole || '',
  partyDate: e?.partyDate || '',
  partyOfficialDate: e?.partyOfficialDate || '',
  partyCell: e?.partyCell || 'Chi bộ Quỹ TDND Yên Thọ',
  politicalTheory: e?.politicalTheory || 'Chưa qua đào tạo',
  unionRole: e?.unionRole || 'Đoàn viên',
  youthUnionRole: e?.youthUnionRole || 'Đoàn viên',

  // Tab 4: Trình độ & Văn bằng
  education: e?.education || e?.qualification || '',
  itLevel: e?.itLevel || 'Ứng dụng CNTT cơ bản',
  foreignLanguage: e?.foreignLanguage || 'Tiếng Anh B1 / Bậc 3',
  stateManagement: e?.stateManagement || 'Chưa qua đào tạo',
});

/**
 * EmployeeProfileDetail: Màn Hình Hồ Sơ Cán Bộ Đa Tab & Chỉnh Sửa Trực Tiếp
 * - 4 Phân khu Tab chuyên biệt trên trang (Lý lịch, Công tác, Chính trị, Trình độ)
 * - Chỉnh sửa và lưu trực tiếp theo từng tab, không cần mở cửa sổ pop-up che khuất
 * - Label ngắn gọn, chuẩn mực nghiệp vụ Quỹ TDND Yên Thọ
 * - Thân thiện di động, touch target >= 44px, không cuộn ngang tabs
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
  hrConfig = null,
  departments = [],
  positions = [],
}) => {
  const toast = useToast();

  // Tab hoạt động & Chế độ xem / sửa
  const [activeSubTab, setActiveSubTab] = useState('PERSONAL');
  const [isEditing, setIsEditing] = useState(false);
  const [tabFormData, setTabFormData] = useState(() => extractFormData(emp));
  const [saving, setSaving] = useState(false);

  // Trạng thái các tác vụ phụ
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modals cho Văn bằng, Quá trình công tác, Mạng xã hội, Bản scan
  const [isAddDegreeModalOpen, setIsAddDegreeModalOpen] = useState(false);
  const [editingDegree, setEditingDegree] = useState(null);
  const [isWorkPeriodModalOpen, setIsWorkPeriodModalOpen] = useState(false);
  const [editingWorkRecord, setEditingWorkRecord] = useState(null);
  const [isManageSocialsModalOpen, setIsManageSocialsModalOpen] = useState(false);
  const [viewingScanImage, setViewingScanImage] = useState(null);

  // Đồng bộ form khi emp thay đổi
  useEffect(() => {
    if (emp) {
      setTabFormData(extractFormData(emp));
      setIsEditing(false);
    }
  }, [emp?.id]);

  // Lọc dữ liệu liên kết của cán bộ
  const empDegrees = useMemo(() => {
    if (!emp?.id) return [];
    return degrees.filter((d) => d.employeeId === emp.id || d.employeeUuid === emp.id);
  }, [degrees, emp?.id]);

  const empSocials = useMemo(() => {
    if (!emp?.id) return [];
    return socials.filter((s) => s.employeeId === emp.id || s.employeeUuid === emp.id);
  }, [socials, emp?.id]);

  const empWorkHistory = useMemo(() => {
    if (!emp?.id) return [];
    const list = workHistory.filter((w) => w.employeeId === emp.id || w.employeeUuid === emp.id);
    return [...list].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      const dateA = a.startDate || a.effectiveDate || '';
      const dateB = b.startDate || b.effectiveDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [workHistory, emp?.id]);

  if (!emp) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
        Vui lòng chọn cán bộ từ danh sách bên trái để xem hồ sơ chi tiết.
      </div>
    );
  }

  // Danh mục cấu hình
  const deptList = departments?.length > 0 ? departments : DEFAULT_DEPARTMENTS;
  const posList = positions?.length > 0 ? positions : DEFAULT_POSITIONS;
  const workLocList = DEFAULT_MODULE_HR_SETTINGS.workLocations;
  const creditAreaList = DEFAULT_MODULE_HR_SETTINGS.creditAreas;

  // Tính toán thâm niên
  const effectiveStart = emp.positionStartDate || emp.joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(emp.joinDate);
  const isCreditOfficer = isCreditOfficerRole(emp.position, emp.department);

  const cycleMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
  const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);
  const areaInfo = isCreditOfficer ? calculateAreaTenureAndDueDate(emp.areaStartDate || effectiveStart, cycleMonths, warningMonths) : null;

  // Xử lý thay đổi input
  const handleInputChange = (field, value) => {
    setTabFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Hủy chỉnh sửa trên tab
  const handleCancelEdit = () => {
    setTabFormData(extractFormData(emp));
    setIsEditing(false);
  };

  // Lưu chỉnh sửa trực tiếp trên tab
  const handleSaveTab = async (tabKey) => {
    if (!emp?.id) return;
    try {
      setSaving(true);
      let payload = {};

      if (tabKey === 'PERSONAL') {
        const cleanName = tabFormData.name?.trim() || emp.name;
        payload = {
          name: cleanName,
          fullName: cleanName,
          gender: tabFormData.gender || 'Nam',
          cccd: tabFormData.cccd?.trim() || '',
          birthDate: tabFormData.birthDate || '',
          dateOfBirth: tabFormData.birthDate || '',
          hometown: tabFormData.hometown?.trim() || '',
          permanentAddress: tabFormData.permanentAddress?.trim() || '',
          phone: tabFormData.phone?.trim() || '',
          secondaryPhone: tabFormData.secondaryPhone?.trim() || '',
          email: tabFormData.email?.trim() || '',
        };
      } else if (tabKey === 'WORK') {
        payload = {
          department: tabFormData.department || emp.department,
          position: tabFormData.position || emp.position,
          joinDate: tabFormData.joinDate || '',
          positionStartDate: tabFormData.positionStartDate || '',
          workLocation: tabFormData.workLocation || '',
          contractType: tabFormData.contractType || '',
          assignedArea: tabFormData.assignedArea || '',
          areaStartDate: tabFormData.areaStartDate || '',
        };
      } else if (tabKey === 'POLITICS') {
        payload = {
          partyMember: Boolean(tabFormData.partyMember),
          politicalRole: tabFormData.partyMember ? (tabFormData.politicalRole || 'Đảng viên') : '',
          partyDate: tabFormData.partyMember ? (tabFormData.partyDate || '') : '',
          partyOfficialDate: tabFormData.partyMember ? (tabFormData.partyOfficialDate || '') : '',
          partyCell: tabFormData.partyCell || '',
          politicalTheory: tabFormData.politicalTheory || 'Chưa qua đào tạo',
          unionRole: tabFormData.unionRole || '',
          youthUnionRole: tabFormData.youthUnionRole || '',
        };
      } else if (tabKey === 'EDUCATION') {
        payload = {
          education: tabFormData.education || '',
          qualification: tabFormData.education || '',
          itLevel: tabFormData.itLevel || '',
          foreignLanguage: tabFormData.foreignLanguage || '',
          stateManagement: tabFormData.stateManagement || '',
        };
      }

      await updateEmployeeProfile(emp.id, payload);
      Object.assign(emp, payload);
      toast?.showSuccess?.('Đã lưu thay đổi thông tin thành công!');
      setIsEditing(false);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu thông tin cán bộ');
    } finally {
      setSaving(false);
    }
  };

  // Cập nhật ảnh đại diện
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const compressed = await compressImage(file, 400, 400, 0.75);
      await updateEmployeeProfile(emp.id, { avatar: compressed.dataUrl });
      emp.avatar = compressed.dataUrl;
      setTabFormData((prev) => ({ ...prev, avatar: compressed.dataUrl }));
      toast?.showSuccess?.('Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xóa văn bằng
  const handleDeleteDegree = async (degreeId) => {
    if (!window.confirm('Xác nhận xóa văn bằng chuyên môn này khỏi hồ sơ cán bộ?')) return;
    try {
      await deleteEmployeeDegree(degreeId);
      toast?.showSuccess?.('Đã xóa văn bằng chuyên môn thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa văn bằng chuyên môn');
    }
  };

  // Xóa mốc công tác
  const handleDeleteWorkHistory = async (workId) => {
    if (!window.confirm('Xác nhận xóa mốc công tác này khỏi lịch sử công tác cán bộ?')) return;
    try {
      await deleteWorkHistory(workId);
      toast?.showSuccess?.('Đã xóa mốc công tác thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa mốc công tác');
    }
  };

  // Xuất file Word
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

  // Xuất file Excel
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

  // Xóa hồ sơ cán bộ
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

  const currentTabObj = SUB_TABS.find((t) => t.id === activeSubTab) || SUB_TABS[0];
  const ActiveTabIcon = currentTabObj.icon;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Header Card: Định Danh & Tác Vụ Xuất Bản */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Nhận diện cán bộ */}
          <div className="flex items-center gap-3.5 sm:gap-4">
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
                title="Thay đổi ảnh đại diện"
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

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  {emp.name}
                </h1>

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

          {/* Hàng nút xuất bản & in ấn dạng biểu tượng (Icon Buttons) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip content="In trích ngang sơ yếu lý lịch chuẩn khổ A4" position="top">
              <button
                type="button"
                onClick={() => onOpenPrint?.(emp)}
                aria-label="In trích ngang A4"
                title="In trích ngang A4"
                className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
              </button>
            </Tooltip>

            <Tooltip content="Xuất sơ yếu lý lịch 2C/TCTD sang Word (.docx)" position="top">
              <button
                type="button"
                onClick={handleExportWord}
                disabled={exportingWord}
                aria-label="Xuất Word (2C/TCTD)"
                title="Xuất Word (2C/TCTD)"
                className="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-blue-700" />
              </button>
            </Tooltip>

            <Tooltip content="Xuất bảng lý lịch trích ngang sang Excel (.xlsx)" position="top">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportingExcel}
                aria-label="Xuất Excel"
                title="Xuất Excel"
                className="w-9 h-9 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              </button>
            </Tooltip>

            {canManage && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-0.5" />

                <Tooltip content="Mở form chỉnh sửa đầy đủ" position="top">
                  <button
                    type="button"
                    onClick={() => onOpenEdit?.(emp)}
                    aria-label="Mở cửa sổ chỉnh sửa đầy đủ"
                    title="Mở form chỉnh sửa đầy đủ"
                    className="w-9 h-9 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-amber-700" />
                  </button>
                </Tooltip>

                <Tooltip content="Xóa hồ sơ cán bộ" position="top">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    aria-label="Xóa hồ sơ cán bộ"
                    title="Xóa hồ sơ cán bộ"
                    className="w-9 h-9 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hệ Thống 4 Sub-Tabs Chức Năng (Responsive Grid, Zero Horizontal Scroll) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 sm:p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (activeSubTab !== tab.id) {
                    setActiveSubTab(tab.id);
                    setIsEditing(false);
                    setTabFormData(extractFormData(emp));
                  }
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Khung Nội Dung Chi Tiết Tab Được Chọn */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
        {/* Header Tab: Tiêu đề phân khu & Nút Chỉnh sửa / Lưu trực tiếp */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
              <ActiveTabIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {currentTabObj.heading}
              </h2>
              <p className="text-[11px] text-slate-500">
                {currentTabObj.shortLabel} • Quỹ Tín Dụng Nhân Dân Yên Thọ
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    Đang chỉnh sửa
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveTab(activeSubTab)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* NỘI DUNG TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
        {activeSubTab === 'PERSONAL' && (
          <div className="space-y-5">
            {isEditing ? (
              /* CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP TAB 1 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Họ và tên cán bộ <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={tabFormData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Giới tính</label>
                    <select
                      value={tabFormData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số thẻ CCCD <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      maxLength={12}
                      value={tabFormData.cccd}
                      onChange={(e) => handleInputChange('cccd', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                      placeholder="12 chữ số CCCD..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={tabFormData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số điện thoại chính</label>
                    <input
                      type="tel"
                      value={tabFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                      placeholder="0388..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số điện thoại 2 (Phụ)</label>
                    <input
                      type="tel"
                      value={tabFormData.secondaryPhone}
                      onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                      placeholder="Số phụ nếu có..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-slate-700 font-bold mb-1">Hộp thư điện tử (Email)</label>
                    <input
                      type="email"
                      value={tabFormData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                      placeholder="canbo@qtdyentho.vn..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-slate-700 font-bold mb-1">Quê quán</label>
                    <input
                      type="text"
                      value={tabFormData.hometown}
                      onChange={(e) => handleInputChange('hometown', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                      placeholder="Xã, Huyện, Tỉnh..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-slate-700 font-bold mb-1">Nơi ở hiện nay / Thường trú</label>
                    <input
                      type="text"
                      value={tabFormData.permanentAddress}
                      onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                      placeholder="Thôn, Xã, Tỉnh..."
                    />
                  </div>
                </div>

                {/* Thanh nút lưu cuối form */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button type="button" variant="primary" onClick={() => handleSaveTab('PERSONAL')} disabled={saving} className="inline-flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ XEM TAB 1 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
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
                    <span className="text-slate-400 block text-[11px] mb-0.5">Số điện thoại chính:</span>
                    <span className="font-bold text-emerald-800 tabular-nums">{emp.phone || '—'}</span>
                  </div>
                  {emp.secondaryPhone ? (
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Số điện thoại 2 (Phụ):</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{emp.secondaryPhone}</span>
                    </div>
                  ) : null}
                  <div className={emp.secondaryPhone ? "" : "sm:col-span-2 md:col-span-1"}>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Hộp thư điện tử (Email):</span>
                    <span className="font-medium text-slate-800">{emp.email || '—'}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Quê quán:</span>
                    <span className="font-medium text-slate-800">{emp.hometown || 'Chờ bổ sung'}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nơi thường trú / Địa chỉ hiện nay:</span>
                    <span className="font-medium text-slate-800">{emp.permanentAddress || 'Thôn Tân Lộc, xã Quý Lộc, Thanh Hóa'}</span>
                  </div>
                </div>

                {/* Khối Kênh Liên Lạc & Mạng Xã Hội */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-700" />
                      <span>KÊNH LIÊN LẠC & MẠNG XÃ HỘI</span>
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
                    <div className="flex flex-wrap gap-2 pt-1">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 transition-all shadow-2xs group"
                            title={`Mở kênh ${soc.platform} của cán bộ`}
                          >
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${plat.color}`}>
                              {soc.platform}
                            </span>
                            <span className="font-semibold text-xs group-hover:text-blue-700">
                              {soc.accountName || soc.username || soc.platform}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                          </a>
                        ) : (
                          <div
                            key={soc.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                          >
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${plat.color}`}>
                              {soc.platform}
                            </span>
                            <span className="font-semibold text-xs">
                              {soc.accountName || soc.username || soc.platform}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
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
            )}
          </div>
        )}

        {/* NỘI DUNG TAB 2: CÔNG TÁC & THÂM NIÊN */}
        {activeSubTab === 'WORK' && (
          <div className="space-y-5">
            {isEditing ? (
              /* CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP TAB 2 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phòng ban công tác</label>
                    <select
                      value={tabFormData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {deptList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chức danh / Vị trí hiện tại</label>
                    <select
                      value={tabFormData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {posList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Loại hợp đồng lao động</label>
                    <select
                      value={tabFormData.contractType}
                      onChange={(e) => handleInputChange('contractType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {CONTRACT_TYPES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày vào Quỹ công tác</label>
                    <input
                      type="date"
                      value={tabFormData.joinDate}
                      onChange={(e) => handleInputChange('joinDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày bổ nhiệm vị trí hiện tại</label>
                    <input
                      type="date"
                      value={tabFormData.positionStartDate}
                      onChange={(e) => handleInputChange('positionStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nơi làm việc</label>
                    <select
                      value={tabFormData.workLocation}
                      onChange={(e) => handleInputChange('workLocation', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {workLocList.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Địa bàn quản lý (CBTD)</label>
                    <select
                      value={tabFormData.assignedArea}
                      onChange={(e) => handleInputChange('assignedArea', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      <option value="">-- Không phân công địa bàn --</option>
                      {creditAreaList.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày nhận bàn giao địa bàn</label>
                    <input
                      type="date"
                      value={tabFormData.areaStartDate}
                      onChange={(e) => handleInputChange('areaStartDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button type="button" variant="primary" onClick={() => handleSaveTab('WORK')} disabled={saving} className="inline-flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ XEM TAB 2 */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Phòng ban công tác:</span>
                    <span className="font-bold text-slate-800">{emp.department || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Chức danh hiện tại:</span>
                    <span className="font-bold text-emerald-900">{emp.position || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Loại hợp đồng lao động:</span>
                    <span className="font-medium text-slate-800">{emp.contractType || 'Không xác định thời hạn'}</span>
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
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nơi làm việc:</span>
                    <span className="font-semibold text-slate-800">
                      {emp.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)'}
                    </span>
                  </div>
                </div>

                {/* Giám sát luân chuyển CBTD */}
                {isCreditOfficer && areaInfo ? (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/90 rounded-xl space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Theo Dõi Quản Lý Địa Bàn &amp; Luân Chuyển Định Kỳ</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Địa bàn quản lý:</span>
                        <strong className="text-emerald-950 font-bold">{emp.assignedArea || 'Chưa phân công địa bàn'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Ngày nhận địa bàn:</span>
                        <strong className="text-slate-800 tabular-nums">
                          {emp.areaStartDate ? formatDateVN(emp.areaStartDate) : (effectiveStart ? formatDateVN(effectiveStart) : 'Chưa cập nhật')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Thâm niên quản lý:</span>
                        <strong className="text-emerald-900 font-black">{areaInfo.tenureText}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Thời điểm luân chuyển:</span>
                        <strong className={`tabular-nums ${areaInfo.isDue ? 'text-rose-700 font-black' : areaInfo.isNear ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                          {areaInfo.dueDateText} ({cycleMonths} tháng)
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Địa bàn phụ trách:</span>
                    <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl block border border-slate-100 text-xs">
                      {emp.assignedArea || 'Chưa phân công địa bàn'}
                    </span>
                  </div>
                )}

                {/* Quá Trình Công Tác & Luân Chuyển Vị Trí (Timeline) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Quá Trình Công Tác &amp; Luân Chuyển Vị Trí</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Lịch sử chức danh, phòng ban và quyết định điều động ({empWorkHistory.length} mốc)
                      </p>
                    </div>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWorkRecord(null);
                          setIsWorkPeriodModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm mốc công tác</span>
                      </button>
                    )}
                  </div>

                  {empWorkHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {empWorkHistory.map((work) => (
                        <div
                          key={work.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            work.isCurrent
                              ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                  work.isCurrent ? 'bg-emerald-800 text-white shadow-2xs' : 'bg-slate-200 text-slate-800'
                                }`}>
                                  {work.isCurrent ? 'Đang đảm nhiệm' : 'Đã hoàn thành'}
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                  {work.position || work.newPosition}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs font-semibold text-slate-700">
                                  {work.department || work.newDepartment}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>
                                  Thời gian: <strong className="text-slate-800 tabular-nums">
                                    {work.startDate ? formatDateVN(work.startDate) : (work.effectiveDate ? formatDateVN(work.effectiveDate) : '—')}
                                  </strong> đến <strong className="text-slate-800 tabular-nums">
                                    {work.isCurrent ? 'Nay' : (work.endDate ? formatDateVN(work.endDate) : '—')}
                                  </strong>
                                </span>
                                {work.assignedArea && (
                                  <span>• Địa bàn: <strong className="text-emerald-950 font-bold">{work.assignedArea}</strong></span>
                                )}
                                {work.decisionNumber && (
                                  <span>• Số QĐ: <strong className="text-slate-700 tabular-nums">{work.decisionNumber}</strong></span>
                                )}
                                {work.signer && (
                                  <span>• Người ký: {work.signer}</span>
                                )}
                              </div>

                              {work.notes && (
                                <p className="text-[11px] text-slate-500 italic pt-0.5">
                                  Ghi chú: {work.notes}
                                </p>
                              )}
                            </div>

                            {canManage && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingWorkRecord(work);
                                    setIsWorkPeriodModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Sửa mốc công tác"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWorkHistory(work.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa mốc công tác"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                      Chưa ghi nhận mốc luân chuyển hoặc quá trình công tác trước đây.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NỘI DUNG TAB 3: CHÍNH TRỊ & ĐOÀN THỂ */}
        {activeSubTab === 'POLITICS' && (
          <div className="space-y-5">
            {isEditing ? (
              /* CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP TAB 3 */
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tab-party-member"
                      checked={tabFormData.partyMember}
                      onChange={(e) => handleInputChange('partyMember', e.target.checked)}
                      className="w-4 h-4 text-emerald-800 rounded-md border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="tab-party-member" className="font-bold text-slate-900 cursor-pointer">
                      Là Đảng viên Đảng Cộng sản Việt Nam
                    </label>
                  </div>

                  {tabFormData.partyMember && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Chức vụ trong Chi bộ</label>
                        <select
                          value={tabFormData.politicalRole}
                          onChange={(e) => handleInputChange('politicalRole', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white text-xs"
                        >
                          <option value="Đảng viên">Đảng viên</option>
                          <option value="Bí thư Chi bộ">Bí thư Chi bộ</option>
                          <option value="Phó Bí thư Chi bộ">Phó Bí thư Chi bộ</option>
                          <option value="Chi ủy viên">Chi ủy viên</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Ngày vào Đảng dự bị</label>
                        <input
                          type="date"
                          value={tabFormData.partyDate}
                          onChange={(e) => handleInputChange('partyDate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Ngày chính thức</label>
                        <input
                          type="date"
                          value={tabFormData.partyOfficialDate}
                          onChange={(e) => handleInputChange('partyOfficialDate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-slate-700 font-semibold mb-1">Nơi sinh hoạt Đảng hiện nay</label>
                        <input
                          type="text"
                          value={tabFormData.partyCell}
                          onChange={(e) => handleInputChange('partyCell', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-xs"
                          placeholder="Chi bộ Quỹ TDND Yên Thọ..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trình độ Lý luận chính trị</label>
                    <select
                      value={tabFormData.politicalTheory}
                      onChange={(e) => handleInputChange('politicalTheory', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {POLITICAL_THEORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Công đoàn cơ sở</label>
                    <select
                      value={tabFormData.unionRole}
                      onChange={(e) => handleInputChange('unionRole', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      <option value="Đoàn viên">Đoàn viên công đoàn</option>
                      <option value="Chủ tịch CĐCS">Chủ tịch CĐCS</option>
                      <option value="Phó Chủ tịch CĐCS">Phó Chủ tịch CĐCS</option>
                      <option value="Ủy viên BCH CĐCS">Ủy viên BCH CĐCS</option>
                      <option value="Không tham gia">Không tham gia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Đoàn TNCS Hồ Chí Minh</label>
                    <select
                      value={tabFormData.youthUnionRole}
                      onChange={(e) => handleInputChange('youthUnionRole', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      <option value="Đoàn viên">Đoàn viên thanh niên</option>
                      <option value="Bí thư Chi đoàn">Bí thư Chi đoàn</option>
                      <option value="Phó Bí thư Chi đoàn">Phó Bí thư Chi đoàn</option>
                      <option value="Ủy viên BCH Chi đoàn">Ủy viên BCH Chi đoàn</option>
                      <option value="Hết tuổi đoàn">Hết tuổi đoàn viên</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button type="button" variant="primary" onClick={() => handleSaveTab('POLITICS')} disabled={saving} className="inline-flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ XEM TAB 3 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
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
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Nơi sinh hoạt Đảng hiện nay:</span>
                    <span className="font-medium text-slate-800">{emp.partyCell || 'Chi bộ Quỹ TDND Yên Thọ'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Lý luận chính trị:</span>
                    <span className="font-bold text-slate-800">{emp.politicalTheory || 'Chưa qua đào tạo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Tổ chức Công đoàn cơ sở:</span>
                    <span className="font-medium text-slate-800">{emp.unionRole || 'Đoàn viên công đoàn'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Đoàn TNCS Hồ Chí Minh:</span>
                    <span className="font-medium text-slate-800">{emp.youthUnionRole || 'Đoàn viên'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NỘI DUNG TAB 4: TRÌNH ĐỘ & VĂN BẰNG CHUYÊN MÔN */}
        {activeSubTab === 'EDUCATION' && (
          <div className="space-y-5">
            {isEditing ? (
              /* CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP TAB 4 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chuyên môn đào tạo / Học vị (Tóm tắt)</label>
                    <input
                      type="text"
                      value={tabFormData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                      placeholder="Cử nhân Tài chính - Ngân hàng..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trình độ Tin học</label>
                    <select
                      value={tabFormData.itLevel}
                      onChange={(e) => handleInputChange('itLevel', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {IT_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trình độ Ngoại ngữ</label>
                    <select
                      value={tabFormData.foreignLanguage}
                      onChange={(e) => handleInputChange('foreignLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {FOREIGN_LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trình độ Quản lý Nhà nước</label>
                    <select
                      value={tabFormData.stateManagement}
                      onChange={(e) => handleInputChange('stateManagement', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white"
                    >
                      {STATE_MGMT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button type="button" variant="primary" onClick={() => handleSaveTab('EDUCATION')} disabled={saving} className="inline-flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ XEM TAB 4 */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Chuyên môn đào tạo / Học vị:</span>
                    <span className="font-bold text-slate-900">{emp.education || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Tin học:</span>
                    <span className="font-semibold text-slate-800">{emp.itLevel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Ngoại ngữ:</span>
                    <span className="font-semibold text-slate-800">{emp.foreignLanguage || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Trình độ Quản lý Nhà nước:</span>
                    <span className="font-semibold text-slate-800">{emp.stateManagement || '—'}</span>
                  </div>
                </div>

                {/* Danh mục văn bằng chuyên môn đa cấp */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Danh Mục Văn Bằng Chuyên Môn Đào Tạo</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Cấp bậc đào tạo, chuyên ngành, cơ sở đào tạo và bản scan ({empDegrees.length} văn bằng)
                      </p>
                    </div>

                    {canManage && (
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
                    )}
                  </div>

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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-1">
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

                                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2">
                                  <span>{deg.institution}</span>
                                  {deg.classification && (
                                    <span className="text-slate-400">• Loại: <strong className="text-slate-700 font-semibold">{deg.classification}</strong></span>
                                  )}
                                  {deg.degreeNumber && (
                                    <span className="text-slate-400">• Số hiệu: <strong className="text-slate-700 font-semibold tabular-nums">{deg.degreeNumber}</strong></span>
                                  )}
                                </div>
                              </div>

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
                                {canManage && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                      Chưa lưu trữ danh mục văn bằng chuyên môn đào tạo chi tiết. Nhấp "Thêm văn bằng" để bổ sung.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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

      {/* Modal Thêm / Chỉnh Sửa Mốc Quá Trình Công Tác (Timeline) */}
      {isWorkPeriodModalOpen && (
        <WorkHistoryPeriodModal
          isOpen={isWorkPeriodModalOpen}
          onClose={() => {
            setIsWorkPeriodModalOpen(false);
            setEditingWorkRecord(null);
          }}
          emp={emp}
          record={editingWorkRecord}
          departments={deptList}
          positions={posList}
          hrConfig={hrConfig}
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

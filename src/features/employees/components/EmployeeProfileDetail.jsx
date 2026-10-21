import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Shield,
  Zap,
  Loader2
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
import UnsavedChangesModal from './UnsavedChangesModal';
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

// Nhãn tiếng Việt định danh cho các trường dữ liệu
const FIELD_LABELS = {
  // Tab 1: Cá nhân & Liên hệ
  name: 'Họ và tên cán bộ',
  gender: 'Giới tính',
  cccd: 'Số thẻ CCCD',
  birthDate: 'Ngày sinh',
  phone: 'Số điện thoại chính',
  secondaryPhone: 'Số điện thoại phụ',
  email: 'Hộp thư điện tử (Email)',
  hometown: 'Quê quán',
  permanentAddress: 'Nơi thường trú',

  // Tab 2: Công tác & Thâm niên
  department: 'Phòng ban công tác',
  position: 'Chức danh hiện tại',
  contractType: 'Loại hợp đồng lao động',
  joinDate: 'Ngày vào Quỹ công tác',
  positionStartDate: 'Ngày bổ nhiệm vị trí',
  workLocation: 'Nơi làm việc',
  assignedArea: 'Địa bàn quản lý (CBTD)',
  areaStartDate: 'Ngày nhận bàn giao địa bàn',

  // Tab 3: Chính trị & Đoàn thể
  partyMember: 'Tư cách Đảng viên',
  politicalRole: 'Chức vụ trong Chi bộ',
  partyDate: 'Ngày vào Đảng dự bị',
  partyOfficialDate: 'Ngày chính thức',
  partyCell: 'Nơi sinh hoạt Đảng',
  politicalTheory: 'Trình độ Lý luận chính trị',
  unionRole: 'Công đoàn cơ sở',
  youthUnionRole: 'Đoàn TNCS Hồ Chí Minh',

  // Tab 4: Trình độ & Văn bằng
  education: 'Chuyên môn đào tạo / Học vị',
  itLevel: 'Trình độ Tin học',
  foreignLanguage: 'Trình độ Ngoại ngữ',
  stateManagement: 'Trình độ Quản lý Nhà nước',
};

// Bản đồ phân nhóm trường theo từng Sub-tab
const TAB_FIELD_MAP = {
  PERSONAL: ['name', 'gender', 'cccd', 'birthDate', 'phone', 'secondaryPhone', 'email', 'hometown', 'permanentAddress'],
  WORK: ['department', 'position', 'contractType', 'joinDate', 'positionStartDate', 'workLocation', 'assignedArea', 'areaStartDate'],
  POLITICS: ['partyMember', 'politicalRole', 'partyDate', 'partyOfficialDate', 'partyCell', 'politicalTheory', 'unionRole', 'youthUnionRole'],
  EDUCATION: ['education', 'itLevel', 'foreignLanguage', 'stateManagement'],
};

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
 * Kiểm tra các trường bị thay đổi của Tab
 */
const getDirtyFieldsForTab = (tabKey, currentData, baseData) => {
  const fields = TAB_FIELD_MAP[tabKey] || [];
  const changed = [];
  if (!currentData || !baseData) return changed;

  for (const f of fields) {
    const valCurr = currentData[f] === undefined ? '' : currentData[f];
    const valBase = baseData[f] === undefined ? '' : baseData[f];
    if (typeof valCurr === 'boolean') {
      if (Boolean(valCurr) !== Boolean(valBase)) {
        changed.push({
          field: f,
          label: FIELD_LABELS[f] || f,
          from: valBase ? 'Có' : 'Không',
          to: valCurr ? 'Có' : 'Không',
        });
      }
    } else {
      const sCurr = String(valCurr).trim();
      const sBase = String(valBase).trim();
      if (sCurr !== sBase) {
        changed.push({
          field: f,
          label: FIELD_LABELS[f] || f,
          from: sBase || '(Trống)',
          to: sCurr || '(Trống)',
        });
      }
    }
  }
  return changed;
};

/**
 * Tạo payload chuẩn bị lưu vào CSDL Firestore
 */
const buildPayloadForTab = (tabKey, formData, currentEmp) => {
  if (tabKey === 'PERSONAL') {
    const cleanName = formData.name?.trim() || currentEmp.name;
    return {
      name: cleanName,
      fullName: cleanName,
      gender: formData.gender || 'Nam',
      cccd: formData.cccd?.trim() || '',
      birthDate: formData.birthDate || '',
      dateOfBirth: formData.birthDate || '',
      hometown: formData.hometown?.trim() || '',
      permanentAddress: formData.permanentAddress?.trim() || '',
      phone: formData.phone?.trim() || '',
      secondaryPhone: formData.secondaryPhone?.trim() || '',
      email: formData.email?.trim() || '',
    };
  }
  if (tabKey === 'WORK') {
    return {
      department: formData.department || currentEmp.department,
      position: formData.position || currentEmp.position,
      joinDate: formData.joinDate || '',
      positionStartDate: formData.positionStartDate || '',
      workLocation: formData.workLocation || '',
      contractType: formData.contractType || '',
      assignedArea: formData.assignedArea || '',
      areaStartDate: formData.areaStartDate || '',
    };
  }
  if (tabKey === 'POLITICS') {
    return {
      partyMember: Boolean(formData.partyMember),
      politicalRole: formData.partyMember ? (formData.politicalRole || 'Đảng viên') : '',
      partyDate: formData.partyMember ? (formData.partyDate || '') : '',
      partyOfficialDate: formData.partyMember ? (formData.partyOfficialDate || '') : '',
      partyCell: formData.partyCell || '',
      politicalTheory: formData.politicalTheory || 'Chưa qua đào tạo',
      unionRole: formData.unionRole || '',
      youthUnionRole: formData.youthUnionRole || '',
    };
  }
  if (tabKey === 'EDUCATION') {
    return {
      education: formData.education || '',
      qualification: formData.education || '',
      itLevel: formData.itLevel || '',
      foreignLanguage: formData.foreignLanguage || '',
      stateManagement: formData.stateManagement || '',
    };
  }
  return {};
};

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
  onDirtyChange = null,
}) => {
  const toast = useToast();

  // Tab hoạt động & Chế độ xem / sửa
  const [activeSubTab, setActiveSubTab] = useState('PERSONAL');
  const currentTabObj = useMemo(() => {
    return SUB_TABS.find((t) => t.id === activeSubTab) || SUB_TABS[0];
  }, [activeSubTab]);
  const [isEditing, setIsEditing] = useState(false);
  const [tabFormData, setTabFormData] = useState(() => extractFormData(emp));
  const [initialFormData, setInitialFormData] = useState(() => extractFormData(emp));
  const [saving, setSaving] = useState(false);

  // Cơ chế Tự Động Lưu & Phát Hiện Thay Đổi
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qtd_hrm_profile_autosave') !== 'false';
    }
    return true;
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'typing' | 'saving' | 'saved' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const autoSaveTimerRef = useRef(null);

  // Modal cảnh báo thay đổi chưa lưu khi chuyển tab hoặc chuyển cán bộ
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null);

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
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      const initial = extractFormData(emp);
      setTabFormData(initial);
      setInitialFormData(initial);
      setIsEditing(false);
      setAutoSaveStatus('idle');
    }
  }, [emp?.id]);

  // Tính toán các trường bị thay đổi trong Tab hiện tại
  const dirtyFields = useMemo(() => {
    if (!isEditing) return [];
    return getDirtyFieldsForTab(activeSubTab, tabFormData, initialFormData);
  }, [isEditing, activeSubTab, tabFormData, initialFormData]);

  const isDirty = dirtyFields.length > 0;

  // Kiểm tra trường cụ thể có bị sửa không
  const isFieldDirty = useCallback((fieldName) => {
    return dirtyFields.some((f) => f.field === fieldName);
  }, [dirtyFields]);

  // Lưu chỉnh sửa trực tiếp trên tab (Thủ công)
  const handleSaveTab = useCallback(async (tabKey) => {
    if (!emp?.id) return;
    try {
      setSaving(true);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      const payload = buildPayloadForTab(tabKey, tabFormData, emp);
      await updateEmployeeProfile(emp.id, payload);
      Object.assign(emp, payload);
      setInitialFormData((prev) => ({ ...prev, ...payload }));
      toast?.showSuccess?.('Đã lưu thay đổi thông tin thành công!');
      setAutoSaveStatus('saved');
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(nowStr);
      setIsEditing(false);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu thông tin cán bộ');
    } finally {
      setSaving(false);
    }
  }, [emp, tabFormData, toast]);

  // Thông báo trạng thái dirty cho Container cha
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange({
        isDirty,
        autoSaveEnabled,
        empName: emp?.name,
        empId: emp?.id,
        dirtyFields,
        currentTabLabel: currentTabObj.shortLabel,
        saveChanges: async () => {
          await handleSaveTab(activeSubTab);
        },
        discardChanges: () => {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          setTabFormData(initialFormData);
          setIsEditing(false);
          setAutoSaveStatus('idle');
        },
      });
    }
  }, [isDirty, autoSaveEnabled, emp?.name, emp?.id, dirtyFields, currentTabObj.shortLabel, activeSubTab, initialFormData, onDirtyChange, handleSaveTab]);

  // Cảnh báo trình duyệt nếu có thay đổi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing && isDirty && !autoSaveEnabled) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, isDirty, autoSaveEnabled]);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Bật/tắt chế độ tự động lưu
  const handleToggleAutoSave = (checked) => {
    setAutoSaveEnabled(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qtd_hrm_profile_autosave', checked ? 'true' : 'false');
    }
    if (checked) {
      toast?.showSuccess?.('Đã bật chế độ tự động lưu khi chỉnh sửa hồ sơ.');
    } else {
      toast?.showInfo?.('Đã chuyển sang chế độ lưu thủ công (có cảnh báo thay đổi).');
    }
  };

  // Tự động lưu ngầm Debounced
  const handleAutoSaveDebounced = async (tabKey, currentWorkingData) => {
    if (!emp?.id) return;
    try {
      setAutoSaveStatus('saving');
      const payload = buildPayloadForTab(tabKey, currentWorkingData || tabFormData, emp);
      await updateEmployeeProfile(emp.id, payload);
      Object.assign(emp, payload);
      setInitialFormData((prev) => ({ ...prev, ...payload }));
      setAutoSaveStatus('saved');
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(nowStr);
      setTimeout(() => {
        setAutoSaveStatus((curr) => (curr === 'saved' ? 'idle' : curr));
      }, 3500);
    } catch (err) {
      console.error('Lỗi tự động lưu:', err);
      setAutoSaveStatus('error');
      toast?.showError?.('Lỗi tự động lưu: ' + (err.message || 'Không thể cập nhật CSDL'));
    }
  };

  // Xử lý thay đổi input
  const handleInputChange = (field, value) => {
    const nextData = { ...tabFormData, [field]: value };
    setTabFormData(nextData);

    if (autoSaveEnabled) {
      setAutoSaveStatus('typing');
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSaveDebounced(activeSubTab, nextData);
      }, 1500);
    }
  };

  // Hủy chỉnh sửa trên tab
  const handleCancelEdit = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (isDirty) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy bỏ các thay đổi này không?')) {
        setTabFormData(initialFormData);
        setIsEditing(false);
        setAutoSaveStatus('idle');
      }
    } else {
      setTabFormData(initialFormData);
      setIsEditing(false);
      setAutoSaveStatus('idle');
    }
  };


  // Điều hướng chuyển Sub-tab kèm kiểm tra thay đổi chưa lưu
  const handleSubTabClick = async (targetTabId) => {
    if (activeSubTab === targetTabId) return;

    if (isEditing && isDirty) {
      if (autoSaveEnabled) {
        // Tự động lưu ngầm tab hiện tại trước khi chuyển
        try {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          const payload = buildPayloadForTab(activeSubTab, tabFormData, emp);
          await updateEmployeeProfile(emp.id, payload);
          Object.assign(emp, payload);
          setInitialFormData((prev) => ({ ...prev, ...payload }));
          toast?.showSuccess?.(`Đã tự động lưu ${currentTabObj.shortLabel}`);
          setActiveSubTab(targetTabId);
          setIsEditing(false);
        } catch (err) {
          toast?.showError?.('Lỗi tự động lưu: ' + err.message);
        }
      } else {
        // Mở Modal cảnh báo xác nhận
        setPendingTabSwitch(targetTabId);
        setIsUnsavedModalOpen(true);
      }
    } else {
      setActiveSubTab(targetTabId);
      setIsEditing(false);
      setTabFormData(extractFormData(emp));
      setInitialFormData(extractFormData(emp));
    }
  };

  // Modal Xử lý Thay đổi Chưa Lưu
  const handleModalSaveAndContinue = async () => {
    if (!emp?.id) return;
    try {
      setSaving(true);
      const payload = buildPayloadForTab(activeSubTab, tabFormData, emp);
      await updateEmployeeProfile(emp.id, payload);
      Object.assign(emp, payload);
      setInitialFormData((prev) => ({ ...prev, ...payload }));
      toast?.showSuccess?.(`Đã lưu thay đổi ${currentTabObj.shortLabel} thành công!`);
      setIsUnsavedModalOpen(false);
      if (pendingTabSwitch) {
        setActiveSubTab(pendingTabSwitch);
        setPendingTabSwitch(null);
      }
      setIsEditing(false);
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu thông tin cán bộ');
    } finally {
      setSaving(false);
    }
  };

  const handleModalDiscardAndContinue = () => {
    setTabFormData(initialFormData);
    setIsUnsavedModalOpen(false);
    if (pendingTabSwitch) {
      setActiveSubTab(pendingTabSwitch);
      setPendingTabSwitch(null);
    }
    setIsEditing(false);
    toast?.showInfo?.('Đã hủy bỏ các thay đổi chưa lưu.');
  };

  const handleModalCancel = () => {
    setIsUnsavedModalOpen(false);
    setPendingTabSwitch(null);
  };

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
            const tabDirty = isEditing && activeSubTab === tab.id && isDirty;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSubTabClick(tab.id)}
                className={`relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
                {tabDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-2 right-2 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Khung Nội Dung Chi Tiết Tab Được Chọn */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        {/* Header Tab: Tiêu đề phân khu & Nút Chỉnh sửa / Lưu trực tiếp & Trạng thái Đồng bộ */}
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
            <div className="flex flex-wrap items-center gap-2">
              {isEditing ? (
                <>
                  {/* Trạng thái lưu & Dirty indicator */}
                  {autoSaveStatus === 'saving' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>Đang tự động lưu...</span>
                    </span>
                  ) : autoSaveStatus === 'saved' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold animate-in fade-in duration-150">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã lưu lúc {lastSavedTime || 'vừa xong'}</span>
                    </span>
                  ) : isDirty ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Có {dirtyFields.length} thay đổi</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 text-[11px] font-medium hidden sm:inline-flex">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Đồng bộ CSDL</span>
                    </span>
                  )}

                  {/* Nút bật/tắt Tự Động Lưu */}
                  <label 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 text-[11px] font-bold cursor-pointer select-none transition-colors"
                    title="Bật/Tắt chế độ tự động lưu thay đổi khi nhập"
                  >
                    <input
                      type="checkbox"
                      checked={autoSaveEnabled}
                      onChange={(e) => handleToggleAutoSave(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <Zap className={`w-3.5 h-3.5 ${autoSaveEnabled ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <span className="hidden md:inline">Tự động lưu</span>
                  </label>

                  {/* Nút Hủy & Lưu */}
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
                    className={`inline-flex items-center gap-1.5 ${
                      isDirty
                        ? 'bg-emerald-800 hover:bg-emerald-900 ring-2 ring-emerald-500/50 shadow-xs font-black'
                        : ''
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {saving
                        ? 'Đang lưu...'
                        : isDirty
                        ? `Lưu ${dirtyFields.length} thay đổi`
                        : 'Lưu thay đổi'}
                    </span>
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

        {/* Thanh Cảnh Báo Phát Hiện Thay Đổi Chưa Lưu */}
        {isEditing && isDirty && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Phát hiện {dirtyFields.length} mục đã thay đổi:</strong>{' '}
                <span className="text-amber-800 font-medium">
                  {dirtyFields.map((f) => f.label).join(', ')}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="text-amber-800 italic">
                {autoSaveEnabled
                  ? '⚡ Hệ thống đang tự động lưu sau khi dừng gõ...'
                  : '⚠️ Hãy nhấn Lưu thay đổi hoặc bật Tự động lưu'}
              </span>
              {!autoSaveEnabled && (
                <button
                  type="button"
                  onClick={() => handleSaveTab(activeSubTab)}
                  disabled={saving}
                  className="font-black text-emerald-900 hover:text-emerald-950 underline cursor-pointer"
                >
                  Lưu ngay
                </button>
              )}
            </div>
          </div>
        )}

        {/* NỘI DUNG TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ */}
        {activeSubTab === 'PERSONAL' && (
          <div className="space-y-5">
            {isEditing ? (
              /* CHẾ ĐỘ CHỈNH SỬA TRỰC TIẾP TAB 1 */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Họ và tên cán bộ <span className="text-rose-500">*</span></span>
                      {isFieldDirty('name') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={tabFormData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden transition-colors ${
                        isFieldDirty('name') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="Nhập họ và tên..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Giới tính</span>
                      {isFieldDirty('gender') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('gender') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Số thẻ CCCD <span className="text-rose-500">*</span></span>
                      {isFieldDirty('cccd') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={tabFormData.cccd}
                      onChange={(e) => handleInputChange('cccd', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('cccd') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="12 chữ số CCCD..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Ngày sinh</span>
                      {isFieldDirty('birthDate') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={tabFormData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('birthDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Số điện thoại chính</span>
                      {isFieldDirty('phone') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="tel"
                      value={tabFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('phone') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="0388..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Số điện thoại 2 (Phụ)</span>
                      {isFieldDirty('secondaryPhone') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="tel"
                      value={tabFormData.secondaryPhone}
                      onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('secondaryPhone') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="Số phụ nếu có..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Hộp thư điện tử (Email)</span>
                      {isFieldDirty('email') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      value={tabFormData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden transition-colors ${
                        isFieldDirty('email') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="canbo@qtdyentho.vn..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Quê quán</span>
                      {isFieldDirty('hometown') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={tabFormData.hometown}
                      onChange={(e) => handleInputChange('hometown', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden transition-colors ${
                        isFieldDirty('hometown') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="Xã, Huyện, Tỉnh..."
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Nơi ở hiện nay / Thường trú</span>
                      {isFieldDirty('permanentAddress') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={tabFormData.permanentAddress}
                      onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden transition-colors ${
                        isFieldDirty('permanentAddress') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="Thôn, Xã, Tỉnh..."
                    />
                  </div>
                </div>

                {/* Thanh nút lưu cuối form */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => handleSaveTab('PERSONAL')} 
                    disabled={saving} 
                    className={`inline-flex items-center gap-1.5 ${
                      isDirty ? 'bg-emerald-800 hover:bg-emerald-900 ring-2 ring-emerald-500/50 shadow-xs font-black' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving 
                        ? 'Đang lưu...' 
                        : isDirty 
                        ? `Lưu ${dirtyFields.length} thay đổi` 
                        : 'Lưu thay đổi'}
                    </span>
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
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Phòng ban công tác</span>
                      {isFieldDirty('department') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('department') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {deptList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Chức danh / Vị trí hiện tại</span>
                      {isFieldDirty('position') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('position') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {posList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Loại hợp đồng lao động</span>
                      {isFieldDirty('contractType') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.contractType}
                      onChange={(e) => handleInputChange('contractType', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('contractType') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {CONTRACT_TYPES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Ngày vào Quỹ công tác</span>
                      {isFieldDirty('joinDate') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={tabFormData.joinDate}
                      onChange={(e) => handleInputChange('joinDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('joinDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Ngày bổ nhiệm vị trí hiện tại</span>
                      {isFieldDirty('positionStartDate') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={tabFormData.positionStartDate}
                      onChange={(e) => handleInputChange('positionStartDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('positionStartDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Nơi làm việc</span>
                      {isFieldDirty('workLocation') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.workLocation}
                      onChange={(e) => handleInputChange('workLocation', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('workLocation') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {workLocList.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Địa bàn quản lý (CBTD)</span>
                      {isFieldDirty('assignedArea') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.assignedArea}
                      onChange={(e) => handleInputChange('assignedArea', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('assignedArea') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      <option value="">-- Không phân công địa bàn --</option>
                      {creditAreaList.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Ngày nhận bàn giao địa bàn</span>
                      {isFieldDirty('areaStartDate') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={tabFormData.areaStartDate}
                      onChange={(e) => handleInputChange('areaStartDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums transition-colors ${
                        isFieldDirty('areaStartDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Hủy bỏ
                  </Button>
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => handleSaveTab('WORK')} 
                    disabled={saving} 
                    className={`inline-flex items-center gap-1.5 ${
                      isDirty ? 'bg-emerald-800 hover:bg-emerald-900 ring-2 ring-emerald-500/50 shadow-xs font-black' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving 
                        ? 'Đang lưu...' 
                        : isDirty 
                        ? `Lưu ${dirtyFields.length} thay đổi` 
                        : 'Lưu thay đổi'}
                    </span>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="tab-party-member"
                        checked={tabFormData.partyMember}
                        onChange={(e) => handleInputChange('partyMember', e.target.checked)}
                        className="w-4 h-4 text-emerald-800 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="tab-party-member" className="font-bold text-slate-900 cursor-pointer">
                        Là Đảng viên Đảng Cộng sản Việt Nam
                      </label>
                    </div>
                    {isFieldDirty('partyMember') && (
                      <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                        Đã sửa
                      </span>
                    )}
                  </div>

                  {tabFormData.partyMember && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                          <span>Chức vụ trong Chi bộ</span>
                          {isFieldDirty('politicalRole') && (
                            <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                              Đã sửa
                            </span>
                          )}
                        </label>
                        <select
                          value={tabFormData.politicalRole}
                          onChange={(e) => handleInputChange('politicalRole', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white text-xs transition-colors ${
                            isFieldDirty('politicalRole') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                        >
                          <option value="Đảng viên">Đảng viên</option>
                          <option value="Bí thư Chi bộ">Bí thư Chi bộ</option>
                          <option value="Phó Bí thư Chi bộ">Phó Bí thư Chi bộ</option>
                          <option value="Chi ủy viên">Chi ủy viên</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                          <span>Ngày vào Đảng dự bị</span>
                          {isFieldDirty('partyDate') && (
                            <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                              Đã sửa
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={tabFormData.partyDate}
                          onChange={(e) => handleInputChange('partyDate', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums text-xs transition-colors ${
                            isFieldDirty('partyDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                          <span>Ngày chính thức</span>
                          {isFieldDirty('partyOfficialDate') && (
                            <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                              Đã sửa
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={tabFormData.partyOfficialDate}
                          onChange={(e) => handleInputChange('partyOfficialDate', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden tabular-nums text-xs transition-colors ${
                            isFieldDirty('partyOfficialDate') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="flex items-center justify-between text-slate-700 font-semibold mb-1">
                          <span>Nơi sinh hoạt Đảng hiện nay</span>
                          {isFieldDirty('partyCell') && (
                            <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                              Đã sửa
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={tabFormData.partyCell}
                          onChange={(e) => handleInputChange('partyCell', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden text-xs transition-colors ${
                            isFieldDirty('partyCell') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                          }`}
                          placeholder="Chi bộ Quỹ TDND Yên Thọ..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Trình độ Lý luận chính trị</span>
                      {isFieldDirty('politicalTheory') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.politicalTheory}
                      onChange={(e) => handleInputChange('politicalTheory', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('politicalTheory') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {POLITICAL_THEORY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Công đoàn cơ sở</span>
                      {isFieldDirty('unionRole') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.unionRole}
                      onChange={(e) => handleInputChange('unionRole', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('unionRole') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      <option value="Đoàn viên">Đoàn viên công đoàn</option>
                      <option value="Chủ tịch CĐCS">Chủ tịch CĐCS</option>
                      <option value="Phó Chủ tịch CĐCS">Phó Chủ tịch CĐCS</option>
                      <option value="Ủy viên BCH CĐCS">Ủy viên BCH CĐCS</option>
                      <option value="Không tham gia">Không tham gia</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Đoàn TNCS Hồ Chí Minh</span>
                      {isFieldDirty('youthUnionRole') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.youthUnionRole}
                      onChange={(e) => handleInputChange('youthUnionRole', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('youthUnionRole') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
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
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => handleSaveTab('POLITICS')} 
                    disabled={saving} 
                    className={`inline-flex items-center gap-1.5 ${
                      isDirty ? 'bg-emerald-800 hover:bg-emerald-900 ring-2 ring-emerald-500/50 shadow-xs font-black' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving 
                        ? 'Đang lưu...' 
                        : isDirty 
                        ? `Lưu ${dirtyFields.length} thay đổi` 
                        : 'Lưu thay đổi'}
                    </span>
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
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Chuyên môn đào tạo / Học vị</span>
                      {isFieldDirty('education') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={tabFormData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden transition-colors ${
                        isFieldDirty('education') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                      placeholder="Cử nhân Tài chính - Ngân hàng..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Trình độ Tin học</span>
                      {isFieldDirty('itLevel') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.itLevel}
                      onChange={(e) => handleInputChange('itLevel', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('itLevel') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {IT_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Trình độ Ngoại ngữ</span>
                      {isFieldDirty('foreignLanguage') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.foreignLanguage}
                      onChange={(e) => handleInputChange('foreignLanguage', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('foreignLanguage') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
                    >
                      {FOREIGN_LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-slate-700 font-bold mb-1">
                      <span>Trình độ Quản lý Nhà nước</span>
                      {isFieldDirty('stateManagement') && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded">
                          Đã sửa
                        </span>
                      )}
                    </label>
                    <select
                      value={tabFormData.stateManagement}
                      onChange={(e) => handleInputChange('stateManagement', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl focus:border-emerald-600 focus:outline-hidden bg-white transition-colors ${
                        isFieldDirty('stateManagement') ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300' : 'border-slate-300'
                      }`}
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
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => handleSaveTab('EDUCATION')} 
                    disabled={saving} 
                    className={`inline-flex items-center gap-1.5 ${
                      isDirty ? 'bg-emerald-800 hover:bg-emerald-900 ring-2 ring-emerald-500/50 shadow-xs font-black' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving 
                        ? 'Đang lưu...' 
                        : isDirty 
                        ? `Lưu ${dirtyFields.length} thay đổi` 
                        : 'Lưu thay đổi'}
                    </span>
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

      {/* Modal Cảnh Báo Thay Đổi Chưa Lưu Khi Chuyển Tab */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        employeeName={emp?.name}
        currentSection={currentTabObj.label}
        targetSection={SUB_TABS.find((t) => t.id === pendingTabSwitch)?.label || ''}
        dirtyFields={dirtyFields}
        onSave={handleModalSaveAndContinue}
        onDiscard={handleModalDiscardAndContinue}
        onCancel={handleModalCancel}
        isSaving={saving}
      />

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

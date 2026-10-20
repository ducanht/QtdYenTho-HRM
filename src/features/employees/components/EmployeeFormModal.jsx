import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Briefcase, 
  Award, 
  GraduationCap, 
  Share2, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Eye, 
  Camera, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { 
  generateUUID, 
  isCreditOfficerRole, 
  calculatePositionTenure, 
  calculateAreaTenureAndDueDate 
} from '../../../lib/evaluationUtils';
import { formatDateVN } from '../../../lib/dateUtils';
import { compressImage } from '../../../lib/imageUtils';
import { DEFAULT_MODULE_HR_SETTINGS } from '../../../lib/systemDefaults';
import { 
  createEmployeeProfile, 
  updateEmployeeProfile,
  saveEmployeeSocial,
  deleteEmployeeSocial,
  deleteEmployeeDegree,
  deleteWorkHistory
} from '../services/hrService';
import { useToast } from '../../../context/ToastContext';
import AddDegreeModal from './AddDegreeModal';
import WorkHistoryPeriodModal from './WorkHistoryPeriodModal';

// Danh mục nền tảng mạng xã hội chuẩn mực
export const SOCIAL_PLATFORMS = [
  { value: 'Zalo', label: 'Zalo', prefix: 'https://zalo.me/', color: 'bg-blue-600 text-white' },
  { value: 'Facebook', label: 'Facebook', prefix: 'https://facebook.com/', color: 'bg-blue-700 text-white' },
  { value: 'Telegram', label: 'Telegram', prefix: 'https://t.me/', color: 'bg-sky-500 text-white' },
  { value: 'LinkedIn', label: 'LinkedIn', prefix: 'https://linkedin.com/in/', color: 'bg-sky-700 text-white' },
  { value: 'Viber', label: 'Viber', prefix: '', color: 'bg-purple-600 text-white' },
  { value: 'Khác', label: 'Khác (Website / Blog)', prefix: '', color: 'bg-slate-700 text-white' },
];

// Helper: Tính toán thời lượng thâm niên giữa 2 mốc thời gian dạng "X năm Y tháng"
const getPeriodDuration = (startDate, endDate) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months = Math.max(0, months - 1);
  }

  if (months <= 0) return 'Dưới 1 tháng';
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years > 0 && remMonths > 0) return `${years} năm ${remMonths} tháng`;
  if (years > 0) return `${years} năm`;
  return `${remMonths} tháng`;
};

/**
 * EmployeeFormModal: Modal Chỉnh Sửa & Thiết Lập Hồ Sơ Cán Bộ Toàn Diện
 * Đồng nhất 100% với 4 Phân khu thông tin lưu trữ của Hồ sơ Cán bộ:
 * 1. Thông Tin Cá Nhân & Liên Hệ (kèm Mạng Xã Hội & Ảnh đại diện)
 * 2. Công Tác & Thâm Niên (kèm đầy đủ Lịch sử quá trình công tác & Địa bàn CBTD)
 * 3. Chính Trị & Đảng - Đoàn Thể (Đảng viên, Lý luận chính trị, Đoàn thanh niên, Công đoàn)
 * 4. Trình Độ & Văn Bằng Chuyên Môn (Quản lý danh sách Văn bằng đa cấp độ, Tin học, Ngoại ngữ)
 */
const EmployeeFormModal = ({
  isOpen,
  onClose,
  initialData = null,
  departments = [],
  positions = [],
  existingEmployees = [],
  hrConfig = null,
  degrees = [],
  socials = [],
  workHistory = [],
  onSuccess,
}) => {
  const toast = useToast();
  const isEdit = Boolean(initialData?.id);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('PERSONAL');

  // Form Fields - Tab 1: Cá Nhân & Liên Hệ
  const [uuid, setUuid] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [cccd, setCccd] = useState('');
  const [hometown, setHometown] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form Fields - Tab 2: Công Tác & Thâm Niên
  const [department, setDepartment] = useState('Phòng Tín dụng');
  const [position, setPosition] = useState('Cán bộ tín dụng');
  const [positionStartDate, setPositionStartDate] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [contractType, setContractType] = useState('Không xác định thời hạn');
  const [workLocation, setWorkLocation] = useState('Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
  const [assignedArea, setAssignedArea] = useState('');
  const [areaStartDate, setAreaStartDate] = useState('');

  // Form Fields - Tab 3: Chính Trị & Đảng - Đoàn Thể
  const [partyMember, setPartyMember] = useState(false);
  const [partyDate, setPartyDate] = useState('');
  const [partyOfficialDate, setPartyOfficialDate] = useState('');
  const [politicalRole, setPoliticalRole] = useState('Đảng viên');
  const [partyCell, setPartyCell] = useState('Chi bộ Quỹ Tín Dụng Nhân Dân Yên Thọ');
  const [politicalTheory, setPoliticalTheory] = useState('Chưa qua đào tạo');
  const [youthUnionMember, setYouthUnionMember] = useState(false);
  const [youthUnionRole, setYouthUnionRole] = useState('');
  const [tradeUnionMember, setTradeUnionMember] = useState(true);
  const [tradeUnionRole, setTradeUnionRole] = useState('Đoàn viên công đoàn');

  // Form Fields - Tab 4: Trình Độ & Văn Bằng Chuyên Môn
  const [education, setEducation] = useState('');
  const [itLevel, setItLevel] = useState('');
  const [foreignLanguage, setForeignLanguage] = useState('');
  const [stateManagementLevel, setStateManagementLevel] = useState('');
  const [role, setRole] = useState('staff');

  // Sub-modal states
  const [isAddDegreeModalOpen, setIsAddDegreeModalOpen] = useState(false);
  const [editingDegree, setEditingDegree] = useState(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [viewingScanImage, setViewingScanImage] = useState(null);

  // Social form inline state
  const [socialPlatform, setSocialPlatform] = useState('Zalo');
  const [socialAccountName, setSocialAccountName] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialIsPublic, setSocialIsPublic] = useState(true);
  const [editingSocialId, setEditingSocialId] = useState(null);
  const [savingSocial, setSavingSocial] = useState(false);

  // Danh sách dữ liệu liên kết của cán bộ
  const empId = initialData?.id;
  const empCode = initialData?.code;

  const currentEmpDegrees = useMemo(() => {
    if (!empId) return [];
    return degrees.filter((d) => d.employeeId === empId || d.employeeUuid === empId || (empCode && d.employeeCode === empCode));
  }, [degrees, empId, empCode]);

  const currentEmpSocials = useMemo(() => {
    if (!empId) return [];
    return socials.filter((s) => s.employeeId === empId || s.employeeUuid === empId || (empCode && s.employeeCode === empCode));
  }, [socials, empId, empCode]);

  const currentEmpWorkHistory = useMemo(() => {
    if (!empId) return [];
    return workHistory
      .filter((w) => w.employeeId === empId || (empCode && w.employeeCode === empCode))
      .sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        const dateA = a.startDate || a.effectiveDate || '';
        const dateB = b.startDate || b.effectiveDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [workHistory, empId, empCode]);

  // Khởi tạo và đồng bộ state khi mở Modal
  useEffect(() => {
    if (initialData) {
      setUuid(initialData.uuid || generateUUID());
      setCode(initialData.code || '');
      setName(initialData.name || '');
      setGender(initialData.gender || 'Nam');
      setBirthDate(initialData.birthDate || '');
      setCccd(initialData.cccd || '');
      setHometown(initialData.hometown || initialData.nativePlace || '');
      setAddress(initialData.address || initialData.currentAddress || '');
      setPhone(initialData.phone || '');
      setSecondaryPhone(initialData.secondaryPhone || initialData.phone2 || '');
      setEmail(initialData.email || '');
      setAvatar(initialData.avatar || '');

      setDepartment(initialData.department || 'Phòng Tín dụng');
      setPosition(initialData.position || 'Cán bộ tín dụng');
      setPositionStartDate(initialData.positionStartDate || initialData.joinDate || '');
      setJoinDate(initialData.joinDate || '');
      setContractType(initialData.contractType || 'Không xác định thời hạn');
      setWorkLocation(initialData.workLocation || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
      setAssignedArea(initialData.assignedArea || '');
      setAreaStartDate(initialData.areaStartDate || '');

      setPartyMember(Boolean(initialData.partyMember));
      setPartyDate(initialData.partyDate || '');
      setPartyOfficialDate(initialData.partyOfficialDate || '');
      setPoliticalRole(initialData.politicalRole || 'Đảng viên');
      setPartyCell(initialData.partyCell || 'Chi bộ Quỹ Tín Dụng Nhân Dân Yên Thọ');
      setPoliticalTheory(initialData.politicalTheory || 'Chưa qua đào tạo');
      setYouthUnionMember(Boolean(initialData.youthUnionMember));
      setYouthUnionRole(initialData.youthUnionRole || '');
      setTradeUnionMember(initialData.tradeUnionMember !== undefined ? Boolean(initialData.tradeUnionMember) : true);
      setTradeUnionRole(initialData.tradeUnionRole || 'Đoàn viên công đoàn');

      setEducation(initialData.education || '');
      setItLevel(initialData.itLevel || 'Ứng dụng CNTT cơ bản');
      setForeignLanguage(initialData.foreignLanguage || 'Tiếng Anh');
      setStateManagementLevel(initialData.stateManagementLevel || '');
      setRole(initialData.role || 'staff');
    } else {
      const newUuid = generateUUID();
      setUuid(newUuid);

      // Gợi ý mã CB tự động
      const maxCodeNum = existingEmployees.reduce((max, e) => {
        const match = (e.code || '').match(/CB(\d+)/i);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      const nextCode = `CB${String(maxCodeNum + 1).padStart(2, '0')}`;
      setCode(nextCode);

      setName('');
      setGender('Nam');
      setBirthDate('');
      setCccd('');
      setHometown('');
      setAddress('');
      setPhone('');
      setSecondaryPhone('');
      setEmail('');
      setAvatar('');

      setDepartment(departments[0] || 'Phòng Tín dụng');
      setPosition('Cán bộ tín dụng');
      const today = new Date().toISOString().slice(0, 10);
      setPositionStartDate(today);
      setJoinDate(today);
      setContractType('Không xác định thời hạn');
      setWorkLocation('Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)');
      setAssignedArea('');
      setAreaStartDate(today);

      setPartyMember(false);
      setPartyDate('');
      setPartyOfficialDate('');
      setPoliticalRole('Đảng viên');
      setPartyCell('Chi bộ Quỹ Tín Dụng Nhân Dân Yên Thọ');
      setPoliticalTheory('Chưa qua đào tạo');
      setYouthUnionMember(false);
      setYouthUnionRole('');
      setTradeUnionMember(true);
      setTradeUnionRole('Đoàn viên công đoàn');

      setEducation('Đại học chuyên ngành');
      setItLevel('Ứng dụng CNTT cơ bản');
      setForeignLanguage('Tiếng Anh');
      setStateManagementLevel('');
      setRole('staff');
    }
  }, [initialData, isOpen, departments, existingEmployees]);

  // Cán bộ tín dụng & Giám sát luân chuyển địa bàn
  const isCreditOfficer = isCreditOfficerRole(position, department);
  const cycleMonths = Number(hrConfig?.creditRotationMonths || hrConfig?.transferMaxMonths || hrConfig?.transferCycleMonths || 36);
  const warningMonths = Number(hrConfig?.creditWarningMonths || hrConfig?.transferWarningMonths || hrConfig?.warningMonths || 6);

  const effectiveStart = positionStartDate || joinDate;
  const tenureText = calculatePositionTenure(effectiveStart);
  const totalTenureText = calculatePositionTenure(joinDate);
  const areaInfo = isCreditOfficer ? calculateAreaTenureAndDueDate(areaStartDate || effectiveStart, cycleMonths, warningMonths) : null;

  // Xử lý nén và tải ảnh đại diện
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const compressed = await compressImage(file, 400, 400, 0.75);
      setAvatar(compressed.dataUrl);
      toast?.showSuccess?.('Tải ảnh đại diện thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi nén ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Xử lý thêm / cập nhật mạng xã hội
  const handleSaveSocial = async (e) => {
    e?.preventDefault();
    if (!empId) {
      toast?.showError?.('Vui lòng tạo hồ sơ cán bộ trước khi thêm kênh mạng xã hội');
      return;
    }
    if (!socialAccountName.trim()) {
      toast?.showError?.('Vui lòng nhập tên tài khoản hoặc số điện thoại mạng xã hội');
      return;
    }

    setSavingSocial(true);
    try {
      const payload = {
        id: editingSocialId || undefined,
        employeeId: empId,
        employeeCode: code,
        employeeName: name,
        platform: socialPlatform,
        accountName: socialAccountName.trim(),
        url: socialUrl.trim(),
        isPublic: socialIsPublic,
        notes: '',
      };
      await saveEmployeeSocial(payload);
      toast?.showSuccess?.(editingSocialId ? 'Đã cập nhật kênh mạng xã hội!' : 'Đã thêm kênh mạng xã hội mới!');
      setEditingSocialId(null);
      setSocialAccountName('');
      setSocialUrl('');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu kênh mạng xã hội');
    } finally {
      setSavingSocial(false);
    }
  };

  const handleEditSocialClick = (soc) => {
    setEditingSocialId(soc.id);
    setSocialPlatform(soc.platform || 'Zalo');
    setSocialAccountName(soc.accountName || '');
    setSocialUrl(soc.url || '');
    setSocialIsPublic(soc.isPublic !== false);
  };

  const handleDeleteSocialClick = async (socId, platName) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa kênh ${platName} này không?`)) return;
    try {
      await deleteEmployeeSocial(socId);
      toast?.showSuccess?.(`Đã xóa kênh ${platName} thành công!`);
      if (editingSocialId === socId) {
        setEditingSocialId(null);
        setSocialAccountName('');
        setSocialUrl('');
      }
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa kênh mạng xã hội');
    }
  };

  // Xóa văn bằng an toàn
  const handleDeleteDegreeClick = async (degId, majorName) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa văn bằng "${majorName}" khỏi hồ sơ?`)) return;
    try {
      await deleteEmployeeDegree(degId);
      toast?.showSuccess?.('Đã xóa văn bằng chuyên môn thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa văn bằng');
    }
  };

  // Xóa mốc công tác an toàn
  const handleDeletePeriodClick = async (periodId, decNo) => {
    const label = decNo ? `số "${decNo}"` : 'công tác này';
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa mốc ${label} không?`)) return;
    try {
      await deleteWorkHistory(periodId);
      toast?.showSuccess?.('Đã xóa mốc quá trình công tác thành công!');
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi xóa mốc công tác');
    }
  };

  // Lưu toàn bộ hồ sơ cán bộ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast?.showError?.('Vui lòng nhập họ và tên cán bộ');
      setActiveTab('PERSONAL');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        uuid: uuid || generateUUID(),
        code: (code || `CB${String(existingEmployees.length + 1).padStart(2, '0')}`).trim().toUpperCase(),
        name: name.trim(),
        gender,
        birthDate,
        cccd: cccd.trim(),
        hometown: hometown.trim(),
        address: address.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        email: email.trim().toLowerCase(),
        avatar: avatar || '',
        department,
        position: position.trim(),
        positionStartDate,
        joinDate,
        contractType,
        workLocation: workLocation.trim() || 'Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)',
        assignedArea: isCreditOfficer ? assignedArea.trim() : '',
        areaStartDate: isCreditOfficer ? (areaStartDate || '') : '',
        partyMember,
        partyDate: partyMember ? partyDate : '',
        partyOfficialDate: partyMember ? partyOfficialDate : '',
        politicalRole: partyMember ? politicalRole : '',
        partyCell: partyMember ? partyCell.trim() : '',
        politicalTheory: politicalTheory || 'Chưa qua đào tạo',
        youthUnionMember,
        youthUnionRole: youthUnionMember ? youthUnionRole.trim() : '',
        tradeUnionMember,
        tradeUnionRole: tradeUnionMember ? tradeUnionRole.trim() : '',
        education: education.trim(),
        itLevel: itLevel.trim(),
        foreignLanguage: foreignLanguage.trim(),
        stateManagementLevel: stateManagementLevel.trim(),
        role: role || 'staff',
        status: initialData?.status || 'ACTIVE',
      };

      if (isEdit) {
        await updateEmployeeProfile(initialData.id, payload);
        toast?.showSuccess?.(`Đã cập nhật hồ sơ cán bộ ${name} thành công!`);
        onSuccess?.({ id: initialData.id, ...payload });
      } else {
        const customId = `emp-${payload.code.toLowerCase()}`;
        await createEmployeeProfile({ ...payload, id: customId });
        toast?.showSuccess?.(`Đã thêm mới cán bộ ${name} thành công!`);
        onSuccess?.({ id: customId, ...payload });
      }

      onClose();
    } catch (err) {
      toast?.showError?.(err.message || 'Lỗi khi lưu hồ sơ cán bộ');
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình 4 Tab điều hướng chuẩn mực
  const tabsList = [
    {
      id: 'PERSONAL',
      label: '1. Cá Nhân & Liên Hệ',
      icon: User,
      badge: currentEmpSocials.length > 0 ? `${currentEmpSocials.length} kênh` : null,
    },
    {
      id: 'WORK',
      label: '2. Công Tác & Thâm Niên',
      icon: Briefcase,
      badge: currentEmpWorkHistory.length > 0 ? `${currentEmpWorkHistory.length} mốc` : null,
    },
    {
      id: 'POLITICS',
      label: '3. Chính Trị & Đoàn Thể',
      icon: Award,
      badge: partyMember ? 'Đảng viên' : null,
    },
    {
      id: 'EDUCATION',
      label: '4. Trình Độ & Văn Bằng',
      icon: GraduationCap,
      badge: currentEmpDegrees.length > 0 ? `${currentEmpDegrees.length} bằng` : null,
    },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Chỉnh Sửa Hồ Sơ Cán Bộ' : 'Thêm Mới Cán Bộ Nhân Viên'}
        subtitle={`Quỹ Tín Dụng Nhân Dân Yên Thọ • ${isEdit ? `Mã CB: ${code} — ${name}` : 'Thiết lập đầy đủ hồ sơ lý lịch'}`}
        maxWidth="max-w-4xl"
        zIndex="z-50"
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[82vh]">
          {/* THANH ĐIỀU HƯỚNG 4 PHÂN KHU CHUẨN MỰC (ZERO HORIZONTAL SCROLL) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-3 bg-slate-50 border-b border-slate-200/90 shrink-0">
            {tabsList.map((t) => {
              const IconComponent = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left min-h-[44px] ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-lime-300' : 'text-emerald-700'}`} />
                    <span className="truncate">{t.label}</span>
                  </span>
                  {t.badge && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${
                        isActive
                          ? 'bg-emerald-950/50 text-lime-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* NỘI DUNG CUỘN THEO TAB TƯƠNG ỨNG */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
            {/* ========================================================================= */}
            {/* TAB 1: THÔNG TIN CÁ NHÂN & LIÊN HỆ (KÈM MẠNG XÃ HỘI) */}
            {/* ========================================================================= */}
            {activeTab === 'PERSONAL' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Khối Ảnh Đại Diện & Thông Tin Cơ Bản */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/90">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-emerald-600/30 shadow-xs flex items-center justify-center">
                      {avatar ? (
                        <img src={avatar} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-8 h-8 text-slate-300" />
                          <span className="text-[10px] mt-0.5">Chưa có ảnh</span>
                        </div>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px]">
                          Đang tải...
                        </div>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs">
                      <Camera className="w-3 h-3 text-emerald-700" />
                      <span>{avatar ? 'Đổi ảnh' : 'Tải ảnh'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>

                  {/* Tên & Giới tính */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 font-bold mb-1">
                        Họ và tên cán bộ <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Trịnh Đức Anh"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Giới tính:</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Số Thẻ CCCD:</label>
                      <input
                        type="text"
                        placeholder="0380..."
                        value={cccd}
                        onChange={(e) => setCccd(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Ngày sinh:</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Quê quán / Nơi sinh:</label>
                      <input
                        type="text"
                        placeholder="VD: Xã Quý Lộc, Yên Định"
                        value={hometown}
                        onChange={(e) => setHometown(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Khối Điện Thoại & Liên Hệ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số điện thoại chính:</label>
                    <input
                      type="text"
                      placeholder="0988..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Số điện thoại 2 (Phụ):</label>
                    <input
                      type="text"
                      placeholder="0912... (Tùy chọn)"
                      value={secondaryPhone}
                      onChange={(e) => setSecondaryPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Hộp thư điện tử (Email):</label>
                    <input
                      type="email"
                      placeholder="ducanht@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-bold mb-1">Nơi ở hiện nay (Địa chỉ thường trú):</label>
                    <input
                      type="text"
                      placeholder="VD: Thôn Tân Lộc, xã Quý Lộc, tỉnh Thanh Hóa"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* KHỐI KÊNH LIÊN LẠC & MẠNG XÃ HỘI (SOCIALS) */}
                <div className="pt-3 border-t border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Kênh Liên Lạc &amp; Mạng Xã Hội ({currentEmpSocials.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Tích hợp Zalo, Facebook, Telegram phục vụ điều hành và giao tiếp
                    </span>
                  </div>

                  {/* Danh sách kênh hiện có */}
                  {currentEmpSocials.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentEmpSocials.map((soc) => {
                        const plat = SOCIAL_PLATFORMS.find((p) => p.value === soc.platform) || {
                          color: 'bg-slate-700 text-white',
                        };
                        return (
                          <div
                            key={soc.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${plat.color} shrink-0`}>
                                {soc.platform}
                              </span>
                              <span className="font-bold text-slate-800 truncate">{soc.accountName}</span>
                              {soc.url && (
                                <a
                                  href={soc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Mở liên kết"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleEditSocialClick(soc)}
                                className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                                title="Sửa kênh"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSocialClick(soc.id, soc.platform)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Xóa kênh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      Chưa thiết lập kênh mạng xã hội. Thêm kênh liên lạc nhanh bên dưới.
                    </div>
                  )}

                  {/* Form thêm / sửa nhanh mạng xã hội */}
                  {isEdit ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{editingSocialId ? 'Chỉnh sửa kênh liên lạc' : '+ Thêm kênh liên lạc mới:'}</span>
                        {editingSocialId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSocialId(null);
                              setSocialAccountName('');
                              setSocialUrl('');
                            }}
                            className="text-xs text-rose-600 hover:underline font-normal"
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <select
                            value={socialPlatform}
                            onChange={(e) => {
                              const newPlat = e.target.value;
                              setSocialPlatform(newPlat);
                              const platCfg = SOCIAL_PLATFORMS.find((p) => p.value === newPlat);
                              if (platCfg?.prefix && (!socialUrl || socialUrl.startsWith('https://'))) {
                                setSocialUrl(platCfg.prefix);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
                          >
                            {SOCIAL_PLATFORMS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Tên tài khoản / Số ĐT"
                            value={socialAccountName}
                            onChange={(e) => setSocialAccountName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-1.5">
                          <input
                            type="url"
                            placeholder="https://..."
                            value={socialUrl}
                            onChange={(e) => setSocialUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleSaveSocial}
                            disabled={savingSocial}
                            className="shrink-0 text-xs py-1.5"
                          >
                            {savingSocial ? '...' : editingSocialId ? 'Cập nhật' : 'Thêm'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      * Sau khi hoàn tất lưu tạo mới cán bộ, đồng chí có thể thiết lập các kênh mạng xã hội chi tiết.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: CÔNG TÁC & THÂM NIÊN (KÈM TOÀN BỘ WORK HISTORY TIMELINE) */}
            {/* ========================================================================= */}
            {activeTab === 'WORK' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Vị trí hiện tại & Thâm niên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phòng ban:</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chức vụ chính quyền:</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="VD: Cán bộ tín dụng / Kế toán trưởng"
                      required
                      list="modal-positions-list"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                    <datalist id="modal-positions-list">
                      {positions.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Loại hợp đồng lao động:</label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    >
                      <option value="Không xác định thời hạn">Không xác định thời hạn</option>
                      <option value="Theo nhiệm kỳ">Theo nhiệm kỳ bầu cử</option>
                      <option value="Hợp đồng xác định thời hạn">Hợp đồng xác định thời hạn</option>
                      <option value="Thử việc / Học việc">Thử việc / Tập sự</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày bắt đầu chức vụ:</label>
                    <input
                      type="date"
                      value={positionStartDate}
                      onChange={(e) => setPositionStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Ngày tuyển dụng vào Quỹ:</label>
                    <input
                      type="date"
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center">
                    {/* Thẻ Thâm Niên Live Preview */}
                    <div className="w-full p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Thâm niên vị trí:</span>
                        <strong className="text-emerald-900">{tenureText || '—'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-200/50">
                        <span className="text-slate-500">Tổng thâm niên Quỹ:</span>
                        <strong className="text-slate-800">{totalTenureText || '—'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-slate-700 font-bold mb-1">Nơi làm việc (Địa bàn hoạt động):</label>
                    <input
                      type="text"
                      list="modal-work-locations-list"
                      placeholder="VD: Trụ sở chính - Quỹ TDND Yên Thọ (Thôn Tân Lộc, xã Quý Lộc)"
                      value={workLocation}
                      onChange={(e) => setWorkLocation(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                    <datalist id="modal-work-locations-list">
                      {(hrConfig?.workLocations || DEFAULT_MODULE_HR_SETTINGS.workLocations || []).map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Quản lý Địa Bàn Tín Dụng CBTD */}
                {isCreditOfficer && (
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-emerald-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Giám Sát Chu Kỳ Luân Chuyển Địa Bàn Cán Bộ Tín Dụng (NHNN)</span>
                      </h4>
                      {areaInfo && (
                        <span className="font-bold text-slate-700 tabular-nums">
                          {areaInfo.tenureText} / {cycleMonths} tháng
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">Địa bàn phụ trách tín dụng:</label>
                        <input
                          type="text"
                          list="modal-credit-areas-list"
                          placeholder="VD: Phụ trách thành viên vay vốn xã Quý Lộc"
                          value={assignedArea}
                          onChange={(e) => setAssignedArea(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                        <datalist id="modal-credit-areas-list">
                          {(hrConfig?.creditAreas || DEFAULT_MODULE_HR_SETTINGS.creditAreas || []).map((area) => (
                            <option key={area} value={area} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Ngày bắt đầu nhận địa bàn:</label>
                        <input
                          type="date"
                          value={areaStartDate}
                          onChange={(e) => setAreaStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* KHỐI LỊCH SỬ QUÁ TRÌNH CÔNG TÁC (WORK HISTORY TIMELINE) */}
                <div className="pt-3 border-t border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Quá Trình Công Tác &amp; Các Quyết Định Luân Chuyển ({currentEmpWorkHistory.length} mốc)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Theo dõi đầy đủ lịch sử các vị trí, phòng ban, nơi làm việc và số quyết định điều động
                      </p>
                    </div>

                    {isEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingPeriod(null);
                          setIsPeriodModalOpen(true);
                        }}
                        icon={Plus}
                        className="text-xs py-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                      >
                        + Thêm mốc công tác
                      </Button>
                    )}
                  </div>

                  {currentEmpWorkHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentEmpWorkHistory.map((item) => {
                        const duration = getPeriodDuration(item.startDate || item.effectiveDate, item.endDate);
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              item.isCurrent
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-slate-100">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs">
                                  {item.position || position}
                                </span>
                                {item.isCurrent && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-700 text-white uppercase tracking-wider">
                                    Đang đảm nhiệm
                                  </span>
                                )}
                                {duration && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {duration}
                                  </span>
                                )}
                                <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                                  {formatDateVN(item.startDate || item.effectiveDate)} — {item.isCurrent ? 'Nay' : formatDateVN(item.endDate)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPeriod(item);
                                    setIsPeriodModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-700 rounded transition-colors"
                                  title="Sửa mốc công tác"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePeriodClick(item.id, item.decisionNumber)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Xóa mốc công tác"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-[11px] text-slate-600">
                              <div>
                                Phòng ban: <strong className="text-slate-800">{item.department || department}</strong>
                              </div>
                              <div>
                                Nơi làm việc: <strong className="text-slate-800">{item.workLocation || item.workplace || 'Trụ sở chính'}</strong>
                              </div>
                              {item.assignedArea && (
                                <div>
                                  Địa bàn: <strong className="text-emerald-800">{item.assignedArea}</strong>
                                </div>
                              )}
                              {item.decisionNumber && (
                                <div>
                                  Số QĐ: <strong className="text-slate-800">{item.decisionNumber}</strong>
                                  {item.decisionDate && ` (Ký ${formatDateVN(item.decisionDate)})`}
                                </div>
                              )}
                              {item.signer && (
                                <div>
                                  Người ký: <strong className="text-slate-800">{item.signer}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      {isEdit
                        ? 'Chưa có dữ liệu mốc quá trình công tác. Nhấn "+ Thêm mốc công tác" phía trên để tạo timeline lịch sử.'
                        : 'Mốc công tác đầu tiên sẽ tự động được khởi tạo theo chức danh và phòng ban khi tạo mới cán bộ.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: CHÍNH TRỊ & ĐẢNG - ĐOÀN THỂ */}
            {/* ========================================================================= */}
            {activeTab === 'POLITICS' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* 1. Đảng Cộng sản Việt Nam */}
                <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-amber-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-700" />
                      <span>1. Đảng Cộng Sản Việt Nam</span>
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={partyMember}
                        onChange={(e) => setPartyMember(e.target.checked)}
                        className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                      />
                      <span className="font-bold text-slate-900 text-xs">Là Đảng viên ĐCSVN</span>
                    </label>
                  </div>

                  {partyMember && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Ngày vào Đảng dự bị:</label>
                        <input
                          type="date"
                          value={partyDate}
                          onChange={(e) => setPartyDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Ngày công nhận chính thức:</label>
                        <input
                          type="date"
                          value={partyOfficialDate}
                          onChange={(e) => setPartyOfficialDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Chức vụ Chi bộ:</label>
                        <input
                          type="text"
                          placeholder="VD: Bí thư Chi bộ / Đảng viên"
                          value={politicalRole}
                          onChange={(e) => setPoliticalRole(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Nơi sinh hoạt Chi bộ:</label>
                        <input
                          type="text"
                          placeholder="VD: Chi bộ Quỹ TDND Yên Thọ"
                          value={partyCell}
                          onChange={(e) => setPartyCell(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Trình Độ Lý Luận Chính Trị */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
                    2. Trình Độ Lý Luận Chính Trị
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Trình độ LLCT:</label>
                      <select
                        value={politicalTheory}
                        onChange={(e) => setPoliticalTheory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      >
                        <option value="Chưa qua đào tạo">Chưa qua đào tạo</option>
                        <option value="Sơ cấp lý luận chính trị">Sơ cấp lý luận chính trị</option>
                        <option value="Trung cấp lý luận chính trị">Trung cấp lý luận chính trị</option>
                        <option value="Cao cấp lý luận chính trị">Cao cấp lý luận chính trị</option>
                        <option value="Cử nhân chính trị">Cử nhân chính trị</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Quản lý nhà nước / Bồi dưỡng:</label>
                      <input
                        type="text"
                        placeholder="VD: Chuyên viên / Chuyên viên chính (nếu có)"
                        value={stateManagementLevel}
                        onChange={(e) => setStateManagementLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Đoàn Thể & Tổ Chức Xã Hội */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
                    3. Đoàn Thể &amp; Tổ Chức Quần Chúng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Đoàn TNCS Hồ Chí Minh */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={youthUnionMember}
                          onChange={(e) => setYouthUnionMember(e.target.checked)}
                          className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900">Đoàn viên Đoàn TNCS Hồ Chí Minh</span>
                      </label>
                      {youthUnionMember && (
                        <div>
                          <label className="block text-slate-500 text-[11px] mb-1">Chức vụ Đoàn:</label>
                          <input
                            type="text"
                            placeholder="VD: Bí thư Chi đoàn / Đoàn viên"
                            value={youthUnionRole}
                            onChange={(e) => setYouthUnionRole(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Công đoàn */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={tradeUnionMember}
                          onChange={(e) => setTradeUnionMember(e.target.checked)}
                          className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-700 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900">Đoàn viên Công đoàn cơ sở</span>
                      </label>
                      {tradeUnionMember && (
                        <div>
                          <label className="block text-slate-500 text-[11px] mb-1">Chức vụ Công đoàn:</label>
                          <input
                            type="text"
                            placeholder="VD: Chủ tịch Công đoàn / Đoàn viên"
                            value={tradeUnionRole}
                            onChange={(e) => setTradeUnionRole(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: TRÌNH ĐỘ & VĂN BẰNG CHUYÊN MÔN (KÈM DANH SÁCH DEGREES) */}
            {/* ========================================================================= */}
            {activeTab === 'EDUCATION' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* KHỐI DANH SÁCH VĂN BẰNG CHUYÊN MÔN ĐA CẤP (DEGREES) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Danh Mục Văn Bằng Chuyên Môn Đào Tạo ({currentEmpDegrees.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Quản lý chi tiết các cấp bậc: Thạc sĩ, Đại học, Cao đẳng... kèm hình thức và số hiệu bằng
                      </p>
                    </div>

                    {isEdit && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          setEditingDegree(null);
                          setIsAddDegreeModalOpen(true);
                        }}
                        icon={Plus}
                        className="text-xs py-1.5"
                      >
                        Thêm văn bằng
                      </Button>
                    )}
                  </div>

                  {currentEmpDegrees.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentEmpDegrees.map((deg) => {
                        const isHigh = Boolean(deg.isHighest);
                        return (
                          <div
                            key={deg.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isHigh
                                ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
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

                                <div className="text-xs font-bold text-slate-900">{deg.major}</div>

                                <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                                  <span>{deg.institution}</span>
                                  {deg.classification && (
                                    <span className="text-slate-400">
                                      • Loại: <strong className="text-slate-700 font-semibold">{deg.classification}</strong>
                                    </span>
                                  )}
                                  {deg.degreeNumber && (
                                    <span className="text-slate-400">
                                      • Số hiệu: <strong className="text-slate-700 font-semibold tabular-nums">{deg.degreeNumber}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {deg.degreeImage && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingScanImage(deg.degreeImage)}
                                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                                    title="Xem bản scan"
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
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="Sửa văn bằng"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDegreeClick(deg.id, deg.major)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      {isEdit
                        ? 'Chưa thiết lập danh sách văn bằng chi tiết. Bấm nút "Thêm văn bằng" phía trên để lưu trữ.'
                        : 'Sau khi lưu tạo mới cán bộ, đồng chí có thể bổ sung danh sách văn bằng chuyên môn đa cấp độ.'}
                    </div>
                  )}
                </div>

                {/* HỌC VẤN CHUNG & KỸ NĂNG BỔ TRỢ */}
                <div className="pt-3 border-t border-slate-200/90 space-y-3">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider text-emerald-800">
                    Trình Độ Học Vấn &amp; Kỹ Năng Bổ Trợ
                  </h4>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Học vị / Chuyên môn chính (Tóm tắt hồ sơ 2C):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Đại học chuyên ngành Tài chính - Ngân hàng"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Trình độ Tin học (Không bắt buộc):</label>
                      <input
                        type="text"
                        placeholder="VD: Ứng dụng CNTT cơ bản"
                        list="modal-it-levels-list"
                        value={itLevel}
                        onChange={(e) => setItLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                      <datalist id="modal-it-levels-list">
                        <option value="Ứng dụng CNTT cơ bản" />
                        <option value="Ứng dụng CNTT nâng cao" />
                        <option value="Chứng chỉ Tin học Quốc tế MOS" />
                        <option value="Chứng chỉ Tin học Quốc tế IC3" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Trình độ Ngoại ngữ (Không bắt buộc):</label>
                      <input
                        type="text"
                        placeholder="VD: Tiếng Anh / B1"
                        list="modal-languages-list"
                        value={foreignLanguage}
                        onChange={(e) => setForeignLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:outline-hidden"
                      />
                      <datalist id="modal-languages-list">
                        <option value="Tiếng Anh" />
                        <option value="Tiếng Anh (Bậc 1/6 - A1)" />
                        <option value="Tiếng Anh (Bậc 2/6 - A2)" />
                        <option value="Tiếng Anh (Bậc 3/6 - B1)" />
                        <option value="Tiếng Anh (Bậc 4/6 - B2)" />
                        <option value="Tiếng Anh (IELTS / TOEIC)" />
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER CỐ ĐỊNH: ĐIỀU HƯỚNG TỪNG BƯỚC & NÚT LƯU TRỌNG TÂM */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-200/90 shrink-0">
            {/* Nút điều hướng Tab */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              {activeTab !== 'PERSONAL' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabsList.findIndex((t) => t.id === activeTab);
                    if (idx > 0) setActiveTab(tabsList[idx - 1].id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
              )}

              {activeTab !== 'EDUCATION' && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabsList.findIndex((t) => t.id === activeTab);
                    if (idx < tabsList.length - 1) setActiveTab(tabsList[idx + 1].id);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <span>Tiếp theo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nút Hủy & Lưu chính thức */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
                Hủy bỏ
              </Button>
              <Button variant="primary" type="submit" disabled={submitting} icon={Save}>
                {submitting ? 'Đang lưu hồ sơ...' : isEdit ? 'Cập nhật hồ sơ' : 'Thêm cán bộ'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* SUB-MODAL 1: THÊM / SỬA VĂN BẰNG CHUYÊN MÔN */}
      {isAddDegreeModalOpen && (
        <AddDegreeModal
          isOpen={isAddDegreeModalOpen}
          onClose={() => {
            setIsAddDegreeModalOpen(false);
            setEditingDegree(null);
          }}
          emp={initialData || { id: empId, name, code, department, position }}
          initialData={editingDegree}
          existingDegreesCount={currentEmpDegrees.length}
          zIndex="z-60"
          onSuccess={() => {}}
        />
      )}

      {/* SUB-MODAL 2: THÊM / SỬA MỐC QUÁ TRÌNH CÔNG TÁC */}
      {isPeriodModalOpen && (
        <WorkHistoryPeriodModal
          isOpen={isPeriodModalOpen}
          onClose={() => {
            setIsPeriodModalOpen(false);
            setEditingPeriod(null);
          }}
          emp={initialData || { id: empId, name, code, department, position }}
          editingRecord={editingPeriod}
          departments={departments}
          positions={positions}
          hrConfig={hrConfig}
          zIndex="z-60"
          onSuccess={() => {}}
        />
      )}

      {/* SUB-MODAL 3: XEM BẢN SCAN VĂN BẰNG */}
      {viewingScanImage && (
        <Modal
          isOpen={Boolean(viewingScanImage)}
          onClose={() => setViewingScanImage(null)}
          title="Bản Scan / Ảnh Chụp Văn Bằng Chứng Thực"
          subtitle={`Cán bộ: ${name} • ${position}`}
          maxWidth="max-w-2xl"
          zIndex="z-60"
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
    </>
  );
};

export default React.memo(EmployeeFormModal);

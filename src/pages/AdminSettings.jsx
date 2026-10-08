import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Vote, 
  Building2, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers,
  Clock,
  DollarSign,
  Award,
  Globe,
  Settings2,
  Lock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeDepartments,
  saveDepartment,
  deleteDepartment,
  subscribePositions,
  savePosition,
  deletePosition,
  subscribeTrustCriteria,
  saveTrustCriterion,
  deleteTrustCriterion,
  subscribeSystemSettings,
  saveSystemSettings,
  subscribeSystemModules,
  updateSystemModule,
  subscribeSubsystemConfig,
  saveSubsystemConfig
} from '../lib/services';
import { 
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_MODULE_TRUST_SETTINGS,
  DEFAULT_MODULE_HR_SETTINGS,
  DEFAULT_MODULE_KPI_SETTINGS,
  DEFAULT_MODULE_PLANNING_SETTINGS,
  DEFAULT_MODULE_ATTENDANCE_SETTINGS,
  DEFAULT_MODULE_PAYROLL_SETTINGS,
  DEFAULT_MODULE_AWARDS_SETTINGS
} from '../lib/systemDefaults';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

const AdminSettings = () => {
  const toast = useToast();
  const { isSuperAdmin, isAdmin, canToggleModules, canConfigureWebapp, currentUser } = useAuth();

  // Nhóm tab lớn: 'GLOBAL' (Cấu hình chung) hoặc 'SUBSYSTEM' (Cấu hình từng phân hệ)
  const [activeGroup, setActiveGroup] = useState('SUBSYSTEM');

  // Tab cụ thể đang chọn:
  // GLOBAL: 'GENERAL_LEGAL', 'GENERAL_ORG', 'GENERAL_MODULES'
  // SUBSYSTEM: 'SUB_TRUST', 'SUB_HR', 'SUB_KPI', 'SUB_PLANNING', 'SUB_ATTENDANCE', 'SUB_PAYROLL', 'SUB_AWARDS'
  const [activeTab, setActiveTab] = useState('SUB_TRUST');

  // Loading states
  const [savingSection, setSavingSection] = useState(null);

  // Dữ liệu Realtime Firestore: Cấu hình chung
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trustCriteria, setTrustCriteria] = useState([]);
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [modulesList, setModulesList] = useState([]);

  // Dữ liệu Realtime Firestore: Cấu hình chuyên biệt từng phân hệ
  const [trustConfig, setTrustConfig] = useState(DEFAULT_MODULE_TRUST_SETTINGS);
  const [hrConfig, setHrConfig] = useState(DEFAULT_MODULE_HR_SETTINGS);
  const [kpiConfig, setKpiConfig] = useState(DEFAULT_MODULE_KPI_SETTINGS);
  const [planningConfig, setPlanningConfig] = useState(DEFAULT_MODULE_PLANNING_SETTINGS);
  const [attendanceConfig, setAttendanceConfig] = useState(DEFAULT_MODULE_ATTENDANCE_SETTINGS);
  const [payrollConfig, setPayrollConfig] = useState(DEFAULT_MODULE_PAYROLL_SETTINGS);
  const [awardsConfig, setAwardsConfig] = useState(DEFAULT_MODULE_AWARDS_SETTINGS);

  // States chỉnh sửa Phòng ban
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', order: 1 });

  // States chỉnh sửa Chức vụ
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({ name: '', code: '', department: '', order: 1 });

  // States chỉnh sửa Tiêu chí tín nhiệm
  const [critModalOpen, setCritModalOpen] = useState(false);
  const [editingCrit, setEditingCrit] = useState(null);
  const [critForm, setCritForm] = useState({
    code: '',
    title: '',
    group: '',
    description: '',
    maxScore: 10,
    minScore: 0,
    weight: 10,
  });

  // State chỉnh sửa Chức danh quy hoạch
  const [newPlanningPos, setNewPlanningPos] = useState('');

  // 1. Subscribe Realtime Firestore
  useEffect(() => {
    const unsubDept = subscribeDepartments((list) => setDepartments(list));
    const unsubPos = subscribePositions((list) => setPositions(list));
    const unsubCrit = subscribeTrustCriteria((list) => setTrustCriteria(list));
    const unsubMod = subscribeSystemModules((list) => setModulesList(list));
    const unsubSet = subscribeSystemSettings((data) => {
      if (data) setSystemSettings((prev) => ({ ...prev, ...data }));
    });

    // Subsystem configs
    const unsubTrust = subscribeSubsystemConfig('trust', (data) => {
      if (data) setTrustConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubHr = subscribeSubsystemConfig('hr', (data) => {
      if (data) setHrConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubKpi = subscribeSubsystemConfig('kpi', (data) => {
      if (data) setKpiConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubPlanning = subscribeSubsystemConfig('planning', (data) => {
      if (data) setPlanningConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubAtt = subscribeSubsystemConfig('attendance', (data) => {
      if (data) setAttendanceConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubPay = subscribeSubsystemConfig('payroll', (data) => {
      if (data) setPayrollConfig((prev) => ({ ...prev, ...data }));
    });
    const unsubAwards = subscribeSubsystemConfig('awards', (data) => {
      if (data) setAwardsConfig((prev) => ({ ...prev, ...data }));
    });

    return () => {
      unsubDept();
      unsubPos();
      unsubCrit();
      unsubMod();
      unsubSet();
      unsubTrust();
      unsubHr();
      unsubKpi();
      unsubPlanning();
      unsubAtt();
      unsubPay();
      unsubAwards();
    };
  }, []);

  // Handler: Lưu Cài đặt hệ thống chung (Đặc quyền SuperAdmin qtdyentho@gmail.com)
  const handleSaveGeneralSettings = async (e) => {
    e?.preventDefault?.();
    if (!canConfigureWebapp) {
      toast.error('Chỉ Quản trị viên cấp cao duy nhất (qtdyentho@gmail.com) mới có quyền lưu cấu hình tham số webapp!');
      return;
    }
    setSavingSection('GENERAL_LEGAL');
    try {
      await saveSystemSettings(systemSettings);
      toast.success('Đã lưu thông tin pháp nhân Quỹ lên Firestore thành công!');
    } catch (err) {
      toast.error('Lỗi lưu cấu hình: ' + err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Handler: Lưu cấu hình từng phân hệ chuyên biệt
  const handleSaveSubsystem = async (moduleKey, data) => {
    setSavingSection(moduleKey);
    try {
      await saveSubsystemConfig(moduleKey, data);
      toast.success(`Đã lưu cấu hình chuyên sâu Phân hệ [${moduleKey.toUpperCase()}] lên Firestore thành công!`);
    } catch (err) {
      toast.error(`Lỗi lưu cấu hình ${moduleKey}: ` + err.message);
    } finally {
      setSavingSection(null);
    }
  };

  // Handler: Phòng ban
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code || '', order: dept.order || departments.length + 1 });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '', order: departments.length + 1 });
    }
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      toast.error('Tên phòng ban không được để trống.');
      return;
    }
    try {
      await saveDepartment({
        ...(editingDept ? { id: editingDept.id } : {}),
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase() || `PB${Date.now()}`,
        order: Number(deptForm.order) || 1,
      });
      toast.success(`${editingDept ? 'Cập nhật' : 'Thêm mới'} phòng ban thành công!`);
      setDeptModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu phòng ban: ' + err.message);
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa phòng ban [${name}]?`)) return;
    try {
      await deleteDepartment(id);
      toast.success(`Đã xóa phòng ban [${name}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  // Handler: Chức vụ
  const handleOpenPosModal = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm({ 
        name: pos.name, 
        code: pos.code || '', 
        department: pos.department || departments[0]?.name || '', 
        order: pos.order || positions.length + 1 
      });
    } else {
      setEditingPos(null);
      setPosForm({ 
        name: '', 
        code: '', 
        department: departments[0]?.name || 'Phòng Tín dụng', 
        order: positions.length + 1 
      });
    }
    setPosModalOpen(true);
  };

  const handleSavePos = async (e) => {
    e.preventDefault();
    if (!posForm.name.trim()) {
      toast.error('Tên chức vụ không được để trống.');
      return;
    }
    try {
      await savePosition({
        ...(editingPos ? { id: editingPos.id } : {}),
        name: posForm.name.trim(),
        code: posForm.code.trim().toUpperCase() || `CV${Date.now()}`,
        department: posForm.department,
        order: Number(posForm.order) || 1,
      });
      toast.success(`${editingPos ? 'Cập nhật' : 'Thêm mới'} chức vụ thành công!`);
      setPosModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu chức vụ: ' + err.message);
    }
  };

  const handleDeletePos = async (id, name) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa chức vụ [${name}]?`)) return;
    try {
      await deletePosition(id);
      toast.success(`Đã xóa chức danh [${name}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  // Handler: Tiêu chí tín nhiệm
  const handleOpenCritModal = (crit = null) => {
    if (crit) {
      setEditingCrit(crit);
      setCritForm({
        code: crit.code,
        title: crit.title,
        group: crit.group || 'Năng lực chuyên môn',
        description: crit.description || '',
        maxScore: crit.maxScore || 10,
        minScore: crit.minScore || 0,
        weight: crit.weight || 10,
      });
    } else {
      setEditingCrit(null);
      const nextId = trustCriteria.length + 1;
      setCritForm({
        code: `TC${String(nextId).padStart(2, '0')}`,
        title: `${nextId}. Tiêu chí đánh giá mới`,
        group: 'Phẩm chất đạo đức',
        description: 'Mô tả tiêu chuẩn và hướng dẫn thang điểm...',
        maxScore: 10,
        minScore: 0,
        weight: 10,
      });
    }
    setCritModalOpen(true);
  };

  const handleSaveCrit = async (e) => {
    e.preventDefault();
    if (!critForm.title.trim()) {
      toast.error('Tên tiêu chí không được để trống.');
      return;
    }
    try {
      await saveTrustCriterion({
        ...(editingCrit ? { id: editingCrit.id } : { id: Date.now() }),
        code: critForm.code.trim().toUpperCase(),
        title: critForm.title.trim(),
        group: critForm.group.trim(),
        description: critForm.description.trim(),
        maxScore: Number(critForm.maxScore) || 10,
        minScore: Number(critForm.minScore) || 0,
        weight: Number(critForm.weight) || 10,
      });
      toast.success(`${editingCrit ? 'Cập nhật' : 'Thêm mới'} tiêu chí thành công!`);
      setCritModalOpen(false);
    } catch (err) {
      toast.error('Lỗi lưu tiêu chí: ' + err.message);
    }
  };

  const handleDeleteCrit = async (code, title) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa tiêu chí [${title}] (${code})?`)) return;
    try {
      await deleteTrustCriterion(code);
      toast.success(`Đã xóa tiêu chí [${title}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa tiêu chí: ' + err.message);
    }
  };

  // Handler: Bật/Tắt module webapp (Đặc quyền SuperAdmin qtdyentho@gmail.com)
  const handleToggleModuleStatus = async (moduleCode, currentStatus) => {
    if (moduleCode === 'MODULE_SETTINGS') {
      toast.warning('Cấu hình & Quản trị Hệ thống là Module Cốt lõi đặc biệt, luôn luôn vận hành và không thể tắt!');
      return;
    }
    if (!canToggleModules) {
      toast.error('Chỉ Quản trị viên cấp cao duy nhất (qtdyentho@gmail.com) mới có quyền bật/tắt các phân hệ webapp!');
      return;
    }
    const newStatus = currentStatus === 'ACTIVE' ? 'PLANNED' : 'ACTIVE';
    try {
      await updateSystemModule(moduleCode, { status: newStatus });
      toast.success(`Đã chuyển trạng thái phân hệ [${moduleCode}] thành: ${newStatus === 'ACTIVE' ? 'Đang vận hành' : 'Kế hoạch triển khai'}!`);
    } catch (err) {
      toast.error('Lỗi cập nhật phân hệ: ' + err.message);
    }
  };

  // Handler: Thêm/Xóa chức danh quy hoạch
  const handleAddPlanningPos = () => {
    if (!newPlanningPos.trim()) return;
    const currentList = systemSettings.planningPositions || [];
    if (currentList.includes(newPlanningPos.trim())) {
      toast.error('Chức danh này đã tồn tại trong danh mục quy hoạch.');
      return;
    }
    const updated = [...currentList, newPlanningPos.trim()];
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
    setNewPlanningPos('');
  };

  const handleRemovePlanningPos = (posName) => {
    const currentList = systemSettings.planningPositions || [];
    const updated = currentList.filter((p) => p !== posName);
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Trang Quản Trị */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#0f766e] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200">
              Quản Trị Hệ Thống 2 Tầng
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">QTDND Yên Thọ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cấu Hình Hệ Thống Chung & Chuyên Sâu Từng Phân Hệ
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân định rõ ràng giữa Cấu hình dùng chung toàn Quỹ và Cấu hình đặc thù của từng phân hệ nghiệp vụ.
          </p>
        </div>

        {/* Nút chuyển đổi nhanh 2 Khu Vực Cấu Hình */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveGroup('GLOBAL');
              setActiveTab('GENERAL_LEGAL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'GLOBAL'
                ? 'bg-white text-teal-800 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Khu Vực 1: Cấu Hình Chung</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveGroup('SUBSYSTEM');
              setActiveTab('SUB_TRUST');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'SUBSYSTEM'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Khu Vực 2: Cấu Hình Từng Phân Hệ</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">7 Phân hệ</span>
          </button>
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG TABS THEO KHU VỰC */}
      {activeGroup === 'GLOBAL' ? (
        /* MENU TABS: KHU VỰC 1 - CẤU HÌNH HỆ THỐNG DÙNG CHUNG */
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('GENERAL_LEGAL')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GENERAL_LEGAL'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>1. Thông Tin Pháp Nhân Quỹ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GENERAL_ORG')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GENERAL_ORG'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>2. Danh Mục Phòng Ban & Chức Danh Dùng Chung</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {departments.length} PB / {positions.length} CV
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GENERAL_MODULES')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'GENERAL_MODULES'
                ? 'bg-white text-teal-900 shadow-xs border border-teal-200'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>3. Cổng Phân Hệ (Registry & Bật/Tắt)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
              Feature Flags
            </span>
          </button>
        </div>
      ) : (
        /* MENU TABS: KHU VỰC 2 - CẤU HÌNH CHUYÊN SÂU TỪNG PHÂN HỆ */
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span>Phân hệ đang vận hành:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('SUB_TRUST')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_TRUST'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>1. Tín Nhiệm (10 Tiêu Chí)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUB_HR')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_HR'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Nhân Sự & Luân Chuyển</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUB_KPI')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_KPI'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>3. KPI (3 Cấp 40-30-30)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUB_PLANNING')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_PLANNING'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50/50'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>4. Quy Hoạch Nguồn</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 pt-2">
            <span>Phân hệ đang triển khai (Sắp ra mắt):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('SUB_ATTENDANCE')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_ATTENDANCE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>5. Chấm Công & Ca Trực Kho</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUB_PAYROLL')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_PAYROLL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>6. Tiền Lương & Đãi Ngộ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUB_AWARDS')}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUB_AWARDS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 text-yellow-500" />
              <span>7. Thi Đua Khen Thưởng</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 1: TAB 1 - THÔNG TIN PHÁP NHÂN QUỸ                            */}
      {/* ===================================================================== */}
      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_LEGAL' && (
        <Card title="Thông Tin Pháp Nhân & Địa Bàn Hoạt Động (QTDND Yên Thọ)">
          {!canConfigureWebapp && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Chế độ Xem (Read-only):</strong> Thông tin pháp nhân và Cấu hình hệ thống Webapp được bảo vệ. Chỉ Quản trị viên cấp cao duy nhất (<strong>qtdyentho@gmail.com</strong>) mới có quyền chỉnh sửa và lưu thay đổi.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tên đầy đủ Quỹ tín dụng"
                value={systemSettings.unitName || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, unitName: e.target.value }))}
                disabled={!canConfigureWebapp}
                required
              />
              <Input
                label="Tên viết tắt"
                value={systemSettings.shortName || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, shortName: e.target.value }))}
                disabled={!canConfigureWebapp}
              />
            </div>

            <Input
              label="Địa chỉ trụ sở chính"
              value={systemSettings.address || ''}
              onChange={(e) => setSystemSettings((prev) => ({ ...prev, address: e.target.value }))}
              disabled={!canConfigureWebapp}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Giấy phép thành lập & hoạt động NHNN"
                value={systemSettings.licenseNo || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, licenseNo: e.target.value }))}
                disabled={!canConfigureWebapp}
              />
              <Input
                label="Số điện thoại liên hệ"
                value={systemSettings.phone || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={!canConfigureWebapp}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Chủ tịch Hội đồng Quản trị"
                value={systemSettings.chairmanName || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, chairmanName: e.target.value }))}
                disabled={!canConfigureWebapp}
              />
              <Input
                label="Giám đốc điều hành"
                value={systemSettings.directorName || ''}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, directorName: e.target.value }))}
                disabled={!canConfigureWebapp}
              />
            </div>

            {canConfigureWebapp && (
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Save} 
                  isLoading={savingSection === 'GENERAL_LEGAL'}
                  className="font-bold"
                >
                  Lưu thông tin pháp nhân
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 1: TAB 2 - PHÒNG BAN & CHỨC DANH DÙNG CHUNG                    */}
      {/* ===================================================================== */}
      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_ORG' && (
        <div className="space-y-6">
          {/* Card Phòng ban */}
          <Card
            title={`Danh Mục Phòng Ban Toàn Quỹ (${departments.length})`}
            headerRight={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenDeptModal(null)}
                className="font-bold text-xs"
              >
                Thêm phòng ban
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 transition-all shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {dept.code || 'PB'}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 mt-1">{dept.name}</h4>
                    <span className="text-[10px] text-slate-400">Thứ tự: {dept.order || 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDeptModal(dept)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100"
                      title="Sửa phòng ban"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Xóa phòng ban"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card Chức danh */}
          <Card
            title={`Danh Mục Chức Vụ & Vị Trí Công Tác (${positions.length})`}
            headerRight={
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => handleOpenPosModal(null)}
                className="font-bold text-xs"
              >
                Thêm chức vụ
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {positions.map((pos) => (
                <div
                  key={pos.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-teal-300 transition-all shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {pos.code || 'CV'}
                      </span>
                      <span className="text-[10px] text-slate-500">{pos.department}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mt-1">{pos.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenPosModal(pos)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-slate-100"
                      title="Sửa chức danh"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePos(pos.id, pos.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Xóa chức danh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 1: TAB 3 - QUẢN LÝ CỔNG PHÂN HỆ (FEATURE FLAGS)                */}
      {/* ===================================================================== */}
      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_MODULES' && (
        <Card title="Quản Lý Kích Hoạt Các Phân Hệ Trên Cổng Portal (Registry & Feature Flags)">
          {/* Thông báo phân quyền */}
          {canToggleModules ? (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Đặc quyền SuperAdmin (qtdyentho@gmail.com):</strong> Đồng chí có toàn quyền kích hoạt hoặc tạm ẩn các phân hệ webapp theo tiến độ vận hành.
              </span>
            </div>
          ) : (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Phân định quyền hạn:</strong> Chỉ tài khoản Quản trị Cấp cao duy nhất (<strong>qtdyentho@gmail.com</strong>) mới có quyền bật/tắt các phân hệ webapp. Ban Quản trị & Điều hành đang ở chế độ xem trạng thái vận hành.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 mb-4">
            Kích hoạt đưa vào sử dụng ngay lập tức hoặc tạm ẩn các phân hệ webapp khi đang bảo trì hoặc đang trong giai đoạn triển khai.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modulesList.map((mod) => {
              const isCoreModule = mod.code === 'MODULE_SETTINGS' || mod.isCore || mod.isSystemCore;
              const isActive = isCoreModule ? true : mod.status === 'ACTIVE';

              return (
                <div 
                  key={mod.code} 
                  className={`p-4 rounded-2xl border transition-all ${
                    isCoreModule
                      ? 'border-teal-400 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/40 shadow-xs ring-1 ring-teal-300/40'
                      : isActive 
                        ? 'border-emerald-300 bg-emerald-50/30' 
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCoreModule ? 'bg-teal-600 animate-pulse' : isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          {mod.name}
                          {isCoreModule && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                              Core
                            </span>
                          )}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {isCoreModule 
                          ? 'Module Cốt lõi Quản trị Hệ thống & Tham số toàn Quỹ. Nền tảng vận hành bắt buộc 24/7 và không thể bật/tắt.'
                          : mod.description}
                      </p>
                    </div>

                    {/* Điều khiển Bật/Tắt hoặc Huy hiệu Cốt lõi */}
                    {isCoreModule ? (
                      /* Module Cốt lõi: CỐ ĐỊNH, KHÔNG CÓ NÚT BẬT/TẮT */
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-800 text-white shadow-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-200" />
                          HỆ THỐNG CỐT LÕI
                        </span>
                        <span className="text-[9px] text-teal-700 font-bold uppercase tracking-wider">
                          Bắt buộc • Luôn bật
                        </span>
                      </div>
                    ) : canToggleModules ? (
                      /* SuperAdmin: Nút bấm Toggle hoạt động */
                      <button
                        type="button"
                        onClick={() => handleToggleModuleStatus(mod.code, mod.status)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        {isActive ? 'ĐANG VẬN HÀNH' : 'KẾ HOẠCH TRIỂN KHAI'}
                      </button>
                    ) : (
                      /* Ban Quản trị khác: Chế độ Xem (Locked) */
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 opacity-80 cursor-not-allowed border ${
                            isActive
                              ? 'bg-emerald-100 text-[#047857] border-emerald-300'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                          title="Chỉ Quản trị viên cấp cao (qtdyentho@gmail.com) mới có quyền bật/tắt phân hệ"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          {isActive ? 'ĐANG VẬN HÀNH' : 'KẾ HOẠCH TRIỂN KHAI'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          Chỉ SuperAdmin được đổi
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Mã: {mod.code}</span>
                    <span>Đường dẫn: {mod.route}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 1 - ĐÁNH GIÁ TÍN NHIỆM (MODULE_TRUST)               */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_TRUST' && (
        <div className="space-y-6">
          <Card 
            title="Cấu Hình Chuyên Sâu: Phân Hệ Đánh Giá Tín Nhiệm (10 Tiêu Chí Chuẩn NHNN)"
            headerRight={
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={savingSection === 'trust'}
                onClick={() => handleSaveSubsystem('trust', trustConfig)}
                className="font-bold text-xs"
              >
                Lưu cấu hình Tín Nhiệm
              </Button>
            }
          >
            {/* Tham số xếp loại & bỏ phiếu kín */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                  Ngưỡng Điểm Xếp Loại Tín Nhiệm (Scale 100)
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Xuất sắc (&ge;):</span>
                    <input
                      type="number"
                      value={trustConfig.excellentThreshold ?? 90}
                      onChange={(e) => setTrustConfig((prev) => ({ ...prev, excellentThreshold: Number(e.target.value) }))}
                      className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tốt (&ge;):</span>
                    <input
                      type="number"
                      value={trustConfig.goodThreshold ?? 70}
                      onChange={(e) => setTrustConfig((prev) => ({ ...prev, goodThreshold: Number(e.target.value) }))}
                      className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hoàn thành (&ge;):</span>
                    <input
                      type="number"
                      value={trustConfig.passThreshold ?? 50}
                      onChange={(e) => setTrustConfig((prev) => ({ ...prev, passThreshold: Number(e.target.value) }))}
                      className="w-16 p-1 text-center font-bold bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
                <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
                  Quy Chế Bỏ Phiếu Mặc Định
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="defaultVotingMode"
                      value="ANONYMOUS"
                      checked={trustConfig.defaultVotingMode === 'ANONYMOUS'}
                      onChange={() => setTrustConfig((prev) => ({ ...prev, defaultVotingMode: 'ANONYMOUS' }))}
                    />
                    <span>Bỏ phiếu kín 100% (Ẩn danh cử tri)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="defaultVotingMode"
                      value="IDENTIFIED"
                      checked={trustConfig.defaultVotingMode === 'IDENTIFIED'}
                      onChange={() => setTrustConfig((prev) => ({ ...prev, defaultVotingMode: 'IDENTIFIED' }))}
                    />
                    <span>Định danh (Công khai danh tính)</span>
                  </label>
                </div>
                <p className="text-[11px] text-teal-700 italic">
                  * Khuyến nghị Quỹ: Luôn áp dụng Bỏ phiếu kín để đảm bảo tính công tâm tuyệt đối.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  Quy Chế Chống Tự Chấm Bản Thân
                </span>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-bold text-slate-800">
                    Nghiêm cấm tự đánh giá: {trustConfig.allowSelfEvaluation ? 'Bật (Không khuyên dùng)' : 'Khóa 100% (Chuẩn mực)'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Hệ thống tự động loại trừ chính mình khỏi danh sách thẻ chấm điểm và chặn submit cấp Firestore Rules.
                </p>
              </div>
            </div>

            {/* Quản lý 10 Tiêu chí tín nhiệm */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bộ 10 Tiêu Chí Đánh Giá Tín Nhiệm Chuẩn ({trustCriteria.length} tiêu chí):
                </h4>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenCritModal(null)}
                  className="font-bold text-xs"
                >
                  Thêm tiêu chí mới
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-16 text-center">Mã</th>
                      <th className="py-2.5 px-3">Tên tiêu chí</th>
                      <th className="py-2.5 px-3">Nhóm năng lực</th>
                      <th className="py-2.5 px-3">Mô tả chuẩn mực</th>
                      <th className="py-2.5 px-3 text-center w-24">Thang điểm</th>
                      <th className="py-2.5 px-3 text-center w-20">Trọng số</th>
                      <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trustCriteria.map((c) => (
                      <tr key={c.id || c.code} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-center text-emerald-700">{c.code}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{c.title}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {c.group}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{c.description}</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">{c.minScore || 0} - {c.maxScore || 10}</td>
                        <td className="py-2 px-3 text-center font-bold text-teal-700">{c.weight || 10}%</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCritModal(c)}
                              className="p-1 text-slate-500 hover:text-teal-700 rounded hover:bg-slate-100"
                              title="Sửa tiêu chí"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCrit(c.code, c.title)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Xóa tiêu chí"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 2 - HỒ SƠ & LUÂN CHUYỂN (MODULE_HR)                */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_HR' && (
        <Card 
          title="Cấu Hình Chuyên Sâu: Phân Hệ Nhân Sự & Luân Chuyển Cán Bộ (Quy chế NHNN)"
          headerRight={
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={savingSection === 'hr'}
              onClick={() => handleSaveSubsystem('hr', hrConfig)}
              className="font-bold text-xs"
            >
              Lưu cấu hình Nhân Sự
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
                <span className="text-xs font-bold text-teal-950 uppercase tracking-wider block">
                  Chu Kỳ Luân Chuyển Bắt Buộc Địa Bàn Tín Dụng
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={hrConfig.transferCycleMonths ?? 36}
                    onChange={(e) => setHrConfig((prev) => ({ ...prev, transferCycleMonths: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-teal-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-teal-900">tháng (tương đương 3 năm theo chỉ đạo NHNN)</span>
                </div>
                <p className="text-[11px] text-teal-700">
                  Cán bộ phụ trách địa bàn sau thời hạn này bắt buộc phải điều chuyển sang cụm thôn/xã khác để phòng ngừa rủi ro đạo đức.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  Thời Gian Cảnh Báo Sắp Đến Hạn Luân Chuyển
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={hrConfig.warningDaysBefore ?? 90}
                    onChange={(e) => setHrConfig((prev) => ({ ...prev, warningDaysBefore: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-amber-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-amber-900">ngày trước khi hết chu kỳ</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  Hệ thống tự động phát cảnh báo màu vàng tại trang Nhân sự để Ban Lãnh đạo chủ động xây dựng phương án nhân sự.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Quy Định Biên Bản Bàn Giao Nợ & Hồ Sơ Thế Chấp
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={hrConfig.requireDebtHandover ?? true}
                  onChange={(e) => setHrConfig((prev) => ({ ...prev, requireDebtHandover: e.target.checked }))}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Bắt buộc có biên bản bàn giao dư nợ đầy đủ trước khi cấp quyền trên địa bàn mới</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Đảm bảo không phát sinh tranh chấp hoặc thất thoát hồ sơ vay vốn giữa cán bộ cũ và cán bộ mới tiếp nhận.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 3 - ĐÁNH GIÁ KPI 3 CẤP (MODULE_KPI)                 */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_KPI' && (
        <Card 
          title="Cấu Hình Chuyên Sâu: Phân Hệ Chấm Điểm KPI 3 Cấp (Tỷ Trọng 40-30-30)"
          headerRight={
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={savingSection === 'kpi'}
              onClick={() => handleSaveSubsystem('kpi', kpiConfig)}
              className="font-bold text-xs"
            >
              Lưu cấu hình KPI
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase block">Cấp 1: Cán Bộ Tự Chấm</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={kpiConfig.weightSelf ?? 40}
                    onChange={(e) => setKpiConfig((prev) => ({ ...prev, weightSelf: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-blue-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-blue-900">%</span>
                </div>
                <p className="text-[11px] text-blue-700">Cán bộ tự đánh giá mức độ hoàn thành chỉ tiêu giao trong kỳ.</p>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                <span className="text-xs font-bold text-indigo-900 uppercase block">Cấp 2: Ban Điều Hành (Giám đốc)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={kpiConfig.weightManager ?? 30}
                    onChange={(e) => setKpiConfig((prev) => ({ ...prev, weightManager: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-indigo-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-indigo-900">%</span>
                </div>
                <p className="text-[11px] text-indigo-700">Giám đốc trực tiếp thẩm tra hồ sơ và chấm điểm năng suất công tác.</p>
              </div>

              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-2">
                <span className="text-xs font-bold text-purple-900 uppercase block">Cấp 3: Chủ Tịch HĐQT Phê Chuẩn</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={kpiConfig.weightChairman ?? 30}
                    onChange={(e) => setKpiConfig((prev) => ({ ...prev, weightChairman: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-purple-900">%</span>
                </div>
                <p className="text-[11px] text-purple-700">Chủ tịch HĐQT xem xét toàn diện và phê chuẩn kết quả xếp loại cuối cùng.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
              <span>Tổng tỷ trọng hiện tại:</span>
              <span className={`text-sm ${
                (kpiConfig.weightSelf + kpiConfig.weightManager + kpiConfig.weightChairman) === 100
                  ? 'text-emerald-700 font-black'
                  : 'text-rose-600 font-black'
              }`}>
                {kpiConfig.weightSelf + kpiConfig.weightManager + kpiConfig.weightChairman}% {((kpiConfig.weightSelf + kpiConfig.weightManager + kpiConfig.weightChairman) === 100) ? '(Hợp lệ: 100%)' : '(Chưa chuẩn: Phải bằng 100%)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Chu kỳ đánh giá:</label>
                <select
                  value={kpiConfig.evaluationPeriod || 'MONTHLY'}
                  onChange={(e) => setKpiConfig((prev) => ({ ...prev, evaluationPeriod: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="MONTHLY">Đánh giá hàng tháng (Theo chu kỳ lương kinh doanh)</option>
                  <option value="QUARTERLY">Đánh giá hàng quý (3 tháng/lần)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Hạn nộp bảng tự chấm hàng tháng:</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Ngày</span>
                  <input
                    type="number"
                    value={kpiConfig.dueDayOfMonth ?? 25}
                    onChange={(e) => setKpiConfig((prev) => ({ ...prev, dueDayOfMonth: Number(e.target.value) }))}
                    className="w-16 p-2 text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl text-center"
                  />
                  <span className="text-xs text-slate-500">hàng tháng</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 4 - QUY HOẠCH NGUỒN (MODULE_PLANNING)               */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_PLANNING' && (
        <div className="space-y-6">
          <Card 
            title="Cấu Hình Chuyên Sâu: Phân Hệ Bỏ Phiếu Quy Hoạch Cán Bộ Nguồn (Nhiệm Kỳ 5 Năm)"
            headerRight={
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                isLoading={savingSection === 'planning'}
                onClick={() => handleSaveSubsystem('planning', planningConfig)}
                className="font-bold text-xs"
              >
                Lưu cấu hình Quy Hoạch
              </Button>
            }
          >
            <div className="space-y-6">
              {/* Ngưỡng trúng quy hoạch */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-purple-200 bg-purple-50/50">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-purple-950">
                    Tỷ lệ phiếu tín nhiệm tối thiểu để trúng quy hoạch bổ nhiệm:
                  </h4>
                  <p className="text-[11px] text-purple-800">
                    Ứng viên phải đạt trên tỷ lệ này mới đủ điều kiện lập hồ sơ trình Ban Thường vụ và NHNN Chi nhánh tỉnh phê chuẩn.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={planningConfig.thresholdPercent ?? 50}
                    onChange={(e) => setPlanningConfig((prev) => ({ ...prev, thresholdPercent: Number(e.target.value) }))}
                    className="w-20 p-2 text-sm font-bold bg-white border border-purple-300 rounded-xl text-center"
                  />
                  <span className="text-xs font-bold text-purple-900">% số phiếu hợp lệ</span>
                </div>
              </div>

              {/* Danh mục chức danh quy hoạch */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Danh Mục Chức Danh Lấy Phiếu Quy Hoạch:
                </h4>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nhập tên chức danh quy hoạch mới (VD: Phó Chủ tịch HĐQT)..."
                    value={newPlanningPos}
                    onChange={(e) => setNewPlanningPos(e.target.value)}
                    className="flex-1 p-2.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <Button variant="primary" size="sm" icon={Plus} onClick={handleAddPlanningPos}>
                    Thêm chức danh
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(systemSettings.planningPositions || []).map((pos, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs">
                      <span className="text-xs font-bold text-slate-800">{pos}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlanningPos(pos)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Xóa chức danh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 5 - CHẤM CÔNG & CA TRỰC (ĐANG TRIỂN KHAI)           */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_ATTENDANCE' && (
        <Card 
          title="Cấu Hình Chuyên Sâu: Phân Hệ Chấm Công & Ca Trực Kho Quỹ (Đang Triển Khai)"
          headerRight={
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={savingSection === 'attendance'}
              onClick={() => handleSaveSubsystem('attendance', attendanceConfig)}
              className="font-bold text-xs"
            >
              Lưu cấu hình Chấm Công
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase block">Ca sáng tại quầy:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={attendanceConfig.morningShiftStart || '07:30'}
                    onChange={(e) => setAttendanceConfig((prev) => ({ ...prev, morningShiftStart: e.target.value }))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <span>đến</span>
                  <input
                    type="time"
                    value={attendanceConfig.morningShiftEnd || '11:30'}
                    onChange={(e) => setAttendanceConfig((prev) => ({ ...prev, morningShiftEnd: e.target.value }))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase block">Ca chiều tại quầy:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={attendanceConfig.afternoonShiftStart || '13:30'}
                    onChange={(e) => setAttendanceConfig((prev) => ({ ...prev, afternoonShiftStart: e.target.value }))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                  <span>đến</span>
                  <input
                    type="time"
                    value={attendanceConfig.afternoonShiftEnd || '17:00'}
                    onChange={(e) => setAttendanceConfig((prev) => ({ ...prev, afternoonShiftEnd: e.target.value }))}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
              <span className="text-xs font-bold text-amber-950 uppercase block">Trực bảo vệ & Kho quỹ ban đêm:</span>
              <p className="text-xs text-amber-800">
                Khung giờ trực két sắt ngoài giờ hành chính: <strong>17:00</strong> chiều đến <strong>07:30</strong> sáng hôm sau.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 6 - TIỀN LƯƠNG & ĐÃI NGỘ (ĐANG TRIỂN KHAI)          */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_PAYROLL' && (
        <Card 
          title="Cấu Hình Chuyên Sâu: Phân Hệ Tiền Lương & Đãi Ngộ Cán Bộ (Đang Triển Khai)"
          headerRight={
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={savingSection === 'payroll'}
              onClick={() => handleSaveSubsystem('payroll', payrollConfig)}
              className="font-bold text-xs"
            >
              Lưu cấu hình Tiền Lương
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Tỷ trọng lương KPI:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={payrollConfig.kpiSalaryWeight ?? 30}
                  onChange={(e) => setPayrollConfig((prev) => ({ ...prev, kpiSalaryWeight: Number(e.target.value) }))}
                  className="w-20 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
                />
                <span className="text-xs font-bold text-slate-700">% lương kinh doanh</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Trích nộp BHXH cá nhân:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={payrollConfig.socialInsuranceRate ?? 10.5}
                  onChange={(e) => setPayrollConfig((prev) => ({ ...prev, socialInsuranceRate: Number(e.target.value) }))}
                  className="w-20 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
                />
                <span className="text-xs font-bold text-slate-700">% lương cơ bản</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase block">Ngày chi trả lương:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Ngày</span>
                <input
                  type="number"
                  value={payrollConfig.payDayOfMonth ?? 10}
                  onChange={(e) => setPayrollConfig((prev) => ({ ...prev, payDayOfMonth: Number(e.target.value) }))}
                  className="w-16 p-2 text-sm font-bold bg-white border border-slate-300 rounded-xl text-center"
                />
                <span className="text-xs text-slate-500">hàng tháng</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* KHU VỰC 2: PHÂN HỆ 7 - THI ĐUA KHEN THƯỞNG (ĐANG TRIỂN KHAI)          */}
      {/* ===================================================================== */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_AWARDS' && (
        <Card 
          title="Cấu Hình Chuyên Sâu: Phân Hệ Thi Đua & Khen Thưởng Cuối Năm (Đang Triển Khai)"
          headerRight={
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={savingSection === 'awards'}
              onClick={() => handleSaveSubsystem('awards', awardsConfig)}
              className="font-bold text-xs"
            >
              Lưu cấu hình Thi Đua
            </Button>
          }
        >
          <div className="space-y-3">
            {(awardsConfig.titles || []).map((t) => (
              <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tiêu chuẩn: {t.condition}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">Định mức thưởng:</span>
                  <span className="text-xs font-black text-emerald-700">
                    {Number(t.bonus).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA PHÒNG BAN                                           */}
      {/* ===================================================================== */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Cập Nhật Phòng Ban' : 'Thêm Phòng Ban Mới'}
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Tên phòng ban"
            placeholder="VD: Ban Kiểm soát..."
            value={deptForm.name}
            onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã phòng ban (viết tắt)"
              placeholder="VD: BKS"
              value={deptForm.code}
              onChange={(e) => setDeptForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={deptForm.order}
              onChange={(e) => setDeptForm((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setDeptModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu phòng ban
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA CHỨC DANH                                           */}
      {/* ===================================================================== */}
      <Modal
        isOpen={posModalOpen}
        onClose={() => setPosModalOpen(false)}
        title={editingPos ? 'Cập Nhật Chức Danh' : 'Thêm Chức Danh Mới'}
      >
        <form onSubmit={handleSavePos} className="space-y-4">
          <Input
            label="Tên chức danh / Vị trí"
            placeholder="VD: Trưởng ban kiểm soát..."
            value={posForm.name}
            onChange={(e) => setPosForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phòng ban trực thuộc:
            </label>
            <select
              value={posForm.department}
              onChange={(e) => setPosForm((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mã chức danh"
              placeholder="VD: TR_BKS"
              value={posForm.code}
              onChange={(e) => setPosForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <Input
              label="Thứ tự"
              type="number"
              value={posForm.order}
              onChange={(e) => setPosForm((prev) => ({ ...prev, order: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setPosModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu chức danh
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: THÊM / SỬA TIÊU CHÍ TÍN NHIỆM                                  */}
      {/* ===================================================================== */}
      <Modal
        isOpen={critModalOpen}
        onClose={() => setCritModalOpen(false)}
        title={editingCrit ? 'Cập Nhật Tiêu Chí Tín Nhiệm' : 'Thêm Tiêu Chí Tín Nhiệm'}
      >
        <form onSubmit={handleSaveCrit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Mã tiêu chí"
              placeholder="VD: TC11"
              value={critForm.code}
              onChange={(e) => setCritForm((prev) => ({ ...prev, code: e.target.value }))}
              required
            />
            <div className="col-span-2">
              <Input
                label="Nhóm năng lực"
                placeholder="VD: Phẩm chất đạo đức / Chuyên môn..."
                value={critForm.group}
                onChange={(e) => setCritForm((prev) => ({ ...prev, group: e.target.value }))}
                required
              />
            </div>
          </div>

          <Input
            label="Tiêu đề tiêu chí"
            placeholder="VD: 1. Tinh thần trách nhiệm..."
            value={critForm.title}
            onChange={(e) => setCritForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết & Hướng dẫn chấm điểm:
            </label>
            <textarea
              rows={3}
              value={critForm.description}
              onChange={(e) => setCritForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Quy định nội dung tiêu chuẩn cần đạt..."
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Điểm tối thiểu"
              type="number"
              value={critForm.minScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, minScore: e.target.value }))}
            />
            <Input
              label="Điểm tối đa"
              type="number"
              value={critForm.maxScore}
              onChange={(e) => setCritForm((prev) => ({ ...prev, maxScore: e.target.value }))}
            />
            <Input
              label="Trọng số (%)"
              type="number"
              value={critForm.weight}
              onChange={(e) => setCritForm((prev) => ({ ...prev, weight: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setCritModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu tiêu chí
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSettings;

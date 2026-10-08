import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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
  saveSubsystemConfig,
  subscribeRolePermissions,
  saveRolePermissions
} from '../../lib/services';
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_MODULE_TRUST_SETTINGS,
  DEFAULT_MODULE_HR_SETTINGS,
  DEFAULT_MODULE_KPI_SETTINGS,
  DEFAULT_MODULE_PLANNING_SETTINGS,
  DEFAULT_MODULE_ATTENDANCE_SETTINGS,
  DEFAULT_MODULE_PAYROLL_SETTINGS,
  DEFAULT_MODULE_AWARDS_SETTINGS
} from '../../lib/systemDefaults';
import { DEFAULT_ROLE_PERMISSIONS } from '../../lib/permissions';

// Các components con phân rã sạch sẽ
import SettingsScopeToggle from './components/SettingsScopeToggle';
import SettingsTabsNav from './components/SettingsTabsNav';

// Khu vực 1: Cấu hình chung
import GeneralLegalSettings from './components/global/GeneralLegalSettings';
import OrganizationSettings from './components/global/OrganizationSettings';
import ModuleActivationSettings from './components/global/ModuleActivationSettings';
import GlobalRolePermissionsSettings from './components/global/GlobalRolePermissionsSettings';

// Khu vực 2: Cấu hình chuyên sâu 7 phân hệ
import TrustCriteriaSettings from './components/subsystems/TrustCriteriaSettings';
import HrSubsystemSettings from './components/subsystems/HrSubsystemSettings';
import KpiSubsystemSettings from './components/subsystems/KpiSubsystemSettings';
import PlanningSubsystemSettings from './components/subsystems/PlanningSubsystemSettings';
import AttendanceSubsystemSettings from './components/subsystems/AttendanceSubsystemSettings';
import PayrollSubsystemSettings from './components/subsystems/PayrollSubsystemSettings';
import AwardsSubsystemSettings from './components/subsystems/AwardsSubsystemSettings';

/**
 * Container điều phối Cấu hình & Quản trị Hệ thống 2 Tầng
 * Phân định rành mạch giữa Cấu hình chung toàn Quỹ và Cấu hình đặc thù từng phân hệ
 */
const AdminSettingsContainer = () => {
  const toast = useToast();
  const { canToggleModules, canConfigureWebapp } = useAuth();

  // Nhóm tab lớn: 'GLOBAL' (Cấu hình chung) hoặc 'SUBSYSTEM' (Cấu hình từng phân hệ)
  const [activeGroup, setActiveGroup] = useState('SUBSYSTEM');

  // Tab cụ thể đang chọn
  const [activeTab, setActiveTab] = useState('SUB_TRUST');

  // Loading states
  const [savingSection, setSavingSection] = useState(null);

  // Dữ liệu Realtime Firestore: Cấu hình chung
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [trustCriteria, setTrustCriteria] = useState([]);
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [modulesList, setModulesList] = useState([]);
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);

  // Dữ liệu Realtime Firestore: Cấu hình chuyên biệt từng phân hệ
  const [trustConfig, setTrustConfig] = useState(DEFAULT_MODULE_TRUST_SETTINGS);
  const [hrConfig, setHrConfig] = useState(DEFAULT_MODULE_HR_SETTINGS);
  const [kpiConfig, setKpiConfig] = useState(DEFAULT_MODULE_KPI_SETTINGS);
  const [planningConfig, setPlanningConfig] = useState(DEFAULT_MODULE_PLANNING_SETTINGS);
  const [attendanceConfig, setAttendanceConfig] = useState(DEFAULT_MODULE_ATTENDANCE_SETTINGS);
  const [payrollConfig, setPayrollConfig] = useState(DEFAULT_MODULE_PAYROLL_SETTINGS);
  const [awardsConfig, setAwardsConfig] = useState(DEFAULT_MODULE_AWARDS_SETTINGS);

  // 1. Subscribe Realtime Firestore
  useEffect(() => {
    const unsubDept = subscribeDepartments((list) => setDepartments(list));
    const unsubPos = subscribePositions((list) => setPositions(list));
    const unsubCrit = subscribeTrustCriteria((list) => setTrustCriteria(list));
    const unsubMod = subscribeSystemModules((list) => setModulesList(list));
    const unsubSet = subscribeSystemSettings((data) => {
      if (data) setSystemSettings((prev) => ({ ...prev, ...data }));
    });
    const unsubPerms = subscribeRolePermissions((data) => {
      if (data) setRolePermissions((prev) => ({ ...prev, ...data }));
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
      unsubPerms();
      unsubTrust();
      unsubHr();
      unsubKpi();
      unsubPlanning();
      unsubAtt();
      unsubPay();
      unsubAwards();
    };
  }, []);

  // Handler: Lưu Cài đặt hệ thống chung
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
  const handleSaveDept = async (deptForm, editingDept) => {
    if (!deptForm.name.trim()) {
      toast.error('Tên phòng ban không được để trống.');
      return false;
    }
    try {
      await saveDepartment({
        ...(editingDept ? { id: editingDept.id } : {}),
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase() || `PB${Date.now()}`,
        order: Number(deptForm.order) || 1,
      });
      toast.success(`${editingDept ? 'Cập nhật' : 'Thêm mới'} phòng ban thành công!`);
      return true;
    } catch (err) {
      toast.error('Lỗi lưu phòng ban: ' + err.message);
      return false;
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
  const handleSavePos = async (posForm, editingPos) => {
    if (!posForm.name.trim()) {
      toast.error('Tên chức vụ không được để trống.');
      return false;
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
      return true;
    } catch (err) {
      toast.error('Lỗi lưu chức vụ: ' + err.message);
      return false;
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
  const handleSaveCrit = async (critForm, editingCrit) => {
    if (!critForm.title.trim()) {
      toast.error('Tên tiêu chí không được để trống.');
      return false;
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
      return true;
    } catch (err) {
      toast.error('Lỗi lưu tiêu chí: ' + err.message);
      return false;
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

  // Handler: Bật/Tắt module webapp
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

  // Handler: Chức danh quy hoạch
  const handleAddPlanningPos = (posName) => {
    const currentList = systemSettings.planningPositions || [];
    if (currentList.includes(posName)) {
      toast.error('Chức danh này đã tồn tại trong danh mục quy hoạch.');
      return;
    }
    const updated = [...currentList, posName];
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
  };

  const handleRemovePlanningPos = (posName) => {
    const currentList = systemSettings.planningPositions || [];
    const updated = currentList.filter((p) => p !== posName);
    setSystemSettings((prev) => ({ ...prev, planningPositions: updated }));
  };

  // Handler: Lưu phân quyền vai trò toàn hệ thống
  const handleSaveRolePermissions = async () => {
    setSavingSection('ROLE_PERMS');
    try {
      await saveRolePermissions(rolePermissions);
      toast.success('Đã lưu cấu hình phân quyền vai trò toàn hệ thống thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu phân quyền hệ thống: ' + err.message);
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Thanh Tác Vụ & Chuyển Đổi Khu Vực Cấu Hình */}
      <SettingsScopeToggle
        activeGroup={activeGroup}
        onGroupChange={(group) => {
          setActiveGroup(group);
          if (group === 'GLOBAL') setActiveTab('GENERAL_LEGAL');
          else setActiveTab('SUB_TRUST');
        }}
      />

      {/* 2. Thanh Điều Hướng Tabs */}
      <SettingsTabsNav
        activeGroup={activeGroup}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        departmentsCount={departments.length}
        positionsCount={positions.length}
      />

      {/* 3. Nội Dung Chi Tiết Theo Tab Đang Chọn */}
      {/* KHU VỰC 1: CẤU HÌNH DÙNG CHUNG TOÀN QUỸ */}
      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_LEGAL' && (
        <GeneralLegalSettings
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          onSave={handleSaveGeneralSettings}
          isSaving={savingSection === 'GENERAL_LEGAL'}
          canConfigureWebapp={canConfigureWebapp}
        />
      )}

      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_ORG' && (
        <OrganizationSettings
          departments={departments}
          positions={positions}
          onSaveDept={handleSaveDept}
          onDeleteDept={handleDeleteDept}
          onSavePos={handleSavePos}
          onDeletePos={handleDeletePos}
        />
      )}

      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_MODULES' && (
        <ModuleActivationSettings
          modulesList={modulesList}
          onToggleStatus={handleToggleModuleStatus}
          canToggleModules={canToggleModules}
        />
      )}

      {activeGroup === 'GLOBAL' && activeTab === 'GENERAL_PERMISSIONS' && (
        <GlobalRolePermissionsSettings
          globalPermissions={rolePermissions.global || DEFAULT_ROLE_PERMISSIONS.global}
          onChangeGlobalPermissions={(newGlobal) =>
            setRolePermissions((prev) => ({ ...prev, global: newGlobal }))
          }
          onSavePermissions={handleSaveRolePermissions}
          onResetDefault={() =>
            setRolePermissions((prev) => ({ ...prev, global: DEFAULT_ROLE_PERMISSIONS.global }))
          }
          isSaving={savingSection === 'ROLE_PERMS'}
        />
      )}

      {/* KHU VỰC 2: CẤU HÌNH CHUYÊN SÂU TỪNG PHÂN HỆ */}
      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_TRUST' && (
        <TrustCriteriaSettings
          trustConfig={trustConfig}
          setTrustConfig={setTrustConfig}
          trustCriteria={trustCriteria}
          onSaveConfig={(cfg) => handleSaveSubsystem('trust', cfg)}
          isSaving={savingSection === 'trust'}
          onSaveCriterion={handleSaveCrit}
          onDeleteCriterion={handleDeleteCrit}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_HR' && (
        <HrSubsystemSettings
          hrConfig={hrConfig}
          setHrConfig={setHrConfig}
          onSaveConfig={(cfg) => handleSaveSubsystem('hr', cfg)}
          isSaving={savingSection === 'hr'}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_KPI' && (
        <KpiSubsystemSettings
          kpiConfig={kpiConfig}
          setKpiConfig={setKpiConfig}
          onSaveConfig={(cfg) => handleSaveSubsystem('kpi', cfg)}
          isSaving={savingSection === 'kpi'}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_PLANNING' && (
        <PlanningSubsystemSettings
          planningConfig={planningConfig}
          setPlanningConfig={setPlanningConfig}
          planningPositions={systemSettings.planningPositions}
          onSaveConfig={(cfg) => handleSaveSubsystem('planning', cfg)}
          isSaving={savingSection === 'planning'}
          onAddPlanningPos={handleAddPlanningPos}
          onRemovePlanningPos={handleRemovePlanningPos}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_ATTENDANCE' && (
        <AttendanceSubsystemSettings
          attendanceConfig={attendanceConfig}
          setAttendanceConfig={setAttendanceConfig}
          onSaveConfig={(cfg) => handleSaveSubsystem('attendance', cfg)}
          isSaving={savingSection === 'attendance'}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_PAYROLL' && (
        <PayrollSubsystemSettings
          payrollConfig={payrollConfig}
          setPayrollConfig={setPayrollConfig}
          onSaveConfig={(cfg) => handleSaveSubsystem('payroll', cfg)}
          isSaving={savingSection === 'payroll'}
        />
      )}

      {activeGroup === 'SUBSYSTEM' && activeTab === 'SUB_AWARDS' && (
        <AwardsSubsystemSettings
          awardsConfig={awardsConfig}
          onSaveConfig={(cfg) => handleSaveSubsystem('awards', cfg)}
          isSaving={savingSection === 'awards'}
        />
      )}
    </div>
  );
};

export default AdminSettingsContainer;

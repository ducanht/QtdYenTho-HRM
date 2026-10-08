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
  subscribeSystemSettings,
  saveSystemSettings,
  subscribeSystemModules,
  updateSystemModule,
  subscribeRolePermissions,
  saveRolePermissions
} from '../../lib/services';
import { DEFAULT_SYSTEM_SETTINGS } from '../../lib/systemDefaults';
import { DEFAULT_ROLE_PERMISSIONS } from '../../lib/permissions';

// Các components con Cấu hình chung
import SettingsTabsNav from './components/SettingsTabsNav';
import GeneralLegalSettings from './components/global/GeneralLegalSettings';
import OrganizationSettings from './components/global/OrganizationSettings';
import ModuleActivationSettings from './components/global/ModuleActivationSettings';
import GlobalRolePermissionsSettings from './components/global/GlobalRolePermissionsSettings';

/**
 * Container Quản trị Cấu hình Hệ thống Chung (Global Settings)
 * Quản lý Thông tin Pháp nhân, Cơ cấu Tổ chức, Bật/Tắt Phân hệ và Phân quyền Vai trò
 */
const AdminSettingsContainer = () => {
  const toast = useToast();
  const { canToggleModules, canConfigureWebapp } = useAuth();

  // Tab cụ thể đang chọn trong Cấu hình chung toàn hệ thống
  const [activeTab, setActiveTab] = useState('GENERAL_LEGAL');

  // Loading states
  const [savingSection, setSavingSection] = useState(null);

  // Dữ liệu Realtime Firestore: Cấu hình chung
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);
  const [modulesList, setModulesList] = useState([]);
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);

  // 1. Subscribe Realtime Firestore
  useEffect(() => {
    const unsubDept = subscribeDepartments((list) => setDepartments(list));
    const unsubPos = subscribePositions((list) => setPositions(list));
    const unsubMod = subscribeSystemModules((list) => setModulesList(list));
    const unsubSet = subscribeSystemSettings((data) => {
      if (data) setSystemSettings((prev) => ({ ...prev, ...data }));
    });
    const unsubPerms = subscribeRolePermissions((data) => {
      if (data) setRolePermissions((prev) => ({ ...prev, ...data }));
    });

    return () => {
      unsubDept();
      unsubPos();
      unsubMod();
      unsubSet();
      unsubPerms();
    };
  }, []);

  // Handler: Lưu Cài đặt hệ thống chung
  const handleSaveGeneralSettings = async (e) => {
    e?.preventDefault?.();
    if (!canConfigureWebapp) {
      toast.error('Chỉ Quản trị viên và Ban Lãnh đạo Quỹ mới có quyền lưu cấu hình tham số hệ thống!');
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

  // Handler: Bật/Tắt module webapp
  const handleToggleModuleStatus = async (moduleCode, currentStatus) => {
    if (moduleCode === 'MODULE_SETTINGS') {
      toast.warning('Cấu hình & Quản trị Hệ thống là Module Cốt lõi đặc biệt, luôn luôn vận hành và không thể tắt!');
      return;
    }
    if (!canToggleModules) {
      toast.error('Chỉ Quản trị viên và Ban Lãnh đạo Quỹ mới có quyền bật/tắt các phân hệ webapp!');
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
      {/* 1. Header giải thích chức năng Quản trị chung */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-800 p-5 rounded-3xl text-white shadow-md border border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
            Hệ Thống Cốt Lõi • Ban Quản Trị Quỹ
          </span>
          <h2 className="text-xl sm:text-2xl font-black">
            Cấu Hình & Quản Trị Hệ Thống Chung
          </h2>
          <p className="text-xs text-teal-100 mt-1 max-w-2xl leading-relaxed">
            Thiết lập pháp nhân, cơ cấu tổ chức, quản lý kích hoạt phân hệ nghiệp vụ và phân quyền vai trò toàn Quỹ.
          </p>
        </div>
        <div className="text-xs bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 self-start sm:self-auto">
          <span className="text-emerald-200">Phân quyền: </span>
          <strong className="text-white">Admin & Lãnh đạo</strong>
        </div>
      </div>

      {/* 2. Thanh Điều Hướng 4 Tabs Cấu Hình Chung */}
      <SettingsTabsNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        departmentsCount={departments.length}
        positionsCount={positions.length}
      />

      {/* 3. Nội Dung Chi Tiết Theo Tab Đang Chọn */}
      {activeTab === 'GENERAL_LEGAL' && (
        <GeneralLegalSettings
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          onSave={handleSaveGeneralSettings}
          isSaving={savingSection === 'GENERAL_LEGAL'}
          canConfigureWebapp={canConfigureWebapp}
        />
      )}

      {activeTab === 'GENERAL_ORG' && (
        <OrganizationSettings
          departments={departments}
          positions={positions}
          onSaveDept={handleSaveDept}
          onDeleteDept={handleDeleteDept}
          onSavePos={handleSavePos}
          onDeletePos={handleDeletePos}
        />
      )}

      {activeTab === 'GENERAL_MODULES' && (
        <ModuleActivationSettings
          modulesList={modulesList}
          onToggleStatus={handleToggleModuleStatus}
          canToggleModules={canToggleModules}
        />
      )}

      {activeTab === 'GENERAL_PERMISSIONS' && (
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
    </div>
  );
};

export default AdminSettingsContainer;

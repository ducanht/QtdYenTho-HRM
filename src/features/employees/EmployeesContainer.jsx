import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEPARTMENTS as FALLBACK_DEPARTMENTS } from '../../lib/constants';
import { 
  subscribeEmployees, 
  subscribeWorkHistory, 
  subscribeEmployeeTraining, 
  subscribeDepartments,
  subscribePositions,
  subscribeSubsystemConfig,
  saveSubsystemConfig,
  subscribeEmployeeDegrees,
  subscribeEmployeeSocials,
  subscribeEmployeeContracts,
  subscribeContractAnnexes
} from '../../lib/services';
import { DEFAULT_POSITIONS } from '../../lib/systemDefaults';
import { getOfficialStaff } from '../../lib/evaluationUtils';
import Spinner from '../../components/common/Spinner';

// Navigation & Sidebar
import HRModuleTabsNav from './components/HRModuleTabsNav';
import HRBottomNav from './components/HRBottomNav';
import EmployeeMasterSidebar from './components/EmployeeMasterSidebar';
import EmployeeDirectoryTab from './components/EmployeeDirectoryTab';

// Tab Detail Views
import EmployeeProfileDetail from './components/EmployeeProfileDetail';
import EmployeeOverviewTab from './components/EmployeeOverviewTab';
import EmployeeContractHistoryTab from './components/EmployeeContractHistoryTab';
import EmployeeTrainingTab from './components/EmployeeTrainingTab';
import EmployeeSettingsTab from './components/EmployeeSettingsTab';

// Modals
import EmployeeFormModal from './components/EmployeeFormModal';
import TransferDecisionModal from './components/TransferDecisionModal';
import AddTrainingModal from './components/AddTrainingModal';
import EmployeeA4PrintModal from './components/EmployeeA4PrintModal';
import OverviewDisplayConfigModal, { DEFAULT_OVERVIEW_DISPLAY_CONFIG } from './components/OverviewDisplayConfigModal';
import QuickSelectEmployeeModal from './components/QuickSelectEmployeeModal';
import { ArrowLeft, Users, User } from 'lucide-react';

/**
 * EmployeesContainer: Bộ điều phối chính Phân hệ Quản trị Nhân sự
 * - Phân tầng rõ ràng: Menu Trên (Cấp Quản Trị Toàn Quỹ) vs Menu Dưới (Hồ Sơ Cán Bộ Chi Tiết)
 * - Tách biệt Master - Detail trên Mobile: Không để danh sách 20-30 cán bộ đè lên trên hồ sơ
 * - 100% thời gian thực từ Cloud Firestore, tuân thủ nghiêm ngặt chuẩn Quỹ TDND Yên Thọ
 */
const EmployeesContainer = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Dữ liệu Realtime Firestore
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);
  const [workHistory, setWorkHistory] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [socials, setSocials] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [contractAnnexes, setContractAnnexes] = useState([]);
  const [hrConfig, setHrConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phân quyền Quản trị: HĐQT, Giám đốc, SuperAdmin
  const canManage = useMemo(() => {
    if (!currentUser) return false;
    const r = (role || currentUser.role || '').toLowerCase();
    const email = (currentUser.email || '').toLowerCase();
    return (
      r === 'admin' ||
      r === 'superadmin' ||
      r === 'manager' ||
      r === 'chairman' ||
      r === 'director' ||
      r === 'board' ||
      email === 'qtdyentho@gmail.com' ||
      email === 'ducanht@gmail.com' ||
      email === 'sonqtdyt@gmail.com' ||
      email.includes('admin') ||
      email.includes('chutich') ||
      email.includes('giamdoc') ||
      email.includes('hdqt') ||
      email.includes('vuhien') ||
      email.includes('thao')
    );
  }, [currentUser, role]);

  // Bộ lọc tìm kiếm Cán bộ Sidebar
  const [searchTerm, setSearchTerm] = useState('');

  // URL State Sync
  const urlTab = searchParams.get('tab') || (searchParams.get('empId') ? 'PROFILE' : 'OVERVIEW');
  const urlEmpId = searchParams.get('empId') || '';

  const [activeTab, setActiveTabState] = useState(urlTab);
  const [selectedEmpId, setSelectedEmpIdState] = useState(urlEmpId);

  // Modal đổi nhanh cán bộ trên Mobile
  const [isQuickSelectModalOpen, setIsQuickSelectModalOpen] = useState(false);

  // Cấu hình hiển thị màn hình Tổng quan
  const [isDisplayConfigModalOpen, setIsDisplayConfigModalOpen] = useState(false);

  const overviewDisplayConfig = useMemo(() => {
    let localSaved = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('qtd_hrm_overview_display_config');
        if (raw) localSaved = JSON.parse(raw);
      } catch {
        // bỏ qua lỗi đọc storage
      }
    }
    return localSaved || hrConfig?.overviewDisplayConfig || DEFAULT_OVERVIEW_DISPLAY_CONFIG;
  }, [hrConfig?.overviewDisplayConfig]);

  const handleSaveDisplayConfig = useCallback(async (newConfig) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('qtd_hrm_overview_display_config', JSON.stringify(newConfig));
      }
      if (canManage) {
        await saveSubsystemConfig('hr', {
          overviewDisplayConfig: newConfig,
        });
      }
      setHrConfig((prev) => ({
        ...(prev || {}),
        overviewDisplayConfig: newConfig,
      }));
    } catch (err) {
      console.error('Lỗi lưu cấu hình hiển thị:', err);
    }
  }, [canManage]);

  const handleSelectEmployeeForProfile = useCallback((empId) => {
    setSelectedEmpIdState(empId);
    setActiveTabState('PROFILE');
  }, []);

  // Chặn truy cập tab SETTINGS nếu không có quyền
  useEffect(() => {
    if (activeTab === 'SETTINGS' && !canManage) {
      setActiveTabState('OVERVIEW');
    }
  }, [activeTab, canManage]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalData, setFormModalData] = useState(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetEmp, setTransferTargetEmp] = useState(null);

  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);
  const [trainingTargetEmp, setTrainingTargetEmp] = useState(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetEmp, setPrintTargetEmp] = useState(null);

  // Danh bạ cán bộ chính thức (loại trừ tài khoản root)
  const officialEmployees = useMemo(() => {
    return getOfficialStaff(employees);
  }, [employees]);

  // Danh bạ được phép xem theo cấu hình và phân quyền
  const viewableEmployees = useMemo(() => {
    if (canManage || hrConfig?.allowStaffViewDirectory !== false) {
      return officialEmployees;
    }
    const me = officialEmployees.find(
      (e) => e.id === currentUser?.uid || e.email === currentUser?.email
    );
    return me ? [me] : officialEmployees;
  }, [officialEmployees, canManage, hrConfig?.allowStaffViewDirectory, currentUser]);

  // Tự động chọn cán bộ mặc định nếu chưa chọn
  useEffect(() => {
    if (viewableEmployees.length > 0) {
      if (!selectedEmpId || !viewableEmployees.some((e) => e.id === selectedEmpId)) {
        const me = viewableEmployees.find(
          (e) => e.id === currentUser?.uid || e.email === currentUser?.email
        );
        const defaultId = me ? me.id : viewableEmployees[0].id;
        setSelectedEmpIdState(defaultId);
      }
    }
  }, [viewableEmployees, selectedEmpId, currentUser]);

  // Đồng bộ State -> URL
  useEffect(() => {
    const curTab = searchParams.get('tab') || (searchParams.get('empId') ? 'PROFILE' : 'OVERVIEW');
    const curEmpId = searchParams.get('empId') || '';

    const tabChanged = activeTab && activeTab !== curTab;
    const empChanged = selectedEmpId && selectedEmpId !== curEmpId;

    if (tabChanged || empChanged) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (activeTab && activeTab !== 'OVERVIEW') {
            next.set('tab', activeTab);
          } else {
            next.delete('tab');
          }
          if (selectedEmpId && activeTab === 'PROFILE') {
            next.set('empId', selectedEmpId);
          } else {
            next.delete('empId');
          }
          return next;
        },
        { replace: true }
      );
    }
  }, [activeTab, selectedEmpId, searchParams, setSearchParams]);

  // Đồng bộ URL -> State (Back/Forward)
  useEffect(() => {
    const curTab = searchParams.get('tab') || (searchParams.get('empId') ? 'PROFILE' : 'OVERVIEW');
    const curEmpId = searchParams.get('empId') || '';
    if (curTab !== activeTab) {
      setActiveTabState(curTab);
    }
    if (curEmpId && curEmpId !== selectedEmpId) {
      setSelectedEmpIdState(curEmpId);
    }
  }, [searchParams]);

  // Lắng nghe dữ liệu thời gian thực Firestore
  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      setEmployees(list || []);
      setLoading(false);
    });

    const unsubDept = subscribeDepartments((list) => {
      if (list && list.length > 0) {
        setDepartments(list.map((d) => d.name));
      } else {
        setDepartments(FALLBACK_DEPARTMENTS);
      }
    });

    const unsubPos = subscribePositions((list) => {
      if (list && list.length > 0) {
        setPositions(list);
      } else {
        setPositions(DEFAULT_POSITIONS);
      }
    });

    const unsubConfig = subscribeSubsystemConfig('hr', (cfg) => {
      setHrConfig(cfg || null);
    });

    return () => {
      unsubEmp();
      unsubDept();
      unsubPos();
      unsubConfig();
    };
  }, []);

  // Cán bộ đang được chọn xem chi tiết
  const currentEmp = useMemo(() => {
    return viewableEmployees.find((e) => e.id === selectedEmpId) || viewableEmployees[0] || null;
  }, [viewableEmployees, selectedEmpId]);

  // On-Demand Subscriptions: Chỉ nạp Quá trình công tác, Bằng cấp, Hợp đồng của cá nhân đang xem chi tiết
  useEffect(() => {
    const targetEmpId = currentEmp?.id;
    if (!targetEmpId) {
      setWorkHistory([]);
      setTrainings([]);
      setDegrees([]);
      setSocials([]);
      setContracts([]);
      setContractAnnexes([]);
      return;
    }

    const unsubWork = subscribeWorkHistory(targetEmpId, (list) => {
      setWorkHistory(list || []);
    });

    const unsubTrain = subscribeEmployeeTraining(targetEmpId, (list) => {
      setTrainings(list || []);
    });

    const unsubDegrees = subscribeEmployeeDegrees(targetEmpId, (list) => {
      setDegrees(list || []);
    });

    const unsubSocials = subscribeEmployeeSocials(targetEmpId, (list) => {
      setSocials(list || []);
    });

    const unsubContracts = subscribeEmployeeContracts(targetEmpId, (list) => {
      setContracts(list || []);
    });

    const unsubAnnexes = subscribeContractAnnexes(targetEmpId, (list) => {
      setContractAnnexes(list || []);
    });

    return () => {
      unsubWork();
      unsubTrain();
      unsubDegrees();
      unsubSocials();
      unsubContracts();
      unsubAnnexes();
    };
  }, [currentEmp?.id]);

  // Handlers mở modal
  const handleOpenAdd = useCallback(() => {
    setFormModalData(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((emp) => {
    setFormModalData(emp);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenTransfer = useCallback((emp) => {
    setTransferTargetEmp(emp);
    setIsTransferModalOpen(true);
  }, []);

  const handleOpenAddTraining = useCallback((emp) => {
    setTrainingTargetEmp(emp);
    setIsAddTrainingOpen(true);
  }, []);

  const handleOpenPrint = useCallback((emp) => {
    setPrintTargetEmp(emp);
    setIsPrintModalOpen(true);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6 animate-in fade-in duration-200">
      {/* 1. Menu Quản Trị Cấp Toàn Quỹ trên Desktop / iPad */}
      <HRModuleTabsNav
        activeTab={activeTab}
        onChangeTab={setActiveTabState}
        canManage={canManage}
      />

      {/* 2. Loading Spinner */}
      {loading && employees.length === 0 ? (
        <div className="py-24 flex justify-center items-center">
          <Spinner text="Đang đồng bộ hồ sơ cán bộ từ cơ sở dữ liệu Cloud Firestore..." />
        </div>
      ) : (
        /* 3. Phân Phối Giao Diện Theo Từng Mục Quản Trị */
        <div>
          {/* TAB 1: TỔNG QUAN NHÂN SỰ TOÀN QUỸ */}
          {activeTab === 'OVERVIEW' && (
            <EmployeeOverviewTab
              employees={viewableEmployees}
              departments={departments}
              degrees={degrees}
              contracts={contracts}
              hrConfig={hrConfig}
              overviewDisplayConfig={overviewDisplayConfig}
              onOpenDisplayConfigModal={() => setIsDisplayConfigModalOpen(true)}
              onSelectEmployeeForProfile={handleSelectEmployeeForProfile}
            />
          )}

          {/* TAB 2: DANH BẠ CÁN BỘ TOÀN QUỸ */}
          {activeTab === 'DIRECTORY' && (
            <EmployeeDirectoryTab
              employees={viewableEmployees}
              departments={departments}
              selectedEmployeeId={selectedEmpId}
              onSelectEmployee={handleSelectEmployeeForProfile}
              onOpenAddModal={handleOpenAdd}
              canManage={canManage}
              hrConfig={hrConfig}
            />
          )}

          {/* TAB 3: HỒ SƠ CÁN BỘ CHI TIẾT (Decoupled Master-Detail) */}
          {activeTab === 'PROFILE' && (
            <div>
              {/* TRÊN MOBILE: Ẩn hoàn toàn danh sách 20-30 cán bộ đè lên trên hồ sơ */}
              <div className="block lg:hidden space-y-3 mb-3.5">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTabState('DIRECTORY')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95"
                    title="Quay lại danh bạ cán bộ"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Danh bạ cán bộ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQuickSelectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95"
                    title="Đổi nhanh sang cán bộ khác"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Đổi cán bộ</span>
                  </button>
                </div>
              </div>

              {/* BỐ CỤC MASTER - DETAIL TRÊN DESKTOP */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* CỘT TRÁI (MASTER): Danh sách Cán bộ (Chỉ hiển thị trên màn hình lớn Desktop) */}
                <div 
                  id="employee-master-sidebar"
                  className="hidden lg:block lg:col-span-4 xl:col-span-4"
                >
                  <EmployeeMasterSidebar
                    employees={viewableEmployees}
                    selectedEmployeeId={selectedEmpId}
                    onSelectEmployee={(empId) => {
                      setSelectedEmpIdState(empId);
                    }}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    hrConfig={hrConfig}
                    onOpenAddModal={handleOpenAdd}
                    canManage={canManage}
                  />
                </div>

                {/* CỘT PHẢI (DETAIL): Hồ Sơ Chi Tiết 4 Tab Của Cán Bộ Được Chọn */}
                <div id="employee-detail-panel" className="lg:col-span-8 xl:col-span-8">
                  <EmployeeProfileDetail
                    emp={currentEmp}
                    onOpenEdit={handleOpenEdit}
                    onOpenPrint={handleOpenPrint}
                    onDeleteSuccess={(deletedId) => {
                      const remaining = viewableEmployees.filter((e) => e.id !== deletedId);
                      if (remaining.length > 0) {
                        setSelectedEmpIdState(remaining[0].id);
                      } else {
                        setActiveTabState('DIRECTORY');
                      }
                    }}
                    workHistory={workHistory}
                    trainings={trainings}
                    degrees={degrees}
                    socials={socials}
                    canManage={canManage}
                    hrConfig={hrConfig}
                    departments={departments}
                    positions={positions}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CẤU HÌNH & PHÂN QUYỀN PHÂN HỆ */}
          {activeTab === 'SETTINGS' && canManage && (
            <EmployeeSettingsTab
              departments={departments}
              positions={positions}
              hrConfig={hrConfig}
              canManage={canManage}
            />
          )}

          {/* CÁC TAB TƯƠNG THÍCH NGƯỢC (CONTRACTS, TRAINING) NẾU ĐƯỢC GỌI TỪ URL CŨ */}
          {(activeTab === 'CONTRACTS' || activeTab === 'TRANSFERS') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="hidden lg:block lg:col-span-4">
                <EmployeeMasterSidebar
                  employees={viewableEmployees}
                  selectedEmployeeId={selectedEmpId}
                  onSelectEmployee={(empId) => setSelectedEmpIdState(empId)}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  hrConfig={hrConfig}
                  onOpenAddModal={handleOpenAdd}
                  canManage={canManage}
                />
              </div>
              <div className="lg:col-span-8">
                <EmployeeContractHistoryTab
                  emp={currentEmp}
                  contracts={contracts}
                  contractAnnexes={contractAnnexes}
                  workHistory={workHistory}
                  hrConfig={hrConfig}
                  departments={departments}
                  positions={positions}
                  canManage={canManage}
                />
              </div>
            </div>
          )}

          {activeTab === 'TRAINING' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="hidden lg:block lg:col-span-4">
                <EmployeeMasterSidebar
                  employees={viewableEmployees}
                  selectedEmployeeId={selectedEmpId}
                  onSelectEmployee={(empId) => setSelectedEmpIdState(empId)}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  hrConfig={hrConfig}
                  onOpenAddModal={handleOpenAdd}
                  canManage={canManage}
                />
              </div>
              <div className="lg:col-span-8">
                <EmployeeTrainingTab
                  emp={currentEmp}
                  trainings={trainings}
                  onOpenAddTraining={handleOpenAddTraining}
                  canManage={canManage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Thanh Bottom Navigation cố định dưới đáy Mobile */}
      <HRBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTabState}
        canManage={canManage}
      />

      {/* 5. Modal Đổi Nhanh Cán Bộ (Mobile & Tablet) */}
      {isQuickSelectModalOpen && (
        <QuickSelectEmployeeModal
          isOpen={isQuickSelectModalOpen}
          onClose={() => setIsQuickSelectModalOpen(false)}
          employees={viewableEmployees}
          selectedEmployeeId={selectedEmpId}
          onSelectEmployee={(empId) => {
            setSelectedEmpIdState(empId);
            setActiveTabState('PROFILE');
          }}
        />
      )}

      {/* 6. Các Modal Nghiệp Vụ */}
      {isFormModalOpen && (
        <EmployeeFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          initialData={formModalData}
          departments={departments}
          positions={positions}
          existingEmployees={officialEmployees}
          hrConfig={hrConfig}
          degrees={degrees}
          socials={socials}
          workHistory={workHistory}
          onSuccess={(saved) => {
            if (saved) {
              setEmployees((prev) => {
                const idx = prev.findIndex((e) => e.id === saved.id || (saved.code && e.code === saved.code));
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], ...saved };
                  return copy;
                }
                return [...prev, saved];
              });
            }
          }}
        />
      )}

      {isTransferModalOpen && (
        <TransferDecisionModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          selectedEmp={transferTargetEmp || currentEmp}
          employees={officialEmployees}
          departments={departments}
          positions={positions}
          hrConfig={hrConfig}
          onSuccess={() => {}}
        />
      )}

      {isAddTrainingOpen && (
        <AddTrainingModal
          isOpen={isAddTrainingOpen}
          onClose={() => setIsAddTrainingOpen(false)}
          selectedEmp={trainingTargetEmp || currentEmp}
          onSuccess={() => {}}
        />
      )}

      {isPrintModalOpen && (
        <EmployeeA4PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          emp={printTargetEmp || currentEmp}
          workHistory={workHistory}
          trainings={trainings}
          degrees={degrees}
          socials={socials}
        />
      )}

      {isDisplayConfigModalOpen && (
        <OverviewDisplayConfigModal
          isOpen={isDisplayConfigModalOpen}
          onClose={() => setIsDisplayConfigModalOpen(false)}
          config={overviewDisplayConfig}
          onSaveConfig={handleSaveDisplayConfig}
        />
      )}
    </div>
  );
};

export default React.memo(EmployeesContainer);

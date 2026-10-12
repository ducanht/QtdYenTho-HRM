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
  subscribeEmployeeDegrees,
  subscribeEmployeeSocials
} from '../../lib/services';
import { DEFAULT_POSITIONS } from '../../lib/systemDefaults';
import { getOfficialStaff } from '../../lib/evaluationUtils';
import Spinner from '../../components/common/Spinner';

// Navigation & Sidebar
import HRModuleTabsNav from './components/HRModuleTabsNav';
import HRBottomNav from './components/HRBottomNav';
import EmployeeMasterSidebar from './components/EmployeeMasterSidebar';

// Tab Detail Views
import EmployeeProfileDetail from './components/EmployeeProfileDetail';
import EmployeeTransferHistory from './components/EmployeeTransferHistory';
import EmployeeTrainingTab from './components/EmployeeTrainingTab';
import EmployeeAnalyticsTab from './components/EmployeeAnalyticsTab';
import EmployeeSettingsTab from './components/EmployeeSettingsTab';

// Modals
import EmployeeFormModal from './components/EmployeeFormModal';
import TransferDecisionModal from './components/TransferDecisionModal';
import AddTrainingModal from './components/AddTrainingModal';
import EmployeeA4PrintModal from './components/EmployeeA4PrintModal';

/**
 * EmployeesContainer: Bộ điều phối chính Phân hệ Quản trị Nhân sự
 * - Bố cục Master - Detail iPad 2 phần (Cột trái 4/12, Cột phải 8/12)
 * - Tích hợp phân quyền & cấu hình phạm vi xem danh bạ (Toàn Quỹ vs Cá nhân)
 * - Không mock data, 100% thời gian thực từ Cloud Firestore
 * - Không dùng font-mono, không dùng từ ngữ mang tính AI
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
  const urlTab = searchParams.get('tab') || 'PROFILE';
  const urlEmpId = searchParams.get('empId') || '';

  const [activeTab, setActiveTabState] = useState(urlTab);
  const [selectedEmpId, setSelectedEmpIdState] = useState(urlEmpId);

  // Chặn truy cập tab SETTINGS nếu không có quyền
  useEffect(() => {
    if (activeTab === 'SETTINGS' && !canManage) {
      setActiveTabState('PROFILE');
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
    // Nếu ở chế độ bảo mật cá nhân: Cán bộ chỉ thấy hồ sơ của mình
    const me = officialEmployees.find(
      (e) => e.id === currentUser?.uid || e.email === currentUser?.email
    );
    return me ? [me] : officialEmployees;
  }, [officialEmployees, canManage, hrConfig?.allowStaffViewDirectory, currentUser]);

  // Tự động chọn cán bộ mặc định nếu chưa chọn
  useEffect(() => {
    if (viewableEmployees.length > 0) {
      if (!selectedEmpId || !viewableEmployees.some((e) => e.id === selectedEmpId)) {
        // Ưu tiên chọn tài khoản chính mình nếu thuộc danh bạ
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
    const curTab = searchParams.get('tab') || 'PROFILE';
    const curEmpId = searchParams.get('empId') || '';

    const tabChanged = activeTab && activeTab !== curTab;
    const empChanged = selectedEmpId && selectedEmpId !== curEmpId;

    if (tabChanged || empChanged) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (activeTab && activeTab !== 'PROFILE') {
            next.set('tab', activeTab);
          } else {
            next.delete('tab');
          }
          if (selectedEmpId) {
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
    const curTab = searchParams.get('tab') || 'PROFILE';
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

    const unsubWork = subscribeWorkHistory(null, (list) => {
      setWorkHistory(list || []);
    });

    const unsubTrain = subscribeEmployeeTraining(null, (list) => {
      setTrainings(list || []);
    });

    const unsubConfig = subscribeSubsystemConfig('hr', (cfg) => {
      setHrConfig(cfg || null);
    });

    const unsubDegrees = subscribeEmployeeDegrees(null, (list) => {
      setDegrees(list || []);
    });

    const unsubSocials = subscribeEmployeeSocials(null, (list) => {
      setSocials(list || []);
    });

    return () => {
      unsubEmp();
      unsubDept();
      unsubPos();
      unsubWork();
      unsubTrain();
      unsubConfig();
      unsubDegrees();
      unsubSocials();
    };
  }, []);

  // Cán bộ đang được chọn xem chi tiết
  const currentEmp = useMemo(() => {
    return viewableEmployees.find((e) => e.id === selectedEmpId) || viewableEmployees[0] || null;
  }, [viewableEmployees, selectedEmpId]);

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

  const handleSelectEmployeeForTransfer = useCallback((empId) => {
    setSelectedEmpIdState(empId);
    setActiveTabState('TRANSFERS');
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6 animate-in fade-in duration-200">
      {/* 1. Thanh Tab ngang chuyển nhanh trên Desktop/iPad */}
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
        /* 3. Bố cục Master - Detail iPad 2 phần */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER): Danh sách Cán bộ & Bộ lọc nhanh */}
          <div className="lg:col-span-4 xl:col-span-4">
            <EmployeeMasterSidebar
              employees={viewableEmployees}
              selectedEmployeeId={selectedEmpId}
              onSelectEmployee={setSelectedEmpIdState}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              hrConfig={hrConfig}
              onOpenAddModal={handleOpenAdd}
              canManage={canManage}
            />
          </div>

          {/* CỘT PHẢI (DETAIL): Nội dung chi tiết theo từng Tab */}
          <div className="lg:col-span-8 xl:col-span-8">
            {activeTab === 'PROFILE' && (
              <EmployeeProfileDetail
                emp={currentEmp}
                onOpenEdit={handleOpenEdit}
                onOpenPrint={handleOpenPrint}
                onDeleteSuccess={(deletedId) => {
                  const remaining = viewableEmployees.filter((e) => e.id !== deletedId);
                  if (remaining.length > 0) {
                    setSelectedEmpIdState(remaining[0].id);
                  }
                }}
                workHistory={workHistory}
                trainings={trainings}
                degrees={degrees}
                socials={socials}
                canManage={canManage}
                hrConfig={hrConfig}
              />
            )}

            {activeTab === 'TRANSFERS' && (
              <EmployeeTransferHistory
                emp={currentEmp}
                workHistory={workHistory}
                hrConfig={hrConfig}
                departments={departments}
                positions={positions}
                canManage={canManage}
              />
            )}

            {activeTab === 'TRAINING' && (
              <EmployeeTrainingTab
                emp={currentEmp}
                trainings={trainings}
                onOpenAddTraining={handleOpenAddTraining}
                canManage={canManage}
              />
            )}

            {activeTab === 'ANALYTICS' && (
              <EmployeeAnalyticsTab
                employees={viewableEmployees}
                departments={departments}
                degrees={degrees}
                hrConfig={hrConfig}
                onSelectEmployeeForTransfer={handleSelectEmployeeForTransfer}
              />
            )}

            {activeTab === 'SETTINGS' && canManage && (
              <EmployeeSettingsTab
                departments={departments}
                positions={positions}
                hrConfig={hrConfig}
                canManage={canManage}
              />
            )}
          </div>
        </div>
      )}

      {/* 4. Thanh Bottom Navigation cố định dưới đáy Mobile */}
      <HRBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTabState}
        canManage={canManage}
      />

      {/* 5. Các Modal Nghiệp Vụ */}
      {isFormModalOpen && (
        <EmployeeFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          initialData={formModalData}
          departments={departments}
          positions={positions}
          existingEmployees={officialEmployees}
          hrConfig={hrConfig}
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
    </div>
  );
};

export default React.memo(EmployeesContainer);

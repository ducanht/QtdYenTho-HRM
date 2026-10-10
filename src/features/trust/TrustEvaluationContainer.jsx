import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  subscribeTrustCriteria, 
  subscribeEmployees, 
  subscribeEvaluationPeriods, 
  subscribeTrustEvaluations,
  saveTrustEvaluation,
  saveEvaluationPeriod,
  deleteEvaluationPeriod,
  subscribeSubsystemConfig,
  saveSubsystemConfig,
  saveTrustCriterion,
  deleteTrustCriterion,
  subscribePeriodConfig,
  savePeriodConfig
} from '../../lib/services';
import { classifyTrustScore } from '../../lib/schema';
import { getEligibleTargetEmployees, isSystemAdminAccount } from '../../lib/evaluationUtils';
import { TRUST_CRITERIA_DEFAULT as DEFAULT_CRITERIA } from '../../lib/constants';
import { DEFAULT_MODULE_TRUST_SETTINGS } from '../../lib/systemDefaults';
import { 
  checkUserPermission, 
  TRUST_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../lib/permissions';

import PeriodMasterSidebar from './components/PeriodMasterSidebar';
import TrustModuleTabsNav from './components/TrustModuleTabsNav';
import DeletePeriodConfirmModal from './components/DeletePeriodConfirmModal';
import CriteriaTabsNav from './components/CriteriaTabsNav';
import CriteriaScoringTable from './components/CriteriaScoringTable';
import TrustProgressBanner from './components/TrustProgressBanner';
import MySubmittedSummary from './components/MySubmittedSummary';
import MySelfResults from './components/MySelfResults';
import TrustOverviewReport from './components/TrustOverviewReport';
import TrustPeriodModal from './components/TrustPeriodModal';
import TrustA4PrintModal from './components/TrustA4PrintModal';
import TrustBottomNav from './components/TrustBottomNav';

// Components Cấu hình & Phân quyền chuyên biệt của Phân hệ Tín nhiệm
import TrustCriteriaSettings from '../settings/components/subsystems/TrustCriteriaSettings';
import TrustPermissionsMatrix from '../settings/components/subsystems/TrustPermissionsMatrix';

/**
 * TrustEvaluationContainer: Bộ điều phối kiến trúc phân hệ Lấy phiếu Tín nhiệm
 * - Đảm bảo phân tầng Clean Architecture
 * - Bảng chấm xếp hàng liên tiếp theo tiêu chí (vần ABC / phòng ban, pick 1..10)
 * - Tuyệt đối không hiển thị điểm tổng khi chưa hoàn tất
 * - Phân quyền bảo mật: Cán bộ chỉ xem điểm cá nhân và phiếu mình đã chấm
 */
const TrustEvaluationContainer = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Dữ liệu thời gian thực Firestore
  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [globalCriteria, setGlobalCriteria] = useState(DEFAULT_CRITERIA);
  const [evaluations, setEvaluations] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Tab chức năng chính & Kỳ đánh giá: Lưu trữ đồng bộ 100% với searchParams để khôi phục chuẩn khi F5 hoặc Back
  const urlTab = searchParams.get('tab');
  const urlPeriodId = searchParams.get('periodId');

  const [selectedPeriodId, setSelectedPeriodIdState] = useState(urlPeriodId || '');
  const [activeTab, setActiveTabState] = useState(urlTab || 'SCORING');

  const setSelectedPeriodId = useCallback((idOrUpdater) => {
    setSelectedPeriodIdState((prev) => {
      const nextId = typeof idOrUpdater === 'function' ? idOrUpdater(prev) : idOrUpdater;
      setSearchParams((p) => {
        const nextParams = new URLSearchParams(p);
        if (nextId) {
          nextParams.set('periodId', nextId);
        } else {
          nextParams.delete('periodId');
        }
        return nextParams;
      }, { replace: true });
      return nextId;
    });
  }, [setSearchParams]);

  const setActiveTab = useCallback((tabOrUpdater) => {
    setActiveTabState((prev) => {
      const nextTab = typeof tabOrUpdater === 'function' ? tabOrUpdater(prev) : tabOrUpdater;
      setSearchParams((p) => {
        const nextParams = new URLSearchParams(p);
        if (nextTab) {
          nextParams.set('tab', nextTab);
        } else {
          nextParams.delete('tab');
        }
        return nextParams;
      }, { replace: true });
      return nextTab;
    });
  }, [setSearchParams]);

  // Đồng bộ URL -> State khi người dùng bấm nút Back/Forward của trình duyệt
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && currentTab !== activeTab) {
      setActiveTabState(currentTab);
    }
    const currentPid = searchParams.get('periodId');
    if (currentPid && currentPid !== selectedPeriodId) {
      setSelectedPeriodIdState(currentPid);
    }
  }, [searchParams, activeTab, selectedPeriodId]);

  // Chế độ xem tiêu chí: 'STEPPER' (từng tiêu chí một) | 'ALL' (toàn bộ 10 tiêu chí cuộn liên tục)
  const [viewMode, setViewMode] = useState('STEPPER');
  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);

  // Bộ lọc bảng chấm điểm
  const [searchTerm, setSearchTerm] = useState('');

  // Bảng điểm chấm: matrixScores[employeeId][criterionId] = score (số nguyên 1..10)
  const [matrixScores, setMatrixScores] = useState({});
  const [matrixNotes, setMatrixNotes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý Modal in A4 & Modal đợt Admin
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState(null);
  const [periodFormMode, setPeriodFormMode] = useState('CREATE');
  const [submittingPeriod, setSubmittingPeriod] = useState(false);
  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    year: 2026,
    quarter: 4,
    votingMode: 'ANONYMOUS',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    description: '',
    targetEmployeeIds: [],
    customCriteria: DEFAULT_CRITERIA,
  });

  // Quản lý Phân quyền theo ma trận RBAC Phân hệ Tín nhiệm
  const [trustPermissions, setTrustPermissions] = useState(DEFAULT_ROLE_PERMISSIONS.trust);
  const [trustConfig, setTrustConfig] = useState(DEFAULT_MODULE_TRUST_SETTINGS);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Cấu hình Riêng Biệt Cho Từng Đợt Đánh Giá (period_configs)
  const [currentPeriodConfig, setCurrentPeriodConfig] = useState(null);
  const [savingPeriodConfig, setSavingPeriodConfig] = useState(false);

  // Lắng nghe cấu hình độc lập của đợt đánh giá đang chọn
  useEffect(() => {
    if (!selectedPeriodId) {
      setCurrentPeriodConfig(null);
      return;
    }
    const unsub = subscribePeriodConfig(selectedPeriodId, (cfg) => {
      setCurrentPeriodConfig(cfg);
    });
    return () => unsub();
  }, [selectedPeriodId]);

  useEffect(() => {
    const unsubConfig = subscribeSubsystemConfig('trust', (cfg) => {
      if (cfg) {
        setTrustConfig((prev) => ({ ...prev, ...cfg }));
        if (cfg.permissions) {
          setTrustPermissions(cfg.permissions);
        }
      }
    });
    return () => unsubConfig();
  }, []);

  // Kiểm tra quyền hạn chuyên sâu từng thao tác
  const canManagePeriods = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.MANAGE_PERIODS, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canManageCriteria = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.MANAGE_CRITERIA, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canVote = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.VOTE, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canViewOwnResults = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.VIEW_OWN_RESULTS, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canViewSubmitted = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.VIEW_OWN_SUBMITTED, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canViewOverview = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.VIEW_AGGREGATE_REPORT, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  const canPrintReport = useMemo(() => {
    return checkUserPermission(currentUser, TRUST_PERMISSIONS.PRINT_OFFICIAL_REPORT, { trust: trustPermissions });
  }, [currentUser, trustPermissions]);

  // Tự động chuyển tab nếu người dùng không có quyền truy cập tab hiện tại
  useEffect(() => {
    if (activeTab === 'OVERVIEW' && !canViewOverview) {
      setActiveTab('SCORING');
    } else if (activeTab === 'CRITERIA_SETTINGS' && !canManageCriteria) {
      setActiveTab('SCORING');
    } else if (activeTab === 'PERMISSIONS_SETTINGS' && !(canManageCriteria || canManagePeriods)) {
      setActiveTab('SCORING');
    } else if (activeTab === 'SCORING' && !canVote) {
      setActiveTab(canViewOwnResults ? 'MY_RESULTS' : 'MY_VOTES');
    }
  }, [activeTab, canViewOverview, canManageCriteria, canManagePeriods, canVote, canViewOwnResults, setActiveTab]);

  // Handler: Lưu cấu hình tiêu chí & tham số phân hệ Tín nhiệm
  const handleSaveTrustConfig = async (newConfig) => {
    setSavingConfig(true);
    try {
      await saveSubsystemConfig('trust', {
        ...newConfig,
        permissions: trustPermissions,
      });
      toast.success('Đã lưu cấu hình tham số Tín nhiệm lên Firestore thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình tín nhiệm: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Handler: Thêm/Sửa tiêu chí tín nhiệm
  const handleSaveCriterion = async (critForm, editingCrit) => {
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

  // Handler: Xóa tiêu chí tín nhiệm
  const handleDeleteCriterion = async (code, title) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa tiêu chí [${title}] (${code})?`)) return;
    try {
      await deleteTrustCriterion(code);
      toast.success(`Đã xóa tiêu chí [${title}].`);
    } catch (err) {
      toast.error('Lỗi khi xóa tiêu chí: ' + err.message);
    }
  };

  // Handler: Lưu phân quyền chuyên biệt phân hệ Tín nhiệm
  const handleSaveTrustPermissions = async () => {
    setSavingPermissions(true);
    try {
      await saveSubsystemConfig('trust', {
        ...trustConfig,
        permissions: trustPermissions,
      });
      toast.success('Đã lưu phân quyền phân hệ Tín nhiệm lên Firestore thành công!');
    } catch (err) {
      toast.error('Lỗi lưu phân quyền tín nhiệm: ' + err.message);
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleResetTrustPermissions = () => {
    setTrustPermissions(DEFAULT_ROLE_PERMISSIONS.trust);
  };

  // 1. Subscribe Tiêu chí gốc
  useEffect(() => {
    const unsub = subscribeTrustCriteria((list) => {
      if (list && list.length > 0) setGlobalCriteria(list);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe Danh bạ Cán bộ
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      setEmployees(list || []);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe Đợt đánh giá
  useEffect(() => {
    const unsub = subscribeEvaluationPeriods((list) => {
      if (list && list.length > 0) {
        setPeriods(list);
        setSelectedPeriodId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          const active = list.find((p) => p.status === 'ACTIVE') || list[0];
          return active ? active.id : '';
        });
      }
    });
    return () => unsub();
  }, [setSelectedPeriodId]);

  // 4. Subscribe Phiếu đánh giá Real-time
  useEffect(() => {
    const unsub = subscribeTrustEvaluations((data) => {
      setEvaluations(data || []);
    });
    return () => unsub();
  }, []);

  // Thông tin Đợt hiện hành
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0] || null;
  }, [periods, selectedPeriodId]);

  // Bộ tiêu chí áp dụng cho Đợt (Ưu tiên cấu hình độc lập của đợt trong period_configs)
  const activeCriteria = useMemo(() => {
    if (
      currentPeriodConfig?.criteria &&
      Array.isArray(currentPeriodConfig.criteria) &&
      currentPeriodConfig.criteria.length > 0
    ) {
      return currentPeriodConfig.criteria;
    }
    if (
      currentPeriod?.customCriteria &&
      Array.isArray(currentPeriod.customCriteria) &&
      currentPeriod.customCriteria.length > 0
    ) {
      return currentPeriod.customCriteria;
    }
    return globalCriteria;
  }, [currentPeriodConfig, currentPeriod, globalCriteria]);

  // Thông tin Đợt hiện hành kết hợp đầy đủ cấu hình riêng biệt (Zero Config Loss)
  const effectivePeriod = useMemo(() => {
    if (!currentPeriod) return null;
    const cfg = currentPeriodConfig || {};
    return {
      ...currentPeriod,
      ...cfg,
      id: currentPeriod.id,
      name: cfg.periodName || cfg.name || currentPeriod.name,
      allowSelfEvaluation: cfg.allowSelfEvaluation ?? currentPeriod.allowSelfEvaluation ?? false,
      targetEmployeeIds:
        (Array.isArray(cfg.targetEmployeeIds) && cfg.targetEmployeeIds.length > 0)
          ? cfg.targetEmployeeIds
          : (Array.isArray(currentPeriod.targetEmployeeIds) && currentPeriod.targetEmployeeIds.length > 0)
            ? currentPeriod.targetEmployeeIds
            : [],
      voterEmployeeIds:
        (Array.isArray(cfg.voterEmployeeIds) && cfg.voterEmployeeIds.length > 0)
          ? cfg.voterEmployeeIds
          : (Array.isArray(currentPeriod.voterEmployeeIds) && currentPeriod.voterEmployeeIds.length > 0)
            ? currentPeriod.voterEmployeeIds
            : [],
      customCriteria: activeCriteria,
      thresholds: cfg.excellentThreshold !== undefined
        ? {
            excellent: cfg.excellentThreshold,
            excellentMinCrit: cfg.excellentMinCrit ?? 7,
            good: cfg.goodThreshold ?? 70,
            goodMinCrit: cfg.goodMinCrit ?? 5,
            pass: cfg.passThreshold ?? 50,
            weakVotesThresholdPercent: cfg.weakVotesThresholdPercent ?? 50,
          }
        : currentPeriod.thresholds,
    };
  }, [currentPeriod, currentPeriodConfig, activeCriteria]);

  // Tiêu chí hiện đang chọn ở chế độ Stepper
  const currentCriterion = useMemo(() => {
    return activeCriteria[activeCriterionIndex] || activeCriteria[0] || null;
  }, [activeCriteria, activeCriterionIndex]);

  // Danh sách cán bộ được lấy phiếu tín nhiệm (TUÂN THỦ 100% CẤU HÌNH ĐỢT & loại trừ bản thân nếu quy chế khóa)
  const evaluatableEmployees = useMemo(() => {
    if (!employees.length) return [];

    const targetIds =
      (Array.isArray(currentPeriodConfig?.targetEmployeeIds) && currentPeriodConfig.targetEmployeeIds.length > 0)
        ? currentPeriodConfig.targetEmployeeIds
        : (Array.isArray(currentPeriod?.targetEmployeeIds) && currentPeriod.targetEmployeeIds.length > 0)
          ? currentPeriod.targetEmployeeIds
          : null;

    // Luôn loại trừ tài khoản Quản trị hệ thống, tuân thủ đúng danh sách chuyên môn
    const pool = getEligibleTargetEmployees(employees, targetIds);

    const allowSelf =
      currentPeriodConfig?.allowSelfEvaluation ??
      currentPeriod?.allowSelfEvaluation ??
      false;

    return pool.filter((emp) => {
      if (allowSelf) return true;
      const isSelf =
        (currentUser?.id && emp.id === currentUser.id) ||
        (currentUser?.uid && emp.id === currentUser.uid) ||
        (currentUser?.email && emp.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser?.code && emp.code === currentUser.code);
      return !isSelf;
    });
  }, [employees, currentPeriodConfig, currentPeriod, currentUser]);

  // Kiểm tra cán bộ hiện tại có thuộc danh sách Cử tri được bỏ phiếu trong đợt này không
  const isEligibleVoter = useMemo(() => {
    if (!currentPeriod || !currentUser) return false;
    const voterIds = currentPeriodConfig?.voterEmployeeIds || currentPeriod?.voterEmployeeIds;
    // Nếu chưa cấu hình hoặc để trống -> Mặc định toàn bộ cán bộ được bỏ phiếu
    if (!Array.isArray(voterIds) || voterIds.length === 0) return true;
    const currentId = currentUser.id || currentUser.uid;
    const currentCode = currentUser.code;
    const currentEmail = currentUser.email?.toLowerCase();
    return employees.some(
      (emp) =>
        voterIds.includes(emp.id) &&
        (emp.id === currentId ||
          emp.uid === currentId ||
          (currentCode && emp.code === currentCode) ||
          (currentEmail && emp.email?.toLowerCase() === currentEmail))
    );
  }, [currentPeriod, currentPeriodConfig, currentUser, employees]);

  // Kiểm tra tình trạng nộp phiếu của người dùng hiện tại trong đợt này
  const userSubmissionInfo = useMemo(() => {
    if (!currentPeriod?.id || !currentUser) return null;
    const currentId = currentUser.uid || currentUser.id;
    const currentEmail = currentUser.email?.toLowerCase();
    const mySubmitted = evaluations.filter(
      (ev) =>
        ev.periodId === currentPeriod.id &&
        !ev.isDraft &&
        (ev.evaluatorId === currentId ||
          ev.evaluatorId === currentUser.id ||
          (currentEmail && ev.evaluatorEmail?.toLowerCase() === currentEmail))
    );
    if (!mySubmitted.length) return null;
    const sorted = [...mySubmitted].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    return {
      hasSubmitted: true,
      count: sorted.length,
      lastSubmittedAt: sorted[0]?.submittedAt || null,
    };
  }, [currentPeriod?.id, currentUser, evaluations]);

  const hasSubmitted = Boolean(userSubmissionInfo?.hasSubmitted);
  const submittedAt = userSubmissionInfo?.lastSubmittedAt;

  // Đếm ngược thời gian kết thúc đợt
  const timeRemainingBadge = useMemo(() => {
    if (!currentPeriod?.endDate) return null;
    const now = new Date();
    const end = new Date(currentPeriod.endDate + 'T23:59:59');
    const diffMs = end - now;
    if (diffMs < 0) {
      return { text: 'Đã hết hạn lấy phiếu', isExpired: true };
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return { text: `Còn ${days} ngày ${hours} giờ`, isExpired: false };
    }
    return { text: `Còn ${hours} giờ nữa`, isExpired: false, isUrgent: true };
  }, [currentPeriod?.endDate]);

  // Tải dữ liệu nháp (Local Draft) hoặc dữ liệu đã nộp cho Ma trận điểm khi đổi đợt
  useEffect(() => {
    if (!currentPeriod?.id || !evaluatableEmployees.length || !currentUser) return;

    const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
    let savedDraft = null;
    try {
      const draftStr = localStorage.getItem(draftKey);
      if (draftStr) savedDraft = JSON.parse(draftStr);
    } catch {
      // ignore parse error
    }

    // Lấy các phiếu đã nộp trước đó của người dùng trong đợt này
    const mySubmittedList = evaluations.filter(
      (ev) =>
        ev.periodId === currentPeriod.id &&
        (ev.evaluatorId === currentUser.uid ||
          ev.evaluatorId === currentUser.id ||
          ev.evaluatorEmail === currentUser.email)
    );

    const initialMatrix = {};
    const initialNotes = {};

    evaluatableEmployees.forEach((emp) => {
      initialMatrix[emp.id] = {};
      const foundSubmitted = mySubmittedList.find((ev) => ev.targetEmployeeId === emp.id);
      const foundDraft = savedDraft?.scores?.[emp.id];

      activeCriteria.forEach((crit) => {
        if (foundDraft?.[crit.id] !== undefined) {
          initialMatrix[emp.id][crit.id] = Number(foundDraft[crit.id]);
        } else if (foundSubmitted?.scores?.[crit.id] !== undefined) {
          initialMatrix[emp.id][crit.id] = Number(foundSubmitted.scores[crit.id]);
        }
      });

      if (foundDraft?.notes) {
        initialNotes[emp.id] = foundDraft.notes;
      } else if (foundSubmitted?.notes) {
        initialNotes[emp.id] = foundSubmitted.notes;
      }
    });

    setMatrixScores(initialMatrix);
    setMatrixNotes(initialNotes);
  }, [currentPeriod?.id, evaluatableEmployees.length, activeCriteria.length, currentUser?.uid]);

  // Cập nhật điểm cho 1 cán bộ ở 1 tiêu chí (Số nguyên 1..10) & TỰ ĐỘNG LƯU NGẦM
  const handleSetScore = useCallback((employeeId, criterionId, score) => {
    const intScore = Math.round(Number(score));
    if (isNaN(intScore) || intScore < 1 || intScore > 10) return;

    setMatrixScores((prev) => {
      const updated = {
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || {}),
          [criterionId]: intScore,
        },
      };

      // Tự động lưu ngầm vào localStorage ngay lập tức
      if (currentPeriod?.id && (currentUser?.uid || currentUser?.id)) {
        try {
          const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
          const existing = JSON.parse(localStorage.getItem(draftKey) || '{}');
          localStorage.setItem(draftKey, JSON.stringify({
            ...existing,
            scores: updated,
            updatedAt: new Date().toISOString(),
          }));
        } catch {
          // ignore
        }
      }

      return updated;
    });
  }, [currentPeriod?.id, currentUser]);

  // Cập nhật ghi chú cho 1 cán bộ & TỰ ĐỘNG LƯU NGẦM
  const handleSetNote = useCallback((employeeId, note) => {
    setMatrixNotes((prev) => {
      const updated = {
        ...prev,
        [employeeId]: note,
      };

      // Tự động lưu ngầm vào localStorage ngay lập tức
      if (currentPeriod?.id && (currentUser?.uid || currentUser?.id)) {
        try {
          const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
          const existing = JSON.parse(localStorage.getItem(draftKey) || '{}');
          localStorage.setItem(draftKey, JSON.stringify({
            ...existing,
            notes: updated,
            updatedAt: new Date().toISOString(),
          }));
        } catch {
          // ignore
        }
      }

      return updated;
    });
  }, [currentPeriod?.id, currentUser]);

  // Tính số lượng cán bộ đã chấm trên từng tiêu chí
  const completionByCriteria = useMemo(() => {
    const map = {};
    activeCriteria.forEach((c) => {
      map[c.id] = 0;
    });

    evaluatableEmployees.forEach((emp) => {
      const empScores = matrixScores[emp.id] || {};
      activeCriteria.forEach((c) => {
        if (empScores[c.id] !== undefined && empScores[c.id] !== null && empScores[c.id] > 0) {
          map[c.id] = (map[c.id] || 0) + 1;
        }
      });
    });

    return map;
  }, [activeCriteria, evaluatableEmployees, matrixScores]);

  // Số tiêu chí đã hoàn thành 100% cán bộ
  const completedCriteriaCount = useMemo(() => {
    if (!evaluatableEmployees.length) return 0;
    return activeCriteria.filter((c) => (completionByCriteria[c.id] || 0) >= evaluatableEmployees.length).length;
  }, [activeCriteria, completionByCriteria, evaluatableEmployees.length]);

  // Tính phần trăm hoàn thành tổng thể
  const overallPercent = useMemo(() => {
    const totalRequired = evaluatableEmployees.length * activeCriteria.length;
    if (totalRequired === 0) return 0;

    let scoredTotal = 0;
    evaluatableEmployees.forEach((emp) => {
      const empScores = matrixScores[emp.id] || {};
      activeCriteria.forEach((c) => {
        if (empScores[c.id] !== undefined && empScores[c.id] !== null && empScores[c.id] > 0) {
          scoredTotal += 1;
        }
      });
    });

    return Math.round((scoredTotal / totalRequired) * 100);
  }, [evaluatableEmployees, activeCriteria, matrixScores]);

  // Đã sẵn sàng nộp phiếu chính thức chưa? (Phải chấm đủ 100% và thuộc danh sách cử tri)
  const isFullyReadyToSubmit = useMemo(() => {
    return isEligibleVoter && overallPercent === 100 && evaluatableEmployees.length > 0;
  }, [isEligibleVoter, overallPercent, evaluatableEmployees.length]);

  // Nộp phiếu chính thức cho tất cả cán bộ (Chặn hoàn toàn nếu chưa hoàn thành hoặc không phải cử tri)
  const handleSubmitOfficial = async () => {
    if (!currentPeriod || !currentUser) return;

    if (!isEligibleVoter) {
      toast.error('Đồng chí không thuộc danh sách cử tri được chỉ định tham gia bỏ phiếu trong đợt này!');
      return;
    }

    if (!isFullyReadyToSubmit) {
      toast.error('Chưa hoàn thành toàn bộ đánh giá! Vui lòng chấm điểm đủ tất cả tiêu chí cho toàn bộ cán bộ trước khi nộp phiếu.');
      return;
    }


    // Kiểm tra soát lỗi kỹ càng từng cán bộ và từng tiêu chí
    for (const emp of evaluatableEmployees) {
      for (const crit of activeCriteria) {
        const val = matrixScores[emp.id]?.[crit.id];
        if (val === undefined || val === null || Number(val) <= 0) {
          toast.error(`Chưa chấm điểm cho cán bộ ${emp.name} ở tiêu chí [${crit.title || crit.code}].`);
          return;
        }
      }
    }

    const confirmSubmit = window.confirm(
      `Xác nhận nộp phiếu tín nhiệm chính thức cho ${evaluatableEmployees.length} cán bộ trong kỳ "${currentPeriod.name}"?\nSau khi nộp, phiếu sẽ được khóa chính thức vào cơ sở dữ liệu Quỹ.`
    );
    if (!confirmSubmit) return;

    setIsSubmitting(true);
    try {
      const isAnonymous = currentPeriod.votingMode === 'ANONYMOUS' || currentPeriod.votingMode === 'ANONYMOUS_ONLY';

      for (const emp of evaluatableEmployees) {
        const empScores = matrixScores[emp.id] || {};
        let totalScore = 0;
        activeCriteria.forEach((c) => {
          totalScore += Number(empScores[c.id]) || 0;
        });

        const classification = classifyTrustScore(totalScore);

        const payload = {
          periodId: currentPeriod.id,
          periodName: currentPeriod.name,
          votingMode: currentPeriod.votingMode,
          evaluatorId: currentUser.uid || currentUser.id,
          evaluatorName: currentUser.name,
          evaluatorEmail: currentUser.email || '',
          evaluatorDepartment: currentUser.department || '',
          evaluatorPosition: currentUser.position || '',
          targetEmployeeId: emp.id,
          targetEmployeeName: emp.name,
          targetDepartment: emp.department,
          targetPosition: emp.position,
          scores: empScores,
          totalScore,
          classification: classification.label,
          notes: matrixNotes[emp.id] || '',
          isAnonymous,
          isDraft: false,
          submittedAt: new Date().toISOString(),
        };

        await saveTrustEvaluation(payload);
      }

      // Xóa bản nháp sau khi đã nộp thành công
      const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
      localStorage.removeItem(draftKey);

      toast.success(`Đã nộp phiếu tín nhiệm cho ${evaluatableEmployees.length} cán bộ thành công!`);
      // Chuyển sang xem phiếu đã nộp
      setActiveTab('MY_VOTES');
    } catch (err) {
      console.error('Lỗi khi nộp phiếu tín nhiệm:', err);
      toast.error('Có lỗi xảy ra khi lưu phiếu tín nhiệm vào hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quản lý đợt đánh giá cho Admin
  const handleOpenCreatePeriod = () => {
    setPeriodFormMode('CREATE');
    setPeriodFormData({
      name: '',
      year: 2026,
      quarter: 4,
      votingMode: 'ANONYMOUS',
      allowSelfEvaluation: false,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
      voterEmployeeIds: employees.map((e) => e.id),
      targetEmployeeIds: getEligibleTargetEmployees(employees).map((e) => e.id),
      customCriteria: [...DEFAULT_CRITERIA],
    });
    setIsPeriodModalOpen(true);
  };

  const handleOpenEditPeriod = (period) => {
    setPeriodFormMode('EDIT');
    setPeriodFormData({
      id: period.id,
      name: period.name || '',
      year: period.year || 2026,
      quarter: period.quarter || 4,
      votingMode: period.votingMode || 'ANONYMOUS',
      allowSelfEvaluation: period.allowSelfEvaluation ?? false,
      status: period.status || 'ACTIVE',
      startDate: period.startDate || '',
      endDate: period.endDate || '',
      description: period.description || '',
      voterEmployeeIds: period.voterEmployeeIds || employees.map((e) => e.id),
      targetEmployeeIds: getEligibleTargetEmployees(employees, period.targetEmployeeIds).map((e) => e.id),
      customCriteria: period.customCriteria || [...DEFAULT_CRITERIA],
    });
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!periodFormData.name || !periodFormData.name.trim()) {
      toast.error('Vui lòng nhập tên đợt đánh giá tín nhiệm!');
      return;
    }
    setSubmittingPeriod(true);
    try {
      const periodId =
        periodFormMode === 'CREATE'
          ? (periodFormData.id || `PERIOD-${periodFormData.year || 2026}-Q${periodFormData.quarter || 4}-${Date.now().toString().slice(-4)}`)
          : periodFormData.id;

      const payload = {
        ...periodFormData,
        id: periodId,
        name: periodFormData.name.trim(),
        year: Number(periodFormData.year) || 2026,
        quarter: Number(periodFormData.quarter) || 4,
        votingMode: periodFormData.votingMode || 'ANONYMOUS',
        allowSelfEvaluation: Boolean(periodFormData.allowSelfEvaluation),
        status: periodFormData.status || 'ACTIVE',
        startDate: periodFormData.startDate || new Date().toISOString().split('T')[0],
        endDate: periodFormData.endDate || '',
        description: periodFormData.description || '',
        voterEmployeeIds: Array.isArray(periodFormData.voterEmployeeIds) ? periodFormData.voterEmployeeIds : employees.map((e) => e.id),
        targetEmployeeIds: Array.isArray(periodFormData.targetEmployeeIds) ? periodFormData.targetEmployeeIds : [],
        customCriteria: Array.isArray(periodFormData.customCriteria) ? periodFormData.customCriteria : [],
        updatedAt: new Date().toISOString(),
      };

      await saveEvaluationPeriod(periodId, payload);

      // Cập nhật lạc quan (Optimistic update) để giao diện phản ánh thay đổi tức thì 0ms
      setPeriods((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === periodId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...payload };
          return updated;
        } else {
          return [payload, ...prev];
        }
      });

      setSelectedPeriodId(periodId);
      setIsPeriodModalOpen(false);

      toast.success(
        periodFormMode === 'CREATE'
          ? `Đã tạo đợt lấy phiếu tín nhiệm "${payload.name}" thành công!`
          : `Đã cập nhật cấu hình đợt "${payload.name}" thành công!`
      );
    } catch (err) {
      console.error('Lỗi khi lưu đợt đánh giá tín nhiệm:', err);
      toast.error(`Có lỗi khi lưu đợt đánh giá: ${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId, periodName) => {
    try {
      await deleteEvaluationPeriod(periodId);
      toast.success(`Đã xóa đợt đánh giá "${periodName}" thành công.`);
      const remaining = periods.filter((p) => p.id !== periodId);
      setPeriods(remaining);
      if (remaining.length > 0) setSelectedPeriodId(remaining[0].id);
    } catch (err) {
      console.error('Lỗi khi xóa đợt đánh giá:', err);
      toast.error(`Lỗi khi xóa đợt đánh giá: ${err.message || 'Vui lòng thử lại'}`);
    }
  };

  // Handler: Lưu cấu hình riêng biệt cho từng đợt đánh giá (period_configs)
  const handleSavePeriodConfig = async (periodId, configData) => {
    setSavingPeriodConfig(true);
    try {
      await savePeriodConfig(periodId, configData);

      // Cập nhật lạc quan state periods trong RAM
      setPeriods((prev) =>
        prev.map((p) => {
          if (p.id !== periodId) return p;
          return {
            ...p,
            configId: periodId,
            votingMode: configData.votingMode,
            allowSelfEvaluation: configData.allowSelfEvaluation,
            voterEmployeeIds: configData.voterEmployeeIds,
            targetEmployeeIds: configData.targetEmployeeIds,
            customCriteria: configData.criteria,
            thresholds: {
              excellent: configData.excellentThreshold,
              excellentMinCrit: configData.excellentMinCrit,
              good: configData.goodThreshold,
              goodMinCrit: configData.goodMinCrit,
              pass: configData.passThreshold,
              weakVotesThresholdPercent: configData.weakVotesThresholdPercent,
            },
          };
        })
      );

      // Đồng bộ state cấu hình hiện hành
      setCurrentPeriodConfig({
        ...configData,
        id: periodId,
        periodId,
      });

      toast.success(`Đã lưu cấu hình riêng cho đợt "${currentPeriod?.name || periodId}" thành công!`);
    } catch (err) {

      console.error('Lỗi khi lưu cấu hình đợt:', err);
      toast.error(`Có lỗi khi lưu cấu hình đợt: ${err.message || 'Vui lòng thử lại'}`);
    } finally {
      setSavingPeriodConfig(false);
    }
  };

  // Dữ liệu bảng xếp hạng thực tế của đợt hiện hành phục vụ In A4 & Xuất báo cáo (Zero Mock Data)
  const fallbackRealLeaderboard = useMemo(() => {
    if (!currentPeriod || !employees.length) return [];

    const targetIds = currentPeriodConfig?.targetEmployeeIds || currentPeriod.targetEmployeeIds;
    const targetEmployees = getEligibleTargetEmployees(employees, targetIds);

    const empStatsMap = {};
    targetEmployees.forEach((emp) => {
      empStatsMap[emp.id] = {
        employee: emp,
        totalScoreSum: 0,
        count: 0,
        critSums: {},
        critCounts: {},
        votes: [],
      };
    });

    evaluations
      .filter((ev) => ev.periodId === currentPeriod.id && !ev.isDraft)
      .forEach((ev) => {
        if (empStatsMap[ev.targetEmployeeId]) {
          const score = ev.totalScore !== undefined ? Number(ev.totalScore) : 0;
          empStatsMap[ev.targetEmployeeId].totalScoreSum += score;
          empStatsMap[ev.targetEmployeeId].count += 1;
          empStatsMap[ev.targetEmployeeId].votes.push(ev);

          if (ev.scores && typeof ev.scores === 'object') {
            Object.entries(ev.scores).forEach(([critId, cScore]) => {
              const num = Number(cScore) || 0;
              empStatsMap[ev.targetEmployeeId].critSums[critId] =
                (empStatsMap[ev.targetEmployeeId].critSums[critId] || 0) + num;
              empStatsMap[ev.targetEmployeeId].critCounts[critId] =
                (empStatsMap[ev.targetEmployeeId].critCounts[critId] || 0) + 1;
            });
          }
        }
      });

    const effectiveThresholds = currentPeriodConfig?.excellentThreshold !== undefined
      ? {
          excellent: currentPeriodConfig.excellentThreshold,
          excellentMinCrit: currentPeriodConfig.excellentMinCrit ?? 7,
          good: currentPeriodConfig.goodThreshold ?? 70,
          goodMinCrit: currentPeriodConfig.goodMinCrit ?? 5,
          pass: currentPeriodConfig.passThreshold ?? 50,
          weakVotesThresholdPercent: currentPeriodConfig.weakVotesThresholdPercent ?? 50,
        }
      : currentPeriod?.thresholds;

    const list = Object.values(empStatsMap).map((item) => {
      const count = item.count;
      const avgScore100 = count > 0 ? Number((item.totalScoreSum / count).toFixed(1)) : 0;
      const avgScore10 = Number((avgScore100 / (activeCriteria.length || 10)).toFixed(1));

      const critAverages = activeCriteria.map((c) => {
        const cCnt = item.critCounts[c.id] || 0;
        return cCnt > 0 ? Number((item.critSums[c.id] / cCnt).toFixed(1)) : 0;
      });

      const classification = classifyTrustScore(avgScore100, {
        critAverages,
        votes: item.votes,
        thresholds: effectiveThresholds,
        evaluationsCount: count,
        votesCount: count,
      });

      return {
        id: item.employee.id,
        name: item.employee.name,
        code: item.employee.code,
        department: item.employee.department,
        position: item.employee.position,
        evaluationsCount: count,
        avgScore100,
        avgScore10,
        classification,
      };
    });

    list.sort((a, b) => {
      if (a.evaluationsCount === 0 && b.evaluationsCount > 0) return 1;
      if (a.evaluationsCount > 0 && b.evaluationsCount === 0) return -1;
      return b.avgScore100 - a.avgScore100;
    });

    return list;
  }, [currentPeriod, currentPeriodConfig, employees, evaluations, activeCriteria]);

  const [printModalData, setPrintModalData] = useState(null);

  const handleOpenPrintModal = useCallback((data) => {
    if (Array.isArray(data) && data.length > 0) {
      setPrintModalData({ periodId: selectedPeriodId, data });
    } else {
      setPrintModalData(null);
    }
    setIsPrintModalOpen(true);
  }, [selectedPeriodId]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6 animate-in fade-in duration-200">
      {/* 1. Thanh Menu Tab tinh gọn chuyển nhanh trên Desktop / iPad (Không còn Header rườm rà) */}
      <TrustModuleTabsNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canVote={canVote}
        canViewSubmitted={canViewSubmitted}
        canViewOwnResults={canViewOwnResults}
        canViewOverview={canViewOverview}
        canManageCriteria={canManageCriteria}
        canManagePeriods={canManagePeriods}
      />

      {/* 2. Nội dung theo từng Tab - 100% bố cục 2 phần kiểu iPad (Master - Detail) */}
      
      {/* Tab 1: ĐÁNH GIÁ (Bên trái: Chọn đợt - Bên phải: Bảng chấm điểm cán bộ) */}
      {activeTab === 'SCORING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER): Danh sách đợt đánh giá kèm bộ lọc năm */}
          <div className="lg:col-span-4 xl:col-span-3">
            <PeriodMasterSidebar
              periods={periods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={setSelectedPeriodId}
              title="Đợt Đánh Giá"
              badgeRenderer={(p) => {
                const mySubmitted = evaluations.filter(
                  (ev) =>
                    ev.periodId === p.id &&
                    (ev.evaluatorId === currentUser?.uid ||
                      ev.evaluatorId === currentUser?.id ||
                      ev.evaluatorEmail === currentUser?.email) &&
                    !ev.isDraft
                );
                if (mySubmitted.length > 0) {
                  return (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đã nộp ({mySubmitted.length})
                    </span>
                  );
                }
                if (p.id === selectedPeriodId && overallPercent > 0) {
                  return (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Tiến độ: {overallPercent}%
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] text-slate-400">
                    {p.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}
                  </span>
                );
              }}
            />
          </div>

          {/* CỘT PHẢI (DETAIL): Banner tiến độ & Bảng chấm điểm cán bộ hoặc Thông báo không thuộc cử tri */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {!isEligibleVoter ? (
              <div className="p-8 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-xl font-bold">
                  🛡️
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-amber-950">
                    Đồng chí không thuộc danh sách cử tri tham gia bỏ phiếu trong đợt này
                  </h3>
                  <p className="text-xs text-amber-800 max-w-lg mx-auto">
                    Theo quyết định ban hành đợt "{currentPeriod?.name || ''}", danh sách cử tri được chỉ định bỏ phiếu gồm{' '}
                    <strong className="underline">
                      {(currentPeriodConfig?.voterEmployeeIds || currentPeriod?.voterEmployeeIds || []).length} cán bộ
                    </strong>
                    . Nếu có thắc mắc, vui lòng liên hệ Ban Quản trị cơ quan.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Banner tiến độ chấm điểm (Ẩn hoàn toàn điểm tổng, Tự động lưu ngầm) */}
                <TrustProgressBanner
                  totalEmployeesCount={evaluatableEmployees.length}
                  completedCriteriaCount={completedCriteriaCount}
                  totalCriteriaCount={activeCriteria.length}
                  overallPercent={overallPercent}
                  isFullyReadyToSubmit={isFullyReadyToSubmit}
                  onSubmitOfficial={handleSubmitOfficial}
                  isSubmitting={isSubmitting}
                  hasSubmitted={hasSubmitted}
                  submittedAt={submittedAt}
                  onViewSubmittedVotes={() => setActiveTab('MY_VOTES')}
                />

                {/* Thanh chuyển nhanh 10 tiêu chí & Chế độ xem */}
                <CriteriaTabsNav
                  criteria={activeCriteria}
                  activeIndex={activeCriterionIndex}
                  onSelectIndex={setActiveCriterionIndex}
                  completionByCriteria={completionByCriteria}
                  totalEmployeesCount={evaluatableEmployees.length}
                  viewMode={viewMode}
                  onToggleViewMode={() => setViewMode((prev) => (prev === 'STEPPER' ? 'ALL' : 'STEPPER'))}
                />

                {/* Bảng chấm điểm cán bộ xếp hàng liên tiếp theo tiêu chí (pick chọn 1..10) */}
                {viewMode === 'STEPPER' ? (
                  <CriteriaScoringTable
                    criterion={currentCriterion}
                    criterionIndex={activeCriterionIndex}
                    employees={evaluatableEmployees}
                    scores={matrixScores}
                    notes={matrixNotes}
                    onSetScore={handleSetScore}
                    onSetNote={handleSetNote}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    showTitle={true}
                    currentUser={currentUser}
                  />
                ) : (
                  <div className="space-y-8">
                    {activeCriteria.map((crit, idx) => (
                      <CriteriaScoringTable
                        key={crit.id || idx}
                        criterion={crit}
                        criterionIndex={idx}
                        employees={evaluatableEmployees}
                        scores={matrixScores}
                        notes={matrixNotes}
                        onSetScore={handleSetScore}
                        onSetNote={handleSetNote}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        showTitle={true}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}


      {/* Tab 2: LỊCH SỬ (Bên trái: Chọn đợt - Bên phải: Phiếu cá nhân đã nộp) */}
      {activeTab === 'MY_VOTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER): Chọn đợt kèm số lượng phiếu đã nộp */}
          <div className="lg:col-span-4 xl:col-span-3">
            <PeriodMasterSidebar
              periods={periods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={setSelectedPeriodId}
              title="Đợt Đánh Giá"
              allowSelectAll={true}
              badgeRenderer={(p) => {
                const count = evaluations.filter(
                  (ev) =>
                    ev.periodId === p.id &&
                    (ev.evaluatorId === currentUser?.uid ||
                      ev.evaluatorId === currentUser?.id ||
                      ev.evaluatorEmail === currentUser?.email) &&
                    !ev.isDraft
                ).length;
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    count > 0
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-slate-400 bg-slate-100'
                  }`}>
                    {count > 0 ? `Đã nộp (${count})` : 'Chưa nộp'}
                  </span>
                );
              }}
            />
          </div>

          {/* CỘT PHẢI (DETAIL): Bảng danh sách phiếu cá nhân đã nộp */}
          <div className="lg:col-span-8 xl:col-span-9">
            <MySubmittedSummary
              evaluations={evaluations}
              currentUser={currentUser}
              currentPeriod={effectivePeriod}
              selectedPeriodId={selectedPeriodId}
              periods={periods}
              criteria={activeCriteria}
            />
          </div>
        </div>
      )}

      {/* Tab 3: CÁ NHÂN (Bên trái: Chọn đợt - Bên phải: Kết quả điểm tín nhiệm của mình) */}
      {activeTab === 'MY_RESULTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER): Chọn đợt */}
          <div className="lg:col-span-4 xl:col-span-3">
            <PeriodMasterSidebar
              periods={periods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={setSelectedPeriodId}
              title="Đợt Đánh Giá"
              badgeRenderer={(p) => (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'CLOSED'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  {p.status === 'CLOSED' ? 'Đã công bố' : 'Đang mở'}
                </span>
              )}
            />
          </div>

          {/* CỘT PHẢI (DETAIL): Kết quả tín nhiệm cá nhân */}
          <div className="lg:col-span-8 xl:col-span-9">
            <MySelfResults
              evaluations={evaluations}
              currentUser={currentUser}
              currentPeriod={effectivePeriod}
              criteria={activeCriteria}
            />
          </div>
        </div>
      )}

      {/* Tab 4: TỔNG QUAN (Bên trái: Chọn đợt + Quản trị đợt - Bên phải: Báo cáo & Xuất In) */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (MASTER): Chọn đợt & Thao tác đợt của Lãnh đạo */}
          <div className="lg:col-span-4 xl:col-span-3">
            <PeriodMasterSidebar
              periods={periods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={setSelectedPeriodId}
              title="Đợt Đánh Giá"
              showAdminControls={canManagePeriods}
              onOpenCreatePeriod={handleOpenCreatePeriod}
              onOpenEditPeriod={handleOpenEditPeriod}
              onDeletePeriodClick={(p) => setPeriodToDelete(p)}
              badgeRenderer={(p) => {
                const voterSet = new Set(
                  evaluations
                    .filter((ev) => ev.periodId === p.id && !ev.isDraft)
                    .map((ev) => ev.evaluatorId)
                );
                const percent = employees.length > 0 ? Math.round((voterSet.size / employees.length) * 100) : 0;
                return (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {percent}% cử tri
                  </span>
                );
              }}
            />
          </div>

          {/* CỘT PHẢI (DETAIL): Báo cáo tổng thể, Danh sách cử tri & Nút In A4, Xuất Excel */}
          <div className="lg:col-span-8 xl:col-span-9">
            <TrustOverviewReport
              evaluations={evaluations}
              employees={employees}
              currentPeriod={effectivePeriod}
              periodConfig={currentPeriodConfig}
              criteria={activeCriteria}
              isAdmin={canManagePeriods}
              onOpenPrintModal={handleOpenPrintModal}
            />
          </div>
        </div>
      )}

      {/* Tab 5: CẤU HÌNH (Bên trái: Chọn đợt - Bên phải: Cấu hình đợt + Nút Lưu) */}
      {activeTab === 'CRITERIA_SETTINGS' && (
        <TrustCriteriaSettings
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={setSelectedPeriodId}
          currentPeriod={currentPeriod}
          periodConfig={currentPeriodConfig}
          employees={employees}
          onSavePeriodConfig={handleSavePeriodConfig}
          isSaving={savingPeriodConfig}
          canManagePeriods={canManagePeriods}
          onOpenCreatePeriod={handleOpenCreatePeriod}
          onOpenEditPeriod={handleOpenEditPeriod}
          onDeletePeriod={(id, name) => {
            const p = periods.find((item) => item.id === id);
            setPeriodToDelete(p || { id, name });
          }}
          currentUser={currentUser}
        />
      )}

      {/* Tab 6: PHÂN QUYỀN (Ma trận Phân quyền RBAC chuyên biệt Phân hệ Tín nhiệm) */}
      {activeTab === 'PERMISSIONS_SETTINGS' && (
        <TrustPermissionsMatrix
          permissions={trustPermissions}
          onChangePermissions={(newPerms) => setTrustPermissions(newPerms)}
          onResetDefault={handleResetTrustPermissions}
          onSavePermissions={handleSaveTrustPermissions}
          isSaving={savingPermissions}
        />
      )}

      {/* 3. Modals quản lý đợt & in ấn */}
      <TrustPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        mode={periodFormMode}
        formData={periodFormData}
        setFormData={setPeriodFormData}
        onSave={handleSavePeriod}
        submitting={submittingPeriod}
        employees={employees}
      />

      <TrustA4PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        currentPeriod={effectivePeriod}
        leaderboard={
          (printModalData && currentPeriod?.id && printModalData.periodId === currentPeriod.id && Array.isArray(printModalData.data) && printModalData.data.length > 0)
            ? printModalData.data
            : fallbackRealLeaderboard
        }
      />

      {/* Modal bảo mật xác nhận xóa đợt đánh giá (Bắt buộc nhập mật khẩu quản trị) */}
      <DeletePeriodConfirmModal
        isOpen={Boolean(periodToDelete)}
        onClose={() => setPeriodToDelete(null)}
        period={periodToDelete}
        onConfirmDelete={handleDeletePeriod}
        currentUser={currentUser}
      />

      {/* 4. Bottom Navigation Menu (Chuyên dụng cho thiết bị di động - Truy cập nhanh 1 chạm) */}
      <TrustBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canVote={canVote}
        canViewSubmitted={canViewSubmitted}
        canViewOwnResults={canViewOwnResults}
        canViewOverview={canViewOverview}
        canManageCriteria={canManageCriteria}
        canManagePeriods={canManagePeriods}
      />
    </div>
  );
};

export default React.memo(TrustEvaluationContainer);

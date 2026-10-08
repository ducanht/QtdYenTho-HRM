import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  subscribeSubsystemConfig
} from '../../lib/services';
import { classifyTrustScore } from '../../lib/schema';
import { TRUST_CRITERIA_DEFAULT as DEFAULT_CRITERIA } from '../../lib/constants';
import { 
  checkUserPermission, 
  TRUST_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../lib/permissions';

import TrustActionBar from './components/TrustActionBar';
import CriteriaTabsNav from './components/CriteriaTabsNav';
import CriteriaScoringTable from './components/CriteriaScoringTable';
import TrustProgressBanner from './components/TrustProgressBanner';
import MySubmittedSummary from './components/MySubmittedSummary';
import MySelfResults from './components/MySelfResults';
import TrustOverviewReport from './components/TrustOverviewReport';
import TrustPeriodModal from './components/TrustPeriodModal';
import TrustA4PrintModal from './components/TrustA4PrintModal';

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

  // Kỳ đánh giá đang chọn
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  // Tab chức năng chính: 'SCORING' | 'MY_VOTES' | 'MY_RESULTS' | 'OVERVIEW'
  const [activeTab, setActiveTab] = useState('SCORING');

  // Chế độ xem tiêu chí: 'STEPPER' (từng tiêu chí một) | 'ALL' (toàn bộ 10 tiêu chí cuộn liên tục)
  const [viewMode, setViewMode] = useState('STEPPER');
  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);

  // Bộ lọc bảng chấm điểm
  const [sortBy, setSortBy] = useState('ABC'); // 'ABC' | 'DEPT'
  const [searchTerm, setSearchTerm] = useState('');

  // Bảng điểm chấm: matrixScores[employeeId][criterionId] = score (số nguyên 1..10)
  const [matrixScores, setMatrixScores] = useState({});
  const [matrixNotes, setMatrixNotes] = useState({});
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý Modal in A4 & Modal đợt Admin
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
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

  useEffect(() => {
    const unsubConfig = subscribeSubsystemConfig('trust', (cfg) => {
      if (cfg?.permissions) {
        setTrustPermissions(cfg.permissions);
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
    } else if (activeTab === 'SCORING' && !canVote) {
      setActiveTab(canViewOwnResults ? 'MY_RESULTS' : 'MY_VOTES');
    }
  }, [activeTab, canViewOverview, canVote, canViewOwnResults]);

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
  }, []);

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

  // Bộ tiêu chí áp dụng cho Đợt
  const activeCriteria = useMemo(() => {
    if (
      currentPeriod?.customCriteria &&
      Array.isArray(currentPeriod.customCriteria) &&
      currentPeriod.customCriteria.length > 0
    ) {
      return currentPeriod.customCriteria;
    }
    return globalCriteria;
  }, [currentPeriod, globalCriteria]);

  // Tiêu chí hiện đang chọn ở chế độ Stepper
  const currentCriterion = useMemo(() => {
    return activeCriteria[activeCriterionIndex] || activeCriteria[0] || null;
  }, [activeCriteria, activeCriterionIndex]);

  // Danh sách cán bộ được lấy phiếu tín nhiệm (LOẠI TRỪ 100% BẢN THÂN NGƯỜI ĐĂNG NHẬP)
  const evaluatableEmployees = useMemo(() => {
    if (!employees.length) return [];

    let pool = employees;
    if (
      currentPeriod?.targetEmployeeIds &&
      Array.isArray(currentPeriod.targetEmployeeIds) &&
      currentPeriod.targetEmployeeIds.length > 0
    ) {
      pool = employees.filter((e) => currentPeriod.targetEmployeeIds.includes(e.id));
    }

    return pool.filter((emp) => {
      const isSelf =
        (currentUser?.id && emp.id === currentUser.id) ||
        (currentUser?.uid && emp.id === currentUser.uid) ||
        (currentUser?.email && emp.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (currentUser?.code && emp.code === currentUser.code);
      return !isSelf;
    });
  }, [employees, currentPeriod, currentUser]);

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

  // Cập nhật điểm cho 1 cán bộ ở 1 tiêu chí (Số nguyên 1..10)
  const handleSetScore = useCallback((employeeId, criterionId, score) => {
    const intScore = Math.round(Number(score));
    if (isNaN(intScore) || intScore < 1 || intScore > 10) return;

    setMatrixScores((prev) => ({
      ...prev,
      [employeeId]: {
        ...(prev[employeeId] || {}),
        [criterionId]: intScore,
      },
    }));
  }, []);

  // Cập nhật ghi chú cho 1 cán bộ
  const handleSetNote = useCallback((employeeId, note) => {
    setMatrixNotes((prev) => ({
      ...prev,
      [employeeId]: note,
    }));
  }, []);

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

  // Đã sẵn sàng nộp phiếu chính thức chưa? (Phải chấm đủ 100%)
  const isFullyReadyToSubmit = useMemo(() => {
    return overallPercent === 100 && evaluatableEmployees.length > 0;
  }, [overallPercent, evaluatableEmployees.length]);

  // Lưu nháp (Local Draft)
  const handleSaveDraft = useCallback(() => {
    if (!currentPeriod?.id || !currentUser) return;
    setIsDraftSaving(true);
    try {
      const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
      const payload = {
        scores: matrixScores,
        notes: matrixNotes,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      toast.success('Đã lưu nháp kết quả chấm điểm tạm thời thành công!');
    } catch {
      toast.error('Không thể lưu nháp vào bộ nhớ trình duyệt.');
    } finally {
      setIsDraftSaving(false);
    }
  }, [currentPeriod?.id, currentUser, matrixScores, matrixNotes, toast]);

  // Nộp phiếu chính thức cho tất cả cán bộ
  const handleSubmitOfficial = async () => {
    if (!currentPeriod || !currentUser) return;

    if (!isFullyReadyToSubmit) {
      toast.error('Đồng chí vui lòng chấm đủ điểm từ 1 đến 10 cho toàn bộ cán bộ ở cả 10 tiêu chí trước khi nộp.');
      return;
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
          evaluatorName: isAnonymous ? 'Ẩn danh (Bỏ phiếu kín)' : currentUser.name,
          evaluatorEmail: isAnonymous ? '' : (currentUser.email || ''),
          targetEmployeeId: emp.id,
          targetEmployeeName: emp.name,
          targetDepartment: emp.department,
          targetPosition: emp.position,
          scores: empScores,
          totalScore,
          classification: classification.label,
          notes: matrixNotes[emp.id] || '',
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
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
      targetEmployeeIds: employees.map((e) => e.id),
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
      status: period.status || 'ACTIVE',
      startDate: period.startDate || '',
      endDate: period.endDate || '',
      description: period.description || '',
      targetEmployeeIds: period.targetEmployeeIds || employees.map((e) => e.id),
      customCriteria: period.customCriteria || [...DEFAULT_CRITERIA],
    });
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!periodFormData.name.trim()) {
      toast.error('Vui lòng nhập tên đợt đánh giá tín nhiệm!');
      return;
    }
    setSubmittingPeriod(true);
    try {
      const periodId =
        periodFormMode === 'CREATE'
          ? `PERIOD-${periodFormData.year}-Q${periodFormData.quarter}-${Date.now().toString().slice(-4)}`
          : periodFormData.id;

      await saveEvaluationPeriod(periodId, periodFormData);
      toast.success(
        periodFormMode === 'CREATE'
          ? `Đã tạo đợt lấy phiếu tín nhiệm "${periodFormData.name}" thành công!`
          : `Đã cập nhật cấu hình đợt "${periodFormData.name}"!`
      );
      setSelectedPeriodId(periodId);
      setIsPeriodModalOpen(false);
    } catch {
      toast.error('Có lỗi xảy ra khi lưu đợt đánh giá.');
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleDeletePeriod = async (periodId, periodName) => {
    if (!window.confirm(`Xác nhận xóa đợt đánh giá tín nhiệm: "${periodName}"?\nLưu ý: Không thể hoàn tác thao tác này!`)) {
      return;
    }
    try {
      await deleteEvaluationPeriod(periodId);
      toast.success(`Đã xóa đợt đánh giá "${periodName}" thành công.`);
      const remaining = periods.filter((p) => p.id !== periodId);
      if (remaining.length > 0) setSelectedPeriodId(remaining[0].id);
    } catch {
      toast.error('Lỗi khi xóa đợt đánh giá.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Thanh tác vụ chính: Chọn đợt, trạng thái, đếm ngược và các nút chức năng (KHÔNG lặp lại tên phân hệ) */}
      <TrustActionBar
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        onSelectPeriod={setSelectedPeriodId}
        currentPeriod={currentPeriod}
        timeRemainingBadge={timeRemainingBadge}
        canManagePeriods={canManagePeriods}
        canPrintReport={canPrintReport}
        canViewOverview={canViewOverview}
        canViewSubmitted={canViewSubmitted}
        canViewOwnResults={canViewOwnResults}
        canVote={canVote}
        currentUser={currentUser}
        onOpenCreatePeriod={handleOpenCreatePeriod}
        onOpenEditPeriod={handleOpenEditPeriod}
        onDeletePeriod={handleDeletePeriod}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 2. Nội dung theo từng Tab */}
      {activeTab === 'SCORING' && (
        <div className="space-y-6">
          {/* Banner tiến độ chấm điểm (Ẩn hoàn toàn điểm tổng) */}
          <TrustProgressBanner
            totalEmployeesCount={evaluatableEmployees.length}
            completedCriteriaCount={completedCriteriaCount}
            totalCriteriaCount={activeCriteria.length}
            overallPercent={overallPercent}
            isFullyReadyToSubmit={isFullyReadyToSubmit}
            onSaveDraft={handleSaveDraft}
            onSubmitOfficial={handleSubmitOfficial}
            isDraftSaving={isDraftSaving}
            isSubmitting={isSubmitting}
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

          {/* Bảng chấm điểm cán bộ xếp hàng liên tiếp theo tiêu chí (pick chọn 1..10, vần ABC) */}
          {viewMode === 'STEPPER' ? (
            <CriteriaScoringTable
              criterion={currentCriterion}
              criterionIndex={activeCriterionIndex}
              employees={evaluatableEmployees}
              scores={matrixScores}
              notes={matrixNotes}
              onSetScore={handleSetScore}
              onSetNote={handleSetNote}
              sortBy={sortBy}
              onChangeSortBy={setSortBy}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              showTitle={true}
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
                  sortBy={sortBy}
                  onChangeSortBy={setSortBy}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  showTitle={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Xem kết quả phiếu chính mình đã chấm cho đồng nghiệp */}
      {activeTab === 'MY_VOTES' && (
        <MySubmittedSummary
          evaluations={evaluations}
          currentUser={currentUser}
          currentPeriod={currentPeriod}
          criteria={activeCriteria}
        />
      )}

      {/* Tab 3: Xem điểm tín nhiệm cá nhân của bản thân sau khi hoàn tất */}
      {activeTab === 'MY_RESULTS' && (
        <MySelfResults
          evaluations={evaluations}
          currentUser={currentUser}
          currentPeriod={currentPeriod}
          criteria={activeCriteria}
        />
      )}

      {/* Tab 4: Báo cáo tổng quan toàn Quỹ */}
      {activeTab === 'OVERVIEW' && (
        <TrustOverviewReport
          evaluations={evaluations}
          employees={employees}
          currentPeriod={currentPeriod}
          criteria={activeCriteria}
          isAdmin={canManagePeriods}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
        />
      )}

      {/* 3. Modals */}
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
        currentPeriod={currentPeriod}
        leaderboard={evaluatableEmployees.map((emp) => {
          return {
            id: emp.id,
            name: emp.name,
            position: emp.position,
            department: emp.department,
            avgScore: 8.5,
            classification: 'Tốt',
          };
        })}
      />
    </div>
  );
};

export default React.memo(TrustEvaluationContainer);

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeEmployees,
  subscribeEvaluationPeriods,
  subscribeDepartments,
} from '../../lib/services';
import {
  subscribeKpiEvaluations,
  subscribeKpiCriteria,
  subscribeEmployeeKpiHistory,
  saveKpiStep1Self,
} from './services/kpiService';
import { ROLES } from '../../lib/constants';

// Shared Components
import KpiPeriodSelector from './components/shared/KpiPeriodSelector';
import KpiModuleTabsNav from './components/shared/KpiModuleTabsNav';
import KpiBottomNav from './components/shared/KpiBottomNav';
import KpiA4PrintModal from './components/shared/KpiA4PrintModal';

// Specific Tabs
import KpiOverviewTab from './components/overview/KpiOverviewTab';
import KpiScoringTab from './components/scoring/KpiScoringTab';
import KpiMyResultsTab from './components/results/KpiMyResultsTab';
import KpiHistoryTab from './components/history/KpiHistoryTab';
import KpiSettingsTab from './components/settings/KpiSettingsTab';

/**
 * KpiEvaluationContainer: Bộ điều phối trung tâm Phân Hệ Chấm Điểm KPI 3 Cấp
 * Quy trình đánh giá: Cán bộ tự chấm (40%) -> Trưởng bộ phận thẩm định (30%) -> HĐQT phê chuẩn (30%)
 * Đáp ứng đầy đủ 5 phân hệ chức năng:
 *  1. Tổng Quan HĐQT (KPI Overview & Tiến trình xét duyệt toàn đơn vị)
 *  2. Chấm Điểm 3 Cấp (Tự chấm, Thẩm định, Phê chuẩn, Khiếu nại)
 *  3. Kết Quả Cá Nhân (Chi tiết phiếu cá nhân, khiếu nại, in A4)
 *  4. Lịch Sử Đa Kỳ (Tra cứu toàn Quỹ & Visual timeline cá nhân)
 *  5. Cấu Hình & Tiêu Chí (Trọng số 40-30-30 & Danh mục tiêu chí động)
 */
const KpiEvaluationContainer = () => {
  const { currentUser, role, isManager, isChairman } = useAuth();
  const isAdmin = role === ROLES.ADMIN || role === 'SUPER_ADMIN';
  const toast = useToast();

  // Danh mục dữ liệu chính từ Firestore
  const [kpiList, setKpiList] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Kỳ đánh giá được chọn
  const [period, setPeriod] = useState('Quý III / 2026');

  // Điều phối Tab hiện tại: 'OVERVIEW' | 'SCORING' | 'MY_RESULTS' | 'HISTORY' | 'SETTINGS'
  const canAccessOverview = isChairman || isManager || isAdmin;
  const canAccessSettings = isChairman || isAdmin;

  const defaultTab = canAccessOverview ? 'OVERVIEW' : 'SCORING';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Form State Cấp 1
  const [submittingStep1, setSubmittingStep1] = useState(false);

  // Modal In Ấn Chuẩn A4
  const [printModalState, setPrintModalState] = useState({
    isOpen: false,
    mode: 'PERSONAL', // 'PERSONAL' | 'FUND_SUMMARY'
    personalData: null,
    fundList: [],
  });

  // Cấu hình tỷ trọng & xếp loại (Có thể lưu Firestore hoặc dùng mặc định chuẩn hóa)
  const [kpiSettings, setKpiSettings] = useState({
    self: 40,
    manager: 30,
    chairman: 30,
  });
  const [thresholds, setThresholds] = useState({
    excellent: 90,
    good: 75,
    pass: 60,
  });

  // 1. Lắng nghe danh sách Cán bộ nhân viên
  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      if (list) setEmployees(list);
    });
    return () => unsubEmp();
  }, []);

  // 2. Lắng nghe danh mục Phòng ban
  useEffect(() => {
    const unsubDept = subscribeDepartments((list) => {
      if (list) setDepartments(list);
    });
    return () => unsubDept();
  }, []);

  // 3. Lắng nghe các kỳ đánh giá động
  useEffect(() => {
    const unsubPeriods = subscribeEvaluationPeriods((list) => {
      if (list && list.length > 0) {
        setPeriods(list);
        const active = list.find((p) => p.status === 'ACTIVE') || list[0];
        if (active) {
          const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
          const activeCode =
            active.quarter && active.year
              ? `Quý ${roman[active.quarter] || active.quarter} / ${active.year}`
              : active.name;
          setPeriod((prev) => prev || activeCode);
        }
      }
    });
    return () => unsubPeriods();
  }, []);

  // 4. Lắng nghe danh sách phiếu KPI theo thời gian thực
  useEffect(() => {
    setLoading(true);
    const unsubKpi = subscribeKpiEvaluations((data) => {
      setKpiList(data || []);
      setLoading(false);
    });
    return () => unsubKpi();
  }, []);

  // 5. Lắng nghe danh mục tiêu chí đánh giá động (25 collections chuẩn hóa)
  useEffect(() => {
    const unsubCriteria = subscribeKpiCriteria((data) => {
      setCriteriaList(data || []);
    });
    return () => unsubCriteria();
  }, []);

  // 6. Lắng nghe lịch sử KPI đa kỳ (employee_kpi_history)
  useEffect(() => {
    const unsubHistory = subscribeEmployeeKpiHistory(null, (data) => {
      setHistoryList(data || []);
    });
    return () => unsubHistory();
  }, []);

  // Danh sách các kỳ đánh giá kết hợp từ evaluation_periods và dữ liệu thực tế
  const periodOptions = useMemo(() => {
    const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    const seen = new Set();
    const opts = [];

    periods.forEach((p) => {
      const code =
        p.quarter && p.year
          ? `Quý ${roman[p.quarter] || p.quarter} / ${p.year}`
          : p.name;
      if (code && !seen.has(code)) {
        seen.add(code);
        opts.push({
          value: code,
          label: `${code}${p.status === 'ACTIVE' ? ' (Đang diễn ra)' : ''}`,
          status: p.status,
        });
      }
    });

    kpiList.forEach((k) => {
      if (k.period && !seen.has(k.period)) {
        seen.add(k.period);
        opts.push({
          value: k.period,
          label: k.period,
          status: 'PAST',
        });
      }
    });

    if (opts.length === 0) {
      opts.push({ value: 'Quý III / 2026', label: 'Quý III / 2026 (Đang diễn ra)' });
    }

    return opts;
  }, [periods, kpiList]);

  // Phiếu KPI cá nhân của người dùng hiện tại trong kỳ đã chọn
  const myCurrentKpi = useMemo(() => {
    return kpiList.find(
      (k) =>
        (k.employeeId === currentUser?.id ||
          k.employeeId === currentUser?.uid ||
          k.employeeName === currentUser?.name) &&
        k.period === period
    );
  }, [kpiList, currentUser, period]);

  // Lịch sử cá nhân qua tất cả các kỳ
  const personalHistory = useMemo(() => {
    const uid = currentUser?.id || currentUser?.uid;
    const fromHistory = historyList.filter(
      (h) => h.employeeId === uid || h.employeeName === currentUser?.name
    );
    if (fromHistory.length > 0) return fromHistory;

    // Fallback từ kpiList nếu historyList chưa nạp xong
    return kpiList.filter(
      (k) => k.employeeId === uid || k.employeeName === currentUser?.name
    );
  }, [historyList, kpiList, currentUser]);

  // Tính toán số lượng cần xử lý cho từng vai trò (Pending Badges)
  const pendingCounts = useMemo(() => {
    const currentPeriodList = kpiList.filter((k) => !period || k.period === period);
    const chairmanCount = currentPeriodList.filter((k) => k.status === 'pending_chairman').length;
    const managerCount = currentPeriodList.filter((k) => k.status === 'pending_manager').length;
    const appealsCount = currentPeriodList.filter((k) => k.appealStatus === 'PENDING').length;
    const selfCount = myCurrentKpi ? 0 : 1;

    return {
      self: selfCount,
      manager: managerCount,
      chairman: chairmanCount,
      appeals: appealsCount,
    };
  }, [kpiList, period, myCurrentKpi]);

  // Tự động kiểm tra quyền hạn khi chuyển tab
  useEffect(() => {
    if (activeTab === 'OVERVIEW' && !canAccessOverview) {
      setActiveTab('SCORING');
    }
    if (activeTab === 'SETTINGS' && !canAccessSettings) {
      setActiveTab('SCORING');
    }
  }, [activeTab, canAccessOverview, canAccessSettings]);

  // Xử lý nộp phiếu Cấp 1 (Tự chấm)
  const handleSubmitStep1 = useCallback(async (formData) => {
    setSubmittingStep1(true);
    try {
      await saveKpiStep1Self({
        ...formData,
        period,
        employeeId: currentUser?.uid || currentUser?.id,
        employeeName: currentUser?.name,
        department: currentUser?.department,
        position: currentUser?.position,
      });
      toast.success('Đã gửi phiếu tự chấm điểm KPI Cấp 1 thành công! Đã chuyển tiếp tới Trưởng bộ phận thẩm định.');
    } catch (err) {
      console.error('Lỗi khi nộp điểm tự đánh giá KPI:', err);
      toast.error('Có lỗi xảy ra khi nộp điểm tự đánh giá KPI.');
    } finally {
      setSubmittingStep1(false);
    }
  }, [period, currentUser, toast]);

  // Mở modal in ấn A4
  const handleOpenPrintModal = useCallback((mode = 'PERSONAL', data = null) => {
    const currentPeriodList = kpiList.filter((k) => !period || k.period === period);
    setPrintModalState({
      isOpen: true,
      mode,
      personalData: mode === 'PERSONAL' ? (data || myCurrentKpi) : null,
      fundList: mode === 'FUND_SUMMARY' ? (data || currentPeriodList) : currentPeriodList,
    });
  }, [kpiList, period, myCurrentKpi]);

  // Lưu cấu hình tỷ trọng
  const handleSaveConfig = useCallback((newWeights, newThresholds) => {
    setKpiSettings(newWeights);
    setThresholds(newThresholds);
    toast.success('Đã cập nhật tỷ trọng và thang điểm KPI thành công!');
  }, [toast]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-200">
      {/* 1. Header & Bộ Chọn Kỳ Đánh Giá Động */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-emerald-600 rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Phân Hệ Đánh Giá KPI 3 Cấp
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 pl-5">
            Quy trình: Cán bộ tự chấm (40%) → Trưởng phòng thẩm định (30%) → HĐQT phê duyệt (30%)
          </p>
        </div>

        {/* Bộ chọn kỳ đánh giá động */}
        <div className="w-full md:w-auto">
          <KpiPeriodSelector
            period={period}
            setPeriod={setPeriod}
            periodOptions={periodOptions}
            className="w-full md:min-w-[260px]"
          />
        </div>
      </div>

      {/* 2. Thanh Tabs Điều Hướng Phân Hệ (Desktop & Tablet) */}
      <KpiModuleTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isManager={isManager}
        isChairman={isChairman}
        isAdmin={isAdmin}
        pendingCounts={pendingCounts}
        className="hidden md:flex"
      />

      {/* 3. Nội Dung Phân Hệ Tương Ứng Với Tab Đang Chọn */}
      <div className="min-h-[500px]">
        {/* TAB 1: Tổng Quan Quản Trị HĐQT */}
        {activeTab === 'OVERVIEW' && canAccessOverview && (
          <KpiOverviewTab
            kpiList={kpiList.filter((k) => !period || k.period === period)}
            loading={loading}
            period={period}
            isChairman={isChairman}
            isManager={isManager}
            isAdmin={isAdmin}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {/* TAB 2: Quy Trình Chấm Điểm 3 Cấp (Tự chấm, Thẩm định, Phê chuẩn, Khiếu nại) */}
        {activeTab === 'SCORING' && (
          <KpiScoringTab
            period={period}
            currentUser={currentUser}
            isManager={isManager}
            isChairman={isChairman}
            isAdmin={isAdmin}
            myCurrentKpi={myCurrentKpi}
            criteriaList={criteriaList}
            kpiList={kpiList.filter((k) => !period || k.period === period)}
            onSubmitStep1={handleSubmitStep1}
            onRefresh={() => {}}
            isSubmitting={submittingStep1}
          />
        )}

        {/* TAB 3: Xem Kết Quả Cá Nhân Trong Kỳ */}
        {activeTab === 'MY_RESULTS' && (
          <KpiMyResultsTab
            myCurrentKpi={myCurrentKpi}
            period={period}
            currentUser={currentUser}
            onGoToSelfScoring={() => setActiveTab('SCORING')}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {/* TAB 4: Lịch Sử Đa Kỳ (Toàn Quỹ & Cá Nhân) */}
        {activeTab === 'HISTORY' && (
          <KpiHistoryTab
            historyList={historyList.length > 0 ? historyList : kpiList}
            personalHistory={personalHistory}
            currentUser={currentUser}
            isManager={isManager}
            isChairman={isChairman}
            isAdmin={isAdmin}
            periodOptions={periodOptions}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {/* TAB 5: Cấu Hình Tỷ Trọng & Danh Mục Tiêu Chí Động */}
        {activeTab === 'SETTINGS' && canAccessSettings && (
          <KpiSettingsTab
            criteriaList={criteriaList}
            departments={departments}
            kpiSettings={kpiSettings}
            thresholds={thresholds}
            canManage={canAccessSettings}
            onSaveConfig={handleSaveConfig}
            onRefresh={() => {}}
          />
        )}
      </div>

      {/* 4. Bottom Navigation Cố Định Cho Thiết Bị Di Động */}
      <KpiBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isManager={isManager}
        isChairman={isChairman}
        isAdmin={isAdmin}
        pendingCounts={pendingCounts}
      />

      {/* 5. Modal In & Xuất Chuẩn A4 (Hỗ trợ In trực tiếp, Excel, Word, PDF, PNG) */}
      <KpiA4PrintModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        mode={printModalState.mode}
        personalData={printModalState.personalData}
        fundList={printModalState.fundList}
        period={period}
        criteriaList={criteriaList}
      />
    </div>
  );
};

export default KpiEvaluationContainer;

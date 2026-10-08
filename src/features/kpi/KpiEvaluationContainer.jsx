import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  saveKpiStep1Self,
  updateKpiStep2Manager,
  updateKpiStep3Chairman,
  subscribeKpiEvaluations,
  subscribeEmployees,
  subscribeEvaluationPeriods
} from '../../lib/services';
import { ROLES } from '../../lib/constants';

// Subcomponents phân rã sạch
import KpiActionBar from './components/KpiActionBar';
import KpiWeightingCard from './components/KpiWeightingCard';
import KpiSelfEvaluationForm from './components/KpiSelfEvaluationForm';
import KpiApprovalTable from './components/KpiApprovalTable';
import KpiGradingModal from './components/KpiGradingModal';

/**
 * Container điều phối Phân Hệ Chấm Điểm KPI 3 Cấp (40% - 30% - 30%)
 */
const KpiEvaluationContainer = () => {
  const { currentUser, role, isManager, isChairman } = useAuth();
  const toast = useToast();

  const [kpiList, setKpiList] = useState([]);
  const [, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Quý III / 2026');

  // Step 1 Form State (Cán bộ tự chấm)
  const [selfScore, setSelfScore] = useState(85);
  const [selfNotes, setSelfNotes] = useState('');
  const [submittingStep1, setSubmittingStep1] = useState(false);

  // Modal Step 2 (Manager chấm) & Step 3 (Chairman chấm)
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalScore, setModalScore] = useState(85);
  const [modalNotes, setModalNotes] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const unsubEmp = subscribeEmployees((list) => {
      if (list) setEmployees(list);
    });
    return () => unsubEmp();
  }, []);

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

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeKpiEvaluations((data) => {
      setKpiList(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Danh sách các kỳ đánh giá động từ Firestore
  const periodOptions = useMemo(() => {
    const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    const seen = new Set();
    const opts = [];

    // 1. Thêm từ evaluation_periods collection
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

    // 2. Thêm các kỳ đã có trong kpiList (bảo toàn lịch sử)
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
      opts.push({ value: 'Quý III / 2026', label: 'Quý III / 2026' });
    }

    return opts;
  }, [periods, kpiList]);

  // Kiểm tra xem user hiện tại đã gửi Step 1 trong kỳ này chưa
  const myCurrentKpi = useMemo(() => {
    return kpiList.find(
      (k) =>
        (k.employeeId === currentUser?.id ||
          k.employeeId === currentUser?.uid ||
          k.employeeName === currentUser?.name) &&
        k.period === period
    );
  }, [kpiList, currentUser, period]);

  // Xử lý nộp Step 1 (Self-Evaluation - Trọng số 40%)
  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    const scoreNum = Number(selfScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Điểm tự đánh giá phải nằm trong khoảng từ 0 đến 100.');
      return;
    }

    setSubmittingStep1(true);
    try {
      await saveKpiStep1Self({
        period,
        employeeId: currentUser?.uid || currentUser?.id,
        employeeName: currentUser?.name,
        department: currentUser?.department,
        position: currentUser?.position,
        scoreSelf: scoreNum,
        selfNotes: selfNotes.trim(),
      });
      toast.success('Đã gửi phiếu tự chấm điểm KPI (Bước 1: Trọng số 40%) thành công!');
      setSelfNotes('');
    } catch {
      toast.error('Lỗi khi nộp điểm tự đánh giá KPI.');
    } finally {
      setSubmittingStep1(false);
    }
  };

  // Mở modal chấm điểm cấp 2 hoặc cấp 3
  const openActionModal = (item) => {
    setActiveModalItem(item);
    if (role === ROLES.MANAGER) {
      setModalScore(item.scoreManager ?? 85);
      setModalNotes(item.managerNotes || '');
    } else if (role === ROLES.CHAIRMAN) {
      setModalScore(item.scoreChairman ?? 85);
      setModalNotes(item.chairmanNotes || '');
    }
  };

  // Xử lý lưu điểm Step 2 (Manager - 30%) hoặc Step 3 (Chairman - 30%)
  const handleSaveModalScore = async () => {
    if (!activeModalItem) return;
    const scoreNum = Number(modalScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Điểm đánh giá phải từ 0 đến 100.');
      return;
    }

    setModalSubmitting(true);
    try {
      if (role === ROLES.MANAGER) {
        await updateKpiStep2Manager(activeModalItem.id, scoreNum, modalNotes);
        toast.success(
          `Ban điều hành đã chấm ${scoreNum} điểm cho đ/c ${activeModalItem.employeeName}! Chuyển tiếp tới Chủ tịch HĐQT.`
        );
      } else if (role === ROLES.CHAIRMAN) {
        const res = await updateKpiStep3Chairman(
          activeModalItem.id,
          scoreNum,
          modalNotes,
          activeModalItem.scoreSelf,
          activeModalItem.scoreManager
        );
        toast.success(
          `Chủ tịch HĐQT đã hoàn tất phê duyệt! Điểm tổng kết: ${res.finalScore} điểm.`
        );
      }
      setActiveModalItem(null);
    } catch {
      toast.error('Có lỗi xảy ra khi lưu điểm KPI.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Lọc danh sách KPI
  const filteredKpiList = useMemo(() => {
    return kpiList.filter((item) => {
      const matchPeriod = !period || item.period === period;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchSearch =
        !searchTerm.trim() ||
        item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchPeriod && matchStatus && matchSearch;
    });
  }, [kpiList, period, filterStatus, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Thanh tác vụ chọn kỳ đánh giá */}
      <KpiActionBar
        period={period}
        setPeriod={setPeriod}
        periodOptions={periodOptions}
      />

      {/* 2. Banner cơ cấu tỷ trọng 3 cấp */}
      <KpiWeightingCard />

      {/* 3. Bố cục 2 cột: Cán bộ tự chấm & Bảng theo dõi toàn đơn vị */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái (5 cols): Step 1 Cán bộ tự chấm */}
        <div className="lg:col-span-5 space-y-6">
          <KpiSelfEvaluationForm
            period={period}
            currentUser={currentUser}
            myCurrentKpi={myCurrentKpi}
            selfScore={selfScore}
            setSelfScore={setSelfScore}
            selfNotes={selfNotes}
            setSelfNotes={setSelfNotes}
            onSubmitStep1={handleSubmitStep1}
            isSubmitting={submittingStep1}
          />
        </div>

        {/* Cột phải (7 cols): Theo dõi tiến trình 3 cấp toàn đơn vị */}
        <div className="lg:col-span-7 space-y-6">
          <KpiApprovalTable
            kpiList={filteredKpiList}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            isManager={isManager}
            isChairman={isChairman}
            onOpenActionModal={openActionModal}
          />
        </div>
      </div>

      {/* 4. Modal chấm điểm của Giám đốc BĐH hoặc Chủ tịch HĐQT */}
      <KpiGradingModal
        activeModalItem={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        role={role}
        modalScore={modalScore}
        setModalScore={setModalScore}
        modalNotes={modalNotes}
        setModalNotes={setModalNotes}
        onSaveScore={handleSaveModalScore}
        isSubmitting={modalSubmitting}
      />
    </div>
  );
};

export default KpiEvaluationContainer;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Award, 
  CheckCircle2, 
  Send, 
  Search, 
  Eye, 
  Clock, 
  Calendar, 
  Settings, 
  PlusCircle, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  ChevronRight, 
  BarChart2, 
  Printer, 
  Trash2, 
  Edit3, 
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  saveTrustEvaluation, 
  saveBatchTrustEvaluations,
  subscribeTrustEvaluations, 
  subscribeEmployees,
  subscribeEvaluationPeriods,
  subscribeTrustCriteria,
  saveEvaluationPeriod,
  deleteEvaluationPeriod
} from '../lib/services';
import { PERMISSIONS, hasPermission } from '../lib/permissions';
import { formatDateTimeVN, formatDateRangeVN } from '../lib/dateUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import EmployeeBadge from '../components/common/EmployeeBadge';
import StatusBadge from '../components/common/StatusBadge';

// 10 Tiêu chí tín nhiệm chuẩn mực của Quỹ TDND Yên Thọ
const DEFAULT_CRITERIA = [
  { id: 1, code: 'TC01', title: '1. Tinh thần trách nhiệm & Đạo đức nghề nghiệp', description: 'Gương mẫu, tận tụy với công việc, trung thực, liêm chính, bảo vệ uy tín Quỹ.', maxScore: 10 },
  { id: 2, code: 'TC02', title: '2. Chấp hành Quy chế, Nội quy & Pháp luật NHNN', description: 'Tuân thủ tuyệt đối quy trình nghiệp vụ, an toàn kho quỹ và pháp luật ngân hàng.', maxScore: 10 },
  { id: 3, code: 'TC03', title: '3. Năng lực chuyên môn & Nghiệp vụ chuyên sâu', description: 'Nắm vững chính sách, xử lý công việc chính xác, hạn chế tối đa rủi ro vận hành.', maxScore: 10 },
  { id: 4, code: 'TC04', title: '4. Tác phong giao dịch & Văn hóa phục vụ thành viên', description: 'Chu đáo, tôn trọng, giữ gìn uy tín Quỹ tín dụng nhân dân, vì thành viên phục vụ.', maxScore: 10 },
  { id: 5, code: 'TC05', title: '5. Tinh thần đoàn kết & Phối hợp phòng ban', description: 'Tương trợ đồng nghiệp, phối hợp nhịp nhàng giữa các bộ phận trong cơ quan.', maxScore: 10 },
  { id: 6, code: 'TC06', title: '6. Kỷ luật giờ giấc & Bảo mật thông tin tài chính', description: 'Nghiêm túc chấp hành kỷ luật lao động và quy định an toàn bảo mật thông tin.', maxScore: 10 },
  { id: 7, code: 'TC07', title: '7. Đổi mới sáng tạo & Chuyển đổi số', description: 'Tích cực ứng dụng công nghệ thông tin, cải tiến quy trình công tác nghiệp vụ.', maxScore: 10 },
  { id: 8, code: 'TC08', title: '8. Liêm chính tài chính & Phòng ngừa rủi ro đạo đức', description: 'Không vụ lợi cá nhân, không bao che sai phạm, phòng ngừa rủi ro đạo đức.', maxScore: 10 },
  { id: 9, code: 'TC09', title: '9. Đóng góp phong trào & Văn hóa tổ chức', description: 'Tham gia sôi nổi các hoạt động đoàn thể, văn thể mỹ, xây dựng đơn vị vững mạnh.', maxScore: 10 },
  { id: 10, code: 'TC10', title: '10. Hiệu quả hoàn thành chỉ tiêu công việc', description: 'Mức độ hoàn thành kế hoạch được giao theo tiến độ và chất lượng thực tế.', maxScore: 10 },
];

const TrustEvaluation = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();

  // Dữ liệu từ Firestore
  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [globalCriteria, setGlobalCriteria] = useState(DEFAULT_CRITERIA);
  const [evaluations, setEvaluations] = useState([]);

  // Quản lý Đợt đánh giá đang chọn
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  // Tab điều hướng chính:
  // 'CRITERIA_MATRIX': Ma trận so sánh CBNV theo từng Tiêu chí (Yêu cầu trọng tâm)
  // 'SINGLE_EMPLOYEE': Chấm theo từng Cán bộ (Truyền thống)
  // 'LEADERBOARD_ANALYTICS': Tiến trình Realtime & Kết quả tổng hợp
  // 'HISTORY_LIST': Lịch sử các phiếu đánh giá
  const [activeTab, setActiveTab] = useState('CRITERIA_MATRIX');

  // Trạng thái cho Tab 1: Ma trận theo Tiêu chí
  const [activeCriterionIndex, setActiveCriterionIndex] = useState(0);

  // Bảng điểm ma trận: matrixScores[employeeId][criterionId] = score
  const [matrixScores, setMatrixScores] = useState({});
  const [matrixNotes, setMatrixNotes] = useState({});
  const [submittingMatrix, setSubmittingMatrix] = useState(false);

  // Trạng thái cho Tab 2: Chấm theo từng Cán bộ
  const [singleTargetId, setSingleTargetId] = useState('');
  const [singleScores, setSingleScores] = useState({});
  const [singleNotes, setSingleNotes] = useState('');
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Bộ lọc lịch sử & Chi tiết phiếu
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Modal In Biên Bản A4
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Quản lý Modal Cấu Hình Đợt Đánh Giá (Admin)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodFormMode, setPeriodFormMode] = useState('CREATE'); // 'CREATE' hoặc 'EDIT'
  const [submittingPeriod, setSubmittingPeriod] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    year: 2026,
    quarter: 4,
    votingMode: 'ANONYMOUS', // 'ANONYMOUS' hoặc 'IDENTIFIED'
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    description: '',
    targetEmployeeIds: [],
    customCriteria: DEFAULT_CRITERIA,
  });

  // State thêm tiêu chí tùy biến trong modal Admin
  const [newCustomCrit, setNewCustomCrit] = useState({ title: '', description: '', maxScore: 10 });
  const [isAddingCrit, setIsAddingCrit] = useState(false);

  // Quyền quản lý đợt đánh giá
  const canManagePeriods = useMemo(() => {
    return hasPermission(role, PERMISSIONS.TRUST_MANAGE_PERIODS) || role === 'chairman' || role === 'manager' || role === 'admin';
  }, [role]);

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

  // 4. Subscribe Phiếu đánh giá Realtime
  useEffect(() => {
    const unsub = subscribeTrustEvaluations((data) => {
      setEvaluations(data || []);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  // Thông tin Đợt đánh giá hiện hành
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0];
  }, [periods, selectedPeriodId]);

  // Bộ tiêu chí áp dụng cho Đợt hiện hành
  const activeCriteria = useMemo(() => {
    if (currentPeriod?.customCriteria && Array.isArray(currentPeriod.customCriteria) && currentPeriod.customCriteria.length > 0) {
      return currentPeriod.customCriteria;
    }
    return globalCriteria;
  }, [currentPeriod, globalCriteria]);

  // Tiêu chí hiện đang chọn ở Tab 1
  const currentCriterion = useMemo(() => {
    return activeCriteria[activeCriterionIndex] || activeCriteria[0];
  }, [activeCriteria, activeCriterionIndex]);

  // Hình thức bỏ phiếu của Đợt: Ẩn danh (Bỏ phiếu kín) hoặc Công khai (Định danh)
  const isAnonymousByPolicy = useMemo(() => {
    if (!currentPeriod) return true;
    return currentPeriod.votingMode === 'ANONYMOUS' || currentPeriod.votingMode === 'ANONYMOUS_ONLY';
  }, [currentPeriod]);

  // DANH SÁCH CÁN BỘ ĐƯỢC ĐÁNH GIÁ TRONG ĐỢT (LOẠI TRỪ 100% BẢN THÂN NGƯỜI ĐĂNG NHẬP)
  const evaluatableEmployees = useMemo(() => {
    if (!employees.length) return [];

    let pool = employees;
    // Nếu đợt có chỉ định danh sách targetEmployeeIds
    if (currentPeriod?.targetEmployeeIds && Array.isArray(currentPeriod.targetEmployeeIds) && currentPeriod.targetEmployeeIds.length > 0) {
      pool = employees.filter((e) => currentPeriod.targetEmployeeIds.includes(e.id));
    }

    // NGHIÊM NGẶT LOẠI TRỪ BẢN THÂN
    return pool.filter((emp) => {
      const isSelf = (currentUser?.id && emp.id === currentUser.id) ||
                     (currentUser?.uid && emp.id === currentUser.uid) ||
                     (currentUser?.email && emp.email?.toLowerCase() === currentUser.email?.toLowerCase()) ||
                     (currentUser?.code && emp.code === currentUser.code);
      return !isSelf;
    });
  }, [employees, currentPeriod, currentUser]);

  // Tải dữ liệu nháp (Local Draft) hoặc dữ liệu đã nộp cho Ma trận điểm khi đổi đợt
  useEffect(() => {
    if (!currentPeriod || !evaluatableEmployees.length || !currentUser) return;

    const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
    let savedDraft = null;
    try {
      const draftStr = localStorage.getItem(draftKey);
      if (draftStr) savedDraft = JSON.parse(draftStr);
    } catch {
      // bỏ qua lỗi parse
    }

    // Lấy các phiếu đã nộp trước đó của người dùng này trong đợt
    const mySubmittedList = evaluations.filter(
      (ev) => ev.periodId === currentPeriod.id && (ev.evaluatorId === currentUser.uid || ev.evaluatorId === currentUser.id)
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
        } else {
          initialMatrix[emp.id][crit.id] = 8; // Điểm chuẩn mặc định
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

  // Tự động lưu nháp điểm ma trận vào LocalStorage
  const handleScoreChangeMatrix = (employeeId, criterionId, score) => {
    const val = Math.max(0, Math.min(Number(score) || 0, currentCriterion?.maxScore || 10));
    setMatrixScores((prev) => {
      const updated = {
        ...prev,
        [employeeId]: {
          ...(prev[employeeId] || {}),
          [criterionId]: val,
        },
      };

      // Auto save draft
      if (currentPeriod && currentUser) {
        const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
        localStorage.setItem(draftKey, JSON.stringify({ scores: updated, notes: matrixNotes, updatedAt: new Date().toISOString() }));
      }
      return updated;
    });
  };

  // Nút tiện ích: Gán điểm nhanh cho toàn bộ cán bộ tại Tiêu chí hiện tại
  const handleQuickFillCriterion = (fillScore) => {
    if (!currentCriterion) return;
    const cid = currentCriterion.id;
    setMatrixScores((prev) => {
      const updated = { ...prev };
      evaluatableEmployees.forEach((emp) => {
        updated[emp.id] = {
          ...(updated[emp.id] || {}),
          [cid]: fillScore,
        };
      });

      if (currentPeriod && currentUser) {
        const draftKey = `qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`;
        localStorage.setItem(draftKey, JSON.stringify({ scores: updated, notes: matrixNotes, updatedAt: new Date().toISOString() }));
      }
      return updated;
    });
    toast.success(`Đã gán nhanh điểm [${fillScore}] cho toàn bộ đồng nghiệp tại ${currentCriterion.title}!`);
  };

  // Nộp toàn bộ phiếu đánh giá từ Bảng Ma Trận
  const handleSubmitAllMatrix = async () => {
    if (!evaluatableEmployees.length) {
      toast.error('Không có cán bộ nào cần đánh giá trong đợt này.');
      return;
    }
    if (currentPeriod?.status === 'CLOSED') {
      toast.error('Đợt đánh giá đã kết thúc. Vui lòng liên hệ Ban Quản trị.');
      return;
    }

    setSubmittingMatrix(true);
    try {
      const payloadList = evaluatableEmployees.map((emp) => {
        const empScores = matrixScores[emp.id] || {};
        const total = Object.values(empScores).reduce((sum, v) => sum + (Number(v) || 0), 0);
        let classification = 'Không hoàn thành';
        if (total >= 90) classification = 'Xuất sắc';
        else if (total >= 70) classification = 'Tốt';
        else if (total >= 50) classification = 'Hoàn thành';

        return {
          periodId: currentPeriod.id,
          periodName: currentPeriod.name,
          evaluatorId: currentUser.uid || currentUser.id,
          evaluatorName: isAnonymousByPolicy ? 'Cán bộ Quỹ (Ẩn danh)' : currentUser.name,
          evaluatorRole: isAnonymousByPolicy ? 'Ẩn danh' : role,
          targetEmployeeId: emp.id,
          targetEmployeeName: emp.name,
          targetEmployeeCode: emp.code,
          targetDepartment: emp.department,
          targetPosition: emp.position,
          scores: empScores,
          totalScore: total,
          classification,
          notes: matrixNotes[emp.id] || '',
          isAnonymous: isAnonymousByPolicy,
        };
      });

      await saveBatchTrustEvaluations(payloadList);

      // Xóa nháp
      if (currentPeriod && currentUser) {
        localStorage.removeItem(`qtd_trust_draft_${currentPeriod.id}_${currentUser.uid || currentUser.id}`);
      }

      toast.success(
        `Hoàn tất! Đã lưu thành công phiếu đánh giá tín nhiệm cho ${payloadList.length} đồng nghiệp thuộc đợt [${currentPeriod.name}]!`
      );
      setActiveTab('LEADERBOARD_ANALYTICS');
    } catch (err) {
      toast.error(`Lỗi khi nộp phiếu: ${err.message}`);
    } finally {
      setSubmittingMatrix(false);
    }
  };

  // Xử lý nộp phiếu lẻ ở Tab 2 (Chấm theo từng cán bộ)
  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    if (!singleTargetId) {
      toast.error('Vui lòng chọn cán bộ được đánh giá.');
      return;
    }
    const targetEmp = employees.find((e) => e.id === singleTargetId);
    if (!targetEmp) return;

    setSubmittingSingle(true);
    try {
      const total = Object.values(singleScores).reduce((sum, v) => sum + (Number(v) || 0), 0);
      let classification = 'Không hoàn thành';
      if (total >= 90) classification = 'Xuất sắc';
      else if (total >= 70) classification = 'Tốt';
      else if (total >= 50) classification = 'Hoàn thành';

      await saveTrustEvaluation({
        periodId: currentPeriod.id,
        periodName: currentPeriod.name,
        evaluatorId: currentUser.uid || currentUser.id,
        evaluatorName: isAnonymousByPolicy ? 'Cán bộ Quỹ (Ẩn danh)' : currentUser.name,
        evaluatorRole: isAnonymousByPolicy ? 'Ẩn danh' : role,
        targetEmployeeId: targetEmp.id,
        targetEmployeeName: targetEmp.name,
        targetEmployeeCode: targetEmp.code,
        targetDepartment: targetEmp.department,
        targetPosition: targetEmp.position,
        scores: singleScores,
        totalScore: total,
        classification,
        notes: singleNotes.trim(),
        isAnonymous: isAnonymousByPolicy,
      });

      toast.success(`Đã lưu phiếu đánh giá cho đồng chí ${targetEmp.name} (${total} điểm)!`);
      setSingleTargetId('');
      setSingleNotes('');
    } catch (err) {
      toast.error(`Lỗi lưu phiếu: ${err.message}`);
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Tính toán Tiến trình đánh giá & Bảng xếp hạng Realtime
  const analyticsData = useMemo(() => {
    if (!currentPeriod || !employees.length) {
      return { leaderboard: [], voterProgress: { submitted: 0, total: 0, percent: 0 }, deptBreakdown: [] };
    }

    const periodEvaluations = evaluations.filter((ev) => ev.periodId === currentPeriod.id);

    // 1. Tiến độ cử tri nộp phiếu
    const submittedVoterIds = new Set(periodEvaluations.map((ev) => ev.evaluatorId));
    const totalEligible = employees.length;
    const submittedCount = submittedVoterIds.size;
    const turnoutPercent = totalEligible > 0 ? Math.round((submittedCount / totalEligible) * 100) : 0;

    // 2. Bảng xếp hạng cán bộ theo điểm trung bình
    const employeeStats = {};
    evaluatableEmployees.forEach((emp) => {
      employeeStats[emp.id] = {
        employee: emp,
        evaluationsCount: 0,
        totalScoreSum: 0,
        criteriaSums: {},
      };
      activeCriteria.forEach((c) => {
        employeeStats[emp.id].criteriaSums[c.id] = 0;
      });
    });

    periodEvaluations.forEach((ev) => {
      const stats = employeeStats[ev.targetEmployeeId];
      if (stats) {
        stats.evaluationsCount += 1;
        stats.totalScoreSum += Number(ev.totalScore) || 0;
        activeCriteria.forEach((c) => {
          const sc = Number(ev.scores?.[c.id]) || 0;
          stats.criteriaSums[c.id] = (stats.criteriaSums[c.id] || 0) + sc;
        });
      }
    });

    const leaderboard = Object.values(employeeStats).map((item) => {
      const count = item.evaluationsCount;
      const avgScore = count > 0 ? Number((item.totalScoreSum / count).toFixed(1)) : 0;
      let classification = 'Chưa có phiếu';
      if (count > 0) {
        if (avgScore >= 90) classification = 'Xuất sắc';
        else if (avgScore >= 70) classification = 'Tốt';
        else if (avgScore >= 50) classification = 'Hoàn thành';
        else classification = 'Không hoàn thành';
      }

      const criteriaAvgs = {};
      activeCriteria.forEach((c) => {
        criteriaAvgs[c.id] = count > 0 ? Number((item.criteriaSums[c.id] / count).toFixed(1)) : 0;
      });

      return {
        id: item.employee.id,
        name: item.employee.name,
        code: item.employee.code,
        department: item.employee.department,
        position: item.employee.position,
        evaluationsCount: count,
        avgScore,
        classification,
        criteriaAvgs,
      };
    });

    leaderboard.sort((a, b) => b.avgScore - a.avgScore);

    return {
      leaderboard,
      voterProgress: { submitted: submittedCount, total: totalEligible, percent: turnoutPercent },
    };
  }, [currentPeriod, evaluations, evaluatableEmployees, activeCriteria, employees.length]);

  // Bộ lọc lịch sử phiếu
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchPeriod = !selectedPeriodId || item.periodId === selectedPeriodId;
      const matchDept = filterDept === 'ALL' || item.targetDepartment === filterDept;
      const matchSearch =
        !searchTerm.trim() ||
        item.targetEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.periodName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchPeriod && matchDept && matchSearch;
    });
  }, [evaluations, selectedPeriodId, filterDept, searchTerm]);

  // Xử lý tạo / cập nhật Đợt đánh giá (Admin)
  const handleOpenCreatePeriod = () => {
    setPeriodFormMode('CREATE');
    setEditingPeriodId(null);
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
    setEditingPeriodId(period.id);
    setPeriodFormData({
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

  const handleSavePeriod = async (e) => {
    e.preventDefault();
    if (!periodFormData.name.trim()) {
      toast.error('Vui lòng nhập tên đợt đánh giá.');
      return;
    }

    setSubmittingPeriod(true);
    try {
      const periodId = editingPeriodId || `PERIOD-${periodFormData.year}-Q${periodFormData.quarter}-${Date.now().toString().slice(-4)}`;
      const payload = {
        ...periodFormData,
        id: periodId,
        year: Number(periodFormData.year),
        quarter: Number(periodFormData.quarter),
      };

      await saveEvaluationPeriod(payload);
      setSelectedPeriodId(periodId);
      setIsPeriodModalOpen(false);
      toast.success(
        periodFormMode === 'CREATE'
          ? `Đã ban hành đợt đánh giá mới: [${payload.name}]!`
          : `Đã cập nhật cấu hình đợt [${payload.name}] thành công!`
      );
    } catch (err) {
      toast.error(`Lỗi lưu đợt đánh giá: ${err.message}`);
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleDeletePeriod = async (pId, pName) => {
    if (!window.confirm(`Đồng chí có chắc chắn muốn xóa đợt đánh giá [${pName}] không?`)) return;
    try {
      await deleteEvaluationPeriod(pId);
      toast.success(`Đã xóa đợt đánh giá [${pName}].`);
    } catch (err) {
      toast.error(`Không thể xóa đợt: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Trang & Bộ chọn Đợt Đánh Giá */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phân hệ Nghiệp vụ A • Quỹ Tín Dụng Nhân Dân Yên Thọ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đánh Giá Tín Nhiệm Cán Bộ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Lấy phiếu tín nhiệm định kỳ — So sánh trực quan theo từng tiêu chí, công tâm và minh bạch
          </p>
        </div>

        {/* Cán bộ đang đăng nhập & Nút Admin */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {canManagePeriods && (
            <Button
              variant="outline"
              size="sm"
              icon={Settings}
              onClick={() => handleOpenCreatePeriod()}
              className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50"
            >
              Cấu hình Đợt Đánh Giá
            </Button>
          )}

          <div className="bg-white px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <span className="text-slate-400 text-[10px] hidden sm:inline font-medium">Người chấm:</span>
            <EmployeeBadge
              employee={currentUser}
              size="sm"
              showCode={false}
              showPosition={true}
              showDepartment={false}
            />
          </div>
        </div>
      </div>

      {/* 2. Banner Thông Tin Kỳ Đánh Giá Đang Chọn & Đồng Hồ Tiến Trình */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50/70 via-white to-emerald-50/40 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0f766e]" />
                Kỳ đánh giá:
              </span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="text-xs sm:text-sm font-bold text-slate-900 bg-white border border-teal-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 shadow-2xs"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'CLOSED' ? '(Đã đóng)' : p.status === 'UPCOMING' ? '(Sắp diễn ra)' : '(Đang mở)'}
                  </option>
                ))}
              </select>

              <StatusBadge type="period_status" value={currentPeriod?.status} />
              <StatusBadge type="voting_mode" value={currentPeriod?.votingMode} />

              {canManagePeriods && currentPeriod && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPeriod(currentPeriod)}
                    className="p-1.5 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-teal-100 transition-colors cursor-pointer"
                    title="Chỉnh sửa đợt đánh giá này"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePeriod(currentPeriod.id, currentPeriod.name)}
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Xóa đợt đánh giá này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Thời hạn: <strong className="text-slate-800">{formatDateRangeVN(currentPeriod?.startDate, currentPeriod?.endDate)}</strong>
              </span>
              <span>•</span>
              <span>
                Cán bộ được lấy phiếu: <strong className="text-[#0f766e]">{evaluatableEmployees.length}</strong> đồng chí
              </span>
              <span>•</span>
              <span>
                Bộ tiêu chí: <strong className="text-slate-800">{activeCriteria.length}</strong> tiêu chí
              </span>
            </div>
          </div>

          {/* Quy chế Bỏ phiếu kín / Công khai */}
          <div className="flex items-center gap-3 bg-white/90 p-3 rounded-2xl border border-teal-100 shadow-2xs">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isAnonymousByPolicy ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'}`}>
              {isAnonymousByPolicy ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900">
                {isAnonymousByPolicy ? 'QUY CHẾ BỎ PHIẾU KÍN (ẨN DANH)' : 'HÌNH THỨC CÔNG KHAI (ĐỊNH DANH)'}
              </div>
              <p className="text-[11px] text-slate-500">
                {isAnonymousByPolicy
                  ? 'Mã hóa người chấm, phiếu ghi nhận là "Cán bộ Quỹ (Ẩn danh)".'
                  : `Ghi nhận công khai danh tính: ${currentUser?.name} (${currentUser?.position}).`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Navigation Tabs (3 Chế độ chính) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('CRITERIA_MATRIX')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'CRITERIA_MATRIX'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ma Trận So Sánh Theo Tiêu Chí (Khuyên dùng)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-emerald-950 font-black">Mới</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SINGLE_EMPLOYEE')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'SINGLE_EMPLOYEE'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Chấm Theo Từng Cán Bộ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEADERBOARD_ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'LEADERBOARD_ANALYTICS'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Tiến Trình & Kết Quả Tổng Hợp</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-bold">Realtime</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY_LIST')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'HISTORY_LIST'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Lịch Sử Phiếu Đã Nộp ({filteredEvaluations.length})</span>
        </button>
      </div>

      {/* 4. TAB 1: MA TRẬN SO SÁNH THEO TIÊU CHÍ (YÊU CẦU TRỌNG TÂM) */}
      {activeTab === 'CRITERIA_MATRIX' && (
        <div className="space-y-6">
          {/* Header Tiêu chí hiện hành & Stepper chọn tiêu chí */}
          <div className="bg-white p-5 rounded-3xl border border-teal-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-xs">
                  {activeCriterionIndex + 1}
                </span>
                <div>
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                    Tiêu chí {activeCriterionIndex + 1} / {activeCriteria.length}:
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {currentCriterion?.title}
                  </h3>
                </div>
              </div>

              {/* Bộ điều hướng tiêu chí nhanh */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeCriterionIndex === 0}
                  onClick={() => setActiveCriterionIndex((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Tiêu chí trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-slate-700 px-2">
                  {activeCriterionIndex + 1} / {activeCriteria.length}
                </span>

                <button
                  type="button"
                  disabled={activeCriterionIndex === activeCriteria.length - 1}
                  onClick={() => setActiveCriterionIndex((prev) => Math.min(activeCriteria.length - 1, prev + 1))}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Tiêu chí tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Diễn giải tiêu chí & Thanh thao tác gán nhanh */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                <strong className="text-slate-800">Nội dung yêu cầu: </strong>
                {currentCriterion?.description}
              </div>

              {/* Nút tiện ích gán nhanh điểm sàn */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">Gán nhanh cho tất cả:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFillCriterion(8)}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors cursor-pointer"
                >
                  8 điểm
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillCriterion(8.5)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
                >
                  8.5 điểm
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillCriterion(9)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200 transition-colors cursor-pointer"
                >
                  9 điểm
                </button>
              </div>
            </div>

            {/* Stepper Dots (10 tiêu chí) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {activeCriteria.map((crit, idx) => (
                <button
                  key={crit.id}
                  type="button"
                  onClick={() => setActiveCriterionIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    activeCriterionIndex === idx
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  TC {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Lưới các cán bộ nhân viên xếp cùng nhau ở tiêu chí này */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {evaluatableEmployees.map((emp) => {
              const currentScore = matrixScores[emp.id]?.[currentCriterion?.id] ?? 8;
              return (
                <Card
                  key={emp.id}
                  className="border-slate-200/80 hover:border-teal-300 transition-all shadow-xs bg-white flex flex-col justify-between"
                >
                  <div>
                    {/* Thông tin Cán bộ */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <EmployeeBadge
                        employee={emp}
                        size="md"
                        showCode={true}
                        showPosition={true}
                        showDepartment={true}
                      />
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Điểm tiêu chí:</span>
                        <span className="text-2xl font-black text-[#0f766e]">
                          {currentScore}
                        </span>
                        <span className="text-[10px] text-slate-400"> / 10</span>
                      </div>
                    </div>

                    {/* Bộ chấm điểm nhanh cho cán bộ */}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Chọn điểm đánh giá:</span>
                        <span className="font-bold text-slate-700">
                          {currentScore >= 9 ? 'Xuất sắc' : currentScore >= 7 ? 'Tốt' : 'Khá'}
                        </span>
                      </div>

                      {/* Slider chấm điểm mượt mà */}
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={currentScore}
                        onChange={(e) => handleScoreChangeMatrix(emp.id, currentCriterion?.id, e.target.value)}
                        className="w-full accent-[#0f766e] cursor-pointer"
                      />

                      {/* Các nút bấm điểm số nhanh 1 chạm */}
                      <div className="grid grid-cols-6 gap-1">
                        {[6, 7, 8, 8.5, 9, 10].map((scorePill) => (
                          <button
                            key={scorePill}
                            type="button"
                            onClick={() => handleScoreChangeMatrix(emp.id, currentCriterion?.id, scorePill)}
                            className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentScore === scorePill
                                ? 'bg-teal-800 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {scorePill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tổng điểm dự kiến của cán bộ này qua tất cả các tiêu chí */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Tổng điểm tạm tính:</span>
                    <strong className="text-slate-800">
                      {Object.values(matrixScores[emp.id] || {}).reduce((s, v) => s + (Number(v) || 0), 0)} / 100 điểm
                    </strong>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Thanh Footer Điều Hướng & Nút Hoàn Tất */}
          <div className="sticky bottom-4 z-20 bg-slate-900/95 text-white p-4 rounded-3xl shadow-2xl backdrop-blur-md border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300">
              <span className="text-amber-300 font-bold">Tự động lưu nháp: </span>
              Đã ghi nhớ điểm đánh giá của {evaluatableEmployees.length} đồng nghiệp.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={activeCriterionIndex === 0}
                onClick={() => setActiveCriterionIndex((prev) => Math.max(0, prev - 1))}
                className="text-white border-slate-600 hover:bg-slate-800"
              >
                ← Tiêu chí trước
              </Button>

              {activeCriterionIndex < activeCriteria.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveCriterionIndex((prev) => Math.min(activeCriteria.length - 1, prev + 1))}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
                >
                  <span>Tiêu chí tiếp theo →</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={submittingMatrix}
                  onClick={handleSubmitAllMatrix}
                  icon={CheckCircle2}
                  className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-6 shadow-lg shadow-amber-400/20"
                >
                  Xác nhận & Nộp phiếu toàn bộ đợt
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: CHẤM THEO TỪNG CÁN BỘ (CHẾ ĐỘ TRUYỀN THỐNG) */}
      {activeTab === 'SINGLE_EMPLOYEE' && (
        <Card title="Chấm Điểm Tín Nhiệm Theo Từng Cá Nhân">
          <form onSubmit={handleSubmitSingle} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-2">
                Chọn cán bộ cần đánh giá (Đã loại trừ bản thân):
              </label>
              <select
                value={singleTargetId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSingleTargetId(val);
                  if (val && matrixScores[val]) {
                    setSingleScores({ ...matrixScores[val] });
                  } else {
                    const init = {};
                    activeCriteria.forEach((c) => { init[c.id] = 8; });
                    setSingleScores(init);
                  }
                }}
                className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e]/30 font-bold text-slate-800"
                required
              >
                <option value="">-- Chọn đồng chí trong danh sách lấy phiếu tín nhiệm --</option>
                {evaluatableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code}) — {emp.position} [{emp.department}]
                  </option>
                ))}
              </select>
            </div>

            {singleTargetId && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {activeCriteria.map((crit) => (
                    <div key={crit.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{crit.title}</span>
                        <strong className="text-sm font-black text-[#0f766e]">{singleScores[crit.id] || 8} / 10</strong>
                      </div>
                      <p className="text-[11px] text-slate-500">{crit.description}</p>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={singleScores[crit.id] || 8}
                        onChange={(e) => setSingleScores((prev) => ({ ...prev, [crit.id]: Number(e.target.value) }))}
                        className="w-full accent-[#0f766e] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhận xét & Ý kiến xây dựng thêm (Tùy chọn):
                  </label>
                  <textarea
                    rows={2}
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    placeholder="Ghi nhận các mặt nổi bật hoặc điểm cần tiếp tục phát huy..."
                    className="w-full p-2.5 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submittingSingle}
                    icon={Send}
                    className="font-bold px-6"
                  >
                    Nộp phiếu cho cán bộ này
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* 6. TAB 3: TIẾN TRÌNH REALTIME & BẢNG XẾP HẠNG TÍN NHIỆM */}
      {activeTab === 'LEADERBOARD_ANALYTICS' && (
        <div className="space-y-6">
          {/* Hàng chỉ số Thống kê Realtime */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white border-teal-800">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
                Tỷ lệ cử tri nộp phiếu
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-amber-300">
                  {analyticsData.voterProgress.percent}%
                </span>
                <span className="text-xs text-teal-200 font-medium">
                  ({analyticsData.voterProgress.submitted}/{analyticsData.voterProgress.total} cán bộ)
                </span>
              </div>
              <div className="w-full bg-teal-950 rounded-full h-1.5 mt-3 overflow-hidden border border-teal-800">
                <div
                  className="bg-amber-400 h-1.5 rounded-full"
                  style={{ width: `${analyticsData.voterProgress.percent}%` }}
                />
              </div>
            </Card>

            <Card className="bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tổng số phiếu ghi nhận
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {evaluations.filter((e) => e.periodId === currentPeriod?.id).length}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Được cập nhật tự động thời gian thực qua Cloud Firestore
              </p>
            </Card>

            <Card className="bg-white border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Công cụ Báo cáo & Lưu trữ
                </span>
                <p className="text-xs text-slate-600 mt-1">
                  Xuất biên bản họp lấy phiếu tín nhiệm chuẩn văn bản Quỹ
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Printer}
                  onClick={() => setIsPrintModalOpen(true)}
                  className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50"
                >
                  In Biên Bản A4
                </Button>
              </div>
            </Card>
          </div>

          {/* Bảng Xếp Hạng Tín Nhiệm Tổng Hợp */}
          <Card title="Bảng Xếp Hạng Điểm Tín Nhiệm Cán Bộ (Leaderboard)">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 text-center w-12">Thứ hạng</th>
                    <th className="py-3 px-3">Cán bộ được đánh giá</th>
                    <th className="py-3 px-3">Chức danh / Phòng ban</th>
                    <th className="py-3 px-3 text-center">Số phiếu</th>
                    <th className="py-3 px-3 text-center">Điểm trung bình</th>
                    <th className="py-3 px-3">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData.leaderboard.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                          idx === 0 ? 'bg-amber-400 text-emerald-950 shadow-xs' :
                          idx === 1 ? 'bg-slate-300 text-slate-800' :
                          idx === 2 ? 'bg-amber-600/30 text-amber-900' : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.name}
                        <span className="text-[10px] text-slate-400 font-mono ml-1.5">({item.code})</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.position} • <span className="text-slate-400">{item.department}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {item.evaluationsCount} phiếu
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-sm text-[#0f766e]">
                          {item.avgScore}
                        </span>
                        <span className="text-slate-400 text-[10px]"> / 100</span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge type="trust_classification" value={item.classification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 7. TAB 4: LỊCH SỬ PHIẾU ĐÃ NỘP */}
      {activeTab === 'HISTORY_LIST' && (
        <Card title="Danh Sách Phiếu Đánh Giá Tín Nhiệm Đã Ghi Nhận">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên cán bộ, đợt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:ring-2 focus:ring-[#0f766e]/30"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  <option value="Phòng Tín dụng">Phòng Tín dụng</option>
                  <option value="Phòng Kế toán - Ngân quỹ">Phòng Kế toán - Ngân quỹ</option>
                  <option value="Ban Kiểm soát">Ban Kiểm soát</option>
                  <option value="Ban Giám đốc">Ban Giám đốc</option>
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Tổng số: <strong className="text-slate-800">{filteredEvaluations.length}</strong> phiếu
              </div>
            </div>

            {filteredEvaluations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Chưa có dữ liệu phiếu đánh giá tín nhiệm nào trong đợt này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-3">Cán bộ được đánh giá</th>
                      <th className="py-3 px-3">Phòng ban</th>
                      <th className="py-3 px-3">Người chấm</th>
                      <th className="py-3 px-3 text-center">Tổng điểm</th>
                      <th className="py-3 px-3">Xếp loại</th>
                      <th className="py-3 px-3">Thời gian nộp</th>
                      <th className="py-3 px-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvaluations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.targetEmployeeName}
                          <span className="text-[10px] text-slate-400 font-mono ml-1">({item.targetEmployeeCode})</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{item.targetDepartment}</td>
                        <td className="py-3 px-3">
                          {item.isAnonymous ? (
                            <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-teal-200">
                              <Lock className="w-3 h-3" />
                              {item.evaluatorName}
                            </span>
                          ) : (
                            <span className="text-slate-800 font-medium">{item.evaluatorName}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-black text-sm text-[#0f766e]">{item.totalScore}</span>
                          <span className="text-slate-400 text-[10px]"> / 100</span>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge type="trust_classification" value={item.classification} />
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {formatDateTimeVN(item.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEvaluation(item)}
                            className="text-[#0f766e] hover:text-teal-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MODAL 1: Chi tiết Phiếu Đánh Giá */}
      <Modal
        isOpen={Boolean(selectedEvaluation)}
        onClose={() => setSelectedEvaluation(null)}
        title="Chi Tiết Phiếu Đánh Giá Tín Nhiệm"
        subtitle={`Mã phiếu: ${selectedEvaluation?.id}`}
        maxWidth="max-w-3xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedEvaluation(null)}>
            Đóng cửa sổ
          </Button>
        }
      >
        {selectedEvaluation && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block">Cán bộ được đánh giá:</span>
                <strong className="text-sm text-slate-900">{selectedEvaluation.targetEmployeeName}</strong>
                <span className="text-[11px] text-slate-500 block">{selectedEvaluation.targetDepartment}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Hình thức phiếu:</span>
                <StatusBadge type="voting_mode" value={selectedEvaluation.isAnonymous ? 'ANONYMOUS' : 'IDENTIFIED'} />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tổng điểm & Xếp loại:</span>
                <span className="text-sm font-black text-[#0f766e]">{selectedEvaluation.totalScore} điểm</span> • {selectedEvaluation.classification}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">
                Chi tiết điểm các tiêu chí:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCriteria.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between">
                    <span className="text-slate-700 font-medium truncate pr-2">{c.title}</span>
                    <strong className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 shrink-0">
                      {selectedEvaluation.scores?.[c.id] ?? 0} / 10
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {selectedEvaluation.notes && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <strong className="text-teal-900 block mb-0.5">Nhận xét:</strong>
                <p className="text-teal-800 italic">{selectedEvaluation.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL 2: Quản Lý & Cấu Hình Đợt Đánh Giá (Admin) */}
      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title={periodFormMode === 'CREATE' ? 'Ban Hành Đợt Lấy Phiếu Tín Nhiệm Mới' : 'Chỉnh Sửa Cấu Hình Đợt Đánh Giá'}
        subtitle="Quản lý thời gian, tùy biến danh sách ứng viên và bộ tiêu chí đánh giá"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-500">Chỉ cấp Quản lý/Chủ tịch có quyền tác nghiệp.</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPeriodModalOpen(false)}>Hủy</Button>
              <Button
                variant="primary"
                onClick={handleSavePeriod}
                isLoading={submittingPeriod}
                icon={CheckCircle2}
              >
                Xác nhận lưu đợt
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Tên đợt đánh giá <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={periodFormData.name}
                onChange={(e) => setPeriodFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Lấy phiếu tín nhiệm Cán bộ Quản lý Quý IV/2026"
                className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kỳ / Năm</label>
              <div className="flex gap-1.5">
                <select
                  value={periodFormData.quarter}
                  onChange={(e) => setPeriodFormData((prev) => ({ ...prev, quarter: Number(e.target.value) }))}
                  className="p-2 bg-white rounded-xl border border-slate-300 text-xs"
                >
                  <option value={1}>Quý I</option>
                  <option value={2}>Quý II</option>
                  <option value={3}>Quý III</option>
                  <option value={4}>Quý IV</option>
                </select>
                <input
                  type="number"
                  value={periodFormData.year}
                  onChange={(e) => setPeriodFormData((prev) => ({ ...prev, year: Number(e.target.value) }))}
                  className="w-20 p-2 bg-white rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Thời gian bắt đầu và kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian bắt đầu</label>
              <input
                type="date"
                value={periodFormData.startDate}
                onChange={(e) => setPeriodFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian kết thúc</label>
              <input
                type="date"
                value={periodFormData.endDate}
                onChange={(e) => setPeriodFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 bg-white rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Hình thức bỏ phiếu & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Hình thức bỏ phiếu:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalVotingMode"
                    value="ANONYMOUS"
                    checked={periodFormData.votingMode === 'ANONYMOUS'}
                    onChange={() => setPeriodFormData((prev) => ({ ...prev, votingMode: 'ANONYMOUS' }))}
                  />
                  <span>Bỏ phiếu kín (Ẩn danh)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalVotingMode"
                    value="IDENTIFIED"
                    checked={periodFormData.votingMode === 'IDENTIFIED'}
                    onChange={() => setPeriodFormData((prev) => ({ ...prev, votingMode: 'IDENTIFIED' }))}
                  />
                  <span>Định danh (Công khai)</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Trạng thái đợt:
              </label>
              <select
                value={periodFormData.status}
                onChange={(e) => setPeriodFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="ACTIVE">Đang diễn ra (ACTIVE)</option>
                <option value="UPCOMING">Sắp diễn ra (UPCOMING)</option>
                <option value="CLOSED">Đã đóng / Khóa sổ (CLOSED)</option>
              </select>
            </div>
          </div>

          {/* Danh sách cán bộ được lấy phiếu tín nhiệm */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Cán bộ được lấy phiếu tín nhiệm ({periodFormData.targetEmployeeIds.length}/{employees.length}):
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPeriodFormData((prev) => ({ ...prev, targetEmployeeIds: employees.map((e) => e.id) }))}
                  className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFormData((prev) => ({ ...prev, targetEmployeeIds: [] }))}
                  className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
              {employees.map((emp) => {
                const isSelected = periodFormData.targetEmployeeIds.includes(emp.id);
                return (
                  <label key={emp.id} className="flex items-center gap-1.5 text-[11px] p-1 rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPeriodFormData((prev) => ({
                          ...prev,
                          targetEmployeeIds: checked
                            ? [...prev.targetEmployeeIds, emp.id]
                            : prev.targetEmployeeIds.filter((id) => id !== emp.id),
                        }));
                      }}
                    />
                    <span className="truncate">{emp.name} ({emp.code})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tùy biến Tiêu chí Đánh giá */}
          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Bộ Tiêu Chí Đánh Giá ({periodFormData.customCriteria.length} tiêu chí):
              </label>
              <Button
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={() => setIsAddingCrit(!isAddingCrit)}
                className="text-[10px] py-1 px-2"
              >
                {isAddingCrit ? 'Đóng' : 'Thêm tiêu chí mới'}
              </Button>
            </div>

            {/* Form thêm tiêu chí mới */}
            {isAddingCrit && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Tên tiêu chí (VD: Năng lực chuyển đổi số)"
                  value={newCustomCrit.title}
                  onChange={(e) => setNewCustomCrit((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Diễn giải yêu cầu tiêu chí..."
                  value={newCustomCrit.description}
                  onChange={(e) => setNewCustomCrit((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!newCustomCrit.title.trim()) return;
                      const nextId = periodFormData.customCriteria.length + 1;
                      setPeriodFormData((prev) => ({
                        ...prev,
                        customCriteria: [
                          ...prev.customCriteria,
                          {
                            id: nextId,
                            code: `TC${nextId < 10 ? '0' : ''}${nextId}`,
                            title: `${nextId}. ${newCustomCrit.title.trim()}`,
                            description: newCustomCrit.description.trim(),
                            maxScore: 10,
                          },
                        ],
                      }));
                      setNewCustomCrit({ title: '', description: '', maxScore: 10 });
                      setIsAddingCrit(false);
                      toast.success('Đã thêm tiêu chí mới!');
                    }}
                  >
                    Lưu tiêu chí
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
              {periodFormData.customCriteria.map((crit, cIdx) => (
                <div key={crit.id} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate pr-2">{crit.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodFormData((prev) => ({
                        ...prev,
                        customCriteria: prev.customCriteria.filter((_, idx) => idx !== cIdx),
                      }));
                    }}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    title="Xóa tiêu chí này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: In Biên Bản Tổng Kết A4 Chuẩn Mực */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Biên Bản Tổng Hợp Lấy Phiếu Tín Nhiệm (Khổ A4)"
        subtitle="Mẫu in văn bản hành chính Quỹ Tín Dụng Nhân Dân Yên Thọ"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>Đóng</Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => window.print()}
            >
              In văn bản ngay (Ctrl + P)
            </Button>
          </div>
        }
      >
        <div className="p-6 bg-white text-slate-900 space-y-6 font-serif border border-slate-200 rounded-xl shadow-xs print:m-0 print:border-none">
          {/* Header Quốc hiệu & Đơn vị */}
          <div className="flex justify-between text-center pb-4 border-b border-slate-300">
            <div>
              <div className="text-xs uppercase font-bold">QUỸ TÍN DỤNG NHÂN DÂN YÊN THỌ</div>
              <div className="text-[10px] text-slate-600">Thôn Tân Lộc, xã Quý Lộc, Thanh Hóa</div>
              <div className="text-[10px] font-bold mt-1">Số: ..... /BB-QTDYT</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="text-[10px] font-bold italic underline">Độc lập - Tự do - Hạnh phúc</div>
              <div className="text-[10px] text-slate-500 italic mt-1">Quý Lộc, ngày ... tháng ... năm 2026</div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-black uppercase tracking-wide">
              BIÊN BẢN TỔNG HỢP KẾT QUẢ LẤY PHIẾU TÍN NHIỆM
            </h3>
            <p className="text-xs italic text-slate-600">
              Đợt: {currentPeriod?.name} (Hình thức: {isAnonymousByPolicy ? 'Bỏ phiếu kín' : 'Công khai'})
            </p>
          </div>

          {/* Bảng điểm A4 */}
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-slate-300 p-2 w-10">STT</th>
                <th className="border border-slate-300 p-2">Họ và tên cán bộ</th>
                <th className="border border-slate-300 p-2">Chức danh</th>
                <th className="border border-slate-300 p-2">Phòng ban</th>
                <th className="border border-slate-300 p-2 w-20">Điểm TB</th>
                <th className="border border-slate-300 p-2 w-24">Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.leaderboard.map((item, idx) => (
                <tr key={item.id}>
                  <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 font-bold">{item.name}</td>
                  <td className="border border-slate-300 p-2">{item.position}</td>
                  <td className="border border-slate-300 p-2">{item.department}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-[#0f766e]">{item.avgScore}</td>
                  <td className="border border-slate-300 p-2 text-center">{item.classification}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Chữ ký 3 bên */}
          <div className="grid grid-cols-3 text-center pt-8 text-xs font-bold gap-4">
            <div>
              <span>TRƯỞNG BAN KIỂM SOÁT</span>
              <div className="h-16"></div>
              <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
            </div>
            <div>
              <span>GIÁM ĐỐC ĐIỀU HÀNH</span>
              <div className="h-16"></div>
              <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
            </div>
            <div>
              <span>CHỦ TỊCH HỘI ĐỒNG QUẢN TRỊ</span>
              <div className="h-16"></div>
              <span className="italic font-normal">(Ký và ghi rõ họ tên)</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrustEvaluation;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Award, 
  CheckCircle2, 
  Send, 
  History, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Clock, 
  Building,
  HelpCircle,
  Calendar,
  Settings,
  PlusCircle,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  TRUST_CRITERIA, 
  INITIAL_EMPLOYEES,
  EVALUATION_PERIODS 
} from '../lib/mockData';
import { 
  saveTrustEvaluation, 
  subscribeTrustEvaluations, 
  subscribeEmployees,
  subscribeEvaluationPeriods,
  saveEvaluationPeriod,
  updateEvaluationPeriod
} from '../lib/services';
import { PERMISSIONS, hasPermission } from '../lib/permissions';
import { formatDateVN, formatDateTimeVN, formatDateRangeVN } from '../lib/dateUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import RatingInput from '../components/common/RatingInput';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const TrustEvaluation = () => {
  const { currentUser, role } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [periods, setPeriods] = useState(EVALUATION_PERIODS);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Quản lý Modal Đợt đánh giá
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);
  const [submittingPeriod, setSubmittingPeriod] = useState(false);
  const [newPeriodForm, setNewPeriodForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    quarter: 3,
    votingMode: 'ANONYMOUS', // 'ANONYMOUS' hoặc 'IDENTIFIED'
    startDate: '',
    endDate: '',
    description: '',
  });

  // 10 tiêu chí mặc định điểm là 8
  const [scores, setScores] = useState(() => {
    const initial = {};
    TRUST_CRITERIA.forEach((c) => {
      initial[c.id] = 8;
    });
    return initial;
  });

  // Filter cho bảng lịch sử
  const [filterDept, setFilterDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);

  // Quyền quản lý đợt đánh giá (Chủ tịch HĐQT, Ban Giám đốc)
  const canManagePeriods = useMemo(() => {
    return hasPermission(role, PERMISSIONS.TRUST_MANAGE_PERIODS) || role === 'chairman' || role === 'manager';
  }, [role]);

  // Subscribe danh sách nhân sự
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      if (list && list.length > 0) setEmployees(list);
    });
    return () => unsub();
  }, []);

  // Subscribe danh sách đợt đánh giá
  useEffect(() => {
    const unsub = subscribeEvaluationPeriods((list) => {
      if (list && list.length > 0) {
        setPeriods(list);
        // Tự động chọn đợt ACTIVE hoặc đợt đầu tiên nếu chưa chọn
        setSelectedPeriodId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          const active = list.find((p) => p.status === 'ACTIVE') || list[0];
          return active ? active.id : '';
        });
      }
    });
    return () => unsub();
  }, []);

  // Subscribe evaluations_trust real-time
  useEffect(() => {
    setLoadingHistory(true);
    const unsub = subscribeTrustEvaluations((data) => {
      setEvaluations(data || []);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, []);

  // Thông tin Đợt đánh giá hiện tại đang được chọn
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0];
  }, [periods, selectedPeriodId]);

  // Hình thức Ẩn danh / Công khai: Hoàn toàn do Ban Quản trị quyết định ở cấp Đợt
  const isAnonymousByPolicy = useMemo(() => {
    if (!currentPeriod) return true;
    return currentPeriod.votingMode === 'ANONYMOUS' || currentPeriod.votingMode === 'ANONYMOUS_ONLY';
  }, [currentPeriod]);

  // Danh sách nhân sự có thể đánh giá (loại trừ chính bản thân người đăng nhập)
  const evaluatableEmployees = useMemo(() => {
    return employees.filter((e) => e.email !== currentUser?.email && e.id !== currentUser?.id);
  }, [employees, currentUser]);

  // Thông tin nhân sự đang được chọn
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === targetEmployeeId);
  }, [employees, targetEmployeeId]);

  // Tính tổng điểm từ 10 tiêu chí (Sum 0-100)
  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [scores]);

  // Phân loại xếp loại tín nhiệm theo quy chế Quỹ:
  // >= 90: Xuất sắc, >= 70: Tốt, >= 50: Hoàn thành, < 50: Không hoàn thành
  const classification = useMemo(() => {
    if (totalScore >= 90) return { label: 'Xuất sắc', variant: 'xuat-sac' };
    if (totalScore >= 70) return { label: 'Tốt', variant: 'tot' };
    if (totalScore >= 50) return { label: 'Hoàn thành', variant: 'hoan-thanh' };
    return { label: 'Không hoàn thành', variant: 'khong-hoan-thanh' };
  }, [totalScore]);

  const handleScoreChange = (criteriaId, value) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: value,
    }));
  };

  // Nộp phiếu đánh giá
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetEmployeeId) {
      toast.error('Vui lòng chọn cán bộ cần đánh giá tín nhiệm!');
      return;
    }

    if (currentPeriod?.status === 'CLOSED') {
      toast.error('Đợt đánh giá này đã kết thúc. Vui lòng liên hệ Ban Quản trị để mở đợt mới!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        periodId: currentPeriod?.id || 'PERIOD-CURRENT',
        periodName: currentPeriod?.name || 'Đợt đánh giá định kỳ',
        evaluatorId: currentUser.uid || currentUser.id,
        // Tên hiển thị người chấm: Tự động khóa theo quyết định của Ban Quản trị
        evaluatorName: isAnonymousByPolicy ? 'Cán bộ Quỹ (Ẩn danh)' : currentUser.name,
        evaluatorRole: isAnonymousByPolicy ? 'Ẩn danh' : role,
        targetEmployeeId,
        targetEmployeeName: selectedEmployee.name,
        targetDepartment: selectedEmployee.department,
        scores,
        totalScore,
        classification: classification.label,
        notes: notes.trim(),
        isAnonymous: isAnonymousByPolicy, // Quyết định ở cấp Đợt
      };

      await saveTrustEvaluation(payload);
      toast.success(
        `Đã lưu phiếu đánh giá tín nhiệm cho đ/c ${selectedEmployee.name} (${totalScore} điểm - ${classification.label}) thuộc đợt [${currentPeriod?.name}] theo hình thức [${
          isAnonymousByPolicy ? 'Bỏ phiếu kín (Ẩn danh)' : 'Định danh công khai'
        }]!`
      );

      // Reset form
      setTargetEmployeeId('');
      setNotes('');
      const resetScores = {};
      TRUST_CRITERIA.forEach((c) => {
        resetScores[c.id] = 8;
      });
      setScores(resetScores);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu đánh giá. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setSubmitting(false);
    }
  };

  // Chuyển đổi nhanh hình thức Ẩn danh <-> Công khai của Đợt
  const handleTogglePeriodVotingMode = async (period) => {
    const newMode = (period.votingMode === 'ANONYMOUS' || period.votingMode === 'ANONYMOUS_ONLY') 
      ? 'IDENTIFIED' 
      : 'ANONYMOUS';
    try {
      await updateEvaluationPeriod(period.id, { votingMode: newMode });
      toast.success(
        `Đã chuyển hình thức đợt [${period.name}] sang: ${
          newMode === 'ANONYMOUS' ? 'BỎ PHIẾU KÍN (ẨN DANH)' : 'ĐỊNH DANH (CÔNG KHAI)'
        }`
      );
    } catch (err) {
      toast.error('Không thể cập nhật cấu hình đợt đánh giá.');
    }
  };

  // Chuyển đổi trạng thái Đợt: ACTIVE <-> CLOSED
  const handleTogglePeriodStatus = async (period) => {
    const newStatus = period.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await updateEvaluationPeriod(period.id, { status: newStatus });
      toast.success(`Đã cập nhật trạng thái đợt [${period.name}] sang: ${newStatus === 'ACTIVE' ? 'ĐANG DIỄN RA' : 'ĐÃ ĐÓNG'}`);
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái đợt.');
    }
  };

  // Tạo đợt đánh giá mới
  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    if (!newPeriodForm.name.trim()) {
      toast.error('Vui lòng nhập tên đợt đánh giá!');
      return;
    }

    setSubmittingPeriod(true);
    try {
      const generatedId = `PERIOD-${newPeriodForm.year}-Q${newPeriodForm.quarter}-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: generatedId,
        name: newPeriodForm.name.trim(),
        year: Number(newPeriodForm.year),
        quarter: Number(newPeriodForm.quarter),
        votingMode: newPeriodForm.votingMode,
        status: 'ACTIVE',
        startDate: newPeriodForm.startDate || new Date().toISOString().split('T')[0],
        endDate: newPeriodForm.endDate || '',
        description: newPeriodForm.description.trim(),
      };

      await saveEvaluationPeriod(payload);
      setSelectedPeriodId(generatedId);
      setShowNewPeriodForm(false);
      setNewPeriodForm({
        name: '',
        year: new Date().getFullYear(),
        quarter: 3,
        votingMode: 'ANONYMOUS',
        startDate: '',
        endDate: '',
        description: '',
      });
      toast.success(`Đã ban hành thành công đợt đánh giá: [${payload.name}]!`);
    } catch (err) {
      toast.error('Không thể tạo đợt đánh giá mới. Vui lòng kiểm tra lại!');
    } finally {
      setSubmittingPeriod(false);
    }
  };

  // Lọc danh sách lịch sử đánh giá
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchDept = filterDept === 'ALL' || item.targetDepartment === filterDept;
      const matchSearch =
        !searchTerm.trim() ||
        item.targetEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.periodName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [evaluations, filterDept, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phân hệ Nghiệp vụ A • Quỹ TDND Yên Thọ</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Đánh Giá Tín Nhiệm Cán Bộ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thực hiện bỏ phiếu đánh giá định kỳ 10 tiêu chí đạo đức, nghiệp vụ & hiệu quả công tác
          </p>
        </div>

        {/* Current User Rating Banner & Admin Action */}
        <div className="flex items-center gap-3">
          {canManagePeriods && (
            <Button
              variant="outline"
              size="sm"
              icon={Settings}
              onClick={() => setIsPeriodModalOpen(true)}
              className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50"
            >
              Cấu hình Đợt Đánh Giá
            </Button>
          )}

          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-left text-xs">
              <span className="text-slate-400 block text-[10px]">Cán bộ thực hiện:</span>
              <span className="font-bold text-slate-800">{currentUser?.name}</span>
              <span className="text-teal-700 font-semibold block text-[11px]">
                {currentUser?.position}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Evaluation 10 Criteria (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Lựa chọn Đợt & Quy Chế Của Ban Quản Trị */}
          <Card className="border-teal-200 bg-white shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0f766e]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Đợt đánh giá áp dụng:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  >
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.status === 'CLOSED' ? '(Đã đóng)' : p.status === 'UPCOMING' ? '(Sắp diễn ra)' : '(Đang mở)'}
                      </option>
                    ))}
                  </select>

                  {canManagePeriods && (
                    <button
                      type="button"
                      onClick={() => setIsPeriodModalOpen(true)}
                      className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Quản lý & Cấu hình Đợt đánh giá"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Banner Quyết định của Ban Quản trị: Ẩn danh hay Công khai */}
              {isAnonymousByPolicy ? (
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/70 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-300 text-[#0f766e] flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-teal-950 flex items-center gap-2">
                      <span>QUY CHẾ BỎ PHIẾU KÍN (ẨN DANH) THEO QUYẾT ĐỊNH CỦA BAN QUẢN TRỊ</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900 font-bold uppercase">
                        Bảo mật 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">
                      Theo quyết định ban hành đợt của Ban Quản trị Quỹ, toàn bộ phiếu đánh giá trong đợt này tự động được mã hóa danh tính người chấm. Tên người đánh giá sẽ lưu là <strong>"Cán bộ Quỹ (Ẩn danh)"</strong> để đảm bảo sự khách quan, dân chủ và bảo vệ quyền lợi chính đáng của cán bộ.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Unlock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                      <span>HÌNH THỨC ĐỊNH DANH (CÔNG KHAI) THEO QUYẾT ĐỊNH CỦA BAN QUẢN TRỊ</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 font-bold uppercase">
                        Công khai minh bạch
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                      Đợt đánh giá này được Ban Quản trị quyết định thực hiện theo hình thức Công khai định danh. Phiếu nộp sẽ ghi nhận rõ ràng họ tên và chức danh: <strong>{currentUser?.name} ({currentUser?.position})</strong> nhằm nâng cao tinh thần trách nhiệm xây dựng nội bộ cơ quan.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Form Đánh Giá 10 Tiêu Chí */}
          <Card className="border-teal-100 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0f766e]" />
                    Chọn cán bộ cần đánh giá <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Chỉ hiển thị các đồng chí trong cơ quan
                  </span>
                </div>

                <Select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  placeholder="-- Chọn đồng chí được đánh giá tín nhiệm --"
                  options={evaluatableEmployees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.name} (${emp.code}) - ${emp.position} [${emp.department}]`,
                  }))}
                  required
                />

                {selectedEmployee && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-teal-100 border border-teal-300 text-[#0f766e] flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                      {selectedEmployee.avatar ? (
                        <img
                          src={selectedEmployee.avatar}
                          alt={selectedEmployee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedEmployee.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm">
                        {selectedEmployee.name}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          (Mã: {selectedEmployee.code})
                        </span>
                      </div>
                      <div className="text-xs text-[#0f766e] font-medium">
                        {selectedEmployee.position} • {selectedEmployee.department}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 10 Criteria Inputs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0f766e]" />
                    10 Tiêu chí đánh giá tín nhiệm (Thang điểm 0 - 10)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Tối đa 100 điểm
                  </span>
                </div>

                <div className="space-y-3.5">
                  {TRUST_CRITERIA.map((criterion) => (
                    <RatingInput
                      key={criterion.id}
                      label={criterion.title}
                      description={criterion.description}
                      value={scores[criterion.id] || 0}
                      onChange={(newScore) => handleScoreChange(criterion.id, newScore)}
                    />
                  ))}
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nhận xét & Ý kiến đóng góp thêm (Tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi nhận các mặt ưu điểm nổi bật, tinh thần trách nhiệm hoặc các điểm cần đồng chí tiếp tục phát huy..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Hình thức áp dụng: <span className="font-bold text-slate-800">{isAnonymousByPolicy ? 'Bỏ phiếu kín (Ẩn danh)' : 'Công khai (Định danh)'}</span>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  icon={Send}
                  iconPosition="right"
                  className="w-full sm:w-auto font-bold px-8 shadow-md shadow-[#0f766e]/30"
                >
                  Xác nhận nộp phiếu đánh giá
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Sticky Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Real-time Score Calculator Card */}
          <Card className="border-teal-200 bg-gradient-to-b from-teal-50/50 via-white to-white shadow-md">
            <div className="text-center pb-5 border-b border-teal-100">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                Tổng điểm đánh giá tín nhiệm
              </span>
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-5xl font-black text-[#0f766e] tracking-tight">
                  {totalScore}
                </span>
                <span className="text-slate-400 font-bold text-base">/ 100</span>
              </div>

              <div className="mt-3">
                <Badge variant={classification.variant} size="lg" dot>
                  Xếp loại: {classification.label}
                </Badge>
              </div>
            </div>

            {/* Classification Rules Scale */}
            <div className="mt-5 space-y-2.5 text-xs">
              <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Khung phân loại tín nhiệm QTDND:
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                  <span>90 - 100 điểm:</span>
                  <span className="font-bold">Xuất sắc</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50 text-teal-800 font-medium">
                  <span>70 - 89 điểm:</span>
                  <span className="font-bold">Tốt</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800 font-medium">
                  <span>50 - 69 điểm:</span>
                  <span className="font-bold">Hoàn thành</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 text-rose-800 font-medium">
                  <span>Dưới 50 điểm:</span>
                  <span className="font-bold">Không hoàn thành</span>
                </div>
              </div>
            </div>

            {/* Thông tin đợt đánh giá hiện hành */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span>Đợt đánh giá:</span>
                <span className="font-bold text-slate-800">{currentPeriod?.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className={`font-bold ${isAnonymousByPolicy ? 'text-teal-700' : 'text-blue-700'}`}>
                  {isAnonymousByPolicy ? 'Bỏ phiếu kín (Ẩn danh)' : 'Công khai (Định danh)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Thời hạn đợt:</span>
                <span className="font-medium text-slate-700">
                  {formatDateRangeVN(currentPeriod?.startDate, currentPeriod?.endDate)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Lịch Sử Các Lượt Đánh Giá Gần Đây */}
      <Card title="Lịch Sử Bỏ Phiếu Đánh Giá Tín Nhiệm">
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên cán bộ, đợt..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                />
              </div>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
              >
                <option value="ALL">Tất cả phòng ban</option>
                <option value="Ban Giám đốc">Ban Giám đốc</option>
                <option value="Phòng Tín dụng">Phòng Tín dụng</option>
                <option value="Phòng Kế toán - Ngân quỹ">Phòng Kế toán - Ngân quỹ</option>
                <option value="Ban Kiểm soát">Ban Kiểm soát</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Tổng số: <strong className="text-slate-800">{filteredEvaluations.length}</strong> phiếu
            </div>
          </div>

          {/* Evaluations Table */}
          {loadingHistory ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có dữ liệu phiếu đánh giá tín nhiệm nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">Cán bộ được đánh giá</th>
                    <th className="py-3 px-3">Phòng ban</th>
                    <th className="py-3 px-3">Đợt đánh giá</th>
                    <th className="py-3 px-3">Người đánh giá</th>
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
                      </td>
                      <td className="py-3 px-3 text-slate-600">{item.targetDepartment}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {item.periodName || 'Định kỳ'}
                      </td>
                      <td className="py-3 px-3">
                        {item.isAnonymous ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold text-[11px] border border-teal-200">
                            <Lock className="w-3 h-3" />
                            {item.evaluatorName}
                          </span>
                        ) : (
                          <span className="text-slate-800 font-medium">
                            {item.evaluatorName}{' '}
                            <span className="text-slate-400 text-[10px]">
                              ({item.evaluatorRole})
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-sm text-[#0f766e]">
                          {item.totalScore}
                        </span>
                        <span className="text-slate-400 text-[10px]"> / 100</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.classification === 'Xuất sắc'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.classification === 'Tốt'
                              ? 'bg-teal-100 text-teal-800'
                              : item.classification === 'Hoàn thành'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {formatDateTimeVN(item.createdAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEvaluation(item)}
                          className="text-[#0f766e] hover:text-teal-900 font-bold hover:underline inline-flex items-center gap-1"
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

      {/* Modal View Details of an Evaluation */}
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
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Cán bộ được đánh giá:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedEvaluation.targetEmployeeName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Phòng ban:</span>
                <span className="font-semibold text-slate-800">
                  {selectedEvaluation.targetDepartment}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Hình thức phiếu:</span>
                <span className="font-bold text-slate-800">
                  {selectedEvaluation.isAnonymous ? 'Bỏ phiếu kín (Ẩn danh)' : 'Công khai (Định danh)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tổng điểm & Xếp loại:</span>
                <span className="font-bold text-[#0f766e] text-sm">
                  {selectedEvaluation.totalScore} điểm
                </span>{' '}
                - <span className="font-semibold">{selectedEvaluation.classification}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">
                Chi tiết điểm 10 tiêu chí:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRUST_CRITERIA.map((criterion) => {
                  const score = selectedEvaluation.scores?.[criterion.id] ?? 0;
                  return (
                    <div
                      key={criterion.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between"
                    >
                      <span className="text-slate-700 font-medium pr-2 truncate">
                        {criterion.title}
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold text-slate-900 bg-slate-100 shrink-0">
                        {score} / 10
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedEvaluation.notes && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                <span className="font-bold text-teal-900 block mb-1">
                  Ý kiến nhận xét:
                </span>
                <p className="text-teal-800 italic">{selectedEvaluation.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Quản Lý & Cấu Hình Đợt Đánh Giá (Ban Quản Trị / Lãnh Đạo) */}
      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title="Quản Lý & Cấu Hình Đợt Đánh Giá Tín Nhiệm"
        subtitle="Ban Quản trị quyết định linh hoạt hình thức: Bỏ phiếu kín (Ẩn danh) hoặc Định danh (Công khai)"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-500">
              Chỉ Chủ tịch HĐQT & Ban Giám đốc có quyền điều chỉnh cấu hình này.
            </span>
            <Button variant="outline" onClick={() => setIsPeriodModalOpen(false)}>
              Đóng cửa sổ
            </Button>
          </div>
        }
      >
        <div className="space-y-6 text-xs">
          {/* Top Actions: Add New Period */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Danh sách các đợt đánh giá tín nhiệm
              </h4>
              <p className="text-slate-500 text-[11px]">
                Thiết lập quy chế bỏ phiếu kín hoặc công khai cho từng kỳ đánh giá của Quỹ
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setShowNewPeriodForm(!showNewPeriodForm)}
            >
              {showNewPeriodForm ? 'Đóng form thêm mới' : 'Ban hành đợt mới'}
            </Button>
          </div>

          {/* Form Tạo Đợt Mới */}
          {showNewPeriodForm && (
            <form onSubmit={handleCreatePeriod} className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-4">
              <h5 className="font-bold text-teal-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#0f766e]" />
                Ban hành Đợt đánh giá tín nhiệm mới
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    Tên đợt đánh giá <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPeriodForm.name}
                    onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Đánh giá tín nhiệm Quý IV / 2026"
                    className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">Năm</label>
                  <input
                    type="number"
                    value={newPeriodForm.year}
                    onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">Kỳ / Quý</label>
                  <select
                    value={newPeriodForm.quarter}
                    onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, quarter: e.target.value }))}
                    className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  >
                    <option value={1}>Quý I</option>
                    <option value={2}>Quý II</option>
                    <option value={3}>Quý III</option>
                    <option value={4}>Quý IV</option>
                  </select>
                </div>
              </div>

              {/* Hình thức bỏ phiếu: Ẩn danh hay Công khai */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Hình thức bỏ phiếu (Do Ban Quản trị quyết định):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors has-checked:border-teal-500 has-checked:bg-teal-50/50">
                    <input
                      type="radio"
                      name="votingMode"
                      value="ANONYMOUS"
                      checked={newPeriodForm.votingMode === 'ANONYMOUS'}
                      onChange={() => setNewPeriodForm((prev) => ({ ...prev, votingMode: 'ANONYMOUS' }))}
                      className="mt-0.5 text-[#0f766e] focus:ring-[#0f766e]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-teal-700" />
                        Bỏ phiếu kín (Ẩn danh)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Bảo mật tuyệt đối họ tên người chấm, phiếu ghi nhận là "Cán bộ Quỹ (Ẩn danh)".
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors has-checked:border-blue-500 has-checked:bg-blue-50/50">
                    <input
                      type="radio"
                      name="votingMode"
                      value="IDENTIFIED"
                      checked={newPeriodForm.votingMode === 'IDENTIFIED'}
                      onChange={() => setNewPeriodForm((prev) => ({ ...prev, votingMode: 'IDENTIFIED' }))}
                      className="mt-0.5 text-blue-600 focus:ring-blue-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5 text-blue-700" />
                        Định danh (Công khai)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Ghi nhận công khai họ tên và chức danh cán bộ thực hiện chấm điểm.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={newPeriodForm.startDate}
                    onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={newPeriodForm.endDate}
                    onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-1">
                  Căn cứ quyết định / Ghi chú
                </label>
                <input
                  type="text"
                  value={newPeriodForm.description}
                  onChange={(e) => setNewPeriodForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="VD: Căn cứ Nghị quyết HĐQT số 24/NQ-QTD ngày 15/09/2026..."
                  className="w-full text-xs p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewPeriodForm(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submittingPeriod}
                  icon={CheckCircle2}
                >
                  Xác nhận ban hành đợt
                </Button>
              </div>
            </form>
          )}

          {/* Bảng Danh Sách Đợt & Nút Toggle Nhanh */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Tên đợt đánh giá</th>
                  <th className="py-2.5 px-3">Kỳ / Năm</th>
                  <th className="py-2.5 px-3">Thời hạn</th>
                  <th className="py-2.5 px-3">Hình thức bỏ phiếu</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Điều chỉnh nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((p) => {
                  const isAnon = p.votingMode === 'ANONYMOUS' || p.votingMode === 'ANONYMOUS_ONLY';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {p.name}
                        {p.id === selectedPeriodId && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                            Đang chọn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        Quý {p.quarter || '—'} / {p.year || '2026'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {formatDateRangeVN(p.startDate, p.endDate)}
                      </td>
                      <td className="py-2.5 px-3">
                        {isAnon ? (
                          <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 text-[11px]">
                            <Lock className="w-3 h-3 text-[#0f766e]" />
                            Bỏ phiếu kín (Ẩn danh)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                            <Unlock className="w-3 h-3 text-blue-600" />
                            Định danh (Công khai)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'UPCOMING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Đang mở' : p.status === 'UPCOMING' ? 'Sắp mở' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePeriodVotingMode(p)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                            isAnon
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                          }`}
                          title="Đổi hình thức Ẩn danh / Công khai"
                        >
                          {isAnon ? 'Đổi sang Công khai' : 'Đổi sang Bỏ phiếu kín'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePeriodStatus(p)}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] border transition-colors ${
                            p.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Đóng đợt' : 'Mở lại'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TrustEvaluation;

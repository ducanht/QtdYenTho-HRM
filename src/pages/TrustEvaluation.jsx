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
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  TRUST_CRITERIA, 
  INITIAL_EMPLOYEES 
} from '../lib/mockData';
import { 
  saveTrustEvaluation, 
  subscribeTrustEvaluations, 
  subscribeEmployees 
} from '../lib/services';
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
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

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

  // Subscribe danh sách nhân sự
  useEffect(() => {
    const unsub = subscribeEmployees((list) => {
      if (list && list.length > 0) setEmployees(list);
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

  // Phân loại xếp loại tín nhiệm theo quy tắc đề bài:
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetEmployeeId) {
      toast.error('Vui lòng chọn cán bộ cần đánh giá tín nhiệm!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        evaluatorId: currentUser.uid || currentUser.id,
        evaluatorName: isAnonymous ? 'Cán bộ Quỹ (Ẩn danh)' : currentUser.name,
        evaluatorRole: isAnonymous ? 'Ẩn danh' : role,
        targetEmployeeId,
        targetEmployeeName: selectedEmployee.name,
        targetDepartment: selectedEmployee.department,
        scores,
        totalScore,
        classification: classification.label,
        notes: notes.trim(),
        isAnonymous,
      };

      await saveTrustEvaluation(payload);
      toast.success(
        `Đã lưu đánh giá tín nhiệm cho đ/c ${selectedEmployee.name} (${totalScore} điểm - ${classification.label}) ${
          isAnonymous ? '[Chế độ Ẩn danh]' : ''
        }!`
      );

      // Reset form
      setTargetEmployeeId('');
      setNotes('');
      setIsAnonymous(false);
      const resetScores = {};
      TRUST_CRITERIA.forEach((c) => {
        resetScores[c.id] = 8;
      });
      setScores(resetScores);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc danh sách lịch sử đánh giá
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
      const matchDept = filterDept === 'ALL' || item.targetDepartment === filterDept;
      const matchSearch =
        !searchTerm.trim() ||
        item.targetEmployeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase());
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
            <span>Phân hệ Nghiệp vụ A</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Đánh Giá Tín Nhiệm Cán Bộ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thực hiện bỏ phiếu đánh giá định kỳ 10 tiêu chí đạo đức, nghiệp vụ & hiệu quả công tác
          </p>
        </div>

        {/* Current User Rating Banner */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-left text-xs">
            <span className="text-slate-400 block text-[10px]">Người thực hiện đánh giá:</span>
            <span className="font-bold text-slate-800">{currentUser?.name}</span>
            <span className="text-teal-700 font-semibold block text-[11px]">
              {currentUser?.position}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Evaluation 10 Criteria (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
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

              {/* Tùy chọn Bỏ phiếu Ẩn danh (Bảo mật danh tính) */}
              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="anonymous-vote-toggle"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#0f766e] focus:ring-[#0f766e] accent-[#0f766e] cursor-pointer"
                />
                <label htmlFor="anonymous-vote-toggle" className="cursor-pointer select-none">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-[#0f766e]" />
                    Bỏ phiếu tín nhiệm ẩn danh (Bảo mật danh tính người chấm)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Khi kích hoạt, hệ thống sẽ ẩn hoàn toàn tên và chức vụ của bạn trên phiếu (hiển thị "Cán bộ Quỹ (Ẩn danh)"), giúp bạn an tâm bày tỏ ý kiến khách quan và trung thực.
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
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

              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  totalScore >= 90
                    ? 'bg-emerald-100/90 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>≥ 90 điểm:</span>
                <span>Xuất sắc (Khen thưởng)</span>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  totalScore >= 70 && totalScore < 90
                    ? 'bg-teal-100/90 border-teal-300 text-teal-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>70 - 89 điểm:</span>
                <span>Tốt (Đạt yêu cầu)</span>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  totalScore >= 50 && totalScore < 70
                    ? 'bg-amber-100/90 border-amber-300 text-amber-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>50 - 69 điểm:</span>
                <span>Hoàn thành nhiệm vụ</span>
              </div>

              <div
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  totalScore < 50
                    ? 'bg-rose-100/90 border-rose-300 text-rose-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>&lt; 50 điểm:</span>
                <span>Không hoàn thành</span>
              </div>
            </div>

            {/* Quick Helper Note */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                Điểm số được tính toán tự động và lưu trữ bảo mật trong cơ sở dữ liệu Firestore
                (bộ sưu tập <code className="text-teal-700 font-mono">evaluations_trust</code>).
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* History Table Section: Evaluations Log */}
      <Card
        title="Lịch Sử Các Lượt Đánh Giá Tín Nhiệm Gần Đây"
        subtitle="Danh sách các phiếu đánh giá đã được gửi vào hệ thống (Cập nhật thời gian thực)"
        action={
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Tổng số: {evaluations.length} lượt
          </span>
        }
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên cán bộ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Phòng ban:
            </span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none"
            >
              <option value="ALL">Tất cả phòng ban</option>
              <option value="Phòng Tín dụng">Phòng Tín dụng</option>
              <option value="Phòng Kế toán - Ngân quỹ">Phòng Kế toán - Ngân quỹ</option>
              <option value="Ban Kiểm soát">Ban Kiểm soát</option>
              <option value="Ban Điều hành">Ban Điều hành</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loadingHistory ? (
          <div className="py-12">
            <Spinner text="Đang tải dữ liệu đánh giá..." />
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Chưa có phiếu đánh giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-6">Cán bộ được đánh giá</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4 text-center">Tổng điểm</th>
                  <th className="py-3 px-4 text-center">Xếp loại</th>
                  <th className="py-3 px-4">Người đánh giá</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-6 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvaluations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {item.targetEmployeeName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.targetDepartment}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                      <span className="text-[#0f766e]">{item.totalScore}</span> / 100
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          item.totalScore >= 90
                            ? 'xuat-sac'
                            : item.totalScore >= 70
                            ? 'tot'
                            : item.totalScore >= 50
                            ? 'hoan-thanh'
                            : 'khong-hoan-thanh'
                        }
                        size="sm"
                      >
                        {item.classification}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        {item.isAnonymous ? (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-semibold italic">
                            <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {item.evaluatorName}
                          </span>
                        ) : (
                          item.evaluatorName
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.isAnonymous ? (
                          <span className="text-[#0f766e] font-medium">Bỏ phiếu kín</span>
                        ) : (
                          `Vai trò: ${item.evaluatorRole}`
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '--'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => setSelectedEvaluation(item)}
                      >
                        Xem
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <span className="text-slate-400 block text-[10px]">Người đánh giá:</span>
                <span className="font-semibold text-slate-800">
                  {selectedEvaluation.evaluatorName} ({selectedEvaluation.evaluatorRole})
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
    </div>
  );
};

export default TrustEvaluation;

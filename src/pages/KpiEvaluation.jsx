import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Award, 
  Send, 
  Filter, 
  Search, 
  Calendar,
  Layers,
  HelpCircle,
  Edit3,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  saveKpiStep1Self, 
  updateKpiStep2Manager, 
  updateKpiStep3Chairman, 
  subscribeKpiEvaluations, 
  calculateKpiFinal,
  subscribeEmployees
} from '../lib/services';
import { INITIAL_EMPLOYEES, ROLES } from '../lib/mockData';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';

const KpiEvaluation = () => {
  const { currentUser, role, isStaff, isManager, isChairman } = useAuth();
  const toast = useToast();

  const [kpiList, setKpiList] = useState([]);
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
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
    setLoading(true);
    const unsub = subscribeKpiEvaluations((data) => {
      setKpiList(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Kiểm tra xem user hiện tại đã gửi Step 1 trong kỳ này chưa
  const myCurrentKpi = useMemo(() => {
    return kpiList.find(
      (k) =>
        (k.employeeId === currentUser?.id || k.employeeId === currentUser?.uid || k.employeeName === currentUser?.name) &&
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
        employeeId: currentUser.uid || currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        position: currentUser.position,
        scoreSelf: scoreNum,
        selfNotes: selfNotes.trim(),
      });
      toast.success('Đã gửi phiếu tự chấm điểm KPI (Bước 1: Trọng số 40%) thành công!');
      setSelfNotes('');
    } catch (err) {
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
        toast.success(`Ban điều hành đã chấm ${scoreNum} điểm cho đ/c ${activeModalItem.employeeName}! Chuyển tiếp tới Chủ tịch HĐQT.`);
      } else if (role === ROLES.CHAIRMAN) {
        const res = await updateKpiStep3Chairman(
          activeModalItem.id,
          scoreNum,
          modalNotes,
          activeModalItem.scoreSelf,
          activeModalItem.scoreManager
        );
        toast.success(
          `Chủ tịch HĐQT đã hoàn tất phê duyệt! Điểm tổng kết tự động: ${res.finalScore} điểm.`
        );
      }
      setActiveModalItem(null);
    } catch (err) {
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Phân hệ Nghiệp vụ B</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Chấm Điểm KPI 3 Cấp (40% - 30% - 30%)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hệ thống quy trình đánh giá kết quả công tác: Tự chấm (40%) → Ban điều hành (30%) → Chủ tịch HĐQT (30%)
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
          <Calendar className="w-4 h-4 text-[#0f766e]" />
          <span className="text-xs font-bold text-slate-700">Kỳ đánh giá:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-bold text-[#0f766e] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="Quý III / 2026">Quý III / 2026</option>
            <option value="Quý IV / 2026">Quý IV / 2026</option>
            <option value="Quý I / 2027">Quý I / 2027</option>
          </select>
        </div>
      </div>

      {/* Formula & Weighting Banner */}
      <Card className="bg-gradient-to-r from-teal-900 via-[#0f766e] to-emerald-800 text-white border-none shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
              Công thức tự động hóa
            </div>
            <h3 className="text-lg font-bold">
              Công Thức Tính Điểm KPI Tổng Kết (Final Score)
            </h3>
            <p className="text-teal-100 text-xs">
              <span className="font-mono font-bold bg-black/20 px-2 py-1 rounded">
                FinalScore = (Self × 0.4) + (Manager × 0.3) + (Chairman × 0.3)
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
              <div className="text-[10px] text-teal-200 font-semibold">Bước 1: Cán bộ</div>
              <div className="text-xl font-black text-white">40%</div>
              <div className="text-[9px] text-teal-300">Tự đánh giá</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
              <div className="text-[10px] text-teal-200 font-semibold">Bước 2: BĐH</div>
              <div className="text-xl font-black text-white">30%</div>
              <div className="text-[9px] text-teal-300">Giám đốc duyệt</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
              <div className="text-[10px] text-teal-200 font-semibold">Bước 3: HĐQT</div>
              <div className="text-xl font-black text-white">30%</div>
              <div className="text-[9px] text-teal-300">Chủ tịch quyết định</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 1 Section for Staff (or any user who hasn't submitted yet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Step 1 Self-Evaluation */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="Bước 1: Cán Bộ Tự Chấm Điểm KPI"
            subtitle={`Kỳ đánh giá: ${period} • Trọng số 40%`}
            className="border-teal-200 shadow-md"
          >
            {myCurrentKpi ? (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đồng chí đã gửi bản tự chấm điểm!</span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold">Điểm tự chấm:</span>{' '}
                    <span className="font-black text-[#0f766e] text-base">
                      {myCurrentKpi.scoreSelf}
                    </span>{' '}
                    / 100
                  </div>
                  <div>
                    <span className="font-semibold">Trạng thái:</span>{' '}
                    <Badge variant={myCurrentKpi.status} size="sm">
                      {myCurrentKpi.status === 'pending_manager' && 'Chờ Ban điều hành chấm'}
                      {myCurrentKpi.status === 'pending_chairman' && 'Chờ Chủ tịch HĐQT chấm'}
                      {myCurrentKpi.status === 'completed' && 'Đã hoàn tất đánh giá'}
                    </Badge>
                  </div>
                  {myCurrentKpi.finalScore !== null && (
                    <div className="pt-2 border-t border-teal-200 font-bold text-teal-900 text-sm">
                      Điểm tổng kết cuối cùng: {myCurrentKpi.finalScore} điểm
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitStep1} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px]">Cán bộ thực hiện:</span>
                  <span className="font-bold text-slate-800 text-sm">{currentUser?.name}</span>
                  <span className="text-teal-700 block font-medium">
                    {currentUser?.position} • {currentUser?.department}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Điểm tự đánh giá (0 - 100) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selfScore}
                      onChange={(e) => setSelfScore(e.target.value)}
                      className="w-24 text-center py-2 px-3 border border-slate-300 rounded-xl text-lg font-black text-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                      required
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selfScore}
                      onChange={(e) => setSelfScore(e.target.value)}
                      className="flex-1 accent-[#0f766e]"
                    />
                    <span className="text-xs font-bold text-slate-500">/ 100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Bản tự nhận xét kết quả công tác
                  </label>
                  <textarea
                    rows={3}
                    value={selfNotes}
                    onChange={(e) => setSelfNotes(e.target.value)}
                    placeholder="Liệt kê chỉ tiêu dư nợ, an toàn kho quỹ, tiến độ hoàn thành các nhiệm vụ được giao trong kỳ..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submittingStep1}
                  icon={Send}
                  iconPosition="right"
                  className="w-full font-bold shadow-md shadow-[#0f766e]/20"
                >
                  Nộp phiếu tự đánh giá KPI
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* Right List: Real-time Multi-step KPI Monitor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="Theo Dõi Tiến Trình Đánh Giá KPI Toàn Đơn Vị"
            subtitle="Cập nhật tiến độ 3 cấp chấm điểm và phê duyệt theo thời gian thực"
          >
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm cán bộ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="pending_manager">Chờ BĐH chấm</option>
                  <option value="pending_chairman">Chờ Chủ tịch chấm</option>
                  <option value="completed">Đã hoàn tất</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12">
                <Spinner text="Đang tải dữ liệu KPI..." />
              </div>
            ) : filteredKpiList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có dữ liệu KPI nào trong kỳ này.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredKpiList.map((item) => {
                  const canManagerScore = isManager && item.status === 'pending_manager';
                  const canChairmanScore = isChairman && item.status === 'pending_chairman';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200/90 hover:border-teal-300 bg-white shadow-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.employeeName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.position} • {item.department}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={item.status} size="sm" dot>
                            {item.status === 'pending_manager' && 'Chờ BĐH chấm'}
                            {item.status === 'pending_chairman' && 'Chờ Chủ tịch chấm'}
                            {item.status === 'completed' && 'Đã hoàn tất'}
                          </Badge>

                          {/* Action Button for Manager or Chairman */}
                          {canManagerScore && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Edit3}
                              onClick={() => openActionModal(item)}
                            >
                              BĐH Chấm (30%)
                            </Button>
                          )}

                          {canChairmanScore && (
                            <Button
                              variant="danger"
                              size="sm"
                              icon={CheckCheck}
                              onClick={() => openActionModal(item)}
                            >
                              Chủ Tịch Phê Duyệt (30%)
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 3 Steps Scoring Progress Display */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                        {/* Step 1 Self (40%) */}
                        <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-100">
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Tự chấm (40%)
                          </div>
                          <div className="text-sm font-black text-[#0f766e]">
                            {item.scoreSelf ?? '--'}
                          </div>
                        </div>

                        {/* Step 2 Manager (30%) */}
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-500 font-semibold">
                            BĐH chấm (30%)
                          </div>
                          <div className="text-sm font-black text-slate-800">
                            {item.scoreManager ?? (
                              <span className="text-amber-500 text-xs font-normal">Chờ</span>
                            )}
                          </div>
                        </div>

                        {/* Step 3 Chairman (30%) */}
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Chủ tịch (30%)
                          </div>
                          <div className="text-sm font-black text-slate-800">
                            {item.scoreChairman ?? (
                              <span className="text-slate-400 text-xs font-normal">Chờ</span>
                            )}
                          </div>
                        </div>

                        {/* Final Score */}
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <div className="text-[10px] text-emerald-800 font-bold">
                            Tổng kết
                          </div>
                          <div className="text-sm font-black text-emerald-700">
                            {item.finalScore !== null && item.finalScore !== undefined
                              ? item.finalScore
                              : '--'}
                          </div>
                        </div>
                      </div>

                      {/* Notes snippet */}
                      {item.selfNotes && (
                        <p className="mt-2 text-[11px] text-slate-500 italic truncate">
                          Tự nhận xét: "{item.selfNotes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal for Manager Step 2 or Chairman Step 3 Scoring */}
      <Modal
        isOpen={Boolean(activeModalItem)}
        onClose={() => setActiveModalItem(null)}
        title={
          role === ROLES.MANAGER
            ? 'Ban Điều Hành Chấm Điểm KPI (Trọng số 30%)'
            : 'Chủ Tịch HĐQT Phê Duyệt & Chấm Điểm (Trọng số 30%)'
        }
        subtitle={`Cán bộ: ${activeModalItem?.employeeName} • ${activeModalItem?.department}`}
        maxWidth="max-w-lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveModalItem(null)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              isLoading={modalSubmitting}
              onClick={handleSaveModalScore}
            >
              Lưu điểm đánh giá
            </Button>
          </div>
        }
      >
        {activeModalItem && (
          <div className="space-y-4 text-xs">
            {/* Previous Step Summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm cán bộ tự chấm (40%):</span>
                <span className="font-bold text-[#0f766e] text-sm">
                  {activeModalItem.scoreSelf} điểm
                </span>
              </div>
              {activeModalItem.scoreManager !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm Ban điều hành đã chấm (30%):</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {activeModalItem.scoreManager} điểm
                  </span>
                </div>
              )}
              {activeModalItem.selfNotes && (
                <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
                  "{activeModalItem.selfNotes}"
                </div>
              )}
            </div>

            {/* Score Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {role === ROLES.MANAGER ? 'Điểm Ban điều hành chấm (0 - 100)' : 'Điểm Chủ tịch HĐQT chấm (0 - 100)'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={modalScore}
                  onChange={(e) => setModalScore(e.target.value)}
                  className="w-24 text-center py-2 px-3 border border-slate-300 rounded-xl text-lg font-black text-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={modalScore}
                  onChange={(e) => setModalScore(e.target.value)}
                  className="flex-1 accent-[#0f766e]"
                />
              </div>
            </div>

            {/* Preview Estimated Final Score if Chairman */}
            {role === ROLES.CHAIRMAN && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Điểm tổng kết dự kiến sau khi lưu:
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {calculateKpiFinal(
                    activeModalItem.scoreSelf,
                    activeModalItem.scoreManager,
                    modalScore
                  )}{' '}
                  <span className="text-xs font-normal text-slate-500">/ 100</span>
                </span>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nhận xét chỉ đạo / Góp ý
              </label>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Ý kiến đánh giá từ cấp quản lý..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KpiEvaluation;

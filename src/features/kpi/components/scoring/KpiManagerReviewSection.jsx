import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Send, 
  RotateCcw, 
  MessageSquare, 
  Loader2
} from 'lucide-react';
import { updateKpiStep2Manager } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';
import KpiStatusBadge from '../shared/KpiStatusBadge';

/**
 * Cấp 2: Màn Hình Thẩm Định Của Trưởng Phòng / Ban Điều Hành (Trọng số 30%)
 */
const KpiManagerReviewSection = ({
  kpiList = [],
  currentUser = null,
  period = '',
  onReviewCompleted
}) => {
  const toast = useToast();

  // Danh sách CBNV thuộc phòng ban của Quản lý đang chờ duyệt (status: 'pending_manager')
  const departmentPendingList = useMemo(() => {
    const userDept = (currentUser?.department || '').trim().toLowerCase();
    const isTopAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'chairman';

    return kpiList.filter((k) => {
      const matchPeriod = !period || k.period === period;
      const isPending = k.status === 'pending_manager';
      if (!matchPeriod || !isPending) return false;

      if (isTopAdmin) return true;
      const itemDept = (k.department || '').trim().toLowerCase();
      return itemDept === userDept || itemDept.includes(userDept) || userDept.includes(itemDept);
    });
  }, [kpiList, currentUser, period]);

  // Cán bộ đang được chọn thẩm định
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  const activeKpi = useMemo(() => {
    if (selectedKpiId) {
      return departmentPendingList.find((k) => k.id === selectedKpiId);
    }
    return departmentPendingList[0] || null;
  }, [departmentPendingList, selectedKpiId]);

  // State điểm và nhận xét của Trưởng phòng cho từng tiêu chí
  const [managerCriteriaScores, setManagerCriteriaScores] = useState({});
  const [managerSummaryNote, setManagerSummaryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khi chuyển cán bộ, đồng bộ form
  React.useEffect(() => {
    if (activeKpi) {
      const selfScores = activeKpi.selfCriteriaScores || activeKpi.criteriaScores || {};
      const initial = {};
      Object.keys(selfScores).forEach((critId) => {
        const item = selfScores[critId];
        initial[critId] = {
          score: typeof item?.score === 'number' ? item.score : 0,
          feedback: ''
        };
      });
      setManagerCriteriaScores(initial);
      setManagerSummaryNote(activeKpi.managerNotes || '');
    }
  }, [activeKpi]);

  // Thay đổi điểm tiêu chí
  const handleScoreChange = (critId, maxScore, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num > maxScore) num = maxScore;
    if (num < 0) num = 0;

    setManagerCriteriaScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        score: num
      }
    }));
  };

  // Thay đổi nhận xét tiêu chí
  const handleFeedbackChange = (critId, text) => {
    setManagerCriteriaScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        feedback: text
      }
    }));
  };

  // Tính tổng điểm thẩm định Cấp 2
  const totalManagerScore = useMemo(() => {
    return Object.values(managerCriteriaScores).reduce((sum, item) => sum + (Number(item?.score) || 0), 0);
  }, [managerCriteriaScores]);

  // Xử lý Duyệt & Chuyển HĐQT
  const handleApprove = async () => {
    if (!activeKpi) return;
    setIsSubmitting(true);
    try {
      await updateKpiStep2Manager(activeKpi.id, {
        scoreManager: totalManagerScore,
        managerNotes: managerSummaryNote.trim(),
        criteriaScores: managerCriteriaScores,
        status: 'pending_chairman'
      });
      toast.success(`Đã thẩm định ${totalManagerScore} điểm cho đ/c ${activeKpi.employeeName}! Chuyển tiếp tới Chủ tịch HĐQT.`);
      if (onReviewCompleted) onReviewCompleted();
    } catch (err) {
      console.error('Lỗi updateKpiStep2Manager:', err);
      toast.error('Có lỗi xảy ra khi lưu kết quả thẩm định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Trả lại yêu cầu giải trình
  const handleReturn = async () => {
    if (!activeKpi) return;
    if (!managerSummaryNote.trim()) {
      toast.error('Vui lòng nêu rõ lý do trả lại trong ô nhận xét chung.');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateKpiStep2Manager(activeKpi.id, {
        scoreManager: totalManagerScore,
        managerNotes: `[Yêu cầu giải trình lại]: ${managerSummaryNote.trim()}`,
        status: 'draft'
      });
      toast.success(`Đã trả lại phiếu cho đ/c ${activeKpi.employeeName} để giải trình bổ sung!`);
      if (onReviewCompleted) onReviewCompleted();
    } catch (err) {
      console.error('Lỗi trả lại phiếu:', err);
      toast.error('Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (departmentPendingList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Không Có Phiếu Chờ Thẩm Định
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Hiện tại toàn bộ cán bộ nhân viên trong phòng ban đã được thẩm định xong hoặc chưa nộp phiếu trong kỳ <span className="font-semibold text-slate-700">{period}</span>.
        </p>
      </div>
    );
  }

  // Danh mục tiêu chí từ snapshot của phiếu
  const criteriaSnapshot = activeKpi?.criteriaSnapshot || [];
  const selfScores = activeKpi?.selfCriteriaScores || activeKpi?.criteriaScores || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Cột trái (4 cols): Danh sách cán bộ đang chờ thẩm định */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Chờ Thẩm Định ({departmentPendingList.length})
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {departmentPendingList.map((item) => {
            const isSelected = activeKpi?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedKpiId(item.id)}
                className={`w-full p-3.5 text-left transition-colors flex items-center justify-between cursor-pointer select-none ${
                  isSelected ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.employeeName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.position || item.department}
                  </div>
                </div>
                <div className="text-right font-numeric">
                  <span className="text-xs text-slate-400 block">Tự chấm</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {item.scoreSelf}đ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cột phải (8 cols): Khung thẩm định đối chiếu chi tiết */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Cán bộ đang chọn */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Thẩm Định: {activeKpi?.employeeName}
              </h3>
              <KpiStatusBadge status={activeKpi?.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phòng: <span className="font-semibold text-slate-700">{activeKpi?.department}</span> • Chức vụ: <span className="font-semibold text-slate-700">{activeKpi?.position}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Cán bộ tự chấm</span>
              <span className="text-lg font-bold text-slate-700 font-numeric">{activeKpi?.scoreSelf}đ</span>
            </div>
            <span className="text-slate-300">→</span>
            <div>
              <span className="text-[10px] text-emerald-700 block uppercase font-bold">BĐH Thẩm định</span>
              <span className="text-2xl font-bold text-emerald-700 font-numeric tabular-nums">{totalManagerScore}đ</span>
            </div>
          </div>
        </div>

        {/* Danh sách tiêu chí đối chiếu */}
        <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
          {criteriaSnapshot.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg">
              Phiếu chưa lưu snapshot tiêu chí con. Quản lý có thể nhập điểm trực tiếp tại ô tổng điểm.
            </div>
          ) : (
            criteriaSnapshot.map((crit) => {
              const selfItem = selfScores[crit.id] || { score: crit.maxScore, note: '' };
              const managerItem = managerCriteriaScores[crit.id] || { score: selfItem.score, feedback: '' };

              return (
                <div key={crit.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-numeric">
                          {crit.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{crit.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{crit.description}</p>
                      
                      {/* Dẫn chứng của cán bộ */}
                      {selfItem.note && (
                        <div className="mt-2 text-xs p-2 rounded bg-white border border-slate-200 text-slate-700">
                          <span className="font-semibold text-slate-500">[Cán bộ giải trình]:</span> {selfItem.note}
                        </div>
                      )}
                    </div>

                    {/* Đối chiếu điểm Tự chấm vs Quản lý chấm */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-start font-numeric">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">Tự chấm</span>
                        <span className="text-xs font-bold text-slate-600">{selfItem.score}đ</span>
                      </div>
                      <span className="text-slate-300">/</span>
                      <div className="text-center">
                        <span className="text-[10px] text-blue-700 block uppercase font-bold">Thẩm định</span>
                        <input
                          type="number"
                          min="0"
                          max={crit.maxScore}
                          step="0.5"
                          value={managerItem.score ?? ''}
                          onChange={(e) => handleScoreChange(crit.id, crit.maxScore, e.target.value)}
                          className="w-16 px-2 py-1 text-center text-sm font-bold text-blue-800 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ô ghi chú nhận xét của Trưởng phòng cho tiêu chí này */}
                  <div>
                    <input
                      type="text"
                      value={managerItem.feedback || ''}
                      onChange={(e) => handleFeedbackChange(crit.id, e.target.value)}
                      placeholder="Ý kiến nhận xét cụ thể của Trưởng phòng về tiêu chí này..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Ô nhận xét chung của Trưởng phòng */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Ý Kiến Thẩm Định Chung Toàn Kỳ & Đề Xuất Lên HĐQT</span>
            </label>
            <textarea
              rows={3}
              value={managerSummaryNote}
              onChange={(e) => setManagerSummaryNote(e.target.value)}
              placeholder="Ghi rõ đánh giá tổng quan, chỉ ra ưu điểm, tồn tại thực tế và đề xuất danh hiệu thi đua..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReturn}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Yêu cầu giải trình lại</span>
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Duyệt & Chuyển HĐQT Phê Chuẩn</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KpiManagerReviewSection;

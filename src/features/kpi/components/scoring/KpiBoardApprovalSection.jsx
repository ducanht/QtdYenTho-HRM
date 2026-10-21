import React, { useState, useMemo } from 'react';
import { 
  CheckCheck, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  Loader2,
  Users
} from 'lucide-react';
import { updateKpiStep3Chairman, calculateKpiFinal } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';
import KpiStatusBadge from '../shared/KpiStatusBadge';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';
import KpiAppealResolutionModal from './KpiAppealResolutionModal';

/**
 * Cấp 3: Màn Hình Đối Chiếu 3 Chiều & Phê Chuẩn Tối Cao Của HĐQT (Trọng số 30%)
 */
const KpiBoardApprovalSection = ({
  kpiList = [],
  currentUser = null,
  period = '',
  onApprovalCompleted
}) => {
  const toast = useToast();

  // Danh sách các phiếu chờ HĐQT phê chuẩn (pending_chairman) hoặc đang khiếu nại (appealed)
  const pendingBoardList = useMemo(() => {
    return kpiList.filter((k) => {
      const matchPeriod = !period || k.period === period;
      const isBoardAction = k.status === 'pending_chairman' || k.status === 'appealed';
      return matchPeriod && isBoardAction;
    });
  }, [kpiList, period]);

  const [selectedKpiId, setSelectedKpiId] = useState(null);
  const activeKpi = useMemo(() => {
    if (selectedKpiId) {
      return pendingBoardList.find((k) => k.id === selectedKpiId);
    }
    return pendingBoardList[0] || null;
  }, [pendingBoardList, selectedKpiId]);

  // State HĐQT chấm điểm
  const [chairmanCriteriaScores, setChairmanCriteriaScores] = useState({});
  const [chairmanSummaryNote, setChairmanSummaryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);

  // Khi chọn cán bộ, đồng bộ điểm mặc định từ cấp 2
  React.useEffect(() => {
    if (activeKpi) {
      const managerScores = activeKpi.managerCriteriaScores || activeKpi.selfCriteriaScores || {};
      const initial = {};
      Object.keys(managerScores).forEach((critId) => {
        const item = managerScores[critId];
        initial[critId] = {
          score: typeof item?.score === 'number' ? item.score : (activeKpi.scoreManager ?? activeKpi.scoreSelf ?? 85),
          feedback: ''
        };
      });
      setChairmanCriteriaScores(initial);
      setChairmanSummaryNote(activeKpi.chairmanNotes || 'HĐQT đồng thuận với kết quả thẩm định của Ban Điều Hành.');
    }
  }, [activeKpi]);

  const handleScoreChange = (critId, maxScore, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num > maxScore) num = maxScore;
    if (num < 0) num = 0;

    setChairmanCriteriaScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        score: num
      }
    }));
  };

  const handleFeedbackChange = (critId, text) => {
    setChairmanCriteriaScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        feedback: text
      }
    }));
  };

  // Tổng điểm HĐQT Cấp 3
  const totalChairmanScore = useMemo(() => {
    return Object.values(chairmanCriteriaScores).reduce((sum, item) => sum + (Number(item?.score) || 0), 0);
  }, [chairmanCriteriaScores]);

  // Điểm Cấp 1 & Cấp 2
  const scoreSelf = activeKpi?.scoreSelf ?? 0;
  const scoreManager = activeKpi?.scoreManager ?? scoreSelf;

  // Tính điểm tổng kết dự kiến
  const { finalScore, classification } = useMemo(() => {
    return calculateKpiFinal(scoreSelf, scoreManager, totalChairmanScore);
  }, [scoreSelf, scoreManager, totalChairmanScore]);

  // Xử lý Phê Chuẩn Chính Thức
  const handleApprove = async () => {
    if (!activeKpi) return;
    setIsSubmitting(true);
    try {
      const res = await updateKpiStep3Chairman(activeKpi.id, {
        scoreChairman: totalChairmanScore,
        chairmanNotes: chairmanSummaryNote.trim(),
        scoreSelf,
        scoreManager,
        criteriaScores: chairmanCriteriaScores
      });
      toast.success(
        `Chủ tịch HĐQT đã phê chuẩn chính thức cho đ/c ${activeKpi.employeeName}! Điểm tổng kết: ${res.finalScore}đ (${res.classification}).`
      );
      if (onApprovalCompleted) onApprovalCompleted();
    } catch (err) {
      console.error('Lỗi updateKpiStep3Chairman:', err);
      toast.error('Có lỗi xảy ra khi phê chuẩn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingBoardList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Không Có Phiếu Chờ HĐQT Phê Chuẩn
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Toàn bộ các phiếu đánh giá KPI trong kỳ <span className="font-semibold text-slate-700">{period}</span> đã được Chủ tịch HĐQT phê chuẩn hoàn tất.
        </p>
      </div>
    );
  }

  const criteriaSnapshot = activeKpi?.criteriaSnapshot || [];
  const selfScores = activeKpi?.selfCriteriaScores || activeKpi?.criteriaScores || {};
  const managerScores = activeKpi?.managerCriteriaScores || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Cột trái (4 cols): Danh sách phiếu chờ duyệt */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              Chờ HĐQT Phê Duyệt ({pendingBoardList.length})
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {pendingBoardList.map((item) => {
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
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{item.employeeName}</span>
                    {item.status === 'appealed' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.department} • {item.position}
                  </div>
                </div>
                <div className="text-right font-numeric">
                  <span className="text-xs text-slate-400 block">BĐH chấm</span>
                  <span className="text-sm font-bold text-blue-700">
                    {item.scoreManager ?? item.scoreSelf}đ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cột phải (8 cols): Đối chiếu 3 chiều và phê chuẩn */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Cán bộ đang chọn */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Phê Chuẩn: {activeKpi?.employeeName}
              </h3>
              <KpiStatusBadge status={activeKpi?.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phòng: <span className="font-semibold text-slate-700">{activeKpi?.department}</span> • Chức vụ: <span className="font-semibold text-slate-700">{activeKpi?.position}</span>
            </p>
          </div>

          {/* Khối Điểm 3 Cấp & Điểm Tổng Kết */}
          <div className="flex items-center gap-2 text-center font-numeric bg-white p-2 rounded-xl border border-slate-200">
            <div className="px-2">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">CB (40%)</span>
              <span className="text-xs font-bold text-slate-600">{scoreSelf}đ</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="px-2">
              <span className="text-[10px] text-blue-700 block uppercase font-bold">BĐH (30%)</span>
              <span className="text-xs font-bold text-blue-700">{scoreManager}đ</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="px-2">
              <span className="text-[10px] text-amber-700 block uppercase font-bold">HĐQT (30%)</span>
              <span className="text-xs font-bold text-amber-700">{totalChairmanScore}đ</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="px-2 bg-emerald-50 rounded-lg">
              <span className="text-[10px] text-emerald-800 block uppercase font-bold">Tổng kết</span>
              <span className="text-base font-bold text-emerald-700">{finalScore}đ</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo khiếu nại nếu có */}
        {activeKpi?.status === 'appealed' && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cán bộ có đơn đề nghị phúc tra lại điểm số: <b>{activeKpi.appealReason}</b></span>
            </div>
            <button
              type="button"
              onClick={() => setIsAppealModalOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Xử lý khiếu nại
            </button>
          </div>
        )}

        {/* Danh sách tiêu chí đối chiếu 3 chiều */}
        <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
          {criteriaSnapshot.length === 0 ? (
            <div className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-lg">
              Phiếu chưa lưu snapshot tiêu chí con. HĐQT có thể xác nhận trực tiếp bằng điểm tổng kết.
            </div>
          ) : (
            criteriaSnapshot.map((crit) => {
              const selfItem = selfScores[crit.id] || { score: crit.maxScore, note: '' };
              const managerItem = managerScores[crit.id] || { score: selfItem.score, feedback: '' };
              const chairmanItem = chairmanCriteriaScores[crit.id] || { score: managerItem.score, feedback: '' };

              return (
                <div key={crit.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-numeric">
                          {crit.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{crit.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{crit.description}</p>
                      
                      {/* Dẫn chứng 2 chiều */}
                      <div className="mt-2 space-y-1 text-xs">
                        {selfItem.note && (
                          <div className="p-1.5 rounded bg-white border border-slate-100 text-slate-700">
                            <span className="font-semibold text-slate-500">[Cán bộ giải trình]:</span> {selfItem.note}
                          </div>
                        )}
                        {managerItem.feedback && (
                          <div className="p-1.5 rounded bg-blue-50/60 border border-blue-100 text-blue-900">
                            <span className="font-semibold text-blue-600">[BĐH nhận xét]:</span> {managerItem.feedback}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Đối chiếu điểm 3 bên */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-start font-numeric">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block uppercase">CB</span>
                        <span className="text-xs font-bold text-slate-600">{selfItem.score}đ</span>
                      </div>
                      <span className="text-slate-300">/</span>
                      <div className="text-center">
                        <span className="text-[10px] text-blue-600 block uppercase">BĐH</span>
                        <span className="text-xs font-bold text-blue-700">{managerItem.score}đ</span>
                      </div>
                      <span className="text-slate-300">/</span>
                      <div className="text-center">
                        <span className="text-[10px] text-amber-700 block uppercase font-bold">HĐQT</span>
                        <input
                          type="number"
                          min="0"
                          max={crit.maxScore}
                          step="0.5"
                          value={chairmanItem.score ?? ''}
                          onChange={(e) => handleScoreChange(crit.id, crit.maxScore, e.target.value)}
                          className="w-16 px-2 py-1 text-center text-sm font-bold text-amber-800 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ý kiến chỉ đạo tiêu chí của HĐQT */}
                  <div>
                    <input
                      type="text"
                      value={chairmanItem.feedback || ''}
                      onChange={(e) => handleFeedbackChange(crit.id, e.target.value)}
                      placeholder="Ý kiến chỉ đạo cụ thể của Chủ tịch HĐQT..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              );
            })
          )}

          {/* Nhận xét chung & Quyết định công nhận */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ý Kiến Chỉ Đạo & Quyết Định Công Nhận Của Chủ Tịch HĐQT</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Xếp loại dự kiến:</span>
                <KpiClassificationBadge classification={classification} score={finalScore} />
              </div>
            </div>
            <textarea
              rows={3}
              value={chairmanSummaryNote}
              onChange={(e) => setChairmanSummaryNote(e.target.value)}
              placeholder="Ghi nhận chỉ đạo của Chủ tịch HĐQT đối với cán bộ trong kỳ tới..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang phê chuẩn...</span>
              </>
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Phê Chuẩn Chính Thức & Khóa Sổ Phiếu</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Xử Lý Khiếu Nại */}
      <KpiAppealResolutionModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        kpiItem={activeKpi}
        currentUser={currentUser}
        onResolved={onApprovalCompleted}
      />
    </div>
  );
};

export default KpiBoardApprovalSection;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  Save, 
  CheckCircle2, 
  HelpCircle, 
  MessageSquare, 
  AlertCircle,
  FileCheck,
  Award
} from 'lucide-react';
import { filterKpiCriteriaByDepartment, calculateKpiFinal } from '../../services/kpiService';
import KpiStatusBadge from '../shared/KpiStatusBadge';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';
import KpiAppealModal from './KpiAppealModal';

/**
 * Cấp 1: Form Cán Bộ Tự Chấm Điểm Chi Tiết Từng Tiêu Chí (Trọng số 40%)
 */
const KpiSelfScoringForm = ({
  period = '',
  currentUser = null,
  myCurrentKpi = null,
  criteriaList = [],
  onSubmitStep1,
  isSubmitting = false
}) => {
  // Lọc tiêu chí động phù hợp với phòng ban của cán bộ
  const departmentCriteria = useMemo(() => {
    return filterKpiCriteriaByDepartment(criteriaList, currentUser?.department);
  }, [criteriaList, currentUser]);

  // Nhóm theo category
  const groupedCriteria = useMemo(() => {
    const groups = {};
    departmentCriteria.forEach((crit) => {
      const cat = crit.category || 'Nghiệp vụ chung';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(crit);
    });
    return groups;
  }, [departmentCriteria]);

  // State lưu điểm và ghi chú chi tiết từng tiêu chí: { [critId]: { score: number, note: string } }
  const [criterionScores, setCriterionScores] = useState({});
  const [summaryNote, setSummaryNote] = useState('');
  const [isAppealOpen, setIsAppealOpen] = useState(false);

  // Khởi tạo điểm mặc định hoặc từ phiếu đã lưu
  useEffect(() => {
    if (myCurrentKpi) {
      setSummaryNote(myCurrentKpi.selfNotes || '');
      const existingScores = myCurrentKpi.selfCriteriaScores || myCurrentKpi.criteriaScores || {};
      setCriterionScores(existingScores);
    } else {
      // Mặc định gán điểm tối đa cho mỗi tiêu chí để cán bộ dễ điều chỉnh
      const initial = {};
      departmentCriteria.forEach((crit) => {
        initial[crit.id] = {
          score: crit.maxScore,
          note: ''
        };
      });
      setCriterionScores(initial);
      setSummaryNote('');
    }
  }, [myCurrentKpi, departmentCriteria]);

  // Thay đổi điểm tiêu chí
  const handleScoreChange = (critId, maxScore, val) => {
    let num = Number(val);
    if (isNaN(num)) num = 0;
    if (num > maxScore) num = maxScore;
    if (num < 0) num = 0;

    setCriterionScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        score: num
      }
    }));
  };

  // Thay đổi ghi chú tiêu chí
  const handleNoteChange = (critId, text) => {
    setCriterionScores((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || {}),
        note: text
      }
    }));
  };

  // Tổng điểm tự chấm
  const totalScoreSelf = useMemo(() => {
    return Object.values(criterionScores).reduce((sum, item) => sum + (Number(item?.score) || 0), 0);
  }, [criterionScores]);

  // Dự kiến xếp loại
  const projectedClassification = useMemo(() => {
    return calculateKpiFinal(totalScoreSelf, totalScoreSelf, totalScoreSelf).classification;
  }, [totalScoreSelf]);

  // Kiểm tra trạng thái đã nộp chưa
  const isSubmitted = myCurrentKpi && myCurrentKpi.status !== 'draft';
  const isCompleted = myCurrentKpi && myCurrentKpi.status === 'completed';

  const handleSubmit = (statusToSubmit = 'pending_manager') => {
    if (onSubmitStep1) {
      onSubmitStep1({
        id: myCurrentKpi?.id,
        period,
        scoreSelf: totalScoreSelf,
        selfNotes: summaryNote.trim(),
        selfCriteriaScores: criterionScores,
        criteriaSnapshot: departmentCriteria, // Snapshot tiêu chí tại thời điểm chấm
        status: statusToSubmit
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Header Khung Tự Chấm */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">
              Bảng Tự Đánh Giá Hiệu Suất KPI (Cấp 1)
            </h3>
            {myCurrentKpi && <KpiStatusBadge status={myCurrentKpi.status} />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cán bộ: <span className="font-semibold text-slate-700">{currentUser?.name}</span> • {currentUser?.department || 'Chung'} • Kỳ: <span className="font-semibold text-slate-700">{period}</span>
          </p>
        </div>

        {/* Điểm tổng kết tự chấm trực quan */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
              Tổng điểm tự chấm
            </span>
            <div className="flex items-baseline gap-1 justify-end font-numeric">
              <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                {totalScoreSelf}
              </span>
              <span className="text-xs text-slate-400">/ 100đ</span>
            </div>
          </div>
          <KpiClassificationBadge classification={projectedClassification} />
        </div>
      </div>

      {/* 2. Form Danh Sách Tiêu Chí Nhóm */}
      <div className="p-4 sm:p-6 space-y-6">
        {Object.keys(groupedCriteria).map((catName) => {
          const list = groupedCriteria[catName];
          return (
            <div key={catName} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{catName}</span>
                </h4>
                <span className="text-xs text-slate-400 font-numeric">
                  ({list.reduce((sum, c) => sum + c.maxScore, 0)} điểm tối đa)
                </span>
              </div>

              <div className="space-y-3">
                {list.map((crit) => {
                  const currentItem = criterionScores[crit.id] || { score: crit.maxScore, note: '' };
                  return (
                    <div 
                      key={crit.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/30 hover:bg-slate-50/70 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-numeric border border-slate-200">
                              {crit.code}
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              {crit.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {crit.description}
                          </p>
                        </div>

                        {/* Ô nhập điểm */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                          <input
                            type="number"
                            min="0"
                            max={crit.maxScore}
                            step="0.5"
                            disabled={isSubmitted}
                            value={currentItem.score ?? ''}
                            onChange={(e) => handleScoreChange(crit.id, crit.maxScore, e.target.value)}
                            className="w-16 px-2.5 py-1.5 text-center text-sm font-bold font-numeric text-emerald-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-600 shadow-2xs"
                          />
                          <span className="text-xs text-slate-400 font-numeric">
                            / {crit.maxScore}đ
                          </span>
                        </div>
                      </div>

                      {/* Ô nhập ghi chú giải trình thành tích cho từng tiêu chí */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-1">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>Giải trình kết quả thực hiện tiêu chí này:</span>
                        </div>
                        <input
                          type="text"
                          disabled={isSubmitted}
                          value={currentItem.note || ''}
                          onChange={(e) => handleNoteChange(crit.id, e.target.value)}
                          placeholder="Nêu rõ dẫn chứng, số liệu cụ thể đạt được..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Tóm tắt & Đề xuất chung toàn kỳ */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tóm Tắt Thành Tích Nổi Bật & Đề Xuất Trong Kỳ</span>
          </label>
          <textarea
            rows={3}
            disabled={isSubmitted}
            value={summaryNote}
            onChange={(e) => setSummaryNote(e.target.value)}
            placeholder="Tự đánh giá tóm tắt về kỷ luật, tinh thần trách nhiệm, sáng kiến và đề xuất nguyện vọng..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        {/* Thông báo nếu đã nộp */}
        {isSubmitted && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Phiếu đã được nộp thành công và đang trong quy trình thẩm định.
                </p>
                <p className="text-blue-700 mt-0.5">
                  Cán bộ có thể theo dõi tiến trình chấm điểm của Trưởng phòng và HĐQT tại Tab &quot;Kết Quả Cá Nhân&quot;.
                </p>
              </div>
            </div>

            {/* Nút gửi đề nghị xem xét lại nếu không hài lòng */}
            {isCompleted && (
              <button
                type="button"
                onClick={() => setIsAppealOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Khiếu nại điểm</span>
              </button>
            )}
          </div>
        )}

        {/* Nút hành động (Lưu nháp / Nộp chính thức) */}
        {!isSubmitted && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Sau khi nộp, phiếu sẽ được chuyển trực tiếp tới Trưởng phòng để thẩm định.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('draft')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Lưu bản nháp</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('pending_manager')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Nộp Phiếu Lên Cấp Trên'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Khiếu Nại / Đề Nghị Phúc Tra */}
      <KpiAppealModal
        isOpen={isAppealOpen}
        onClose={() => setIsAppealOpen(false)}
        kpiItem={myCurrentKpi}
      />
    </div>
  );
};

export default KpiSelfScoringForm;

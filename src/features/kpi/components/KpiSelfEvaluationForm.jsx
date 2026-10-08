import React from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

/**
 * Step 1: Form Cán Bộ Tự Chấm Điểm KPI (Trọng số 40%)
 */
const KpiSelfEvaluationForm = ({
  period,
  currentUser,
  myCurrentKpi,
  selfScore,
  setSelfScore,
  selfNotes,
  setSelfNotes,
  onSubmitStep1,
  isSubmitting
}) => {
  return (
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
            {myCurrentKpi.finalScore !== null && myCurrentKpi.finalScore !== undefined && (
              <div className="pt-2 border-t border-teal-200 font-bold text-teal-900 text-sm">
                Điểm tổng kết cuối cùng: {myCurrentKpi.finalScore} điểm
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmitStep1} className="space-y-4">
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
            isLoading={isSubmitting}
            icon={Send}
            iconPosition="right"
            className="w-full font-bold shadow-md shadow-[#0f766e]/20"
          >
            Nộp phiếu tự đánh giá KPI
          </Button>
        </form>
      )}
    </Card>
  );
};

export default KpiSelfEvaluationForm;

import React from 'react';
import { CheckCircle2, Clock, Save, Send, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * TrustProgressBanner: Hiển thị tiến trình đánh giá của người dùng
 * - TUYỆT ĐỐI KHÔNG hiển thị điểm tổng khi chưa hoàn tất đánh giá
 * - Chỉ phản ánh số lượng cán bộ và tiêu chí đã hoàn thành
 */
const TrustProgressBanner = ({
  totalEmployeesCount = 0,
  completedCriteriaCount = 0,
  totalCriteriaCount = 10,
  overallPercent = 0,
  isFullyReadyToSubmit = false,
  onSaveDraft,
  onSubmitOfficial,
  isDraftSaving = false,
  isSubmitting = false,
  hasDraft = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-teal-800/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Phần bên trái: Thông tin tiến trình */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Tiến độ đánh giá
            </span>
            <span className="text-xs text-slate-300">
              Quy mô: <strong className="text-white">{totalEmployeesCount} cán bộ</strong>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-black text-white">
              Đã hoàn thành {completedCriteriaCount} / {totalCriteriaCount} tiêu chí
            </h3>
            <span className="text-xs font-bold text-teal-400">({overallPercent}%)</span>
          </div>

          {/* Thanh tiến độ */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              style={{ width: `${overallPercent}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-300"
            />
          </div>

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            {isFullyReadyToSubmit ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã hoàn tất đánh giá toàn bộ cán bộ. Sẵn sàng nộp phiếu.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-200/90">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Vui lòng hoàn tất chấm điểm tất cả tiêu chí để nộp phiếu.
              </span>
            )}
          </p>
        </div>

        {/* Phần bên phải: Nút Lưu nháp & Nộp phiếu */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={Save}
            isLoading={isDraftSaving}
            onClick={onSaveDraft}
            className="text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-white/5"
          >
            Lưu nháp
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Send}
            iconPosition="right"
            isLoading={isSubmitting}
            disabled={!isFullyReadyToSubmit}
            onClick={onSubmitOfficial}
            className={`
              text-xs sm:text-sm font-black px-6 shadow-lg transition-all
              ${
                isFullyReadyToSubmit
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50 ring-2 ring-emerald-400'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
              }
            `}
          >
            Nộp phiếu
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrustProgressBanner);

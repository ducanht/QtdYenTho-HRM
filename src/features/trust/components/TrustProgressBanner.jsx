import React from 'react';
import { CheckCircle2, Clock, Send, Cloud } from 'lucide-react';
import Button from '../../../components/common/Button';

/**
 * TrustProgressBanner: Hiển thị tiến trình đánh giá của người dùng
 * - Tự động lưu ngầm vào hệ thống (Zero manual draft saving)
 * - Chặn tuyệt đối không cho nộp phiếu khi chưa hoàn thành 100% đánh giá
 * - TUYỆT ĐỐI KHÔNG hiển thị điểm tổng khi chưa hoàn tất đánh giá
 */
const TrustProgressBanner = ({
  totalEmployeesCount = 0,
  completedCriteriaCount = 0,
  totalCriteriaCount = 10,
  overallPercent = 0,
  isFullyReadyToSubmit = false,
  onSubmitOfficial,
  isSubmitting = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-3.5 sm:p-5 rounded-2xl shadow-md border border-teal-800/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Phần bên trái: Thông tin tiến trình */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Tiến độ đánh giá
            </span>
            <span className="text-xs text-slate-300">
              Quy mô: <strong className="text-white">{totalEmployeesCount} cán bộ</strong>
            </span>

            {/* Chỉ báo tự động lưu ngầm */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Tự động lưu ngầm</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h3 className="text-base sm:text-lg font-black text-white">
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

          <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
            {isFullyReadyToSubmit ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã hoàn tất đánh giá toàn bộ cán bộ. Sẵn sàng nộp phiếu chính thức.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-200/90">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Cần chấm đủ điểm tất cả tiêu chí cho toàn bộ cán bộ mới được nộp phiếu.
              </span>
            )}
          </p>
        </div>

        {/* Phần bên phải: Nút Nộp phiếu (Chặn hoàn toàn nếu chưa hoàn thành) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {isFullyReadyToSubmit ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Send}
              iconPosition="right"
              isLoading={isSubmitting}
              onClick={onSubmitOfficial}
              className="text-xs sm:text-sm font-black px-6 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50 ring-2 ring-emerald-400 animate-pulse"
            >
              Nộp phiếu chính thức
            </Button>
          ) : (
            <div
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-bold flex items-center gap-2 cursor-not-allowed select-none opacity-60"
              title="Đồng chí cần chấm đủ điểm cho toàn bộ cán bộ ở tất cả tiêu chí để có thể nộp phiếu"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chưa hoàn thành ({completedCriteriaCount}/{totalCriteriaCount} tiêu chí)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrustProgressBanner);

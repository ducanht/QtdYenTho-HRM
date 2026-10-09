import React from 'react';
import { CheckCircle2, Clock, Send, Cloud, ExternalLink } from 'lucide-react';
import Button from '../../../components/common/Button';
import { formatDateTimeVN } from '../../../lib/evaluationUtils';

/**
 * TrustProgressBanner: Hiển thị tiến trình đánh giá & Tình trạng nộp phiếu của người dùng
 * - Tự động lưu ngầm vào hệ thống (Zero manual draft saving)
 * - Hiển thị rõ ràng: ĐÃ NỘP PHIẾU CHÍNH THỨC hay CHƯA NỘP PHIẾU
 * - Khi ĐÃ NỘP: Phần gửi phiếu KHÔNG SÁNG (chuyển sang trạng thái tĩnh "Đã nộp phiếu")
 * - Khi CHƯA NỘP và ĐÃ HOÀN TẤT 100%: Nút "Nộp phiếu chính thức" mới sáng xanh sẵn sàng nộp
 */
const TrustProgressBanner = ({
  totalEmployeesCount = 0,
  completedCriteriaCount = 0,
  totalCriteriaCount = 10,
  overallPercent = 0,
  isFullyReadyToSubmit = false,
  onSubmitOfficial,
  isSubmitting = false,
  hasSubmitted = false,
  submittedAt = null,
  onViewSubmittedVotes,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-3.5 sm:p-5 rounded-2xl shadow-md border border-teal-800/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Phần bên trái: Thông tin tiến trình & Tình trạng nộp */}
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Tiến độ đánh giá
            </span>
            <span className="text-xs text-slate-300">
              Quy mô: <strong className="text-white">{totalEmployeesCount} cán bộ</strong>
            </span>

            {/* Chỉ báo tình trạng Nộp phiếu */}
            {hasSubmitted ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ĐÃ NỘP PHIẾU CHÍNH THỨC</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CHƯA NỘP PHIẾU</span>
              </span>
            )}

            {/* Chỉ báo tự động lưu ngầm */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Tự động lưu ngầm</span>
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-base sm:text-lg font-black text-white">
              {hasSubmitted
                ? 'Đã hoàn tất đánh giá toàn diện'
                : `Đã hoàn thành ${completedCriteriaCount} / ${totalCriteriaCount} tiêu chí`}
            </h3>
            <span className="text-xs font-bold text-teal-400">({overallPercent}%)</span>
            {hasSubmitted && submittedAt && (
              <span className="text-xs text-emerald-300/90 font-medium">
                • Lúc {formatDateTimeVN(submittedAt)}
              </span>
            )}
          </div>

          {/* Thanh tiến độ */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
            <div
              style={{ width: `${overallPercent}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-300"
            />
          </div>

          <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
            {hasSubmitted ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Phiếu tín nhiệm của đồng chí đã được ghi nhận an toàn vào cơ sở dữ liệu.</span>
              </span>
            ) : isFullyReadyToSubmit ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Đã hoàn tất đánh giá toàn bộ cán bộ. Sẵn sàng nộp phiếu chính thức.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-200/90">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Cần chấm đủ điểm tất cả tiêu chí cho toàn bộ cán bộ mới được nộp phiếu.
              </span>
            )}
          </div>
        </div>

        {/* Phần bên phải: Nút Nộp phiếu / Trạng thái đã nộp */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 self-start md:self-auto">
          {hasSubmitted ? (
            /* ĐÃ NỘP RỒI: Phần gửi phiếu KHÔNG SÁNG, chuyển sang trạng thái tĩnh hoàn tất */
            <div className="flex flex-col items-center sm:items-end gap-1.5">
              <div
                className="px-5 py-2.5 rounded-xl bg-slate-800/90 border border-emerald-600/50 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 select-none shadow-sm cursor-default"
                title="Đồng chí đã nộp phiếu tín nhiệm thành công cho đợt này"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Đã nộp phiếu</span>
              </div>
              {onViewSubmittedVotes && (
                <button
                  type="button"
                  onClick={onViewSubmittedVotes}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-white underline transition-colors cursor-pointer"
                >
                  <span>Xem phiếu đã nộp</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : isFullyReadyToSubmit ? (
            /* CHƯA NỘP VÀ ĐÃ XONG 100%: Nút nộp phiếu SÁNG xanh rực rỡ + pulse */
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
            /* CHƯA XONG: Nút mờ không bấm được */
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

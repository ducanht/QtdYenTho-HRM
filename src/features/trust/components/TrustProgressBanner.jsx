import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Cloud, 
  ExternalLink, 
  Calendar, 
  Lock, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { formatDateTimeVN } from '../../../lib/evaluationUtils';

/**
 * TrustProgressBanner: Cột Phải - Hiển thị Thông tin Đợt Đánh Giá & Tiến Trình Nộp Phiếu
 * - Đồng bộ trực tiếp 100% với Đợt được chọn ở Cột Trái (PeriodMasterSidebar)
 * - Hiển thị nổi bật Tên đợt, Quý/Năm, Thời gian và Trạng thái (Đang mở, Sắp diễn ra, Đã đóng)
 * - Tự động lưu ngầm vào hệ thống (Zero manual draft saving)
 * - Xử lý thông minh trạng thái UPCOMING / CLOSED để người dùng luôn nhận biết rõ ràng
 */
const TrustProgressBanner = ({
  currentPeriod = null,
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
  const isUpcoming = currentPeriod?.status === 'UPCOMING';
  const isClosed = currentPeriod?.status === 'CLOSED';
  const isActive = currentPeriod?.status === 'ACTIVE' || (!isUpcoming && !isClosed);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-teal-800/40 space-y-4">
      {/* 1. KHỐI THÔNG TIN ĐỢT ĐANG CHỌN (ĐỒNG BỘ 100% CỘT TRÁI) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-teal-800/40">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Calendar className="w-3 h-3 text-teal-400" />
              <span>ĐỢT ĐANG ĐÁNH GIÁ</span>
            </span>

            {/* Trạng thái đợt */}
            {isUpcoming ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>SẮP DIỄN RA</span>
              </span>
            ) : isClosed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-700/60 border border-slate-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>ĐÃ ĐÓNG CỔNG</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>ĐANG MỞ CỔNG BỎ PHIẾU</span>
              </span>
            )}

            {/* Chế độ bỏ phiếu */}
            <span className="text-[11px] text-teal-200/80 bg-teal-900/40 border border-teal-700/40 px-2 py-0.5 rounded-full font-medium">
              {currentPeriod?.votingMode === 'ANONYMOUS' || currentPeriod?.votingMode === 'ANONYMOUS_ONLY'
                ? 'Bỏ phiếu kín 100%'
                : 'Bỏ phiếu công khai'}
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-black text-white tracking-tight">
            {currentPeriod?.name || 'Đợt Đánh Giá Tín Nhiệm'}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <span>
              Kỳ: <strong className="text-teal-300">Quý {currentPeriod?.quarter || 4} / {currentPeriod?.year || 2026}</strong>
            </span>
            {currentPeriod?.startDate && (
              <>
                <span className="text-slate-500">•</span>
                <span>
                  Thời gian: <strong className="text-slate-200">{currentPeriod.startDate}</strong> đến <strong className="text-slate-200">{currentPeriod.endDate || 'Chưa định'}</strong>
                </span>
              </>
            )}
            <span className="text-slate-500">•</span>
            <span>
              Quy mô đối tượng: <strong className="text-white">{totalEmployeesCount} cán bộ</strong>
            </span>
          </div>
        </div>

        {/* Chỉ báo đã lưu tự động */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tự động lưu ngầm</span>
          </span>
        </div>
      </div>

      {/* 2. DẢI CẢNH BÁO CHO ĐỢT CHƯA MỞ HOẶC ĐÃ ĐÓNG */}
      {isUpcoming && (
        <div className="bg-amber-500/15 border border-amber-400/40 rounded-xl p-3 text-amber-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          <div className="leading-relaxed">
            <strong>Đợt đánh giá chưa đến thời gian mở cổng lấy phiếu:</strong> Dự kiến diễn ra từ ngày <strong className="text-white underline">{currentPeriod?.startDate}</strong> đến <strong className="text-white underline">{currentPeriod?.endDate || 'cuối kỳ'}</strong>. Cán bộ hiện có thể xem trước danh sách đối tượng và 10 tiêu chí đánh giá.
          </div>
        </div>
      )}

      {isClosed && (
        <div className="bg-slate-800/80 border border-slate-600/50 rounded-xl p-3 text-slate-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="leading-relaxed">
            <strong>Đợt đánh giá này đã chính thức kết thúc/đóng cổng lấy phiếu:</strong> Hạn chót lấy phiếu đã kết thúc vào ngày <strong className="text-white underline">{currentPeriod?.endDate || 'kỳ trước'}</strong>. Phiếu tín nhiệm đã được khóa an toàn vào CSDL.
          </div>
        </div>
      )}

      {/* 3. TIẾN ĐỘ CHẤM ĐIỂM & NÚT NỘP PHIẾU */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Phần bên trái: Thanh tiến độ & Thông tin số tiêu chí */}
        <div className="space-y-2 flex-1 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
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

            <span className="text-xs font-bold text-white">
              {hasSubmitted
                ? 'Đã hoàn thành đánh giá'
                : `Đã hoàn thành ${completedCriteriaCount} / ${totalCriteriaCount} tiêu chí`}
            </span>
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
                <span>Phiếu tín nhiệm đã được nộp thành công cho đợt này.</span>
              </span>
            ) : isFullyReadyToSubmit ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Đã hoàn thành đánh giá tất cả cán bộ. Sẵn sàng nộp phiếu.
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-200/90">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                {isUpcoming
                  ? 'Đợt chưa mở cổng nộp phiếu. Cán bộ có thể thử nghiệm cho điểm hoặc xem tiêu chí.'
                  : isClosed
                  ? 'Đợt đã đóng cổng, không nhận thêm phiếu mới.'
                  : 'Vui lòng chấm đủ điểm các tiêu chí cho toàn bộ cán bộ để nộp phiếu.'}
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
          ) : isUpcoming ? (
            /* ĐỢT SẮP DIỄN RA: Nút thông báo chưa mở */
            <div
              className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-not-allowed select-none"
              title="Đợt đánh giá chưa đến thời gian mở cổng lấy phiếu"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Chờ mở cổng (từ {currentPeriod?.startDate || '...'})</span>
            </div>
          ) : isClosed ? (
            /* ĐỢT ĐÃ ĐÓNG: Nút thông báo đã kết thúc */
            <div
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-bold flex items-center gap-2 cursor-not-allowed select-none opacity-80"
              title="Đợt đánh giá đã đóng cổng lấy phiếu"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đợt đã đóng cổng</span>
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

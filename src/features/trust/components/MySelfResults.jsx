import React, { useMemo } from 'react';
import { Award, ShieldCheck, Lock, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import { classifyTrustScore } from '../../../lib/schema';

/**
 * MySelfResults: Xem điểm đánh giá của CHÍNH MÌNH do tập thể chấm
 * - Bảo mật tuyệt đối: Không hiển thị ai đã chấm bao nhiêu điểm cho mình
 * - Chỉ mở kết quả khi đợt đánh giá hoàn tất hoặc được công bố
 */
const MySelfResults = ({
  evaluations = [],
  currentUser,
  currentPeriod,
  criteria = [],
}) => {
  // Lấy tất cả các phiếu mà tập thể đã nộp cho CHÍNH BẢN THÂN NGƯỜI ĐĂNG NHẬP trong kỳ này
  const myReceivedEvaluations = useMemo(() => {
    if (!currentUser || !currentPeriod) return [];
    return evaluations.filter(
      (ev) =>
        ev.periodId === currentPeriod.id &&
        (ev.targetEmployeeId === currentUser.id ||
          ev.targetEmployeeId === currentUser.uid ||
          ev.targetEmployeeEmail === currentUser.email) &&
        !ev.isDraft
    );
  }, [evaluations, currentUser, currentPeriod]);

  // Kiểm tra xem đợt đánh giá đã khép lại chưa
  const isPeriodClosed = currentPeriod?.status === 'CLOSED';

  // Tính toán điểm tổng kết của bản thân
  const summary = useMemo(() => {
    const count = myReceivedEvaluations.length;
    if (count === 0) return null;

    let totalSum = 0;
    const criteriaSums = {};
    criteria.forEach((c) => {
      criteriaSums[c.id] = 0;
    });

    myReceivedEvaluations.forEach((ev) => {
      let evTotal = 0;
      criteria.forEach((c) => {
        const val = Number(ev.scores?.[c.id]) || 0;
        criteriaSums[c.id] += val;
        evTotal += val;
      });
      totalSum += (ev.totalScore !== undefined ? Number(ev.totalScore) : evTotal);
    });

    const avgScore100 = Number((totalSum / count).toFixed(1));
    const avgScore10 = Number((avgScore100 / (criteria.length || 10)).toFixed(1));
    const classification = classifyTrustScore(avgScore100);

    const criteriaBreakdown = criteria.map((c) => ({
      ...c,
      avg10: Number((criteriaSums[c.id] / count).toFixed(1)),
    }));

    return {
      voterCount: count,
      avgScore100,
      avgScore10,
      classification,
      criteriaBreakdown,
    };
  }, [myReceivedEvaluations, criteria]);

  // Nếu đợt chưa kết thúc
  if (!isPeriodClosed) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Kỳ Đánh Giá Đang Trong Thời Gian Lấy Ý Kiến
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Để đảm bảo tính khách quan và nguyên tắc bảo mật thông tin tín nhiệm nội bộ, kết quả đánh giá của đồng chí sẽ được hiển thị ngay khi Hội đồng Quản trị & Ban Kiểm soát đóng đợt đánh giá và công bố kết quả.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Kỳ hiện tại: <strong>{currentPeriod?.name}</strong> (Đang mở)</span>
        </div>
      </div>
    );
  }

  // Nếu đợt đã đóng nhưng chưa có phiếu nào chấm cho mình
  if (!summary) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
        <Award className="w-10 h-10 mx-auto text-slate-300" />
        <div className="text-sm font-bold text-slate-600">
          Chưa ghi nhận phiếu tín nhiệm nào cho đồng chí trong kỳ này
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thẻ tổng kết điểm & xếp loại */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-900 via-[#0f766e] to-emerald-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
              Kết quả tín nhiệm chính thức
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Đồng chí: {currentUser?.name}
            </h3>
            <p className="text-xs text-teal-100">
              Chức vụ: <strong>{currentUser?.position}</strong> • Đơn vị: <strong>{currentUser?.department}</strong>
            </p>
            <p className="text-[11px] text-teal-200">
              Tổng số đồng nghiệp tham gia đánh giá tín nhiệm: <strong>{summary.voterCount} lượt</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-xs shrink-0">
            <div className="text-center">
              <div className="text-[11px] text-teal-200 font-semibold uppercase">Điểm Trung Bình</div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {summary.avgScore10} <span className="text-xs font-normal text-teal-200">/ 10</span>
              </div>
              <div className="text-[10px] text-teal-300">({summary.avgScore100} / 100)</div>
            </div>

            <div className="w-px h-12 bg-white/20" />

            <div className="text-center">
              <div className="text-[11px] text-teal-200 font-semibold uppercase">Xếp Loại</div>
              <div className="text-lg sm:text-xl font-black text-amber-300">
                {summary.classification.label}
              </div>
              <div className="text-[10px] text-teal-300">Chuẩn mực NHNN</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Chi tiết trung bình theo từng tiêu chí */}
      <Card
        title="Chi Tiết Điểm Tín Nhiệm Theo 10 Tiêu Chí Chuẩn Mực"
        subtitle="Mức điểm trung bình tập thể ghi nhận theo từng mặt công tác (Thang điểm 10)"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {summary.criteriaBreakdown.map((crit, idx) => (
            <div
              key={crit.id || idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-colors space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {crit.title}
                  </div>
                  <div className="text-[10px] text-slate-400">{crit.group}</div>
                </div>
                <span className="text-xs font-black text-[#0f766e] bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 shrink-0">
                  {crit.avg10} / 10
                </span>
              </div>

              {/* Thanh tiến độ điểm */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  style={{ width: `${(crit.avg10 / 10) * 100}%` }}
                  className="h-full bg-[#0f766e] rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default React.memo(MySelfResults);

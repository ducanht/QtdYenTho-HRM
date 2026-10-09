import React, { useState, useMemo } from 'react';
import { Award, ShieldCheck, Lock, Clock, CheckCircle2, TrendingUp, TrendingDown, Users, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Tiêu chí đang chọn để xem chi tiết điểm cử tri
  const [selectedCriterionId, setSelectedCriterionId] = useState(null);

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

    const criteriaBreakdown = criteria.map((c) => ({
      ...c,
      avg10: Number((criteriaSums[c.id] / count).toFixed(1)),
    }));

    const critAverages = criteriaBreakdown.map((c) => c.avg10);
    const classification = classifyTrustScore(avgScore100, {
      critAverages,
      votes: myReceivedEvaluations,
      thresholds: currentPeriod?.thresholds,
    });

    const validScores = criteriaBreakdown.map((c) => c.avg10).filter((s) => !isNaN(s) && s > 0);
    const maxScore = validScores.length ? Math.max(...validScores) : null;
    const minScore = validScores.length ? Math.min(...validScores) : null;

    return {
      voterCount: count,
      avgScore100,
      avgScore10,
      classification,
      criteriaBreakdown,
      maxScore,
      minScore,
    };
  }, [myReceivedEvaluations, criteria, currentPeriod?.thresholds]);


  // Nếu đợt chưa kết thúc
  if (!isPeriodClosed) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#0f766e] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Kỳ đánh giá đang trong thời gian lấy ý kiến
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Để đảm bảo tính khách quan và bảo mật thông tin, kết quả đánh giá cá nhân sẽ được hiển thị khi đợt đánh giá kết thúc và được công bố.
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
          Chưa có phiếu đánh giá trong kỳ này
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
              Kết quả đánh giá cá nhân
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {currentUser?.name}
            </h3>
            <p className="text-xs text-teal-100">
              Chức vụ: <strong>{currentUser?.position}</strong> • Đơn vị: <strong>{currentUser?.department}</strong>
            </p>
            <p className="text-[11px] text-teal-200">
              Tổng số lượt đánh giá: <strong>{summary.voterCount} phiếu</strong>
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
              <div className="text-base sm:text-lg font-black text-amber-300">
                {summary.classification.label}
              </div>
              {summary.classification.downgradeReason ? (
                <div className="text-[10px] text-amber-200 italic font-medium">
                  ({summary.classification.downgradeReason})
                </div>
              ) : (
                <div className="text-[10px] text-teal-300">Quy chế mới QTDND</div>
              )}
            </div>
          </div>
        </div>
      </Card>


      {/* Chi tiết trung bình theo từng tiêu chí */}
      <Card
        title="Chi Tiết Điểm Tín Nhiệm Theo 10 Tiêu Chí Chuẩn Mực"
        subtitle="Mức điểm trung bình tập thể ghi nhận theo từng mặt công tác (Thang điểm 10 • Bấm vào để xem chi tiết)"
      >
        <div className="space-y-3">
          {summary.criteriaBreakdown.map((crit, idx) => {
            const isExpanded = selectedCriterionId === crit.id;
            const isMax = crit.avg10 === summary.maxScore && crit.avg10 > 0;
            const isMin = crit.avg10 === summary.minScore && crit.avg10 > 0 && summary.minScore !== summary.maxScore;

            // Danh sách điểm cử tri chấm cho tiêu chí này của mình
            const votersForCrit = myReceivedEvaluations.map((ev, vIdx) => {
              const score = ev.scores?.[crit.id];
              const isAnonymous = currentPeriod?.votingMode === 'ANONYMOUS' || currentPeriod?.votingMode === 'ANONYMOUS_ONLY';
              const voterName = !isAnonymous && ev.evaluatorName 
                ? `${ev.evaluatorName} (${ev.evaluatorPosition || 'Cán bộ'})`
                : `Cử tri #${vIdx + 1} (Bỏ phiếu kín)`;

              return {
                voterName,
                score: score !== undefined ? Number(score) : null,
                notes: ev.notes || '',
              };
            });

            return (
              <div
                key={crit.id || idx}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isExpanded ? 'bg-teal-50/50 border-teal-400 shadow-2xs' : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
                onClick={() => setSelectedCriterionId(isExpanded ? null : crit.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {crit.code || `TC0${idx + 1}`}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {crit.title}
                    </span>
                    {isMax && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                        Cao nhất
                      </span>
                    )}
                    {isMin && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <TrendingDown className="w-3 h-3 text-amber-700" />
                        Thấp nhất
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                      isMax
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                        : isMin
                        ? 'text-amber-800 bg-amber-50 border-amber-300'
                        : 'text-teal-800 bg-teal-50 border-teal-200'
                    }`}>
                      {crit.avg10} / 10
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-teal-700 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Thanh tiến độ điểm */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
                  <div
                    style={{ width: `${(crit.avg10 / 10) * 100}%` }}
                    className={`h-full rounded-full ${isMax ? 'bg-emerald-600' : isMin ? 'bg-amber-600' : 'bg-[#0f766e]'}`}
                  />
                </div>

                {/* Khối mở rộng chi tiết cử tri đánh giá */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-teal-900 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#0f766e]" />
                        Chi tiết điểm nhận được ({votersForCrit.length} phiếu):
                      </span>
                      <span className="text-slate-400 font-normal">
                        {currentPeriod?.votingMode === 'ANONYMOUS' ? 'Bảo mật danh tính cử tri' : 'Công khai danh tính'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {votersForCrit.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span className="text-[11px] text-slate-700 truncate pr-1">
                            {v.voterName}
                          </span>
                          <span className="font-bold text-teal-800 bg-white border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                            {v.score !== null ? `${v.score}/10` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default React.memo(MySelfResults);

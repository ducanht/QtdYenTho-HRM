import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Award, 
  ShieldCheck, 
  Printer, 
  CheckCircle2, 
  FileText,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { classifyTrustScore } from '../../../lib/schema';
import { exportToExcel } from '../../../lib/exportUtils';

/**
 * EmployeeTrustDetailModal: Bảng kiểm tra chi tiết điểm đánh giá tín nhiệm của từng cán bộ
 * Dành riêng cho Lãnh đạo / Admin (Chủ tịch HĐQT, Giám đốc, Ban Kiểm soát)
 * Đảm bảo nguyên tắc bỏ phiếu kín với cán bộ thường, nhưng minh bạch đối soát với Lãnh đạo
 */
const EmployeeTrustDetailModal = ({
  isOpen,
  onClose,
  employee,
  evaluations = [],
  criteria = [],
  currentPeriod,
  isAdmin = false,
}) => {
  // Tiêu chí đang được chọn để xem chi tiết điểm từng cử tri
  const [selectedCriterionId, setSelectedCriterionId] = useState(null);

  // Lọc tất cả các phiếu đánh giá chấm cho cán bộ này trong kỳ hiện tại
  const receivedEvaluations = useMemo(() => {
    if (!employee || !currentPeriod) return [];
    return evaluations.filter(
      (ev) =>
        ev.periodId === currentPeriod.id &&
        (ev.targetEmployeeId === employee.id ||
          ev.targetEmployeeId === employee.uid) &&
        !ev.isDraft
    );
  }, [evaluations, employee, currentPeriod]);

  // Phân tích điểm theo từng tiêu chí
  const criteriaAnalysis = useMemo(() => {
    const totalVoters = receivedEvaluations.length;
    if (totalVoters === 0) return [];

    return criteria.map((crit) => {
      let sum = 0;
      let min = 10;
      let max = 0;

      receivedEvaluations.forEach((ev) => {
        const score = Number(ev.scores?.[crit.id]) || 0;
        sum += score;
        if (score < min) min = score;
        if (score > max) max = score;
      });

      const avg = Number((sum / totalVoters).toFixed(1));

      return {
        ...crit,
        avg,
        min: min === 10 && max === 0 ? 0 : min,
        max,
        totalVoters,
      };
    });
  }, [criteria, receivedEvaluations]);

  // Tìm điểm trung bình cao nhất và thấp nhất trong các tiêu chí
  const { maxAvgScore, minAvgScore } = useMemo(() => {
    if (!criteriaAnalysis.length) return { maxAvgScore: null, minAvgScore: null };
    const validScores = criteriaAnalysis.map((c) => c.avg).filter((s) => !isNaN(s) && s > 0);
    if (!validScores.length) return { maxAvgScore: null, minAvgScore: null };
    return {
      maxAvgScore: Math.max(...validScores),
      minAvgScore: Math.min(...validScores),
    };
  }, [criteriaAnalysis]);

  // Điểm trung bình toàn diện
  const overallStats = useMemo(() => {
    const totalVoters = receivedEvaluations.length;
    if (totalVoters === 0) {
      return {
        avg100: 0,
        avg10: 0,
        classification: { label: 'Chưa có phiếu', color: 'slate' },
        totalVoters: 0,
      };
    }

    const totalScoresSum = receivedEvaluations.reduce(
      (acc, ev) => acc + (Number(ev.totalScore) || 0),
      0
    );
    const avg100 = Number((totalScoresSum / totalVoters).toFixed(1));
    const avg10 = Number((avg100 / (criteria.length || 10)).toFixed(1));
    const critAverages = criteriaAnalysis.map((c) => c.avg);
    const classification = classifyTrustScore(avg100, {
      critAverages,
      votes: receivedEvaluations,
      thresholds: currentPeriod?.thresholds,
    });

    return {
      avg100,
      avg10,
      classification,
      totalVoters,
    };
  }, [receivedEvaluations, criteria, criteriaAnalysis, currentPeriod?.thresholds]);


  // Handler: Xuất dữ liệu bảng điểm cá nhân ra file Microsoft Excel (.xlsx)
  const handleExportIndividualExcel = async () => {
    if (!employee || !criteriaAnalysis.length) return;
    try {
      const isAnonymous = Boolean(
        currentPeriod?.votingMode === 'ANONYMOUS' ||
        currentPeriod?.votingMode === 'ANONYMOUS_ONLY'
      );

      // Bảng 1: Điểm theo tiêu chí
      const headers = ['Mã TC', 'Tiêu chí đánh giá', 'Điểm trung bình (Thang 10)', 'Điểm cao nhất', 'Điểm thấp nhất', 'Số lượt chấm'];
      const rows = criteriaAnalysis.map((crit) => [
        crit.code || '',
        crit.title || '',
        crit.avg,
        crit.max,
        crit.min,
        crit.totalVoters,
      ]);

      // Bổ sung danh sách chi tiết các phiếu phía dưới
      rows.push([]);
      rows.push(['DANH SÁCH CHI TIẾT TỪNG PHIẾU ĐÁNH GIÁ:']);
      rows.push(['STT', 'Cử tri đánh giá', 'Tổng điểm phiếu', 'Xếp loại', 'Ý kiến / Ghi chú']);
      receivedEvaluations.forEach((ev, idx) => {
        const voterLabel = !isAnonymous ? (ev.evaluatorName || 'Cán bộ Quỹ') : `Cử tri #${idx + 1} (Kín)`;
        rows.push([
          idx + 1,
          voterLabel,
          ev.totalScore || 0,
          ev.classification || 'Tốt',
          ev.notes || '',
        ]);
      });

      await exportToExcel({
        filename: `Diem_Tin_Nhiem_${employee.name.replace(/\s+/g, '_')}_${currentPeriod?.name?.replace(/\s+/g, '_') || 'Ky'}.xlsx`,
        sheetName: employee.name.slice(0, 31),
        title: `BẢNG KÊ CHI TIẾT ĐIỂM TÍN NHIỆM: ${employee.name.toUpperCase()}`,
        subtitle: `Chức vụ: ${employee.position || 'Cán bộ'} • Kỳ: ${currentPeriod?.name || 'Hiện hành'} • Điểm TB: ${overallStats.avg10}/10 (${overallStats.avg100}đ) - Xếp loại: ${overallStats.classification.label}`,
        headers,
        rows,
      });
    } catch (err) {
      console.error('Lỗi khi xuất bảng kê cá nhân ra Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.');
    }
  };

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết điểm tín nhiệm: ${employee.name} (${employee.position})`}
      subtitle={`Kỳ đánh giá: ${currentPeriod?.name || 'Hiện hành'} • Phục vụ Ban Kiểm soát & Ban Quản trị`}
      maxWidth="max-w-5xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dữ liệu bảo mật nội bộ QTDND Yên Thọ.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleExportIndividualExcel}
              className="font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              Xuất Excel (.xlsx)
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
              className="font-bold"
            >
              In bảng kê (Ctrl + P)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Header tóm tắt hồ sơ & điểm số */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-[#0f766e] to-emerald-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
              Cán bộ
            </span>
            <h3 className="text-xl font-black text-white">
              {employee.name}
            </h3>
            <p className="text-xs text-teal-100">
              Chức vụ: <strong>{employee.position || 'Cán bộ'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20 shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-teal-200">Tổng Phiếu Nhận</div>
              <div className="text-2xl font-black text-white">{overallStats.totalVoters}</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-teal-200">Điểm Trung Bình</div>
              <div className="text-2xl font-black text-amber-300">
                {overallStats.avg10} <span className="text-xs font-normal text-white">/ 10</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-teal-200">Xếp Loại</div>
              <div className="text-xs sm:text-sm font-black text-white">{overallStats.classification.label}</div>
              {overallStats.classification.downgradeReason && (
                <div className="text-[9px] text-amber-200 italic font-medium">
                  ({overallStats.classification.downgradeReason})
                </div>
              )}
            </div>
          </div>
        </div>




        {/* 1. Bảng điểm trung bình theo tiêu chí */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0f766e]" />
              <span>1. Điểm trung bình theo tiêu chí</span>
            </h4>
            <span className="text-[11px] text-slate-500 italic hidden sm:inline">
              (Chọn tiêu chí để xem chi tiết điểm từng cử tri)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-14 text-center">Mã</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Tiêu chí đánh giá</th>
                  <th className="py-2.5 px-3 text-center min-w-[150px]">Điểm Trung Bình</th>
                  <th className="py-2.5 px-3 text-center w-28">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteriaAnalysis.map((crit, idx) => {
                  const isExpanded = selectedCriterionId === crit.id;
                  const isMax = crit.avg === maxAvgScore && crit.avg > 0;
                  const isMin = crit.avg === minAvgScore && crit.avg > 0 && minAvgScore !== maxAvgScore;

                  // Danh sách chi tiết điểm cử tri đã chấm cho riêng tiêu chí này
                  const votersForCrit = receivedEvaluations.map((ev, vIdx) => {
                    const score = ev.scores?.[crit.id];
                    const isAnonymous = Boolean(
                      ev.isAnonymous ||
                      currentPeriod?.votingMode === 'ANONYMOUS' ||
                      currentPeriod?.votingMode === 'ANONYMOUS_ONLY'
                    );
                    let voterName = '';
                    let voterRole = '';

                    if (!isAnonymous) {
                      voterName = ev.evaluatorName || `Cán bộ Quỹ #${vIdx + 1}`;
                      voterRole = ev.evaluatorPosition || 'Cán bộ';
                    } else {
                      voterName = `Cử tri #${vIdx + 1} (Bỏ phiếu kín)`;
                      voterRole = 'Ẩn danh';
                    }

                    return {
                      voterName,
                      voterRole,
                      score: score !== undefined ? Number(score) : null,
                      notes: ev.notes || '',
                      submittedAt: ev.submittedAt || ev.createdAt,
                    };
                  });

                  return (
                    <React.Fragment key={crit.id || idx}>
                      <tr
                        onClick={() => setSelectedCriterionId(isExpanded ? null : crit.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-teal-50/60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {crit.code || `TC${idx + 1}`}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-1.5">
                            <span>{crit.title}</span>
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
                          {crit.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {crit.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`font-black text-xs px-2.5 py-1 rounded-xl border ${
                            isMax
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
                              : isMin
                              ? 'text-amber-800 bg-amber-50 border-amber-300'
                              : 'text-teal-800 bg-teal-50 border-teal-200'
                          }`}>
                            {crit.avg} / 10
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-teal-700 text-white border-teal-700'
                                : 'text-teal-700 bg-white border-teal-200 hover:bg-teal-50'
                            }`}
                          >
                            <span>{isExpanded ? 'Đóng' : 'Xem điểm'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Khối xem chi tiết điểm từng cử tri chấm cho tiêu chí này */}
                      {isExpanded && (
                        <tr className="bg-teal-50/40">
                          <td colSpan={4} className="p-3 sm:p-4">
                            <div className="bg-white rounded-xl border border-teal-200 shadow-2xs p-3.5 space-y-3 animate-in fade-in duration-150">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-[#0f766e]" />
                                  <span>Điểm cử tri đánh giá tiêu chí: <strong className="text-[#0f766e]">{crit.title}</strong></span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Tổng số: <strong className="text-slate-800">{votersForCrit.length} phiếu</strong> • Điểm TB: <strong className="text-teal-800 font-bold">{crit.avg}/10</strong>
                                </div>
                              </div>

                              {votersForCrit.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 italic">
                                  Chưa có phiếu đánh giá nào cho tiêu chí này.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {votersForCrit.map((voter, vIdx) => (
                                    <div
                                      key={vIdx}
                                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-xs truncate">
                                          {voter.voterName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate">
                                          {voter.voterRole}
                                        </div>
                                      </div>
                                      <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shrink-0">
                                        {voter.score !== null ? `${voter.score} / 10` : '—'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Danh sách phiếu đánh giá nhận được */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0f766e]" />
              <span>2. Danh sách phiếu đánh giá đã nhận ({receivedEvaluations.length} phiếu)</span>
            </h4>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Chi tiết điểm số từng cử tri
            </span>
          </div>

          {receivedEvaluations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
              Chưa có phiếu đánh giá nào được nộp cho cán bộ này trong kỳ hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-2.5 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3 min-w-[170px]">Cử tri đánh giá</th>
                    {criteria.map((c, i) => (
                      <th
                        key={c.id || i}
                        className="py-2.5 px-1.5 text-center w-12 font-mono"
                        title={c.title}
                      >
                        {c.code || `TC${i + 1}`}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center w-24">Tổng điểm</th>
                    <th className="py-2.5 px-3 text-center w-24">Xếp loại</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Ý kiến / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receivedEvaluations.map((ev, idx) => {
                    const isAnonymous = Boolean(
                      ev.isAnonymous ||
                      currentPeriod?.votingMode === 'ANONYMOUS' ||
                      currentPeriod?.votingMode === 'ANONYMOUS_ONLY'
                    );
                    const voterLabel = !isAnonymous
                      ? (ev.evaluatorName || 'Cán bộ Quỹ')
                      : `Cử tri #${idx + 1} (Bỏ phiếu kín)`;

                    const voterSub = !isAnonymous
                      ? (ev.evaluatorPosition || 'Cán bộ')
                      : 'Bỏ phiếu kín';

                    return (
                      <tr key={ev.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-2.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 leading-tight">
                            {voterLabel}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {voterSub}
                          </div>
                        </td>

                        {/* Điểm từng tiêu chí */}
                        {criteria.map((c, cIdx) => {
                          const val = ev.scores?.[c.id];
                          const numVal = val !== undefined ? Number(val) : '-';
                          return (
                            <td
                              key={c.id || cIdx}
                              className={`py-2 px-1.5 text-center font-bold font-mono ${
                                numVal >= 9
                                  ? 'text-emerald-700 bg-emerald-50/30'
                                  : numVal >= 7
                                  ? 'text-teal-700'
                                  : numVal >= 5
                                  ? 'text-amber-700'
                                  : 'text-rose-600 bg-rose-50/30'
                              }`}
                            >
                              {numVal}
                            </td>
                          );
                        })}

                        {/* Tổng điểm phiếu */}
                        <td className="py-2 px-3 text-center">
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                            {ev.totalScore || 0} đ
                          </span>
                        </td>

                        {/* Xếp loại */}
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ev.classification === 'Xuất sắc'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : ev.classification === 'Tốt'
                                ? 'bg-teal-50 text-teal-800 border-teal-300'
                                : ev.classification === 'Hoàn thành'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {ev.classification || 'Tốt'}
                          </span>
                        </td>

                        {/* Ý kiến ghi chú */}
                        <td className="py-2 px-3 text-slate-600 text-[11px] italic">
                          {ev.notes ? (
                            <div className="flex items-start gap-1">
                              <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{ev.notes}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">Không có</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(EmployeeTrustDetailModal);

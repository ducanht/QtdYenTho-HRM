import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Award, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Eye
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { classifyTrustScore } from '../../../lib/schema';
import EmployeeTrustDetailModal from './EmployeeTrustDetailModal';

/**
 * TrustOverviewReport: Báo cáo tổng quan kết quả đánh giá toàn Quỹ
 * - Cán bộ thông thường: Xem tỷ lệ xếp loại chung và phân bổ toàn Quỹ sau khi kết thúc đợt
 * - Lãnh đạo (Admin): Xem chi tiết bảng tổng hợp, tiến độ cử tri và xuất in biên bản A4
 */
const TrustOverviewReport = ({
  evaluations = [],
  employees = [],
  currentPeriod,
  criteria = [],
  isAdmin = false,
  onOpenPrintModal,
}) => {
  const isPeriodClosed = currentPeriod?.status === 'CLOSED';
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState(null);

  // Tính toán tổng hợp kết quả
  const reportData = useMemo(() => {
    if (!currentPeriod || !employees.length) {
      return {
        leaderboard: [],
        summaryCounts: { 'Xuất sắc': 0, 'Tốt': 0, 'Hoàn thành': 0, 'Không hoàn thành': 0 },
        voterStats: { submittedCount: 0, totalEligible: employees.length, turnoutPercent: 0 },
        submittedVoters: [],
        pendingVoters: [],
      };
    }

    // 1. Danh sách cử tri đã nộp phiếu (không trùng lặp)
    const submittedVoterMap = new Map();
    evaluations
      .filter((ev) => ev.periodId === currentPeriod.id && !ev.isDraft)
      .forEach((ev) => {
        if (!submittedVoterMap.has(ev.evaluatorId)) {
          submittedVoterMap.set(ev.evaluatorId, {
            id: ev.evaluatorId,
            name: ev.evaluatorName,
            submittedAt: ev.submittedAt || ev.createdAt,
          });
        }
      });

    const submittedVoters = Array.from(submittedVoterMap.values());
    const submittedVoterIds = new Set(submittedVoters.map((v) => v.id));
    const pendingVoters = employees.filter((e) => !submittedVoterIds.has(e.id) && !submittedVoterIds.has(e.uid));

    const totalEligible = employees.length;
    const submittedCount = submittedVoters.length;
    const turnoutPercent = totalEligible > 0 ? Math.round((submittedCount / totalEligible) * 100) : 0;

    // 2. Tính điểm từng cán bộ
    const empStatsMap = {};
    employees.forEach((emp) => {
      empStatsMap[emp.id] = {
        employee: emp,
        totalScoreSum: 0,
        count: 0,
      };
    });

    evaluations
      .filter((ev) => ev.periodId === currentPeriod.id && !ev.isDraft)
      .forEach((ev) => {
        if (empStatsMap[ev.targetEmployeeId]) {
          const score = ev.totalScore !== undefined ? Number(ev.totalScore) : 0;
          empStatsMap[ev.targetEmployeeId].totalScoreSum += score;
          empStatsMap[ev.targetEmployeeId].count += 1;
        }
      });

    const summaryCounts = { 'Xuất sắc': 0, 'Tốt': 0, 'Hoàn thành': 0, 'Không hoàn thành': 0 };

    const leaderboard = Object.values(empStatsMap).map((item) => {
      const count = item.count;
      const avgScore100 = count > 0 ? Number((item.totalScoreSum / count).toFixed(1)) : 0;
      const avgScore10 = Number((avgScore100 / (criteria.length || 10)).toFixed(1));
      const classification = classifyTrustScore(avgScore100);

      if (count > 0) {
        if (summaryCounts[classification.label] !== undefined) {
          summaryCounts[classification.label] += 1;
        } else {
          summaryCounts['Tốt'] += 1;
        }
      }

      return {
        id: item.employee.id,
        name: item.employee.name,
        code: item.employee.code,
        department: item.employee.department,
        position: item.employee.position,
        evaluationsCount: count,
        avgScore100,
        avgScore10,
        classification,
      };
    });

    leaderboard.sort((a, b) => b.avgScore100 - a.avgScore100);

    return {
      leaderboard,
      summaryCounts,
      voterStats: { submittedCount, totalEligible, turnoutPercent },
      submittedVoters,
      pendingVoters,
    };
  }, [evaluations, employees, currentPeriod, criteria]);

  // Nếu là cán bộ thường và đợt chưa kết thúc
  if (!isAdmin && !isPeriodClosed) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-3 max-w-xl mx-auto">
        <Clock className="w-12 h-12 mx-auto text-teal-700" />
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Kỳ Đánh Giá Đang Được Tiến Hành
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Báo cáo tổng hợp toàn Quỹ sẽ được công bố khi kỳ đánh giá chính thức khép lại. Hiện tại đồng chí có thể xem lại các phiếu mình đã nộp tại tab <strong>"2. Phiếu Tôi Đã Nộp"</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Thẻ tóm tắt tỷ lệ toàn Quỹ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Xuất sắc (≥ 90đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {reportData.summaryCounts['Xuất sắc']}
          </div>
          <div className="text-[10px] text-slate-400">Cán bộ đạt chuẩn</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-[#0f766e] uppercase">Tốt (70 - 89đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0f766e]">
            {reportData.summaryCounts['Tốt']}
          </div>
          <div className="text-[10px] text-slate-400">Cán bộ đạt chuẩn</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Hoàn thành (50 - 69đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {reportData.summaryCounts['Hoàn thành']}
          </div>
          <div className="text-[10px] text-slate-400">Cán bộ đạt chuẩn</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-700 uppercase">Tỷ Lệ Tham Gia</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {reportData.voterStats.turnoutPercent}%
          </div>
          <div className="text-[10px] text-slate-400">
            {reportData.voterStats.submittedCount}/{reportData.voterStats.totalEligible} cử tri đã nộp
          </div>
        </div>
      </div>

      {/* 2. Tiến trình cử tri nộp phiếu (Dành riêng cho Lãnh đạo / Admin) */}
      {isAdmin && (
        <Card
          title="Tiến độ nộp phiếu"
          subtitle="Tỷ lệ tham gia bỏ phiếu của cán bộ nhân viên"
          headerRight={
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={onOpenPrintModal}
              className="text-xs font-bold"
            >
              In biên bản
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Đã nộp */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã nộp phiếu ({reportData.submittedVoters.length})
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">{reportData.voterStats.turnoutPercent}%</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reportData.submittedVoters.map((v) => (
                  <span
                    key={v.id}
                    className="text-[11px] font-semibold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-lg"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Chưa nộp */}
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Chưa nộp phiếu ({reportData.pendingVoters.length})
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">
                  {100 - reportData.voterStats.turnoutPercent}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reportData.pendingVoters.map((v) => (
                  <span
                    key={v.id}
                    className="text-[11px] font-semibold bg-white text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg"
                  >
                    {v.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Bảng Tổng Hợp Điểm Tín Nhiệm (Dành cho Lãnh đạo hoặc khi đã khép lại) */}
      {(isAdmin || isPeriodClosed) && (
        <Card
          title="Kết quả tín nhiệm toàn Quỹ"
          subtitle={`Kỳ: ${currentPeriod?.name}`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">Hạng</th>
                  <th className="py-3 px-4 min-w-[180px]">Họ và tên cán bộ</th>
                  <th className="py-3 px-4 min-w-[150px]">Chức vụ</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Số phiếu nhận</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Điểm trung bình (Thang 10)</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Điểm quy đổi (Thang 100)</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Xếp loại</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Chi tiết phiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.leaderboard.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{row.position || 'Cán bộ'}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                      {row.evaluationsCount} phiếu
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-black text-[#0f766e] bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                        {row.avgScore10} / 10
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {row.avgScore100} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        row.classification.label === 'Xuất sắc'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : row.classification.label === 'Tốt'
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : row.classification.label === 'Hoàn thành'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        {row.classification.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => setSelectedEmpForDetail(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-300 transition-colors shadow-xs"
                          title="Thẩm tra chi tiết điểm từng tiêu chí và người đánh giá"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          Xem chi tiết
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Bảo mật</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal thẩm tra chi tiết phiếu đánh giá của từng cán bộ (Dành riêng cho Admin) */}
      <EmployeeTrustDetailModal
        isOpen={Boolean(selectedEmpForDetail)}
        onClose={() => setSelectedEmpForDetail(null)}
        employee={selectedEmpForDetail}
        evaluations={evaluations}
        criteria={criteria}
        currentPeriod={currentPeriod}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default React.memo(TrustOverviewReport);

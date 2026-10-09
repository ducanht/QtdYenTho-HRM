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
import { classifyTrustScore } from '../../../lib/schema';
import { getClassificationBadgeVariant, getEligibleTargetEmployees, isSystemAdminAccount } from '../../../lib/evaluationUtils';
import EmployeeTrustDetailModal from './EmployeeTrustDetailModal';

/**
 * TrustOverviewReport: Báo cáo tổng quan kết quả đánh giá toàn Quỹ
 * - Cán bộ thông thường: Xem tỷ lệ xếp loại chung và phân bổ toàn Quỹ sau khi kết thúc đợt
 * - Lãnh đạo (Admin): Xem chi tiết bảng tổng hợp, tiến độ cử tri và xuất in biên bản A4
 * - TUÂN THỦ 100% CẤU HÌNH ĐỢT: Loại bỏ hoàn toàn tài khoản Quản trị hệ thống khỏi diện lấy phiếu
 */
const TrustOverviewReport = ({
  evaluations = [],
  employees = [],
  currentPeriod,
  periodConfig = null,
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

    // 1. Danh sách cử tri đã nộp phiếu (không trùng lặp, chỉ lấy cán bộ thực tế)
    const submittedVoterMap = new Map();
    evaluations
      .filter((ev) => ev.periodId === currentPeriod.id && !ev.isDraft)
      .forEach((ev) => {
        // Tìm cán bộ nhân viên thực tế trong danh sách
        const matchedEmp = employees.find(
          (e) => e.id === ev.evaluatorId || e.uid === ev.evaluatorId || (ev.evaluatorEmail && e.email?.toLowerCase() === ev.evaluatorEmail?.toLowerCase())
        );
        if (matchedEmp) {
          if (!submittedVoterMap.has(matchedEmp.id)) {
            submittedVoterMap.set(matchedEmp.id, {
              id: matchedEmp.id,
              name: matchedEmp.name,
              position: matchedEmp.position,
              submittedAt: ev.submittedAt || ev.createdAt,
            });
          }
        } else if (ev.evaluatorName && ev.evaluatorId !== 'anonymous' && !ev.evaluatorName.includes('Ẩn danh')) {
          if (!submittedVoterMap.has(ev.evaluatorId)) {
            submittedVoterMap.set(ev.evaluatorId, {
              id: ev.evaluatorId,
              name: ev.evaluatorName,
              position: ev.evaluatorPosition || 'Cán bộ',
              submittedAt: ev.submittedAt || ev.createdAt,
            });
          }
        }
      });

    const submittedVoters = Array.from(submittedVoterMap.values());
    const submittedVoterIds = new Set(submittedVoters.map((v) => v.id));

    // Lọc danh sách cử tri hợp lệ theo cấu hình đợt (voterEmployeeIds)
    const voterIds = periodConfig?.voterEmployeeIds || currentPeriod.voterEmployeeIds;
    const eligibleVoters = Array.isArray(voterIds) && voterIds.length > 0
      ? employees.filter((e) => voterIds.includes(e.id))
      : employees.filter((e) => !isSystemAdminAccount(e));

    const pendingVoters = eligibleVoters.filter((e) => !submittedVoterIds.has(e.id) && !submittedVoterIds.has(e.uid));

    const totalEligible = eligibleVoters.length;
    const submittedCount = submittedVoters.length;
    const turnoutPercent = totalEligible > 0 ? Math.round((submittedCount / totalEligible) * 100) : 0;

    // 2. Tính điểm từng cán bộ theo danh sách đối tượng được lấy phiếu (targetEmployeeIds)
    // TUÂN THỦ 100% CẤU HÌNH ĐỢT: Dùng helper chuẩn mực loại trừ hoàn toàn tài khoản Quản trị hệ thống
    const targetIds = periodConfig?.targetEmployeeIds || currentPeriod.targetEmployeeIds;
    const targetEmployees = getEligibleTargetEmployees(employees, targetIds);

    const empStatsMap = {};
    targetEmployees.forEach((emp) => {
      empStatsMap[emp.id] = {
        employee: emp,
        totalScoreSum: 0,
        count: 0,
        critSums: {},
        critCounts: {},
        votes: [],
      };
    });

    evaluations
      .filter((ev) => ev.periodId === currentPeriod.id && !ev.isDraft)
      .forEach((ev) => {
        if (empStatsMap[ev.targetEmployeeId]) {
          const score = ev.totalScore !== undefined ? Number(ev.totalScore) : 0;
          empStatsMap[ev.targetEmployeeId].totalScoreSum += score;
          empStatsMap[ev.targetEmployeeId].count += 1;
          empStatsMap[ev.targetEmployeeId].votes.push(ev);

          // Gom điểm từng tiêu chí
          if (ev.scores && typeof ev.scores === 'object') {
            Object.entries(ev.scores).forEach(([critId, cScore]) => {
              const num = Number(cScore) || 0;
              empStatsMap[ev.targetEmployeeId].critSums[critId] =
                (empStatsMap[ev.targetEmployeeId].critSums[critId] || 0) + num;
              empStatsMap[ev.targetEmployeeId].critCounts[critId] =
                (empStatsMap[ev.targetEmployeeId].critCounts[critId] || 0) + 1;
            });
          }
        }
      });

    const summaryCounts = {
      'Hoàn thành xuất sắc nhiệm vụ': 0,
      'Hoàn thành tốt nhiệm vụ': 0,
      'Hoàn thành nhiệm vụ': 0,
      'Không hoàn thành nhiệm vụ': 0,
      'Xuất sắc': 0,
      'Tốt': 0,
      'Hoàn thành': 0,
      'Không hoàn thành': 0,
    };

    const leaderboard = Object.values(empStatsMap).map((item) => {
      const count = item.count;
      const avgScore100 = count > 0 ? Number((item.totalScoreSum / count).toFixed(1)) : 0;
      const avgScore10 = Number((avgScore100 / (criteria.length || 10)).toFixed(1));

      // Tính điểm trung bình từng tiêu chí của cán bộ này
      const critAverages = criteria.map((c) => {
        const cCnt = item.critCounts[c.id] || 0;
        return cCnt > 0 ? Number((item.critSums[c.id] / cCnt).toFixed(1)) : 0;
      });

      // Phân loại kết quả đánh giá theo 4 mức chuẩn mực mới
      const effectiveThresholds = periodConfig?.excellentThreshold !== undefined
        ? {
            excellent: periodConfig.excellentThreshold,
            excellentMinCrit: periodConfig.excellentMinCrit ?? 7,
            good: periodConfig.goodThreshold ?? 70,
            goodMinCrit: periodConfig.goodMinCrit ?? 5,
            pass: periodConfig.passThreshold ?? 50,
            weakVotesThresholdPercent: periodConfig.weakVotesThresholdPercent ?? 50,
          }
        : currentPeriod?.thresholds;

      const classification = classifyTrustScore(avgScore100, {
        critAverages,
        votes: item.votes,
        thresholds: effectiveThresholds,
      });

      if (count > 0) {
        summaryCounts[classification.label] = (summaryCounts[classification.label] || 0) + 1;
        if (classification.shortLabel) {
          summaryCounts[classification.shortLabel] = (summaryCounts[classification.shortLabel] || 0) + 1;
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
  }, [evaluations, employees, currentPeriod, periodConfig, criteria]);


  // Handler: Xuất dữ liệu bảng điểm ra file CSV Excel chuẩn UTF-8
  const handleExportCsv = () => {
    if (!reportData.leaderboard.length) return;
    const headers = [
      'Hạng',
      'Họ và tên cán bộ',
      'Chức vụ',
      'Phòng ban',
      'Số phiếu nhận',
      'Điểm TB (Thang 10)',
      'Điểm quy đổi (Thang 100)',
      'Xếp loại',
    ];
    const rows = reportData.leaderboard.map((row, idx) => [
      idx + 1,
      `"${row.name}"`,
      `"${row.position || 'Cán bộ'}"`,
      `"${row.department || ''}"`,
      row.evaluationsCount,
      row.avgScore10,
      row.avgScore100,
      `"${row.classification.label}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ket_Qua_Tin_Nhiem_${currentPeriod?.name?.replace(/\s+/g, '_') || 'Ky'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nếu là cán bộ thường và đợt chưa kết thúc
  if (!isAdmin && !isPeriodClosed) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-3 max-w-xl mx-auto">
        <Clock className="w-12 h-12 mx-auto text-teal-700" />
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Kỳ Đánh Giá Đang Được Tiến Hành
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Báo cáo tổng hợp toàn Quỹ sẽ được công bố khi kỳ đánh giá chính thức khép lại. Hiện tại đồng chí có thể xem lại các phiếu mình đã nộp tại tab <strong>"Lịch sử"</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Thẻ tóm tắt tỷ lệ toàn Quỹ (Quy chuẩn 4 mức mới) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Xuất sắc (≥ 90đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {reportData.summaryCounts['Hoàn thành xuất sắc nhiệm vụ'] ?? reportData.summaryCounts['Xuất sắc'] ?? 0}
          </div>
          <div className="text-[10px] text-slate-400">Các TC ≥ 7đ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-[#0f766e] uppercase">Tốt (70 - &lt;90đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0f766e]">
            {reportData.summaryCounts['Hoàn thành tốt nhiệm vụ'] ?? reportData.summaryCounts['Tốt'] ?? 0}
          </div>
          <div className="text-[10px] text-slate-400">Các TC ≥ 5đ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Hoàn thành (50 - &lt;70đ)</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {reportData.summaryCounts['Hoàn thành nhiệm vụ'] ?? reportData.summaryCounts['Hoàn thành'] ?? 0}
          </div>
          <div className="text-[10px] text-slate-400">Đạt yêu cầu</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-700 uppercase">Tỷ Lệ Cử Tri</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {reportData.voterStats.turnoutPercent}%
          </div>
          <div className="text-[10px] text-slate-400">
            {reportData.voterStats.submittedCount}/{reportData.voterStats.totalEligible} cử tri nộp
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
          subtitle={`Kỳ: ${currentPeriod?.name || 'Hiện hành'}`}
          headerRight={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={TrendingUp}
                onClick={handleExportCsv}
                className="text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                Xuất Excel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={onOpenPrintModal}
                className="text-xs font-bold"
              >
                In biên bản A4
              </Button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">Hạng</th>
                  <th className="py-3 px-4 min-w-[200px]">Họ và tên cán bộ</th>
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
                      <div className="text-[11px] text-slate-500 font-medium">{row.position || 'Cán bộ'}</div>
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
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getClassificationBadgeVariant(row.classification.label)}`}>
                          {row.classification.label}
                        </span>
                        {row.classification.downgradeReason && (
                          <span className="text-[10px] text-amber-700 italic">
                            ({row.classification.downgradeReason})
                          </span>
                        )}
                      </div>
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

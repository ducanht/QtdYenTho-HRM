import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Vote 
} from 'lucide-react';
import Card from '../../../components/common/Card';

const DashboardKpiSummaryCards = ({
  totalTrustEvaluations = 0,
  avgKpiScore = 0,
  kpiCompletionRate = 0,
  kpiPendingCount = 0,
  totalPlanningVotes = 0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Metric 1: Trust Evaluations */}
      <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Đánh giá tín nhiệm
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0f766e] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {totalTrustEvaluations}
          </span>
          <span className="text-xs text-slate-500 font-medium">lượt hoàn thành</span>
        </div>
        <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center gap-1">
          <span>Đã đánh giá 10 tiêu chí</span>
        </div>
      </Card>

      {/* Metric 2: Average KPI Score */}
      <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Điểm KPI trung bình
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-700">
            {avgKpiScore}
          </span>
          <span className="text-xs text-slate-400 font-bold">/ 100</span>
        </div>
        <div className="mt-2 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
          <span>Trọng số chuẩn 40% - 30% - 30%</span>
        </div>
      </Card>

      {/* Metric 3: KPI Completion Rate */}
      <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tiến độ duyệt KPI
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {kpiCompletionRate}%
          </span>
          <span className="text-xs text-slate-500 font-medium">đã xong 3 cấp</span>
        </div>
        <div className="mt-2 text-[11px] text-sky-700 font-semibold flex items-center gap-1">
          <span>{kpiPendingCount} hồ sơ đang xử lý</span>
        </div>
      </Card>

      {/* Metric 4: Planning Votes */}
      <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Phiếu quy hoạch
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Vote className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900">
            {totalPlanningVotes}
          </span>
          <span className="text-xs text-slate-500 font-medium">phiếu biểu quyết</span>
        </div>
        <div className="mt-2 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
          <span>Đã ghi nhận ý kiến cán bộ</span>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(DashboardKpiSummaryCards);

import React from 'react';
import { Search } from 'lucide-react';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';

const PlanningTallyCard = ({
  loading = false,
  currentPeriod = null,
  candidateStats = [],
  searchTerm = '',
  setSearchTerm,
}) => {
  return (
    <Card
      title="Kết Quả Bỏ Phiếu Quy Hoạch (Tổng Hợp)"
      subtitle={currentPeriod ? `Đợt: ${currentPeriod.name}` : 'Tỷ lệ tín nhiệm theo từng nhân sự dự kiến'}
      headerRight={
        <div className="relative w-40">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Lọc nhân sự..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
          />
        </div>
      }
    >
      {loading ? (
        <div className="py-12">
          <Spinner text="Đang cập nhật kết quả..." />
        </div>
      ) : candidateStats.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Chưa có phiếu biểu quyết nào được ghi nhận.
        </div>
      ) : (
        <div className="space-y-4">
          {candidateStats.map((stat, idx) => {
            const highPercent = Math.round((stat.high / stat.totalVotes) * 100);
            const medPercent = Math.round((stat.medium / stat.totalVotes) * 100);
            const lowPercent = Math.round((stat.low / stat.totalVotes) * 100);

            return (
              <div
                key={stat.candidateName + idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      {stat.candidateName}
                    </div>
                    <div className="text-[11px] text-[#0f766e] font-semibold">
                      Quy hoạch: {stat.proposedRole}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {stat.department}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {stat.totalVotes} phiếu
                  </span>
                </div>

                {/* Vote Progress Multi-Bar */}
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    style={{ width: `${highPercent}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Tín nhiệm cao: ${highPercent}%`}
                  />
                  <div
                    style={{ width: `${medPercent}%` }}
                    className="bg-teal-500 transition-all duration-300"
                    title={`Tín nhiệm: ${medPercent}%`}
                  />
                  <div
                    style={{ width: `${lowPercent}%` }}
                    className="bg-rose-400 transition-all duration-300"
                    title={`Tín nhiệm thấp: ${lowPercent}%`}
                  />
                </div>

                {/* Stats numbers */}
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-100">
                  <span className="text-emerald-700 font-semibold">
                    Cao: {stat.high} ({highPercent}%)
                  </span>
                  <span className="text-teal-700 font-semibold">
                    Đạt: {stat.medium} ({medPercent}%)
                  </span>
                  <span className="text-rose-700 font-semibold">
                    Thấp: {stat.low} ({lowPercent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default React.memo(PlanningTallyCard);

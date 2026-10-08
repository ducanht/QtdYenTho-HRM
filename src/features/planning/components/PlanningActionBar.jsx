import React from 'react';
import { Award } from 'lucide-react';

const PlanningActionBar = ({
  periods = [],
  selectedPeriodId,
  setSelectedPeriodId,
  totalVotes = 0,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-wrap items-center gap-3">
        {periods.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Kỳ quy hoạch:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="font-bold text-[#0f766e] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] cursor-pointer"
            >
              <option value="ALL">-- Tất cả các đợt quy hoạch --</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'ACTIVE' ? '(Đang diễn ra)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-teal-50 text-[#0f766e] px-3 py-1.5 rounded-xl border border-teal-200 text-xs font-bold">
        <Award className="w-4 h-4 text-[#0f766e]" />
        <span>Tổng phiếu đã phát:</span>
        <span className="font-black text-sm">{totalVotes}</span>
      </div>
    </div>
  );
};

export default React.memo(PlanningActionBar);

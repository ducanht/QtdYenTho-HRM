import React from 'react';
import { Calendar, ChevronDown, CheckCircle2 } from 'lucide-react';

/**
 * Dropdown chọn kỳ đánh giá KPI động
 */
const KpiPeriodSelector = ({ 
  period, 
  setPeriod, 
  periodOptions = [],
  className = ''
}) => {
  const currentOption = periodOptions.find((p) => p.value === period);
  const isActivePeriod = currentOption?.status === 'ACTIVE';

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div className="relative flex-1 sm:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Calendar className="w-4 h-4 text-emerald-600" />
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer hover:border-slate-400 transition-colors"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isActivePeriod && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Đang diễn ra</span>
        </span>
      )}
    </div>
  );
};

export default KpiPeriodSelector;

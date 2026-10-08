import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * Thanh tác vụ chọn Kỳ đánh giá & tóm tắt tỷ trọng quy trình 3 cấp
 */
const KpiActionBar = ({ period, setPeriod, periodOptions }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#0f766e]" />
        <span className="text-xs font-bold text-slate-700">Kỳ đánh giá:</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-xs font-bold text-[#0f766e] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0f766e] cursor-pointer"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <span>Quy trình 3 cấp:</span>
        <span className="bg-teal-50 text-[#0f766e] font-bold px-2 py-0.5 rounded border border-teal-200">
          Cán bộ 40% → BĐH 30% → HĐQT 30%
        </span>
      </div>
    </div>
  );
};

export default KpiActionBar;

import React from 'react';
import { Award, PieChart } from 'lucide-react';

/**
 * Biểu đồ phân bổ tỷ lệ xếp loại thi đua toàn đơn vị
 */
const KpiRatingDistributionChart = ({ 
  classifications = { 'Xuất sắc': 0, 'Tốt': 0, 'Đạt yêu cầu': 0, 'Không đạt': 0 },
  totalCompleted = 0 
}) => {
  const items = [
    { label: 'Xuất sắc', count: classifications['Xuất sắc'] || 0, color: 'bg-emerald-600', textColor: 'text-emerald-800', bgBadge: 'bg-emerald-50 border-emerald-200' },
    { label: 'Tốt', count: classifications['Tốt'] || 0, color: 'bg-teal-600', textColor: 'text-teal-800', bgBadge: 'bg-teal-50 border-teal-200' },
    { label: 'Đạt yêu cầu', count: classifications['Đạt yêu cầu'] || 0, color: 'bg-amber-500', textColor: 'text-amber-800', bgBadge: 'bg-amber-50 border-amber-200' },
    { label: 'Không đạt', count: classifications['Không đạt'] || 0, color: 'bg-rose-500', textColor: 'text-rose-800', bgBadge: 'bg-rose-50 border-rose-200' },
  ];

  const total = totalCompleted || items.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-700" />
            <span>Phân Bổ Xếp Loại Thi Đua</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ cấu danh hiệu cán bộ đã hoàn tất phê chuẩn trong kỳ
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-numeric">
          {total} đã duyệt
        </span>
      </div>

      {total === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs">Chưa có cán bộ nào hoàn tất phê chuẩn trong kỳ này</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Stacked bar visualization */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            {items.map((item) => {
              if (item.count === 0) return null;
              const pct = (item.count / total) * 100;
              return (
                <div
                  key={item.label}
                  className={`${item.color} h-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Breakdown items */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {items.map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${item.bgBadge}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="text-right font-numeric">
                    <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                    <span className="text-[11px] text-slate-500 ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiRatingDistributionChart;

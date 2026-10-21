import React from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';

/**
 * Biểu đồ so sánh điểm trung bình và tiến độ giữa các phòng ban
 */
const KpiDepartmentComparisonChart = ({ departmentStats = [] }) => {
  if (!Array.isArray(departmentStats) || departmentStats.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center py-10">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">Chưa có dữ liệu phòng ban trong kỳ này</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>So Sánh Hiệu Suất Theo Phòng Ban</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm trung bình và tỷ lệ hoàn tất đánh giá theo từng bộ phận
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {departmentStats.map((dept) => {
          const completionPct = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
          const score = dept.avgScore || 0;

          // Màu sắc dựa trên điểm số
          let scoreBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          let barFill = 'bg-emerald-600';
          if (score < 60) {
            scoreBadgeBg = 'bg-rose-50 text-rose-800 border-rose-200';
            barFill = 'bg-rose-500';
          } else if (score < 75) {
            scoreBadgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
            barFill = 'bg-amber-500';
          } else if (score < 90) {
            scoreBadgeBg = 'bg-teal-50 text-teal-800 border-teal-200';
            barFill = 'bg-teal-600';
          }

          return (
            <div key={dept.department} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{dept.department}</span>
                  <span className="text-xs text-slate-400 font-numeric">({dept.completed}/{dept.total} CBNV)</span>
                </div>
                <div className="flex items-center gap-2 font-numeric">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreBadgeBg}`}>
                    {score > 0 ? `${score} đ` : 'Chưa có điểm'}
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{completionPct}%</span>
                  </span>
                </div>
              </div>

              {/* Thanh điểm số */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${barFill}`}
                  style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KpiDepartmentComparisonChart;

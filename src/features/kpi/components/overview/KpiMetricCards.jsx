import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Award, 
  TrendingUp 
} from 'lucide-react';

/**
 * 4 Thẻ Chỉ Số KPI Tổng Quan Cho Ban Lãnh Đạo & HĐQT
 */
const KpiMetricCards = ({ stats = {} }) => {
  const {
    total = 0,
    completed = 0,
    pendingManager = 0,
    pendingChairman = 0,
    completionRate = 0,
    avgFinalScore = 0,
    avgSelfScore = 0,
    avgManagerScore = 0,
    avgChairmanScore = 0,
    classifications = { 'Xuất sắc': 0, 'Tốt': 0, 'Đạt yêu cầu': 0, 'Không đạt': 0 }
  } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Thẻ 1: Tổng số Cán bộ */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tổng Số Cán Bộ
          </span>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 font-numeric tabular-nums">
            {total}
          </span>
          <span className="text-xs text-slate-500 font-medium">cán bộ</span>
        </div>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <span>Chờ BĐH:</span>
          <strong className="text-blue-700 font-numeric">{pendingManager}</strong>
          <span className="text-slate-300">•</span>
          <span>Chờ HĐQT:</span>
          <strong className="text-amber-700 font-numeric">{pendingChairman}</strong>
        </div>
      </div>

      {/* Thẻ 2: Tiến độ Hoàn thành */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tiến Độ Phê Duyệt
          </span>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-700 font-numeric tabular-nums">
            {completionRate}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ({completed}/{total})
          </span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>

      {/* Thẻ 3: Điểm Trung Bình Toàn Quỹ */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Điểm TB Toàn Quỹ
          </span>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 font-numeric tabular-nums">
            {avgFinalScore > 0 ? avgFinalScore : (avgSelfScore > 0 ? avgSelfScore : '—')}
          </span>
          <span className="text-xs text-slate-500 font-medium">/ 100 điểm</span>
        </div>
        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between gap-1 font-numeric">
          <span>CB: <b className="text-slate-700">{avgSelfScore || '—'}</b></span>
          <span className="text-slate-300">|</span>
          <span>BĐH: <b className="text-slate-700">{avgManagerScore || '—'}</b></span>
          <span className="text-slate-300">|</span>
          <span>HĐQT: <b className="text-slate-700">{avgChairmanScore || '—'}</b></span>
        </div>
      </div>

      {/* Thẻ 4: Xếp Loại Thi Đua */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cơ Cấu Xếp Loại
          </span>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-700 font-numeric tabular-nums">
            {classifications['Xuất sắc'] || 0}
          </span>
          <span className="text-xs text-slate-500 font-medium">Xuất sắc</span>
        </div>
        <div className="mt-3 text-xs text-slate-600 flex items-center gap-2 font-numeric">
          <span>Tốt: <b className="text-teal-700">{classifications['Tốt'] || 0}</b></span>
          <span className="text-slate-300">•</span>
          <span>Đạt: <b className="text-amber-700">{classifications['Đạt yêu cầu'] || 0}</b></span>
          <span className="text-slate-300">•</span>
          <span>K.Đạt: <b className="text-rose-700">{classifications['Không đạt'] || 0}</b></span>
        </div>
      </div>
    </div>
  );
};

export default KpiMetricCards;

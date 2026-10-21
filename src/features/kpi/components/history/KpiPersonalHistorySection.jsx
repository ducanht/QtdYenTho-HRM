import React, { useMemo } from 'react';
import { 
  History, 
  Printer, 
  TrendingUp, 
  MessageSquare
} from 'lucide-react';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';

/**
 * Lịch Sử Đánh Giá KPI Cá Nhân Qua Các Năm
 */
const KpiPersonalHistorySection = ({
  personalHistory = [],
  currentUser = null,
  onOpenPrintModal,
}) => {
  // Sắp xếp theo thứ tự mới nhất lên đầu
  const sortedList = useMemo(() => {
    return [...personalHistory].sort((a, b) => {
      const dateA = a.completedAt || a.period || '';
      const dateB = b.completedAt || b.period || '';
      return dateB.localeCompare(dateA);
    });
  }, [personalHistory]);

  // Thống kê cá nhân
  const stats = useMemo(() => {
    const total = sortedList.length;
    if (total === 0) return { total: 0, avg: 0, highest: 0, excellentCount: 0 };

    let sum = 0;
    let highest = 0;
    let excellentCount = 0;

    sortedList.forEach((item) => {
      const s = Number(item.finalScore) || 0;
      sum += s;
      if (s > highest) highest = s;
      if ((item.classification || '').includes('Xuất sắc')) excellentCount++;
    });

    return {
      total,
      avg: Number((sum / total).toFixed(1)),
      highest,
      excellentCount
    };
  }, [sortedList]);

  if (sortedList.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          Chưa Có Lịch Sử Đánh Giá
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Đồng chí <span className="font-semibold text-slate-700">{currentUser?.name}</span> chưa có dữ liệu kết quả KPI hoàn tất trong các kỳ trước.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Thẻ Thống Kê Tiến Trình Cá Nhân */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-numeric">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Số kỳ đã hoàn tất</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.total} kỳ</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-teal-600 block uppercase font-sans font-bold">Điểm trung bình</span>
          <span className="text-2xl font-bold text-teal-700 mt-1 block">{stats.avg}đ</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-emerald-600 block uppercase font-sans font-bold">Điểm cao nhất</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{stats.highest}đ</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-amber-600 block uppercase font-sans font-bold">Số lần Xuất sắc</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{stats.excellentCount} lần</span>
        </div>
      </div>

      {/* 2. Biểu Đồ Thanh Tiến Trình Điểm Qua Các Kỳ (Visual Timeline) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              Tiến Trình Hiệu Suất KPI Qua Các Kỳ
            </h3>
          </div>
        </div>

        <div className="space-y-3 font-numeric">
          {sortedList.map((item) => {
            const score = Number(item.finalScore) || 0;
            let barColor = 'bg-emerald-600';
            if (score < 60) barColor = 'bg-rose-500';
            else if (score < 75) barColor = 'bg-amber-500';
            else if (score < 90) barColor = 'bg-teal-600';

            return (
              <div key={item.id} className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                  <div className="flex items-center gap-2 font-sans">
                    <span className="font-bold text-slate-800">{item.period}</span>
                    <span className="text-slate-400">({item.position || item.department})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{score}đ</span>
                    <KpiClassificationBadge classification={item.classification} />
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Danh Sách Chi Tiết Từng Phiếu Lịch Sử */}
      <div className="space-y-4">
        {sortedList.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.period}</span>
                  <KpiClassificationBadge classification={item.classification} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Ngày hoàn tất: <span className="font-numeric">{item.completedAt ? new Date(item.completedAt).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-numeric text-center">
                  <div className="px-2 py-0.5 bg-slate-50 rounded">
                    <span className="text-[10px] text-slate-400 block font-sans">Tự chấm</span>
                    <span className="text-xs font-bold text-slate-700">{item.scoreSelf}đ</span>
                  </div>
                  <div className="px-2 py-0.5 bg-blue-50 rounded">
                    <span className="text-[10px] text-blue-500 block font-sans">BĐH</span>
                    <span className="text-xs font-bold text-blue-700">{item.scoreManager}đ</span>
                  </div>
                  <div className="px-2 py-0.5 bg-amber-50 rounded">
                    <span className="text-[10px] text-amber-600 block font-sans">HĐQT</span>
                    <span className="text-xs font-bold text-amber-700">{item.scoreChairman}đ</span>
                  </div>
                  <div className="px-2.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block font-sans font-bold">Tổng kết</span>
                    <span className="text-sm font-bold text-emerald-700">{item.finalScore}đ</span>
                  </div>
                </div>

                {onOpenPrintModal && (
                  <button
                    type="button"
                    onClick={() => onOpenPrintModal(item)}
                    title="In lại phiếu đánh giá A4"
                    className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Nhận xét của lãnh đạo */}
            {item.notes && (
              <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1 font-bold text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ý kiến chỉ đạo & ghi nhận:</span>
                </div>
                <p className="italic leading-relaxed">{item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KpiPersonalHistorySection;

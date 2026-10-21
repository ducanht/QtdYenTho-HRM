import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  FileSpreadsheet, 
  ChevronDown, 
  Award,
  Printer
} from 'lucide-react';
import KpiClassificationBadge from '../shared/KpiClassificationBadge';
import { exportKpiSummaryToExcel } from '../../services/kpiService';
import { useToast } from '../../../../context/ToastContext';

/**
 * Lịch Sử Thi Đua Toàn Quỹ Qua Các Kỳ / Năm (Dành cho Lãnh đạo & Hội nghị người lao động)
 */
const KpiFundHistorySection = ({
  historyList = [],
  periodOptions = [],
  onOpenPrintModal,
}) => {
  const toast = useToast();

  // Danh sách các kỳ có trong lịch sử
  const availablePeriods = useMemo(() => {
    const set = new Set();
    historyList.forEach((h) => {
      if (h.period) set.add(h.period);
    });
    return Array.from(set);
  }, [historyList]);

  const [selectedPeriod, setSelectedPeriod] = useState(
    availablePeriods[0] || (periodOptions[0]?.value || 'Quý III / 2026')
  );

  // Dữ liệu của kỳ được chọn
  const periodData = useMemo(() => {
    return historyList.filter((h) => h.period === selectedPeriod);
  }, [historyList, selectedPeriod]);

  // Thống kê nhanh của kỳ này
  const stats = useMemo(() => {
    const total = periodData.length;
    if (total === 0) return { total: 0, avg: 0, excellent: 0, good: 0, pass: 0, fail: 0 };

    let sum = 0;
    let excellent = 0;
    let good = 0;
    let pass = 0;
    let fail = 0;

    periodData.forEach((item) => {
      const s = Number(item.finalScore) || 0;
      sum += s;
      const c = item.classification || '';
      if (c.includes('Xuất sắc')) excellent++;
      else if (c.includes('Tốt')) good++;
      else if (c.includes('Đạt')) pass++;
      else fail++;
    });

    return {
      total,
      avg: Number((sum / total).toFixed(1)),
      excellent,
      good,
      pass,
      fail
    };
  }, [periodData]);

  const handleExport = async () => {
    try {
      await exportKpiSummaryToExcel(periodData, selectedPeriod);
      toast.success(`Đã xuất Báo cáo KPI ${selectedPeriod} ra Excel thành công!`);
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      toast.error('Có lỗi xảy ra khi xuất báo cáo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh chọn kỳ lịch sử & Tác vụ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Lịch Sử Thi Đua Toàn Quỹ
            </h3>
            <p className="text-xs text-slate-500">Tra cứu kết quả đánh giá các kỳ trong quá khứ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
            >
              {availablePeriods.length === 0 ? (
                <option value={selectedPeriod}>{selectedPeriod}</option>
              ) : (
                availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {onOpenPrintModal && (
            <button
              type="button"
              onClick={() => onOpenPrintModal({ period: selectedPeriod, isSummary: true, periodData })}
              title="In Báo cáo thi đua năm A4"
              className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleExport}
            disabled={periodData.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất Báo Cáo Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Thẻ Thống Kê Tổng Kết Kỳ */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-numeric">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Tổng số CBNV</span>
          <span className="text-xl font-bold text-slate-800 mt-0.5 block">{stats.total}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-teal-600 block uppercase font-sans font-bold">Điểm TB</span>
          <span className="text-xl font-bold text-teal-700 mt-0.5 block">{stats.avg || '—'}đ</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-emerald-600 block uppercase font-sans font-bold">Xuất sắc</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{stats.excellent}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] text-teal-600 block uppercase font-sans font-bold">Tốt</span>
          <span className="text-xl font-bold text-teal-700 mt-0.5 block">{stats.good}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-amber-600 block uppercase font-sans font-bold">Đạt yêu cầu</span>
          <span className="text-xl font-bold text-amber-700 mt-0.5 block">{stats.pass}</span>
        </div>
      </div>

      {/* 3. Bảng Chi Tiết Kết Quả Kỳ Đã Chọn */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" />
            <span>Danh Sách Kết Quả Thi Đua ({periodData.length})</span>
          </span>
          <span className="text-xs text-slate-400 font-numeric">{selectedPeriod}</span>
        </div>

        {periodData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Chưa có dữ liệu kết quả được lưu trữ trong kỳ {selectedPeriod}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Cán Bộ Nhân Viên</th>
                  <th className="py-3 px-4">Phòng Ban / Chức Vụ</th>
                  <th className="py-3 px-3 text-center">Tự Chấm</th>
                  <th className="py-3 px-3 text-center">BĐH</th>
                  <th className="py-3 px-3 text-center">HĐQT</th>
                  <th className="py-3 px-3 text-center">Tổng Kết</th>
                  <th className="py-3 px-4 text-center">Xếp Loại</th>
                  <th className="py-3 px-4 text-right">Ý Kiến Chỉ Đạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {periodData.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center text-xs text-slate-400 font-numeric">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.employeeName}</div>
                      {item.employeeCode && (
                        <div className="text-[11px] text-slate-400 font-numeric">{item.employeeCode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-700">{item.department || 'Chung'}</div>
                      <div className="text-[11px] text-slate-400">{item.position || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-numeric text-slate-600">
                      {item.scoreSelf ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-numeric text-blue-700">
                      {item.scoreManager ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-numeric text-amber-700">
                      {item.scoreChairman ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-numeric">
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.finalScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <KpiClassificationBadge classification={item.classification} />
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 italic max-w-xs truncate">
                      {item.notes || item.chairmanNotes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiFundHistorySection;

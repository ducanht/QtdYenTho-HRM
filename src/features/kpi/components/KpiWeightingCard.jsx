import React from 'react';
import Card from '../../../components/common/Card';

/**
 * Banner Công Thức Tính Điểm KPI Tổng Kết (Final Score) & Cơ Cấu Tỷ Trọng 3 Cấp
 */
const KpiWeightingCard = () => {
  return (
    <Card className="bg-gradient-to-r from-teal-900 via-[#0f766e] to-emerald-800 text-white border-none shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
            Quy định đánh giá nội bộ
          </div>
          <h3 className="text-lg font-bold">
            Công Thức Tính Điểm KPI Tổng Kết (Final Score)
          </h3>
          <p className="text-teal-100 text-xs">
            <span className="font-mono font-bold bg-black/20 px-2 py-1 rounded">
              FinalScore = (Self × 0.4) + (Manager × 0.3) + (Chairman × 0.3)
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
            <div className="text-[10px] text-teal-200 font-semibold">Bước 1: Cán bộ</div>
            <div className="text-xl font-black text-white">40%</div>
            <div className="text-[9px] text-teal-300">Tự đánh giá</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
            <div className="text-[10px] text-teal-200 font-semibold">Bước 2: BĐH</div>
            <div className="text-xl font-black text-white">30%</div>
            <div className="text-[9px] text-teal-300">Giám đốc duyệt</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center">
            <div className="text-[10px] text-teal-200 font-semibold">Bước 3: HĐQT</div>
            <div className="text-xl font-black text-white">30%</div>
            <div className="text-[9px] text-teal-300">Chủ tịch quyết định</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default KpiWeightingCard;

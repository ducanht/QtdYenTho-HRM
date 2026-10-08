import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Layers } from 'lucide-react';

/**
 * CriteriaTabsNav: Điều hướng 10 tiêu chí đánh giá tín nhiệm
 * - Đưa thẳng 100% ra ngoài bằng Responsive Grid (5 cột trên mobile, 10 cột trên desktop)
 * - TUYỆT ĐỐI KHÔNG dùng cuộn ngang (overflow-x-auto), không bao giờ phải kéo vuốt
 * - Thao tác 1 chạm trực tiếp (One-tap access), nhận biết tức thì tiêu chí đã hoàn thành
 */
const CriteriaTabsNav = ({
  criteria = [],
  activeIndex = 0,
  onSelectIndex,
  completionByCriteria = {},
  totalEmployeesCount = 0,
  viewMode = 'STEPPER', // 'STEPPER' | 'ALL'
  onToggleViewMode,
}) => {
  const handlePrev = () => {
    if (activeIndex > 0) onSelectIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < criteria.length - 1) onSelectIndex(activeIndex + 1);
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
      {/* Hàng trên: Bộ điều hướng tiêu chí & Chuyển chế độ xem */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Tiêu chí:
          </span>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            {activeIndex + 1} / {criteria.length}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline truncate max-w-[220px]">
            {criteria[activeIndex]?.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút chuyển chế độ xem */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Đổi chế độ xem từng tiêu chí hoặc toàn bộ"
          >
            <Layers className="w-3.5 h-3.5 text-[#0f766e]" />
            <span className="hidden xs:inline">{viewMode === 'STEPPER' ? 'Xem tất cả' : 'Từng tiêu chí'}</span>
          </button>

          {/* Nút Trước / Sau khi ở chế độ Stepper */}
          {viewMode === 'STEPPER' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="p-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Tiêu chí trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === criteria.length - 1}
                className="p-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Tiêu chí tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hàng dưới: Responsive Grid 10 tiêu chí - ĐƯA THẲNG TOÀN BỘ RA NGOÀI, KHÔNG CUỘN NGANG */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5">
        {criteria.map((crit, idx) => {
          const isCurrent = activeIndex === idx;
          const scoredCount = completionByCriteria[crit.id] || 0;
          const isFullyScored = totalEmployeesCount > 0 && scoredCount >= totalEmployeesCount;

          return (
            <button
              key={crit.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`
                py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5
                ${
                  isCurrent
                    ? 'bg-[#0f766e] text-white shadow-sm ring-2 ring-[#0f766e]/30 scale-[1.02] z-10'
                    : isFullyScored
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                }
              `}
              title={`${crit.title || `Tiêu chí ${idx + 1}`} (${scoredCount}/${totalEmployeesCount} cán bộ)`}
            >
              {/* Mã tiêu chí / Số thứ tự */}
              <span className={`text-[11px] font-black leading-tight ${isCurrent ? 'text-white' : ''}`}>
                TC{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
              </span>

              {/* Trạng thái tiến độ: Icon hoàn thành hoặc tỉ lệ */}
              {isFullyScored ? (
                <div className="flex items-center gap-0.5 text-[10px] font-bold">
                  <CheckCircle2 className={`w-3 h-3 shrink-0 ${isCurrent ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  <span className="hidden sm:inline">Xong</span>
                </div>
              ) : (
                <span className={`text-[9px] font-semibold leading-none px-1 py-0.2 rounded-full ${
                  isCurrent ? 'bg-white/20 text-white' : 'text-slate-500'
                }`}>
                  {scoredCount}/{totalEmployeesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(CriteriaTabsNav);

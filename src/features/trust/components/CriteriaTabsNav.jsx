import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ListFilter, Layers } from 'lucide-react';

/**
 * CriteriaTabsNav: Điều hướng nhanh giữa 10 tiêu chí đánh giá tín nhiệm
 * - Hiển thị trạng thái hoàn thành của từng tiêu chí
 * - Hỗ trợ chuyển đổi giữa chế độ từng tiêu chí và toàn bộ tiêu chí
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
    <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Hàng trên: Bộ chuyển chế độ xem và nút điều hướng tới/lui */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Tiêu chí:
          </span>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            {activeIndex + 1} / {criteria.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút chuyển chế độ xem */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Đổi chế độ xem từng tiêu chí hoặc toàn bộ"
          >
            {viewMode === 'STEPPER' ? (
              <>
                <Layers className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>Xem tất cả</span>
              </>
            ) : (
              <>
                <ListFilter className="w-3.5 h-3.5 text-[#0f766e]" />
                <span>Từng tiêu chí</span>
              </>
            )}
          </button>

          {/* Nút Previous / Next khi ở chế độ Stepper */}
          {viewMode === 'STEPPER' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="p-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Tiêu chí trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === criteria.length - 1}
                className="p-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Tiêu chí tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hàng dưới: Danh sách 10 tab tiêu chí */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
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
                px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer
                ${
                  isCurrent
                    ? 'bg-[#0f766e] text-white shadow-xs ring-2 ring-[#0f766e]/30'
                    : isFullyScored
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                }
              `}
            >
              <span>{idx + 1}. {crit.code || `TC0${idx + 1}`}</span>

              {isFullyScored ? (
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-emerald-200' : 'text-emerald-600'}`} />
              ) : (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
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

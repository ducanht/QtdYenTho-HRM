import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Edit3, Trash2, CheckCircle2, Clock } from 'lucide-react';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';

/**
 * PeriodMasterSidebar: Cột Trái chọn đợt đánh giá dùng chung cho toàn bộ các Tabs
 * - Layout chuẩn phong cách iPad (Master list)
 * - Tích hợp bộ lọc theo năm mượt mà
 * - Tự động cập nhật đợt đang chọn và render badge tiến độ theo ngữ cảnh từng tab
 */
const PeriodMasterSidebar = ({
  periods = [],
  selectedPeriodId = '',
  onSelectPeriod,
  badgeRenderer = null,
  showAdminControls = false,
  onOpenCreatePeriod = null,
  onOpenEditPeriod = null,
  onDeletePeriodClick = null,
  title = 'Đợt Đánh Giá',
  allowSelectAll = false,
}) => {
  // Bộ lọc năm nội bộ của sidebar
  const [filterYear, setFilterYear] = useState('ALL');

  // Trích xuất danh sách các năm duy nhất từ danh sách đợt
  const availableYears = useMemo(() => {
    const yearSet = new Set(periods.map((p) => p.year).filter(Boolean));
    yearSet.add(2026);
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [periods]);

  // Lọc danh sách đợt theo năm được chọn
  const filteredPeriods = useMemo(() => {
    if (filterYear === 'ALL') return periods;
    return periods.filter((p) => Number(p.year) === Number(filterYear));
  }, [periods, filterYear]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3.5">
      {/* 1. Header Cột Trái */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0f766e]" />
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {filteredPeriods.length}
          </span>
        </div>

        {/* Nút Tạo đợt mới (Nếu bật quyền quản trị) */}
        {showAdminControls && onOpenCreatePeriod && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onOpenCreatePeriod}
            className="text-xs font-bold py-1 px-2.5"
          >
            Tạo đợt
          </Button>
        )}
      </div>

      {/* 2. Bộ lọc theo năm (Chips Filter - Đưa thẳng ra ngoài) */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          type="button"
          onClick={() => setFilterYear('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            filterYear === 'ALL'
              ? 'bg-emerald-800 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả
        </button>
        {availableYears.map((yr) => (
          <button
            key={yr}
            type="button"
            onClick={() => setFilterYear(yr)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterYear === yr
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Năm {yr}
          </button>
        ))}
      </div>

      {/* 3. Danh sách thẻ các đợt đánh giá */}
      <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
        {allowSelectAll && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectPeriod && onSelectPeriod('ALL')}
            className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group select-none touch-manipulation active:scale-[0.99] ${
              selectedPeriodId === 'ALL'
                ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-2xs'
                : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className={`text-xs font-bold ${selectedPeriodId === 'ALL' ? 'text-teal-950' : 'text-slate-800'}`}>
                  Tất cả các đợt đánh giá
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Lịch sử đánh giá toàn bộ các đợt
                </div>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded-full border border-teal-200">
                Tất cả
              </span>
            </div>
          </div>
        )}

        {filteredPeriods.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic">
            Chưa có đợt đánh giá nào trong năm {filterYear === 'ALL' ? 'này' : filterYear}
          </div>
        ) : (
          filteredPeriods.map((p) => {
            const isSelected = p.id === selectedPeriodId;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPeriod && onSelectPeriod(p.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group select-none touch-manipulation active:scale-[0.99] ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-teal-950' : 'text-slate-800'}`}>
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Quý {p.quarter || 4}/{p.year || 2026}</span>
                      {p.startDate && (
                        <>
                          <span>•</span>
                          <span>{p.startDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Nút Sửa / Xóa đợt cho Lãnh đạo (Nếu bật quyền) */}
                  {showAdminControls && (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                      {onOpenEditPeriod && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditPeriod(p);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-white transition-colors"
                          title="Chỉnh sửa thông tin đợt"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeletePeriodClick && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePeriodClick(p);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa đợt đánh giá này (Yêu cầu mật khẩu)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Hàng dưới: Trạng thái & Badge mở rộng tùy biến theo Tab */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-200/60">
                  <StatusBadge type="period_status" value={p.status} />

                  {/* Badge tùy biến theo từng Tab (nếu có) */}
                  {badgeRenderer ? (
                    badgeRenderer(p)
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.votingMode === 'ANONYMOUS' ? 'Bỏ phiếu kín' : 'Công khai'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(PeriodMasterSidebar);

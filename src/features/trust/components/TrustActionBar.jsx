import React from 'react';
import { 
  Calendar, 
  Timer, 
  Settings, 
  PlusCircle, 
  Printer, 
  Edit3, 
  Trash2
} from 'lucide-react';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import EmployeeBadge from '../../../components/common/EmployeeBadge';

/**
 * TrustActionBar: Thanh tác vụ chính cho Phân hệ Tín nhiệm
 * - Tối ưu 100% không tràn trên di động (Zero Horizontal Overflow)
 * - Bộ chọn kỳ đánh giá full-width trên mobile, co giãn thông minh trên desktop
 * - Menu Tab ngang hiển thị trên Desktop (Mobile dùng Bottom Menu chuyên biệt)
 */
const TrustActionBar = ({
  periods = [],
  selectedPeriodId,
  onSelectPeriod,
  currentPeriod,
  timeRemainingBadge,
  canManagePeriods = false,
  canManageCriteria = false,
  canPrintReport = true,
  canViewOverview = true,
  canViewSubmitted = true,
  canViewOwnResults = true,
  canVote = true,
  currentUser,
  onOpenCreatePeriod,
  onOpenEditPeriod,
  onDeletePeriod,
  onOpenPrintModal,
  activeTab,
  onChangeTab,
}) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Thanh điều khiển chính (ActionBar Toolbar) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Hàng 1: Bộ chọn kỳ đánh giá gọn gàng */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ô chọn kỳ đánh giá */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider shrink-0">
              <Calendar className="w-4 h-4 text-[#0f766e] shrink-0" />
              <span>Kỳ đánh giá:</span>
            </span>

            <select
              value={selectedPeriodId}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="w-full sm:max-w-md text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 shadow-2xs cursor-pointer hover:border-teal-500"
            >
              {periods
                .filter((p) => p && (p.name || p.id))
                .map((p) => {
                  const displayName = p.name ? p.name.trim() : `Đánh giá tín nhiệm Quý ${p.quarter || 4}/${p.year || 2026}`;
                  const statusText =
                    p.status === 'CLOSED'
                      ? '(Đã kết thúc)'
                      : p.status === 'UPCOMING'
                      ? '(Sắp diễn ra)'
                      : '(Đang lấy phiếu)';
                  return (
                    <option key={p.id} value={p.id}>
                      {displayName} {statusText}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Nút Tạo đợt mới (Nếu có quyền Quản trị) */}
          {canManagePeriods && onOpenCreatePeriod && (
            <div className="flex items-center gap-2 shrink-0 justify-end">
              <Button
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={onOpenCreatePeriod}
                className="text-xs font-bold border-teal-300 text-teal-800 hover:bg-teal-50"
              >
                Tạo đợt mới
              </Button>
            </div>
          )}
        </div>

        {/* Hàng 2: Trạng thái đợt, Đếm ngược thời gian và Người dùng */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {currentPeriod && (
              <>
                <StatusBadge type="period_status" value={currentPeriod.status} />
                <StatusBadge type="voting_mode" value={currentPeriod.votingMode} />
              </>
            )}

            {/* Đếm ngược thời gian */}
            {timeRemainingBadge && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-xs font-bold border ${
                  timeRemainingBadge.isExpired
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : timeRemainingBadge.isUrgent
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                <Timer className="w-3 h-3" />
                <span>{timeRemainingBadge.text}</span>
              </span>
            )}
          </div>

          {/* Tài khoản người chấm */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] font-medium hidden sm:inline">Tài khoản:</span>
            <EmployeeBadge
              employee={currentUser}
              size="sm"
              showCode={false}
              showPosition={true}
              showDepartment={false}
            />
          </div>
        </div>
      </div>

      {/* 2. Menu phân vùng tính năng trên Desktop (Màn hình lớn) - Trên Mobile dùng Bottom Navigation Menu */}
      <div className="hidden md:flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2">
        {canVote && (
          <button
            type="button"
            onClick={() => onChangeTab('SCORING')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'SCORING'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Đánh giá
          </button>
        )}

        {canViewSubmitted && (
          <button
            type="button"
            onClick={() => onChangeTab('MY_VOTES')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'MY_VOTES'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Lịch sử
          </button>
        )}

        {canViewOwnResults && (
          <button
            type="button"
            onClick={() => onChangeTab('MY_RESULTS')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'MY_RESULTS'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Cá nhân
          </button>
        )}

        {canViewOverview && (
          <button
            type="button"
            onClick={() => onChangeTab('OVERVIEW')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Tổng quan
          </button>
        )}

        {canManageCriteria && (
          <button
            type="button"
            onClick={() => onChangeTab('CRITERIA_SETTINGS')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'CRITERIA_SETTINGS'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Cấu hình
          </button>
        )}

        {(canManageCriteria || canManagePeriods) && (
          <button
            type="button"
            onClick={() => onChangeTab('PERMISSIONS_SETTINGS')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'PERMISSIONS_SETTINGS'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            Phân quyền
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(TrustActionBar);

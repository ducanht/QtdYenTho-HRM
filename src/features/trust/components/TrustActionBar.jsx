import React from 'react';
import { 
  Calendar, 
  Timer, 
  Settings, 
  PlusCircle, 
  Printer, 
  Save, 
  Edit3, 
  Trash2,
  CheckCircle2,
  Send
} from 'lucide-react';
import Button from '../../../components/common/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import EmployeeBadge from '../../../components/common/EmployeeBadge';

/**
 * TrustActionBar: Thanh tác vụ chính cho Phân hệ Tín nhiệm
 * - Không lặp lại tên phân hệ (đã có ở Navbar trên cùng)
 * - Tập trung vào bộ chọn Kỳ đánh giá, đồng hồ đếm ngược, và các nút nghiệp vụ
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
  onSaveDraft,
  onSubmitAll,
  isDraftSaving,
  isSubmitting,
  progress,
  activeTab,
  onChangeTab,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Thanh điều khiển chính (ActionBar Toolbar) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Bộ chọn đợt đánh giá & Trạng thái */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#0f766e]" />
              Kỳ đánh giá:
            </span>
            <select
              value={selectedPeriodId}
              onChange={(e) => onSelectPeriod(e.target.value)}
              className="text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0f766e]/30 shadow-2xs cursor-pointer hover:border-teal-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'CLOSED' ? '(Đã kết thúc)' : p.status === 'UPCOMING' ? '(Sắp diễn ra)' : '(Đang lấy phiếu)'}
                </option>
              ))}
            </select>
          </div>

          {currentPeriod && (
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge type="period_status" value={currentPeriod.status} />
              <StatusBadge type="voting_mode" value={currentPeriod.votingMode} />
            </div>
          )}

          {/* Đếm ngược thời gian nộp phiếu */}
          {timeRemainingBadge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                timeRemainingBadge.isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : timeRemainingBadge.isUrgent
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{timeRemainingBadge.text}</span>
            </span>
          )}

          {/* Nút Sửa / Xóa đợt cho Lãnh đạo */}
          {canManagePeriods && currentPeriod && (
            <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={() => onOpenEditPeriod(currentPeriod)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin đợt này"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeletePeriod(currentPeriod.id, currentPeriod.name)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Xóa đợt này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cụm nút thao tác nghiệp vụ bên phải */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Nút In biên bản kiểm phiếu A4 */}
          {canPrintReport && (
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={onOpenPrintModal}
              className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              In biên bản
            </Button>
          )}

          {canManagePeriods && (
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={onOpenCreatePeriod}
              className="text-xs font-bold border-teal-300 text-teal-800 hover:bg-teal-50"
            >
              Tạo đợt mới
            </Button>
          )}

          {/* Người thực hiện lấy phiếu */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-slate-400 text-[10px] font-medium">Tài khoản:</span>
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

      {/* 2. Menu phân vùng tính năng (Tab Bar rút gọn theo nghiệp vụ) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2">
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
